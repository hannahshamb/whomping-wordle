'use strict';

const fs = require('fs');
const path = require('path');
const {
  PATHS,
  loadApprovals,
  readJson,
  writeJson
} = require('./lib/character-image-utils');
const { cropForStorage } = require('./lib/image-crop');

const USER_AGENT = 'WhompingWordle-ImageReview/1.0 (local dev tool)';

function extensionFromContentType(contentType) {
  if (!contentType) {
    return '.jpg';
  }
  if (contentType.includes('png')) {
    return '.png';
  }
  if (contentType.includes('webp')) {
    return '.webp';
  }
  if (contentType.includes('gif')) {
    return '.gif';
  }
  return '.jpg';
}

function extensionFromUrl(url) {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith('.png')) {
      return '.png';
    }
    if (pathname.endsWith('.webp')) {
      return '.webp';
    }
    if (pathname.endsWith('.gif')) {
      return '.gif';
    }
  } catch {
    // ignore
  }
  return '.jpg';
}

async function downloadImage(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const contentType = res.headers.get('content-type') || '';
  const buffer = Buffer.from(await res.arrayBuffer());
  const ext = extensionFromContentType(contentType) || extensionFromUrl(url);
  return { buffer, ext, contentType };
}

async function main() {
  const approvals = loadApprovals();
  const approved = approvals.approved || {};
  const keys = Object.keys(approved);

  if (keys.length === 0) {
    process.stdout.write('No approved images in data/image-approvals.json\n');
    process.stdout.write('Run npm run image:review and approve portraits first.\n');
    return;
  }

  const overrides = readJson(PATHS.overrides, { byId: {}, byName: {} });
  const imageSources = readJson(PATHS.imageSources, {});
  fs.mkdirSync(PATHS.charactersDir, { recursive: true });

  let ok = 0;
  let failed = 0;

  for (const apiName of keys) {
    const entry = approved[apiName];
    const { selectedUrl, slug, source, label, displayName, crop } = entry;

    try {
      process.stdout.write(`  Downloading ${displayName || apiName}…\n`);
      const { buffer, ext } = await downloadImage(selectedUrl);
      const filename = `${slug}${ext}`;
      const dest = path.join(PATHS.charactersDir, filename);
      fs.writeFileSync(dest, buffer);

      if (!overrides.byName[apiName]) {
        overrides.byName[apiName] = {};
      }
      overrides.byName[apiName].imageFile = filename;
      const storedCrop = cropForStorage(crop);
      if (storedCrop) {
        overrides.byName[apiName].imageCrop = storedCrop;
      } else if (overrides.byName[apiName].imageCrop) {
        delete overrides.byName[apiName].imageCrop;
      }

      imageSources[apiName] = {
        displayName: displayName || apiName,
        slug,
        filename,
        sourceUrl: selectedUrl,
        source: source || 'unknown',
        label: label || '',
        crop: storedCrop || null,
        downloadedAt: new Date().toISOString()
      };

      ok += 1;
    } catch (err) {
      failed += 1;
      process.stderr.write(`  Failed ${apiName}: ${err.message}\n`);
    }
  }

  writeJson(PATHS.overrides, overrides);
  writeJson(PATHS.imageSources, imageSources);

  process.stdout.write('\nDownload complete\n');
  process.stdout.write(`  Saved:   ${ok}\n`);
  process.stdout.write(`  Failed:  ${failed}\n`);
  process.stdout.write(`  Folder:  ${PATHS.charactersDir}\n`);
  process.stdout.write('\nNext: npm run build:characters\n\n');
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
