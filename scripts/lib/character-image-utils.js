'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const DATA_DIR = path.join(ROOT, 'data');

const PATHS = {
  candidates: path.join(DATA_DIR, 'characters-candidates.json'),
  overrides: path.join(DATA_DIR, 'character-overrides.json'),
  approvals: path.join(DATA_DIR, 'image-approvals.json'),
  manifest: path.join(DATA_DIR, 'image-review-manifest.json'),
  imageSources: path.join(DATA_DIR, 'image-sources.json'),
  charactersDir: path.join(ROOT, 'server', 'public', 'imgs', 'characters'),
  gameImgsDir: path.join(ROOT, 'server', 'public', 'imgs')
};

const PLACEHOLDER_IMAGE = '/game-imgs/Wizard-Purple.png';

const GAME_KEYS = [
  'id', 'image', 'name', 'gender', 'hairColour', 'role',
  'house', 'species', 'ancestry', 'alive'
];

const EDITABLE_CHARACTER_FIELDS = [
  'gender', 'hairColour', 'role', 'house', 'species', 'ancestry', 'alive'
];

const DISPLAY_NAME_FIXES = {
  'Quirinus Quirrel': 'Quirinus Quirrell',
  'Phineas Nigelus Black': 'Phineas Nigellus Black',
  'Victor Krum': 'Viktor Krum',
  'Alicia Spinet': 'Alicia Spinnet',
  Tom: 'Tom (Leaky Cauldron)',
  Norberta: 'Norbert',
  'Ted Lupin': 'Teddy Lupin'
};

function isOverrideValueFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function mergeIncludedCharacter(row, overrides) {
  const apiName = row.apiName || row.name;
  const override = overrides.byName?.[apiName];
  const next = { ...row, apiName };

  if (override) {
    for (const key of GAME_KEYS) {
      if (isOverrideValueFilled(override[key])) {
        next[key] = override[key];
      }
    }
    if (override.imageFile) {
      next.image = `/imgs/characters/${override.imageFile}`;
    } else if (override.image === '') {
      next.image = '';
    }
    if (override.imageCrop && typeof override.imageCrop === 'object') {
      next.imageCrop = override.imageCrop;
    }
  }

  if (DISPLAY_NAME_FIXES[apiName]) {
    next.name = DISPLAY_NAME_FIXES[apiName];
  } else if (/^professor\s+/i.test(next.name)) {
    next.name = next.name.replace(/^professor\s+/i, '');
  }

  return next;
}

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function readJson(filePath, fallback) {
  if (!fs.existsSync(filePath)) {
    return fallback;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`);
}

function loadApprovals() {
  return readJson(PATHS.approvals, { approved: {}, skipped: [] });
}

function saveApprovals(approvals) {
  writeJson(PATHS.approvals, approvals);
}

let imageReviewWriteLock = Promise.resolve();

/** Serialize approvals/overrides writes to avoid lost updates from rapid saves */
function withImageReviewWriteLock(fn) {
  const run = imageReviewWriteLock.then(() => Promise.resolve(fn()));
  imageReviewWriteLock = run.catch(() => {});
  return run;
}

function hasLocalImage(overrides, apiName) {
  const entry = overrides.byName && overrides.byName[apiName];
  return Boolean(entry && entry.imageFile);
}

function buildImageReviewQueue() {
  const candidates = readJson(PATHS.candidates, { included: [] });
  const overrides = readJson(PATHS.overrides, { byName: {} });
  const approvals = loadApprovals();
  const approvedKeys = new Set(Object.keys(approvals.approved || {}));
  const skippedSet = new Set(approvals.skipped || []);

  const queue = [];

  for (const row of candidates.included || []) {
    const apiName = row.apiName || row.name;
    const displayName = row.name;
    const hasImage = Boolean(row.image && row.image.trim());
    const hasOverrideFile = hasLocalImage(overrides, apiName);

    if (hasImage || hasOverrideFile) {
      continue;
    }
    if (approvedKeys.has(apiName)) {
      continue;
    }

    queue.push({
      apiName,
      displayName,
      slug: slugify(displayName),
      suggestedFilename: `${slugify(displayName)}.jpg`,
      existingApiImage: row.image || '',
      species: row.species || 'human',
      skipped: skippedSet.has(apiName)
    });
  }

  const pending = queue.filter(item => !item.skipped);
  const skippedItems = queue.filter(item => item.skipped);

  return {
    generatedAt: new Date().toISOString(),
    totalIncluded: (candidates.included || []).length,
    needingReview: pending.length,
    skippedCount: skippedItems.length,
    alreadyApproved: approvedKeys.size,
    queue: pending,
    skipped: skippedItems
  };
}

function resolveCharacterPortrait(row, approval, override) {
  const imageFile = override?.imageFile;
  const apiImageUrl = row.image && String(row.image).trim() ? String(row.image).trim() : null;
  let localImageUrl = null;

  if (imageFile) {
    const diskPath = path.join(PATHS.charactersDir, imageFile);
    if (fs.existsSync(diskPath)) {
      localImageUrl = `/game-imgs/characters/${imageFile}`;
    }
  }

  const crop = approval?.crop || override?.imageCrop || null;

  if (localImageUrl) {
    return {
      previewUrl: localImageUrl,
      usePlaceholder: false,
      imageStatus: 'downloaded',
      crop,
      apiImageUrl
    };
  }

  if (approval?.selectedUrl) {
    return {
      previewUrl: approval.selectedUrl,
      usePlaceholder: false,
      imageStatus: 'approved',
      crop,
      apiImageUrl
    };
  }

  if (apiImageUrl) {
    return {
      previewUrl: apiImageUrl,
      usePlaceholder: false,
      imageStatus: 'api-default',
      crop,
      apiImageUrl
    };
  }

  return {
    previewUrl: PLACEHOLDER_IMAGE,
    usePlaceholder: true,
    imageStatus: 'placeholder',
    crop: null,
    apiImageUrl: null
  };
}

function buildImageReviewGallery() {
  const candidates = readJson(PATHS.candidates, { included: [] });
  const overrides = readJson(PATHS.overrides, { byName: {} });
  const approvals = loadApprovals();
  const approved = approvals.approved || {};

  const items = (candidates.included || []).map(row => {
    const apiName = row.apiName || row.name;
    const character = mergeIncludedCharacter(row, overrides);
    const approval = approved[apiName] || null;
    const override = overrides.byName?.[apiName];
    const portrait = resolveCharacterPortrait(row, approval, override);
    const { _meta, ...characterFields } = character;

    return {
      apiName,
      displayName: character.name,
      slug: slugify(character.name),
      character: {
        gender: characterFields.gender,
        hairColour: characterFields.hairColour,
        role: characterFields.role,
        house: characterFields.house,
        species: characterFields.species,
        ancestry: characterFields.ancestry,
        alive: characterFields.alive
      },
      hasApproval: Boolean(approval),
      imageStatus: portrait.imageStatus,
      previewUrl: portrait.previewUrl,
      apiImageUrl: portrait.apiImageUrl,
      usePlaceholder: portrait.usePlaceholder,
      placeholderUrl: PLACEHOLDER_IMAGE,
      crop: portrait.crop || null,
      approval: approval
        ? {
            selectedUrl: approval.selectedUrl,
            source: approval.source,
            label: approval.label,
            approvedAt: approval.approvedAt,
            crop: approval.crop || null
          }
        : null,
      downloaded: portrait.imageStatus === 'downloaded',
      canEditCrop: !portrait.usePlaceholder
    };
  });

  items.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' }));

  return {
    placeholderUrl: PLACEHOLDER_IMAGE,
    count: items.length,
    approvedCount: items.filter(i => i.hasApproval).length,
    needsImageCount: items.filter(i => i.usePlaceholder).length,
    apiPortraitCount: items.filter(i => i.imageStatus === 'api-default' && !i.hasApproval).length,
    items
  };
}

function getIncludedRoster() {
  return readJson(PATHS.candidates, { included: [] }).included || [];
}

function findIncludedCharacter(apiName) {
  return getIncludedRoster().find(row => (row.apiName || row.name) === apiName) || null;
}

function isIncludedInRoster(apiName) {
  return Boolean(findIncludedCharacter(apiName));
}

/** Ensure gallery and approvals only reference the curated included roster */
function findOverrideEntryKey(byName, apiName) {
  const lower = apiName.toLowerCase();
  return Object.keys(byName || {}).find(key => key.toLowerCase() === lower) || null;
}

function sortByNameEntries(byName) {
  const sorted = {};
  for (const key of Object.keys(byName || {}).sort((a, b) => a.localeCompare(b, 'en'))) {
    sorted[key] = byName[key];
  }
  return sorted;
}

function characterFieldsForGallery(character) {
  return {
    gender: character.gender,
    hairColour: character.hairColour,
    role: character.role,
    house: character.house,
    species: character.species,
    ancestry: character.ancestry,
    alive: character.alive
  };
}

function applyCharacterFieldUpdates(apiName, fields) {
  const row = findIncludedCharacter(apiName);
  if (!row) {
    return {
      ok: false,
      error: `"${apiName}" is not in the game roster (characters-candidates.json).`
    };
  }

  const overrides = readJson(PATHS.overrides, { byId: {}, byName: {} });
  if (!overrides.byName) {
    overrides.byName = {};
  }

  const entryKey = findOverrideEntryKey(overrides.byName, apiName) || apiName;
  if (!overrides.byName[entryKey]) {
    overrides.byName[entryKey] = {};
  }
  const entry = overrides.byName[entryKey];

  for (const field of EDITABLE_CHARACTER_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(fields, field)) {
      continue;
    }
    const value = String(fields[field] ?? '').trim();
    const baseValue = String(row[field] ?? '').trim();

    if (!value) {
      if (entry[field] !== undefined) {
        delete entry[field];
      }
      continue;
    }

    if (value === baseValue) {
      if (entry[field] !== undefined) {
        delete entry[field];
      }
    } else {
      entry[field] = value;
    }

    if (entry._needs?.includes(field)) {
      entry._needs = entry._needs.filter(name => name !== field);
      if (entry._needs.length === 0) {
        delete entry._needs;
      }
    }
  }

  const hasNeeds = entry._needs && entry._needs.length > 0;
  const hasInclude = entry.include !== undefined;
  const hasFilled = Object.keys(entry).some(
    key => key !== '_needs' && isOverrideValueFilled(entry[key])
  );
  const hasPlaceholder = Object.keys(entry).some(
    key => key !== '_needs' && entry[key] === null
  );
  const hasImageMeta = entry.imageCrop || entry.imageFile || entry.image === '';

  if (!hasNeeds && !hasInclude && !hasFilled && !hasPlaceholder && !hasImageMeta) {
    delete overrides.byName[entryKey];
  }

  overrides.byName = sortByNameEntries(overrides.byName);
  writeJson(PATHS.overrides, overrides);

  const merged = mergeIncludedCharacter(row, overrides);
  return {
    ok: true,
    character: characterFieldsForGallery(merged)
  };
}

function auditImageReviewRoster() {
  const included = getIncludedRoster();
  const approvals = loadApprovals();
  const gallery = buildImageReviewGallery();

  const includedApiNames = new Set(included.map(row => row.apiName || row.name));
  const orphanApprovals = Object.keys(approvals.approved || {}).filter(name => !includedApiNames.has(name));
  const orphanGallery = gallery.items.filter(item => !includedApiNames.has(item.apiName));

  return {
    includedCount: included.length,
    galleryCount: gallery.items.length,
    approvedCount: Object.keys(approvals.approved || {}).length,
    orphanApprovals,
    orphanGallery: orphanGallery.map(i => i.apiName),
    inSync: orphanApprovals.length === 0 && orphanGallery.length === 0 && gallery.items.length === included.length
  };
}

module.exports = {
  ROOT,
  DATA_DIR,
  PATHS,
  PLACEHOLDER_IMAGE,
  GAME_KEYS,
  EDITABLE_CHARACTER_FIELDS,
  slugify,
  readJson,
  writeJson,
  loadApprovals,
  saveApprovals,
  withImageReviewWriteLock,
  buildImageReviewQueue,
  buildImageReviewGallery,
  mergeIncludedCharacter,
  resolveCharacterPortrait,
  findIncludedCharacter,
  getIncludedRoster,
  isIncludedInRoster,
  applyCharacterFieldUpdates,
  characterFieldsForGallery,
  auditImageReviewRoster
};
