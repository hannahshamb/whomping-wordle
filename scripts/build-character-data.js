'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(ROOT, 'data');
const PUBLIC_DATA_DIR = path.join(ROOT, 'server', 'public', 'data');
const API_URL = 'https://hp-api.onrender.com/api/characters';
const TARGET_COUNT = 150;

const GAME_KEYS = [
  'id', 'image', 'name', 'gender', 'hairColour', 'role',
  'house', 'species', 'ancestry', 'alive'
];

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

function normalizeRawCharacter(character) {
  const c = { ...character };

  if (c.hogwartsStaff === true) {
    c.role = 'Staff';
  } else if (c.hogwartsStudent === true) {
    c.role = 'Student';
  } else {
    c.role = 'Uninvolved';
  }

  if (['dark', 'tawny', 'dull'].includes(c.hairColour)) {
    c.hairColour = 'brown';
  }
  if (['blond', 'blonde', 'sandy'].includes(c.hairColour)) {
    c.hairColour = c.gender === 'female' ? 'blonde' : 'blond';
  }
  if (c.hairColour === 'gray') {
    c.hairColour = 'grey';
  }
  if (c.ancestry === 'muggleborn') {
    c.ancestry = 'muggle-born';
  }

  const out = {};
  for (const key of GAME_KEYS) {
    let value = c[key];
    if (key === 'image') {
      out.image = value || '';
      continue;
    }
    if (value === '' || value === null || value === undefined) {
      value = 'Unknown';
    } else if (value === false) {
      value = 'False';
    } else if (value === true) {
      value = 'True';
    }
    out[key] = value;
  }

  return out;
}

function getOverride(overrides, character) {
  if (overrides.byId && overrides.byId[character.id]) {
    return overrides.byId[character.id];
  }
  if (overrides.byName && overrides.byName[character.name]) {
    return overrides.byName[character.name];
  }
  const lower = character.name.toLowerCase();
  for (const [name, value] of Object.entries(overrides.byName || {})) {
    if (name.toLowerCase() === lower) {
      return value;
    }
  }
  return null;
}

function isOverrideValueFilled(value) {
  return value !== undefined && value !== null && value !== '';
}

function applyOverride(character, override) {
  if (!override) {
    return character;
  }
  const next = { ...character };
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
    next.imageCrop = {
      x: Number(override.imageCrop.x) || 50,
      y: Number(override.imageCrop.y) || 50,
      zoom: Number(override.imageCrop.zoom) || 1
    };
  }
  return next;
}

const DISPLAY_NAME_FIXES = {
  'Quirinus Quirrel': 'Quirinus Quirrell',
  'Phineas Nigelus Black': 'Phineas Nigellus Black',
  'Victor Krum': 'Viktor Krum',
  'Alicia Spinet': 'Alicia Spinnet',
  Tom: 'Tom (Leaky Cauldron)',
  Norberta: 'Norbert',
  'Ted Lupin': 'Teddy Lupin'
};

/** Non-Hogwarts affiliations or non-humans → None; human wizards still Unknown → Unknown */
const EXTERNAL_SCHOOL_OR_AFFILIATION = new Set([
  'Victor Krum',
  'Fleur Delacour',
  'Gabrielle Delacour',
  'Madame Maxime',
  'Igor Karkaroff',
  'Gellert Grindelwald',
  'Nicolas Flamel'
]);

function resolveDefaultHouse(character) {
  if (character.house !== 'Unknown') {
    return character.house;
  }

  const apiName = character.apiName || character.name;

  if (character.species !== 'human') {
    return 'None';
  }

  if (EXTERNAL_SCHOOL_OR_AFFILIATION.has(apiName)) {
    return 'None';
  }

  if (character.ancestry === 'muggle' || character.ancestry === 'squib') {
    return 'None';
  }

  if (apiName === 'Tom') {
    return 'None';
  }

  return 'Unknown';
}

function applyDisplayNameFixes(character) {
  const apiName = character.apiName || character.name;

  if (DISPLAY_NAME_FIXES[apiName]) {
    return { ...character, name: DISPLAY_NAME_FIXES[apiName] };
  }

  if (/^professor\s+/i.test(character.name)) {
    return { ...character, name: character.name.replace(/^professor\s+/i, '') };
  }

  return character;
}

function isAllowlisted(character, allowlistSet) {
  const apiName = (character.apiName || character.name).toLowerCase();
  const variants = new Set([
    character.name.toLowerCase(),
    apiName,
    character.name.replace(/^professor\s+/i, '').toLowerCase()
  ]);

  for (const allowed of allowlistSet) {
    if (variants.has(allowed)) {
      return true;
    }
  }

  return false;
}

function missingFields(character) {
  return GAME_KEYS.filter(key => {
    if (key === 'id' || key === 'image' || key === 'name') {
      return false;
    }
    return character[key] === 'Unknown';
  });
}

function findOverrideEntryKey(byName, apiName) {
  const lower = apiName.toLowerCase();
  return Object.keys(byName || {}).find(key => key.toLowerCase() === lower);
}

function sortByNameEntries(byName) {
  const sorted = {};
  for (const key of Object.keys(byName || {}).sort((a, b) => a.localeCompare(b, 'en'))) {
    sorted[key] = byName[key];
  }
  return sorted;
}

function syncOverridePlaceholders(overrides, included) {
  if (!overrides.byName) {
    overrides.byName = {};
  }

  const includedByApiLower = new Map();
  for (const row of included) {
    const apiName = row.character.apiName || row.character.name;
    includedByApiLower.set(apiName.toLowerCase(), { apiName, row });
  }

  for (const { apiName, row } of includedByApiLower.values()) {
    const missing = row.missingFields;
    let entryKey = findOverrideEntryKey(overrides.byName, apiName);
    if (!entryKey) {
      entryKey = apiName;
      overrides.byName[entryKey] = {};
    }
    const entry = overrides.byName[entryKey];

    for (const field of missing) {
      if (!isOverrideValueFilled(entry[field])) {
        entry[field] = null;
      }
    }

    const needs = missing.filter(field => !isOverrideValueFilled(entry[field]));
    if (needs.length > 0) {
      entry._needs = needs;
    } else if (entry._needs) {
      delete entry._needs;
    }
  }

  for (const [entryKey, entry] of Object.entries(overrides.byName)) {
    const includedRow = includedByApiLower.get(entryKey.toLowerCase());
    if (!includedRow) {
      continue;
    }
    const stillMissing = new Set(includedRow.row.missingFields);
    for (const key of GAME_KEYS) {
      if (entry[key] === null && !stillMissing.has(key)) {
        delete entry[key];
      }
    }
    if (entry._needs) {
      const needs = includedRow.row.missingFields.filter(field => !isOverrideValueFilled(entry[field]));
      if (needs.length > 0) {
        entry._needs = needs;
      } else {
        delete entry._needs;
      }
    }
  }

  for (const [entryKey, entry] of Object.entries(overrides.byName)) {
    const hasNeeds = entry._needs && entry._needs.length > 0;
    const hasInclude = entry.include !== undefined;
    const hasFilled = Object.keys(entry).some(
      key => key !== '_needs' && isOverrideValueFilled(entry[key])
    );
    const hasPlaceholder = Object.keys(entry).some(
      key => key !== '_needs' && entry[key] === null
    );
    if (!hasNeeds && !hasInclude && !hasFilled && !hasPlaceholder) {
      delete overrides.byName[entryKey];
    }
  }

  overrides.byName = sortByNameEntries(overrides.byName);
  return overrides;
}

function writeNameList(filePath, names) {
  const sorted = [...names].sort((a, b) => a.localeCompare(b, 'en'));
  fs.writeFileSync(filePath, `${sorted.join('\n')}\n`);
}

function scoreCharacter(character, allowlistSet, override) {
  if (override && override.include === false) {
    return -1000;
  }

  let score = 0;
  const reasons = [];

  if (isAllowlisted(character, allowlistSet)) {
    score += 100;
    reasons.push('allowlist');
  }
  if (character.role === 'Student' || character.role === 'Staff') {
    score += 40;
    reasons.push('hogwarts');
  }
  if (character.image) {
    score += 25;
    reasons.push('hasApiImage');
  }
  if (character.name && character.name.length > 2) {
    score += 10;
  }

  const unknownCount = missingFields(character).length;
  score += Math.max(0, (7 - unknownCount) * 5);

  if (unknownCount >= 5) {
    score -= 30;
    reasons.push('manyUnknownFields');
  }

  if (override && override.include === true) {
    score += 200;
    reasons.push('forceInclude');
  }

  return { score, reasons };
}

async function fetchCharacters() {
  const res = await fetch(API_URL);
  if (!res.ok) {
    throw new Error(`hp-api fetch failed: ${res.status}`);
  }
  return res.json();
}

function dedupeById(characters) {
  const seen = new Map();
  for (const c of characters) {
    if (!c.name || !c.id) {
      continue;
    }
    if (!seen.has(c.id)) {
      seen.set(c.id, c);
    }
  }
  return [...seen.values()];
}

function characterDataRichness(character) {
  let score = 0;
  if (character.image) {
    score += 4;
  }
  for (const key of ['gender', 'hairColour', 'role', 'house', 'species', 'ancestry']) {
    if (character[key] && character[key] !== 'Unknown') {
      score += 1;
    }
  }
  return score;
}

/** API sometimes ships duplicate rows for the same name (e.g. two James Potters). */
function dedupeByName(characters) {
  const byName = new Map();
  for (const c of characters) {
    const key = c.name.toLowerCase();
    const existing = byName.get(key);
    if (!existing || characterDataRichness(c) > characterDataRichness(existing)) {
      byName.set(key, c);
    }
  }
  return [...byName.values()];
}

function resolveAllowlistNames(allowlist, aliases, apiNameSet) {
  const resolved = [];
  const notFound = [];

  for (const raw of allowlist) {
    const trimmed = raw.trim();
    if (!trimmed) {
      continue;
    }
    const alias = aliases[trimmed] || trimmed;
    if (apiNameSet.has(alias.toLowerCase())) {
      resolved.push(alias);
    } else if (apiNameSet.has(trimmed.toLowerCase())) {
      resolved.push(trimmed);
    } else {
      notFound.push(trimmed);
    }
  }

  return {
    names: [...new Set(resolved)],
    notFound: [...new Set(notFound)]
  };
}

function buildRoster(allNormalized, allowlist, overrides, aliases) {
  const apiNameSet = new Set(allNormalized.map(c => c.name.toLowerCase()));
  const { names: resolvedAllowlist, notFound: allowlistNotFound } = resolveAllowlistNames(
    allowlist,
    aliases,
    apiNameSet
  );

  const allowlistSet = new Set(
    resolvedAllowlist.map(name => name.toLowerCase())
  );

  const scored = allNormalized.map(character => {
    const override = getOverride(overrides, character);
    const merged = applyOverride(character, override);
    merged.apiName = character.name;
    merged.house = resolveDefaultHouse(merged);
    const { score, reasons } = scoreCharacter(merged, allowlistSet, override);
    const displayCharacter = applyDisplayNameFixes(merged);
    return {
      character: displayCharacter,
      score,
      reasons,
      override,
      missingFields: missingFields(merged),
      suggestedImagePath: `/imgs/characters/${slugify(merged.name)}.jpg`
    };
  });

  const excluded = [];
  const pool = [];

  for (const row of scored) {
    if (row.score < 0) {
      excluded.push({
        id: row.character.id,
        name: row.character.name,
        reason: 'excluded in character-overrides.json'
      });
      continue;
    }
    pool.push(row);
  }

  pool.sort((a, b) => b.score - a.score);

  const included = [];
  const includedIds = new Set();

  for (const row of pool) {
    if (!isAllowlisted(row.character, allowlistSet)) {
      continue;
    }
    if (includedIds.has(row.character.id)) {
      continue;
    }
    included.push(row);
    includedIds.add(row.character.id);
  }

  for (const row of pool) {
    if (included.length >= TARGET_COUNT) {
      break;
    }
    if (includedIds.has(row.character.id)) {
      continue;
    }
    included.push(row);
    includedIds.add(row.character.id);
  }

  const includedNames = new Set(included.map(r => r.character.id));
  for (const row of pool) {
    if (includedNames.has(row.character.id)) {
      continue;
    }
    excluded.push({
      id: row.character.id,
      name: row.character.name,
      score: row.score,
      reason: included.length >= TARGET_COUNT
        ? 'below cutoff for target roster size'
        : 'filtered out'
    });
  }

  return {
    included,
    excluded,
    allowlistNotFound: [...new Set(allowlistNotFound)]
  };
}

function main() {
  const writeFinal = process.argv.includes('--write-final');

  return fetchCharacters().then(raw => {
    const overrides = readJson(path.join(DATA_DIR, 'character-overrides.json'), { byId: {}, byName: {} });
    const allowlist = readJson(path.join(DATA_DIR, 'character-allowlist.json'), []);
    const aliases = readJson(path.join(DATA_DIR, 'character-name-aliases.json'), {});

    const normalized = dedupeByName(dedupeById(raw.map(normalizeRawCharacter)));
    const { included, excluded, allowlistNotFound } = buildRoster(
      normalized,
      allowlist,
      overrides,
      aliases
    );

    const overridesSynced = syncOverridePlaceholders(overrides, included);
    fs.writeFileSync(
      path.join(DATA_DIR, 'character-overrides.json'),
      `${JSON.stringify(overridesSynced, null, 2)}\n`
    );

    const includedNames = included.map(row => row.character.name);
    const excludedNames = excluded.map(row => row.name);
    writeNameList(path.join(DATA_DIR, 'characters-included-names.txt'), includedNames);
    writeNameList(path.join(DATA_DIR, 'characters-excluded-names.txt'), excludedNames);
    fs.writeFileSync(
      path.join(DATA_DIR, 'characters-included-names.json'),
      `${JSON.stringify([...includedNames].sort((a, b) => a.localeCompare(b, 'en')), null, 2)}\n`
    );
    fs.writeFileSync(
      path.join(DATA_DIR, 'characters-excluded-names.json'),
      `${JSON.stringify([...excludedNames].sort((a, b) => a.localeCompare(b, 'en')), null, 2)}\n`
    );

    const withImage = included.filter(r => r.character.image).length;
    const withMissing = included.filter(r => r.missingFields.length > 0).length;

    const candidates = {
      generatedAt: new Date().toISOString(),
      targetCount: TARGET_COUNT,
      summary: {
        apiTotal: raw.length,
        afterDedupe: normalized.length,
        included: included.length,
        excluded: excluded.length,
        allowlistNotFound: allowlistNotFound.length,
        withImage,
        withMissingFields: withMissing
      },
      allowlistNotFound,
      included: included.map(row => ({
        ...row.character,
        _meta: {
          score: row.score,
          reasons: row.reasons,
          missingFields: row.missingFields,
          suggestedImagePath: row.suggestedImagePath,
          hasPortraitFile: false
        }
      })),
      excluded
    };

    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(
      path.join(DATA_DIR, 'characters-candidates.json'),
      `${JSON.stringify(candidates, null, 2)}\n`
    );

    process.stdout.write('\nCharacter build summary\n');
    process.stdout.write(`  API rows:              ${candidates.summary.apiTotal}\n`);
    process.stdout.write(`  After dedupe:          ${candidates.summary.afterDedupe}\n`);
    process.stdout.write(`  Included (review):     ${candidates.summary.included}\n`);
    process.stdout.write(`  Excluded:              ${candidates.summary.excluded}\n`);
    process.stdout.write(`  With image URL/path:   ${candidates.summary.withImage}\n`);
    process.stdout.write(`  With missing fields:   ${candidates.summary.withMissingFields}\n`);
    process.stdout.write(`  Allowlist not in API:  ${candidates.summary.allowlistNotFound}\n`);
    if (allowlistNotFound.length > 0) {
      process.stdout.write(`  Names to fix:          ${allowlistNotFound.slice(0, 8).join(', ')}${allowlistNotFound.length > 8 ? '...' : ''}\n`);
    }
    process.stdout.write('\nWrote data/characters-candidates.json\n');
    process.stdout.write('Wrote data/characters-included-names.txt\n');
    process.stdout.write('Wrote data/characters-excluded-names.txt\n');
    process.stdout.write('Updated data/character-overrides.json (null = fill in; _needs = still missing)\n');

    if (writeFinal) {
      const finalCharacters = candidates.included.map(({ _meta, ...character }) => character);
      fs.writeFileSync(
        path.join(DATA_DIR, 'characters.json'),
        `${JSON.stringify(finalCharacters, null, 2)}\n`
      );
      fs.mkdirSync(PUBLIC_DATA_DIR, { recursive: true });
      fs.writeFileSync(
        path.join(PUBLIC_DATA_DIR, 'characters.json'),
        `${JSON.stringify(finalCharacters, null, 2)}\n`
      );
      process.stdout.write('Wrote data/characters.json and server/public/data/characters.json\n');
    } else {
      process.stdout.write('\nNext: review data/characters-candidates.json, edit allowlist/overrides, re-run.\n');
      process.stdout.write('When approved: npm run build:characters -- --write-final\n\n');
    }
  });
}

main().catch(err => {
  process.stderr.write(`${err.message}\n`);
  process.exit(1);
});
