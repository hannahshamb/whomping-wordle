'use strict';

require('dotenv/config');

const path = require('path');
const express = require('express');
const {
  PATHS,
  buildImageReviewQueue,
  buildImageReviewGallery,
  findIncludedCharacter,
  isIncludedInRoster,
  auditImageReviewRoster,
  loadApprovals,
  saveApprovals,
  withImageReviewWriteLock,
  applyCharacterFieldUpdates,
  readJson,
  writeJson,
  slugify,
  mergeIncludedCharacter
} = require('./lib/character-image-utils');
const { findImageCandidates } = require('./lib/image-search');
const { cropForStorage, normalizeCrop } = require('./lib/image-crop');

const PORT = Number(process.env.IMAGE_REVIEW_PORT) || 3939;
const UI_DIR = path.join(__dirname, '..', 'tools', 'image-review');
const SERVER_VERSION = 4;

const app = express();
app.use(express.json({ limit: '1mb' }));

// API routes must be registered before static files (otherwise old setups can 404 with HTML)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    version: SERVER_VERSION,
    features: ['gallery', 'crop', 'roster', 'queue', 'character-fields'],
    roster: auditImageReviewRoster()
  });
});

app.get('/api/roster-audit', (req, res) => {
  res.json(auditImageReviewRoster());
});

app.get('/api/queue', (req, res) => {
  const manifest = buildImageReviewQueue();
  writeJson(PATHS.manifest, manifest);
  res.json({
    generatedAt: manifest.generatedAt,
    total: manifest.queue.length + manifest.skipped.length,
    pending: manifest.queue.length,
    skipped: manifest.skipped.length,
    alreadyApproved: manifest.alreadyApproved,
    items: manifest.queue,
    skippedItems: manifest.skipped,
    googleSearchEnabled: Boolean(process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX)
  });
});

app.get('/api/candidates', async (req, res, next) => {
  try {
    const { apiName, displayName, existingApiImage, species } = req.query;
    if (!displayName && !apiName) {
      res.status(400).json({ error: 'displayName or apiName required' });
      return;
    }
    const candidates = await findImageCandidates({
      displayName: displayName || apiName,
      apiName: apiName || displayName,
      existingApiImage: existingApiImage || '',
      species: species || 'human'
    });
    res.json({
      displayName: displayName || apiName,
      apiName: apiName || displayName,
      candidates,
      manualSearchUrl: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${displayName || apiName} Harry Potter character portrait`)}`
    });
  } catch (err) {
    next(err);
  }
});

function applyCropToOverride(overrides, apiName, crop) {
  if (!overrides.byName[apiName]) {
    overrides.byName[apiName] = {};
  }
  const stored = cropForStorage(crop);
  if (stored) {
    overrides.byName[apiName].imageCrop = stored;
  } else if (overrides.byName[apiName].imageCrop) {
    delete overrides.byName[apiName].imageCrop;
  }
}

app.post('/api/approve', (req, res, next) => {
  const {
    apiName: rawApiName,
    displayName,
    slug,
    selectedUrl,
    source,
    label,
    crop
  } = req.body || {};
  const apiName = String(rawApiName || '').trim();

  if (!apiName || !selectedUrl || !slug) {
    res.status(400).json({ error: 'apiName, slug, and selectedUrl are required' });
    return;
  }

  if (!isIncludedInRoster(apiName)) {
    res.status(400).json({
      error: `"${apiName}" is not in the game roster (characters-candidates.json). Re-run npm run build:characters if you recently changed the allowlist.`
    });
    return;
  }

  withImageReviewWriteLock(() => {
    const storedCrop = cropForStorage(crop);
    const approvals = loadApprovals();
    if (!approvals.approved) {
      approvals.approved = {};
    }
    const entry = {
      apiName,
      displayName: displayName || apiName,
      slug,
      selectedUrl,
      source: source || 'manual',
      label: label || source || 'manual',
      approvedAt: new Date().toISOString()
    };
    if (storedCrop) {
      entry.crop = storedCrop;
    }
    approvals.approved[apiName] = entry;

    const skipIdx = (approvals.skipped || []).indexOf(apiName);
    if (skipIdx >= 0) {
      approvals.skipped.splice(skipIdx, 1);
    }

    const overrides = readJson(PATHS.overrides, { byName: {} });
    applyCropToOverride(overrides, apiName, storedCrop);
    writeJson(PATHS.overrides, overrides);

    saveApprovals(approvals);
    const manifest = buildImageReviewQueue();
    res.json({ ok: true, remaining: manifest.queue.length });
  }).catch(next);
});

app.post('/api/skip', (req, res) => {
  const { apiName } = req.body || {};
  if (!apiName) {
    res.status(400).json({ error: 'apiName required' });
    return;
  }

  const approvals = loadApprovals();
  if (!approvals.skipped.includes(apiName)) {
    approvals.skipped.push(apiName);
  }
  saveApprovals(approvals);
  const manifest = buildImageReviewQueue();
  res.json({ ok: true, remaining: manifest.queue.length });
});

app.post('/api/unskip', (req, res) => {
  const { apiName } = req.body || {};
  if (!apiName) {
    res.status(400).json({ error: 'apiName required' });
    return;
  }

  const approvals = loadApprovals();
  approvals.skipped = (approvals.skipped || []).filter(name => name !== apiName);
  saveApprovals(approvals);
  const manifest = buildImageReviewQueue();
  res.json({ ok: true, remaining: manifest.queue.length });
});

function sendGallery(req, res, next) {
  try {
    const audit = auditImageReviewRoster();
    const gallery = buildImageReviewGallery();
    gallery.items = gallery.items.map(item => ({
      ...item,
      crop: item.crop ? normalizeCrop(item.crop) : null
    }));
    res.json({
      ...gallery,
      rosterAudit: audit
    });
  } catch (err) {
    next(err);
  }
}

app.get('/api/gallery', sendGallery);
app.get('/api/approved', sendGallery);

app.post('/api/crop', (req, res, next) => {
  const { apiName: rawApiName, crop, selectedUrl, displayName, slug } = req.body || {};
  const apiName = String(rawApiName || '').trim();
  if (!apiName) {
    res.status(400).json({ error: 'apiName required' });
    return;
  }

  const row = findIncludedCharacter(apiName);
  if (!row) {
    res.status(404).json({
      error: `"${apiName}" is not in the game roster (characters-candidates.json). Re-run npm run build:characters if you recently changed the allowlist.`
    });
    return;
  }

  withImageReviewWriteLock(() => {
    const approvals = loadApprovals();
    if (!approvals.approved) {
      approvals.approved = {};
    }
    let entry = approvals.approved[apiName];
    const wasNew = !entry;

    const overrides = readJson(PATHS.overrides, { byName: {} });
    const merged = mergeIncludedCharacter(row, overrides);
    const imageUrl = selectedUrl || entry?.selectedUrl || row.image || '';

    if (!imageUrl) {
      res.status(400).json({ error: 'No image to crop — paste an image URL first' });
      return;
    }

    if (!entry) {
      entry = {
        apiName,
        displayName: displayName || merged.name,
        slug: slug || slugify(merged.name),
        selectedUrl: imageUrl,
        source: row.image && imageUrl === row.image ? 'api-portrait' : 'gallery-crop',
        label: row.image && imageUrl === row.image ? 'HP API portrait' : 'Gallery crop',
        approvedAt: new Date().toISOString()
      };
      approvals.approved[apiName] = entry;
      const skipIdx = (approvals.skipped || []).indexOf(apiName);
      if (skipIdx >= 0) {
        approvals.skipped.splice(skipIdx, 1);
      }
    }

    const storedCrop = cropForStorage(crop);
    if (storedCrop) {
      entry.crop = storedCrop;
    } else {
      delete entry.crop;
    }
    entry.selectedUrl = imageUrl;

    applyCropToOverride(overrides, apiName, storedCrop);
    writeJson(PATHS.overrides, overrides);
    saveApprovals(approvals);
    res.json({ ok: true, crop: storedCrop, createdApproval: wasNew, apiName });
  }).catch(next);
});

app.post('/api/character-fields', (req, res, next) => {
  const apiName = String(req.body?.apiName || '').trim();
  const fields = req.body?.fields;

  if (!apiName) {
    res.status(400).json({ error: 'apiName required' });
    return;
  }
  if (!fields || typeof fields !== 'object') {
    res.status(400).json({ error: 'fields object required' });
    return;
  }

  withImageReviewWriteLock(() => {
    const result = applyCharacterFieldUpdates(apiName, fields);
    if (!result.ok) {
      res.status(404).json({ error: result.error });
      return;
    }
    res.json({ ok: true, apiName, character: result.character });
  }).catch(next);
});

app.post('/api/unapprove', (req, res, next) => {
  const apiName = String(req.body?.apiName || '').trim();
  if (!apiName) {
    res.status(400).json({ error: 'apiName required' });
    return;
  }

  withImageReviewWriteLock(() => {
    const approvals = loadApprovals();
    if (!approvals.approved?.[apiName]) {
      res.status(404).json({ error: 'No saved portrait for this character yet — use Save crop or Save image first.' });
      return;
    }

    delete approvals.approved[apiName];
    saveApprovals(approvals);
    const manifest = buildImageReviewQueue();
    res.json({ ok: true, remaining: manifest.queue.length, approvedCount: Object.keys(approvals.approved).length });
  }).catch(next);
});

app.use('/game-imgs/characters', express.static(PATHS.charactersDir));
app.use('/game-imgs', express.static(PATHS.gameImgsDir));

app.use(express.static(UI_DIR));

app.use((err, req, res, next) => {
  process.stderr.write(`${err.stack || err.message}\n`);
  res.status(500).json({ error: err.message || 'Server error' });
});

app.listen(PORT, () => {
  const manifest = buildImageReviewQueue();
  writeJson(PATHS.manifest, manifest);
  process.stdout.write(`\nCharacter image review (v${SERVER_VERSION})\n`);
  process.stdout.write(`  Open: http://localhost:${PORT}\n`);
  process.stdout.write(`  Pending: ${manifest.needingReview}\n`);
  process.stdout.write(`  Google CSE: ${process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX ? 'enabled' : 'disabled (set GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX in .env)'}\n\n`);
});
