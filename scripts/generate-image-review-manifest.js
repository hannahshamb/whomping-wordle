'use strict';

const { PATHS, buildImageReviewQueue, writeJson } = require('./lib/character-image-utils');

function main() {
  const manifest = buildImageReviewQueue();
  writeJson(PATHS.manifest, manifest);

  process.stdout.write('Image review manifest\n');
  process.stdout.write(`  Included roster:     ${manifest.totalIncluded}\n`);
  process.stdout.write(`  Already approved:    ${manifest.alreadyApproved}\n`);
  process.stdout.write(`  Pending review:      ${manifest.needingReview}\n`);
  process.stdout.write(`  Skipped (later):     ${manifest.skippedCount}\n`);
  process.stdout.write(`\nWrote ${PATHS.manifest}\n`);
}

main();
