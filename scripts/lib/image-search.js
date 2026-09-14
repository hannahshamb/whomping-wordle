'use strict';

const MIN_SHORT_EDGE = 180;
const MAX_CANDIDATES = 5;
const FANDOM_API = 'https://harrypotter.fandom.com/api.php';
const USER_AGENT = 'WhompingWordle-ImageReview/1.0 (local dev tool)';

const BAD_FILENAME_RE = /logo|icon|banner|book.?cover|lego|clipart|silhouette|symbol|crest|flag|map|poster|wallpaper|screenshot.*wide|group.?shot|cast\.|ensemble/i;

/** Gallery filenames on a character page that are not portraits of that character */
const BAD_GALLERY_RE =
  /\bwand\b|patronus|signature|sig\.|clearbg|family|mother|father|brother|sister|wife|husband|book|cover|icon|logo|scene|quake|trailer|promo.*wide|chamber.*secret|group|cast|lego|minifig|funny.*faces|reaction|meme|dumbledore.?s army|hermione and|hermiona|students at|onlookers|duelling club|apparition|vanquished|teaching|hand pointing|site-logo/i;

/** Prefer film / TV stills over fan art or illustrations */
const FILM_STILL_RE =
  /hptv|ootp|gof|cosf?|hps_|half.?blood|deathly|philosopher|chamber|azkaban|promo|screenshot|film|movie|actor|portrait|sorting|da[\s_-]|y[\s_-]?[1-4]\b/i;

/** Wiki page titles that differ from display names */
const FANDOM_TITLE_OVERRIDES = {
  Tom: 'Tom (Leaky Cauldron barman)',
  'Tom (Leaky Cauldron)': 'Tom (Leaky Cauldron barman)',
  'The Grey Lady': 'Grey Lady',
  'Nearly Headless Nick': 'Nearly Headless Nick',
  'Fat Lady': 'Fat Lady (Hufflepuff)',
  'Moaning Myrtle': 'Myrtle Warren',
  'Garrick Ollivander': 'Garrick Ollivander',
  'Stanley Shunpike': 'Stan Shunpike',
  'Phineas Nigellus Black': 'Phineas Nigellus Black',
  'Nicolas Flamel': 'Nicolas Flamel',
  Norberta: 'Norberta',
  Fluffy: 'Fluffy',
  Aragog: 'Aragog',
  Buckbeak: 'Buckbeak',
  Fawkes: 'Fawkes',
  Crookshanks: 'Crookshanks',
  'Mrs Norris': 'Mrs Norris',
  Hedwig: 'Hedwig',
  Trevor: 'Trevor',
  Peeves: 'Peeves',
  'The Sorting Hat': 'Sorting Hat',
  'Madam Pomfrey': 'Poppy Pomfrey',
  'Madam Hooch': 'Rolanda Hooch',
  'Madam Malkin': "Malkin's",
  'Madame Maxime': 'Olympe Maxime',
  'Professor Quirrell': 'Quirinus Quirrell',
  'Quirinus Quirrell': 'Quirinus Quirrell',
  'Alicia Spinnet': 'Alicia Spinet',
  'Gilderoy Lockhart': 'Gilderoy Lockhart',
  'Minerva McGonagall': 'Minerva McGonagall',
  'Filius Flitwick': 'Filius Flitwick',
  'Pomona Sprout': 'Pomona Sprout',
  'Horace Slughorn': 'Horace Slughorn',
  'Sybill Trelawney': 'Sybill Trelawney',
  'Remus Lupin': 'Remus Lupin',
  'Alastor Moody': 'Alastor Moody',
  'Severus Snape': 'Severus Snape',
  'Dolores Umbridge': 'Dolores Umbridge',
  'Percy Weasley': 'Percy Weasley'
};

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') {
    return null;
  }
  if (url.startsWith('//')) {
    return `https:${url}`;
  }
  if (!url.startsWith('https://')) {
    return null;
  }
  return url;
}

function normalizeNameKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, ' ');
}

function nameTokens(name) {
  return normalizeNameKey(name).split(' ').filter(t => t.length > 1);
}

function pathIncludesFirstName(path, first) {
  if (!first) {
    return false;
  }
  if (path.includes(first)) {
    return true;
  }
  const re = new RegExp(`(^|[^a-z0-9])${first}([0-9]{1,3}|[^a-z0-9]|$)`, 'i');
  return re.test(path);
}

/** Same-surname gallery files (e.g. Amelia_Bones when picking Susan Bones) */
function hasConflictingFirstNameForSurname(path, first, last) {
  if (!last || !first) {
    return false;
  }
  const re = new RegExp(`([a-z]{3,})[\\s_\\-]+${last}\\b`, 'gi');
  let match;
  while ((match = re.exec(path)) !== null) {
    const other = match[1].toLowerCase();
    if (other !== first) {
      return true;
    }
  }
  return false;
}

function urlMatchesCharacter(url, displayName, options = {}) {
  if (!url) {
    return false;
  }
  const path = decodeURIComponent(url).toLowerCase();
  const tokens = nameTokens(displayName);
  if (tokens.length === 0) {
    return false;
  }
  if (tokens.length === 1) {
    return path.includes(tokens[0]);
  }

  const first = tokens[0];
  const last = tokens[tokens.length - 1];
  const trustWikiPage = Boolean(options.trustWikiPage);
  const isGoogle = Boolean(options.isGoogle);

  if (!pathIncludesFirstName(path, first)) {
    if (!isGoogle) {
      return false;
    }
    const haystack = `${path} ${(options.googleTitle || '').toLowerCase()}`;
    if (!pathIncludesFirstName(haystack, first)) {
      return false;
    }
  }

  if (hasConflictingFirstNameForSurname(path, first, last)) {
    return false;
  }

  if (trustWikiPage) {
    return true;
  }

  if (isGoogle) {
    const haystack = `${path} ${(options.googleTitle || '').toLowerCase()}`;
    if (hasConflictingFirstNameForSurname(haystack, first, last)) {
      return false;
    }
    return (
      haystack.includes(last) ||
      haystack.includes(`${first} ${last}`) ||
      haystack.includes(`${first}_${last}`)
    );
  }

  const compact = `${first}_${last}`;
  const compact2 = `${first}${last}`;
  return (
    path.includes(last) ||
    path.includes(compact) ||
    path.includes(compact2) ||
    path.includes(`${first} ${last}`)
  );
}

function isExactWikiTitleMatch(displayName, wikiTitle) {
  const wiki = wikiTitle.replace(/_/g, ' ').trim();
  const display = displayName.trim();
  if (wiki.toLowerCase() === display.toLowerCase()) {
    return true;
  }
  const override = FANDOM_TITLE_OVERRIDES[displayName];
  return override && wiki.toLowerCase() === override.toLowerCase();
}

function isPortraitish(width, height, species) {
  if (!width || !height) {
    return true;
  }
  const shortEdge = Math.min(width, height);
  if (shortEdge < MIN_SHORT_EDGE) {
    return false;
  }
  const ratio = width / height;
  if (species && species !== 'human') {
    return ratio >= 0.4 && ratio <= 2.5;
  }
  return ratio >= 0.55 && ratio <= 1.05;
}

function scoreCandidate(candidate, displayName) {
  let score = candidate.baseScore || 0;
  const url = candidate.url || '';
  const w = candidate.width || 0;
  const h = candidate.height || 0;
  if (w && h) {
    const ratio = w / h;
    if (ratio >= 0.65 && ratio <= 0.95) {
      score += 40;
    } else if (h > w) {
      score += 20;
    }
    if (Math.min(w, h) >= 300) {
      score += 15;
    }
  }
  if (url && BAD_FILENAME_RE.test(url)) {
    score -= 100;
  }
  if (candidate.exactTitleMatch) {
    score += 50;
  }
  const matchOpts = {
    trustWikiPage: candidate.trustWikiPage,
    isGoogle: candidate.source === 'google',
    googleTitle: candidate.googleTitle
  };
  if (urlMatchesCharacter(url, displayName, matchOpts)) {
    score += 60;
    const tokens = nameTokens(displayName);
    if (tokens.length >= 2) {
      const path = url.toLowerCase();
      if (path.includes(`${tokens[0]}_${tokens[tokens.length - 1]}`)) {
        score += 30;
      }
      if (path.includes(`${tokens[0]} ${tokens[tokens.length - 1]}`)) {
        score += 25;
      }
    }
  } else if (!candidate.isInfobox) {
    score -= 80;
  }
  if (url && BAD_GALLERY_RE.test(url)) {
    score -= 100;
  }
  if (url && FILM_STILL_RE.test(url)) {
    score += 35;
  }
  if (url && /\.png(\/|$|\?)/i.test(url) && !FILM_STILL_RE.test(url)) {
    score -= 20;
  }
  if (candidate.isInfobox && !FILM_STILL_RE.test(url)) {
    score -= 15;
  }
  if (candidate.source === 'google') {
    score += 25;
  }
  return score;
}

function candidateFromUrl(url, meta = {}) {
  const normalized = normalizeUrl(url);
  if (!normalized || BAD_FILENAME_RE.test(normalized)) {
    return null;
  }
  const displayName = meta.displayName || '';
  const matchOpts = {
    trustWikiPage: Boolean(meta.trustWikiPage),
    isGoogle: meta.source === 'google',
    googleTitle: meta.googleTitle
  };
  if (displayName && !meta.isInfobox && !urlMatchesCharacter(normalized, displayName, matchOpts)) {
    return null;
  }
  if (BAD_GALLERY_RE.test(normalized)) {
    return null;
  }
  const width = meta.width || 0;
  const height = meta.height || 0;
  if (!isPortraitish(width, height, meta.species)) {
    return null;
  }
  const candidate = {
    url: normalized,
    thumbUrl: normalizeUrl(meta.thumbUrl) || normalized,
    source: meta.source || 'unknown',
    label: meta.label || meta.source || 'Image',
    width,
    height,
    baseScore: meta.baseScore || 0,
    exactTitleMatch: Boolean(meta.exactTitleMatch),
    wikiPage: meta.wikiPage || null,
    trustWikiPage: Boolean(meta.trustWikiPage),
    isInfobox: Boolean(meta.isInfobox),
    googleTitle: meta.googleTitle || null
  };
  candidate._score = scoreCandidate(candidate, displayName);
  return candidate;
}

function rankAndLimit(list, displayName) {
  const seen = new Set();
  const sorted = [...list]
    .filter(Boolean)
    .filter(c => (c._score || 0) > 0)
    .sort((a, b) => (b._score || 0) - (a._score || 0));

  const out = [];
  for (const item of sorted) {
    if (seen.has(item.url)) {
      continue;
    }
    seen.add(item.url);
    const { _score, exactTitleMatch, baseScore, wikiPage, ...rest } = item;
    out.push(rest);
    if (out.length >= MAX_CANDIDATES) {
      break;
    }
  }
  return out;
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT }
  });
  if (!res.ok) {
    throw new Error(`${res.status}`);
  }
  return res.json();
}

function fandomApiUrl(params) {
  const q = new URLSearchParams({ format: 'json', origin: '*', ...params });
  return `${FANDOM_API}?${q}`;
}

function fandomTitleVariants(displayName) {
  const variants = [];
  if (FANDOM_TITLE_OVERRIDES[displayName]) {
    variants.push(FANDOM_TITLE_OVERRIDES[displayName]);
  }
  variants.push(displayName.replace(/ /g, '_'));
  variants.push(displayName.replace(/^Professor\s+/i, '').trim().replace(/ /g, '_'));
  return [...new Set(variants.filter(Boolean))];
}

async function resolveCanonicalWikiPage(displayName) {
  for (const title of fandomTitleVariants(displayName)) {
    const url = fandomApiUrl({
      action: 'query',
      titles: title,
      prop: 'pageprops',
      ppprop: 'disambiguation'
    });
    const data = await fetchJson(url);
    const page = Object.values(data.query?.pages || {})[0];
    if (page && !page.missing && !page.invalid && !page.pageprops?.disambiguation) {
      return { title: page.title, exact: isExactWikiTitleMatch(displayName, page.title) };
    }
  }

  const searchUrl = fandomApiUrl({
    action: 'query',
    list: 'search',
    srsearch: displayName,
    srnamespace: 0,
    srlimit: 6
  });
  const data = await fetchJson(searchUrl);
  for (const hit of data.query?.search || []) {
    if (hit.title.toLowerCase() === displayName.toLowerCase()) {
      return { title: hit.title, exact: true };
    }
    if (FANDOM_TITLE_OVERRIDES[displayName]?.toLowerCase() === hit.title.toLowerCase()) {
      return { title: hit.title, exact: true };
    }
  }

  for (const hit of data.query?.search || []) {
    const tokens = nameTokens(displayName);
    const hitNorm = normalizeNameKey(hit.title);
    if (tokens.length >= 2 && hitNorm.includes(tokens[tokens.length - 1]) && hitNorm.includes(tokens[0])) {
      return { title: hit.title, exact: false };
    }
  }

  return null;
}

async function fetchInfoboxImage(wikiTitle, displayName, species, exact) {
  const url = fandomApiUrl({
    action: 'query',
    titles: wikiTitle,
    prop: 'pageimages',
    piprop: 'original|thumbnail',
    pithumbsize: 800
  });
  const data = await fetchJson(url);
  const page = Object.values(data.query?.pages || {})[0];
  if (!page?.thumbnail?.source && !page?.original?.source) {
    return [];
  }
  const thumb = page.thumbnail;
  const imageUrl = page.original?.source || thumb?.source;
  const c = candidateFromUrl(imageUrl, {
    thumbUrl: thumb?.source || imageUrl,
    source: 'hp-wiki',
    label: 'HP Wiki — main portrait',
    width: thumb?.width || page.original?.width,
    height: thumb?.height || page.original?.height,
    species,
    baseScore: 90,
    exactTitleMatch: exact,
    wikiPage: wikiTitle,
    displayName,
    trustWikiPage: exact,
    isInfobox: true
  });
  return c ? [c] : [];
}

async function fetchCharacterGalleryImages(wikiTitle, displayName, species, exact) {
  const listUrl = fandomApiUrl({
    action: 'query',
    titles: wikiTitle,
    prop: 'images',
    imlimit: 50
  });
  const listData = await fetchJson(listUrl);
  const page = Object.values(listData.query?.pages || {})[0];
  if (!page?.images?.length) {
    return [];
  }

  const fileTitles = page.images
    .map(img => img.title)
    .filter(title => /\.(jpg|jpeg|png|webp)$/i.test(title))
    .filter(title => !BAD_FILENAME_RE.test(title))
    .filter(title => !BAD_GALLERY_RE.test(title))
    .filter(title => {
      const fileSlug = title.replace(/^File:/i, '').toLowerCase();
      return urlMatchesCharacter(fileSlug, displayName, { trustWikiPage: exact });
    });

  if (!fileTitles.length) {
    return [];
  }

  const infoUrl = fandomApiUrl({
    action: 'query',
    titles: fileTitles.slice(0, 15).join('|'),
    prop: 'imageinfo',
    iiprop: 'url|thumburl|size',
    iiurlwidth: 800
  });
  const infoData = await fetchJson(infoUrl);
  const results = [];

  for (const filePage of Object.values(infoData.query?.pages || {})) {
    const info = filePage.imageinfo?.[0];
    if (!info) {
      continue;
    }
    const c = candidateFromUrl(info.url || info.thumburl, {
      thumbUrl: info.thumburl || info.url,
      source: 'hp-wiki',
      label: 'HP Wiki — gallery',
      width: info.thumbwidth || info.width,
      height: info.thumbheight || info.height,
      species,
      baseScore: 85,
      exactTitleMatch: exact,
      wikiPage: wikiTitle,
      displayName,
      trustWikiPage: exact
    });
    if (c) {
      results.push(c);
    }
  }
  return results;
}

async function searchHpFandomWiki(displayName, species) {
  const resolved = await resolveCanonicalWikiPage(displayName);
  if (!resolved) {
    return [];
  }

  const { title, exact } = resolved;
  const results = [];

  results.push(...await fetchInfoboxImage(title, displayName, species, exact));
  results.push(...await fetchCharacterGalleryImages(title, displayName, species, exact));

  return results;
}

let hpApiCache = null;

async function loadHpApiImages() {
  if (hpApiCache) {
    return hpApiCache;
  }
  try {
    const res = await fetch('https://hp-api.onrender.com/api/characters', {
      headers: { 'User-Agent': USER_AGENT }
    });
    const list = await res.json();
    hpApiCache = new Map(list.map(c => [c.name, c.image]).filter(([, img]) => img));
  } catch {
    hpApiCache = new Map();
  }
  return hpApiCache;
}

async function searchHpApiByName(apiName, displayName, species) {
  const map = await loadHpApiImages();
  const url = map.get(apiName) || map.get(displayName);
  if (!url) {
    return null;
  }
  return candidateFromUrl(url, {
    source: 'hp-api',
    label: 'HP API (film)',
    thumbUrl: url,
    species,
    baseScore: 110,
    exactTitleMatch: true,
    displayName
  });
}

async function searchGoogleCse(displayName, apiKey, cx, species) {
  if (!apiKey || !cx) {
    return [];
  }
  const q = encodeURIComponent(`${displayName} Harry Potter film character`);
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cx)}&q=${q}&searchType=image&num=10&imgSize=large&safe=active`;
  const data = await fetchJson(url);
  const results = [];

  for (const item of data.items || []) {
    const c = candidateFromUrl(item.link, {
      thumbUrl: item.image?.thumbnailLink || item.link,
      source: 'google',
      label: 'Google Images',
      width: item.image?.width,
      height: item.image?.height,
      species,
      baseScore: 95,
      exactTitleMatch: false,
      displayName,
      googleTitle: item.title || item.snippet || ''
    });
    if (c) {
      results.push(c);
    }
  }
  return results;
}

async function findImageCandidates({ displayName, apiName, existingApiImage, species }) {
  const merged = [];
  const name = displayName || apiName;

  if (existingApiImage) {
    const hp = candidateFromUrl(existingApiImage, {
      source: 'hp-api',
      label: 'HP API (film)',
      thumbUrl: existingApiImage,
      species,
      baseScore: 110,
      exactTitleMatch: true,
      displayName: name
    });
    if (hp) {
      merged.push(hp);
    }
  }

  try {
    const apiMatch = await searchHpApiByName(apiName || name, name, species);
    if (apiMatch) {
      merged.push(apiMatch);
    }
  } catch (err) {
    process.stderr.write(`HP API image lookup failed: ${err.message}\n`);
  }

  try {
    merged.push(...await searchHpFandomWiki(name, species));
  } catch (err) {
    process.stderr.write(`HP Wiki failed for ${name}: ${err.message}\n`);
  }

  let ranked = rankAndLimit(merged, name);

  const hasGoogle = process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX;
  if (hasGoogle && ranked.length < 3) {
    try {
      const google = await searchGoogleCse(
        name,
        process.env.GOOGLE_CSE_API_KEY,
        process.env.GOOGLE_CSE_CX,
        species
      );
      ranked = rankAndLimit([...merged, ...google], name);
    } catch (err) {
      process.stderr.write(`Google CSE failed for ${name}: ${err.message}\n`);
    }
  }

  return ranked.slice(0, 3);
}

module.exports = {
  findImageCandidates,
  MAX_CANDIDATES,
  urlMatchesCharacter,
  resolveCanonicalWikiPage
};
