# Character data (curated roster)

## Files

| File | Purpose |
|------|---------|
| `character-allowlist.json` | Names that must appear in the final roster (~150) |
| `character-overrides.json` | Per-character fixes, `include: false` to exclude, optional `imageFile` |
| `image-sources.json` | Manifest of downloaded portraits (source URL + notes) — filled during image work |
| `characters-candidates.json` | **Generated** — full review payload |
| `characters-included-names.txt` | **Generated** — included roster, one name per line |
| `characters-excluded-names.txt` | **Generated** — excluded from roster, one name per line |
| `characters-included-names.json` / `characters-excluded-names.json` | Same lists as JSON arrays |
| `characters.json` | **Generated** — approved roster (copied to `server/public/data/` in PR 2) |

## Canonical spellings (British English)

| Field | Values used in game |
|-------|-------------------|
| `hairColour` | `blond` (male), `blonde` (female), `brown`, `black`, `red`, `ginger`, `grey`, `white`, `silver`, `bald`, `Unknown` |
| `ancestry` | `muggle-born` (hyphenated), `half-blood`, `pure-blood`, `squib`, etc. |
| `house` | Hogwarts house, `Unknown` (human wizard, house not known), or `None` (other school, creature, muggle, squib, etc.) |

The build script normalises API American variants. Guesses treat `blonde`/`blond` and `red`/`ginger` as equivalent for matching.

## Commands

```bash
npm run build:characters
```

Writes `characters-candidates.json` for review.

After you approve the list (edit allowlist/overrides, re-run until happy):

```bash
npm run build:characters -- --write-final
```

## Review workflow

1. Scan `characters-included-names.txt` and `characters-excluded-names.txt` (fast name-only lists).
2. Fill gaps in `character-overrides.json` — each build adds `null` placeholders for fields still `Unknown`; `_needs` lists what is left. Replace `null` with the real value (e.g. `"ancestry": "half-blood"`). `null` / empty strings are ignored until you set a value. Optional first pass: `npm run fill:characters` applies canon guesses from `scripts/apply-canonical-fills.js` (review and correct as needed).
3. Move names via `character-allowlist.json` or set `"include": false` in overrides.
4. Re-run `npm run build:characters` until the included count and roster look right.
5. Run with `--write-final` when ready for PR 2 (app switch + self-hosted images).

Override keys use the **API name** (e.g. `Quirinus Quirrel`), not always the display name.

## Character portraits (image picker)

Roughly 130 included characters still need a self-hosted image. Use the local review UI instead of hunting images manually.

### 1. Start the review app

```bash
npm run image:review
```

Open [http://localhost:3939](http://localhost:3939). For each character you get up to **3 portrait options**: film-style stills from that character’s **Harry Potter Wiki** page (first name required in filenames; same-surname relatives like Amelia Bones are excluded), plus **Google Images** when `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_CX` are set in `.env` (recommended — matches what you see in a normal Google image search).

**Paste your own image:** use “Paste a direct image URL” (copy image address from Google Images, Reddit, etc. — not the Reddit post page URL).

Optional: add to `.env` (see `.env.example`):

- `GOOGLE_CSE_API_KEY` and `GOOGLE_CSE_CX` — improves results for obscure names

### 2. Approve portraits

- Click a thumbnail to select it, then **Approve selected**
- **Skip for now** — review later (stored in `image-approvals.json`)
- **Back** — previous character in the queue
- Shortcuts: `1` `2` `3` select · `Enter` approve · `S` skip · `B` back
- **Adjust crop** (optional) — one 100×100 preview; pan/zoom applies to both the dropdown and guess table portraits.
- **Roster gallery** tab (default) — all **155** included characters with stats, portrait (HP API / approved / placeholder), **crop/zoom**, and **Change image**. Filters: All · HP API (25) · Custom portraits · Needs portrait. **Save crop** works on API portraits too (stored in `image-approvals.json` + `character-overrides.json`).

Progress is saved in `data/image-approvals.json`.

### 3. Download approved images

After you have approved a batch (or all):

```bash
npm run image:download
```

This downloads files to `server/public/imgs/characters/`, records sources in `data/image-sources.json`, and sets `imageFile` in `character-overrides.json`.

### 4. Rebuild roster

```bash
npm run build:characters
```

Verify `characters-candidates.json` shows `"image": "/imgs/characters/…"` for approved characters.

### Other commands

```bash
npm run image:manifest   # regenerate data/image-review-manifest.json only
```
