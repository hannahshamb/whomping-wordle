/* global fetch, CropEditor */

let queue = [];
let index = 0;
let selectedCandidate = null;
let currentCandidates = [];

const statsEl = document.getElementById('stats');
const emptyState = document.getElementById('emptyState');
const reviewPanel = document.getElementById('reviewPanel');
const characterName = document.getElementById('characterName');
const characterMeta = document.getElementById('characterMeta');
const manualSearch = document.getElementById('manualSearch');
const loading = document.getElementById('loading');
const errorEl = document.getElementById('error');
const candidatesEl = document.getElementById('candidates');
const approveBtn = document.getElementById('approveBtn');
const skipBtn = document.getElementById('skipBtn');
const backBtn = document.getElementById('backBtn');
const customUrlInput = document.getElementById('customUrlInput');
const previewUrlBtn = document.getElementById('previewUrlBtn');
const approveUrlBtn = document.getElementById('approveUrlBtn');
const customPreview = document.getElementById('customPreview');
const navReview = document.getElementById('navReview');
const navApproved = document.getElementById('navApproved');
const approvedCountEl = document.getElementById('approvedCount');
const approvedSection = document.getElementById('approvedSection');
const approvedGrid = document.getElementById('approvedGrid');
const approvedMeta = document.getElementById('approvedMeta');
const approvedLoading = document.getElementById('approvedLoading');
const emptyViewApprovedBtn = document.getElementById('empty-view-approved-btn');
const cropPanel = document.getElementById('cropPanel');
const cropEditorMount = document.getElementById('cropEditorMount');

let customUrlValue = null;
let currentView = 'gallery';
let cropEditor = null;
let galleryFilter = 'all';
let galleryData = null;
const MIN_SERVER_VERSION = 4;

async function fetchJson(url, options) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error(
      'Image review server is out of date or not running. Stop any old server (Ctrl+C), then run: npm run image:review'
    );
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `Request failed (${res.status})`);
  }
  return data;
}

const STAT_FIELDS = [
  ['gender', 'Gender'],
  ['hairColour', 'Hair'],
  ['role', 'Hogwarts'],
  ['house', 'House'],
  ['species', 'Species'],
  ['ancestry', 'Ancestry'],
  ['alive', 'Alive']
];

function getCropEditor() {
  if (!cropEditor && cropEditorMount) {
    cropEditor = new CropEditor(cropEditorMount, {
      onChange: () => syncCandidatePreviewsWithCrop()
    });
  }
  return cropEditor;
}

function cropStyleAttr(crop) {
  if (!crop || window.cropUtils.isDefaultCrop(crop)) {
    return '';
  }
  return ` style="${window.cropUtils.cropToCss(crop)}"`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function imageStatusLabel(item) {
  const labels = {
    placeholder: 'No portrait — game placeholder',
    'api-default': 'HP API portrait (original 25)',
    approved: item.hasApproval ? 'Custom portrait approved' : 'Portrait set',
    downloaded: 'Downloaded locally'
  };
  return labels[item.imageStatus] || item.imageStatus;
}

function characterStatsHtml(character) {
  return `
    <div class="char-stats-editor">
      <dl class="char-stats">
        ${STAT_FIELDS.map(([key, label]) => `
          <div>
            <dt><label class="char-stat-label" for="">${label}</label></dt>
            <dd>
              <input
                type="text"
                class="char-stat-input"
                data-field="${key}"
                value="${escapeHtml(character[key] ?? '')}"
                spellcheck="false"
                autocomplete="off"
              >
            </dd>
          </div>
        `).join('')}
      </dl>
      <button type="button" class="btn btn-secondary save-stats-btn">Save stats</button>
      <p class="meta char-stats-status" aria-live="polite"></p>
    </div>
  `;
}

function galleryPreviewHtml(item) {
  if (item.usePlaceholder) {
    const src = escapeHtml(item.placeholderUrl);
    return `
      <div class="game-preview-slot">
        <p class="game-preview-caption">In-game preview (100×100)</p>
        <div class="img-container game-preview-box gallery-placeholder">
          <img class="character-img-wizard" src="${src}" alt="" loading="lazy">
        </div>
      </div>
    `;
  }
  return gamePreviewHtml(item.previewUrl, item.crop);
}

function updateGalleryCardPreview(card, previewUrl, crop, usePlaceholder, placeholderUrl) {
  const slot = card.querySelector('.gallery-preview-wrap');
  if (!slot) {
    return;
  }
  if (usePlaceholder) {
    slot.innerHTML = galleryPreviewHtml({ usePlaceholder: true, placeholderUrl }).trim();
    return;
  }
  slot.innerHTML = gamePreviewHtml(previewUrl, crop).trim();
}

/** Single 100×100 preview — same crop applies to dropdown and guess table in-game */
function gamePreviewHtml(imageUrl, crop) {
  const src = escapeHtml(imageUrl);
  const style = cropStyleAttr(crop);
  return `
    <div class="game-preview-slot">
      <p class="game-preview-caption">In-game preview (100×100)</p>
      <div class="img-container game-preview-box">
        <img class="character-img-lg" src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer"${style}>
      </div>
    </div>
  `;
}

function syncCandidatePreviewsWithCrop() {
  const editor = getCropEditor();
  if (!editor || !cropPanel || cropPanel.classList.contains('hidden')) {
    return;
  }
  const crop = editor.getCrop();
  for (const img of candidatesEl.querySelectorAll('.candidate.selected .game-preview-box .character-img-lg')) {
    img.style.cssText = `object-fit: cover; width: 100%; height: 100%; border-radius: 4px; ${window.cropUtils.cropToCss(crop)}`;
  }
  const customImg = customPreview.querySelector('.character-img-lg');
  if (customImg) {
    customImg.style.cssText = `object-fit: cover; width: 100%; height: 100%; border-radius: 4px; ${window.cropUtils.cropToCss(crop)}`;
  }
}

function showCropEditor(imageUrl, crop) {
  if (!imageUrl || !cropPanel) {
    hideCropEditor();
    return;
  }
  cropPanel.classList.remove('hidden');
  if (cropEditorMount) {
    cropEditorMount.classList.remove('hidden');
  }
  const editor = getCropEditor();
  if (editor) {
    editor.setImage(imageUrl, crop);
  }
}

function hideCropEditor() {
  if (cropPanel) {
    cropPanel.classList.add('hidden');
  }
  if (cropEditor) {
    cropEditor.reset();
  }
}

async function loadQueue() {
  const data = await fetchJson('/api/queue');
  queue = data.items || [];
  statsEl.innerHTML = `
    <span><strong>${data.pending}</strong> pending</span>
    <span><strong>${data.alreadyApproved}</strong> approved</span>
    <span><strong>${data.skipped}</strong> skipped</span>
    <span>Google CSE: ${data.googleSearchEnabled ? 'on' : 'off'}</span>
  `;
  if (approvedCountEl) {
    approvedCountEl.textContent = String(data.alreadyApproved || 0);
  }
  if (index >= queue.length) {
    index = Math.max(0, queue.length - 1);
  }
  if (currentView === 'review') {
    renderCurrent();
  }
}

function setView(view) {
  currentView = view === 'review' ? 'review' : 'gallery';
  navReview.classList.toggle('active', currentView === 'review');
  navApproved.classList.toggle('active', currentView === 'gallery');
  approvedSection.classList.toggle('hidden', currentView !== 'gallery');
  if (currentView === 'gallery') {
    emptyState.classList.add('hidden');
    reviewPanel.classList.add('hidden');
    loadApprovedGallery();
    return;
  }
  renderCurrent();
}

function showPanel(showReview) {
  emptyState.classList.toggle('hidden', showReview);
  reviewPanel.classList.toggle('hidden', !showReview);
}

function syncGalleryMetaFromData() {
  if (!galleryData) {
    return;
  }
  const auditNote = galleryData.rosterAudit?.inSync
    ? 'roster in sync'
    : 'roster mismatch — restart server & run npm run build:characters';
  approvedMeta.textContent =
    `${galleryData.count} characters · ${galleryData.approvedCount} custom portraits · ${galleryData.apiPortraitCount || 0} HP API portraits · ${galleryData.needsImageCount} need images · ${auditNote}`;
  if (approvedCountEl) {
    approvedCountEl.textContent = String(galleryData.approvedCount || 0);
  }
}

function patchGalleryDataItem(apiName, updates) {
  if (!galleryData?.items) {
    return null;
  }
  const dataItem = galleryData.items.find(entry => entry.apiName === apiName);
  if (dataItem) {
    Object.assign(dataItem, updates);
  }
  return dataItem;
}

function ensureUnapproveButton(card, apiName) {
  const actions = card.querySelector('.gallery-card-actions');
  if (!actions || actions.querySelector('.unapprove-btn')) {
    return;
  }
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn-link unapprove-btn';
  btn.textContent = 'Remove approval';
  btn.addEventListener('click', () => unapprove(apiName));
  actions.appendChild(btn);
}

function removeUnapproveButton(card) {
  const btn = card.querySelector('.unapprove-btn');
  if (btn) {
    btn.remove();
  }
}

function applyGalleryPortraitUpdate(card, item, { imageUrl, crop, createdApproval }) {
  const wasApiDefault = item.imageStatus === 'api-default' && !item.hasApproval;
  item.hasApproval = true;
  item.crop = crop;
  item.previewUrl = imageUrl;
  item.usePlaceholder = false;
  item.canEditCrop = true;
  item.imageStatus = 'approved';
  item.approval = {
    selectedUrl: imageUrl,
    crop,
    source: item.approval?.source || 'gallery-crop',
    label: item.approval?.label || 'Gallery crop'
  };

  patchGalleryDataItem(item.apiName, {
    hasApproval: true,
    crop,
    previewUrl: imageUrl,
    usePlaceholder: false,
    canEditCrop: true,
    imageStatus: 'approved',
    approval: item.approval
  });

  if (createdApproval) {
    galleryData.approvedCount += 1;
    if (wasApiDefault) {
      galleryData.apiPortraitCount = Math.max(0, (galleryData.apiPortraitCount || 0) - 1);
    }
  }

  const statusEl = card.querySelector('.gallery-status');
  if (statusEl) {
    statusEl.textContent = imageStatusLabel(item);
  }
  updateGalleryCardPreview(card, imageUrl, crop, false, item.placeholderUrl);
  ensureUnapproveButton(card, item.apiName);
  syncGalleryMetaFromData();
}

async function loadApprovedGallery({ preserveScroll = false } = {}) {
  const scrollY = preserveScroll ? window.scrollY : 0;
  approvedLoading.classList.remove('hidden');
  approvedGrid.innerHTML = '';

  try {
    const data = await fetchJson('/api/gallery');
    galleryData = data;
    syncGalleryMetaFromData();
    renderGalleryGrid();
    if (preserveScroll) {
      requestAnimationFrame(() => window.scrollTo(0, scrollY));
    }
  } catch (err) {
    approvedMeta.textContent = err.message;
  } finally {
    approvedLoading.classList.add('hidden');
  }
}

function galleryItemsFiltered() {
  if (!galleryData?.items) {
    return [];
  }
  if (galleryFilter === 'approved') {
    return galleryData.items.filter(item => item.hasApproval);
  }
  if (galleryFilter === 'needs') {
    return galleryData.items.filter(item => item.usePlaceholder);
  }
  if (galleryFilter === 'api') {
    return galleryData.items.filter(item => item.imageStatus === 'api-default' && !item.hasApproval);
  }
  return galleryData.items;
}

function renderGalleryGrid() {
  const scrollY = window.scrollY;
  approvedGrid.innerHTML = '';
  const items = galleryItemsFiltered();
  if (!items.length) {
    approvedGrid.innerHTML = '<p class="meta">No characters match this filter.</p>';
    return;
  }

  for (const item of items) {
    const card = document.createElement('article');
    card.className = 'approved-card';
    card.dataset.apiName = item.apiName;
    const cropSection = item.canEditCrop
      ? '<div class="crop-editor-mount"></div><button type="button" class="btn btn-secondary crop-save-approved">Save crop</button>'
      : '<p class="meta crop-unavailable">Paste an image URL below to enable crop.</p>';

    card.innerHTML = `
      <p class="approved-name">${escapeHtml(item.displayName)}</p>
      <p class="gallery-status">${escapeHtml(imageStatusLabel(item))}</p>
      <div class="gallery-preview-wrap">${galleryPreviewHtml(item)}</div>
      ${characterStatsHtml(item.character)}
      ${cropSection}
      <div class="gallery-change-image">
        <label>Change image</label>
        <div class="gallery-url-row">
          <input type="url" class="gallery-url-input" placeholder="Paste direct image URL…" spellcheck="false">
          <button type="button" class="btn btn-secondary gallery-preview-btn">Preview</button>
          <button type="button" class="btn btn-primary gallery-save-image-btn" disabled>Save image</button>
        </div>
      </div>
      <div class="gallery-card-actions">
        ${item.hasApproval ? '<button type="button" class="btn-link unapprove-btn">Remove approval</button>' : ''}
      </div>
    `;

    setupGalleryCard(card, item);
    approvedGrid.appendChild(card);
  }
  requestAnimationFrame(() => window.scrollTo(0, scrollY));
}

function setupGalleryCard(card, item) {
  let inlineEditor = null;
  let pendingGalleryUrl = item.previewUrl;
  let activePreviewUrl = item.previewUrl;

  if (item.canEditCrop) {
    const mount = card.querySelector('.crop-editor-mount');
    const host = document.createElement('div');
    mount.appendChild(host);
    inlineEditor = new CropEditor(host, {
      onChange: crop => {
        updateGalleryCardPreview(card, activePreviewUrl, crop, false, item.placeholderUrl);
      }
    });
    inlineEditor.setImage(item.previewUrl, item.crop);
    card.querySelector('.crop-save-approved').addEventListener('click', async () => {
      await saveGalleryCrop(item, inlineEditor, card, activePreviewUrl);
    });
  }

  const urlInput = card.querySelector('.gallery-url-input');
  const previewBtn = card.querySelector('.gallery-preview-btn');
  const saveImageBtn = card.querySelector('.gallery-save-image-btn');

  previewBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    pendingGalleryUrl = null;
    saveImageBtn.disabled = true;
    if (!url) {
      return;
    }
    if (!isLikelyImageUrl(url)) {
      window.alert('Paste a direct image URL (.jpg, wikia, i.redd.it, etc.)');
      return;
    }
    pendingGalleryUrl = url;
    activePreviewUrl = url;
    saveImageBtn.disabled = false;
    updateGalleryCardPreview(card, url, inlineEditor?.getCrop() || null, false, item.placeholderUrl);
    if (inlineEditor) {
      inlineEditor.setImage(url, inlineEditor.getCrop());
    } else if (!item.canEditCrop) {
      ensureGalleryCropEditor(card, item, url);
      inlineEditor = card._cropEditor;
    }
  });

  saveImageBtn.addEventListener('click', async () => {
    if (!pendingGalleryUrl || saveImageBtn.disabled) {
      return;
    }
    const crop = inlineEditor ? inlineEditor.getCrop() : null;
    const apiName = card.dataset.apiName || item.apiName;
    saveImageBtn.disabled = true;
    try {
      await fetchJson('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiName,
          displayName: item.displayName,
          slug: item.slug,
          selectedUrl: pendingGalleryUrl,
          source: 'manual-url',
          label: 'Gallery edit',
          crop
        })
      });
    } catch (err) {
      window.alert(err.message);
      saveImageBtn.disabled = false;
      return;
    }
    pendingGalleryUrl = null;
    applyGalleryPortraitUpdate(card, item, {
      imageUrl: activePreviewUrl,
      crop,
      createdApproval: !item.hasApproval
    });
    saveImageBtn.textContent = 'Saved';
    setTimeout(() => {
      saveImageBtn.textContent = 'Save image';
      saveImageBtn.disabled = true;
    }, 1500);
    loadQueue();
  });

  const saveStatsBtn = card.querySelector('.save-stats-btn');
  if (saveStatsBtn) {
    saveStatsBtn.addEventListener('click', () => saveGalleryStats(card, item));
  }

  const unapproveBtn = card.querySelector('.unapprove-btn');
  if (unapproveBtn) {
    unapproveBtn.addEventListener('click', () => unapprove(item.apiName));
  }

  if (item.approval?.selectedUrl) {
    urlInput.value = item.approval.selectedUrl;
  } else if (item.apiImageUrl) {
    urlInput.value = item.apiImageUrl;
  } else if (item.previewUrl && !item.usePlaceholder) {
    urlInput.value = item.previewUrl;
  }
}

function ensureGalleryCropEditor(card, item, imageUrl) {
  if (card._cropEditor) {
    return card._cropEditor;
  }
  const unavailable = card.querySelector('.crop-unavailable');
  if (unavailable) {
    unavailable.remove();
  }
  const mount = document.createElement('div');
  mount.className = 'crop-editor-mount';
  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn btn-secondary crop-save-approved';
  saveBtn.textContent = 'Save crop';
  const changeSection = card.querySelector('.gallery-change-image');
  changeSection.before(mount);
  changeSection.before(saveBtn);
  const host = document.createElement('div');
  mount.appendChild(host);
  const editor = new CropEditor(host, {
    onChange: crop => {
      updateGalleryCardPreview(card, imageUrl, crop, false, item.placeholderUrl);
    }
  });
  editor.setImage(imageUrl, null);
  saveBtn.addEventListener('click', async () => {
    await saveGalleryCrop(item, editor, card, imageUrl);
  });
  card._cropEditor = editor;
  return editor;
}

async function saveGalleryStats(card, item) {
  const btn = card.querySelector('.save-stats-btn');
  const statusEl = card.querySelector('.char-stats-status');
  if (btn?.disabled) {
    return;
  }

  const fields = {};
  for (const input of card.querySelectorAll('.char-stat-input')) {
    fields[input.dataset.field] = input.value.trim();
  }

  btn.disabled = true;
  if (statusEl) {
    statusEl.textContent = 'Saving…';
  }

  try {
    const response = await fetchJson('/api/character-fields', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiName: card.dataset.apiName || item.apiName,
        fields
      })
    });
    Object.assign(item.character, response.character);
    patchGalleryDataItem(item.apiName, { character: { ...item.character } });
    for (const input of card.querySelectorAll('.char-stat-input')) {
      const field = input.dataset.field;
      input.value = response.character[field] ?? '';
    }
    if (statusEl) {
      statusEl.textContent = 'Saved to character-overrides.json';
      setTimeout(() => {
        if (statusEl.textContent === 'Saved to character-overrides.json') {
          statusEl.textContent = '';
        }
      }, 2500);
    }
  } catch (err) {
    if (statusEl) {
      statusEl.textContent = '';
    }
    window.alert(err.message);
  } finally {
    btn.disabled = false;
  }
}

async function saveGalleryCrop(item, editor, card, imageUrl) {
  const btn = card.querySelector('.crop-save-approved');
  if (btn?.disabled) {
    return;
  }
  const crop = editor.getCrop();
  const apiName = card.dataset.apiName || item.apiName;
  if (btn) {
    btn.disabled = true;
  }
  let response;
  try {
    response = await fetchJson('/api/crop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiName,
        displayName: item.displayName,
        slug: item.slug,
        selectedUrl: imageUrl || item.previewUrl,
        crop
      })
    });
  } catch (err) {
    window.alert(err.message);
    if (btn) {
      btn.disabled = false;
    }
    return;
  }
  applyGalleryPortraitUpdate(card, item, {
    imageUrl: imageUrl || item.previewUrl,
    crop: response.crop ?? crop,
    createdApproval: Boolean(response.createdApproval)
  });
  if (btn) {
    btn.textContent = 'Saved';
    btn.disabled = false;
    setTimeout(() => {
      btn.textContent = 'Save crop';
    }, 1500);
  }
  loadQueue();
}

async function unapprove(apiName) {
  if (!window.confirm(`Remove approval for ${apiName}? They will return to the review queue.`)) {
    return;
  }
  const res = await fetch('/api/unapprove', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiName })
  });
  if (!res.ok) {
    const data = await res.json();
    window.alert(data.error || 'Could not remove approval');
    return;
  }

  const card = approvedGrid.querySelector(`[data-api-name="${CSS.escape(apiName)}"]`);
  const dataItem = galleryData?.items?.find(entry => entry.apiName === apiName);
  if (card && dataItem) {
    const fallbackUrl = dataItem.apiImageUrl || dataItem.placeholderUrl;
    const wasApproved = dataItem.hasApproval;
    dataItem.hasApproval = false;
    dataItem.approval = null;
    dataItem.crop = null;
    dataItem.previewUrl = fallbackUrl;
    dataItem.usePlaceholder = !dataItem.apiImageUrl;
    dataItem.imageStatus = dataItem.apiImageUrl ? 'api-default' : 'placeholder';
    dataItem.canEditCrop = Boolean(dataItem.apiImageUrl);

    if (wasApproved) {
      galleryData.approvedCount = Math.max(0, galleryData.approvedCount - 1);
      if (dataItem.apiImageUrl) {
        galleryData.apiPortraitCount = (galleryData.apiPortraitCount || 0) + 1;
      }
    }

    const statusEl = card.querySelector('.gallery-status');
    if (statusEl) {
      statusEl.textContent = imageStatusLabel(dataItem);
    }
    updateGalleryCardPreview(
      card,
      dataItem.previewUrl,
      null,
      dataItem.usePlaceholder,
      dataItem.placeholderUrl
    );
    removeUnapproveButton(card);
    syncGalleryMetaFromData();
  }

  loadQueue();
}

async function renderCurrent() {
  if (currentView !== 'review') {
    return;
  }
  if (queue.length === 0) {
    showPanel(false);
    return;
  }

  showPanel(true);
  const item = queue[index];
  selectedCandidate = null;
  approveBtn.disabled = true;
  currentCandidates = [];
  customUrlInput.value = '';
  customUrlValue = null;
  approveUrlBtn.disabled = true;
  customPreview.classList.add('hidden');
  customPreview.innerHTML = '';
  hideCropEditor();

  characterName.textContent = item.displayName;
  characterMeta.textContent = `${index + 1} of ${queue.length} · saves as ${item.suggestedFilename} · API key: ${item.apiName}`;
  manualSearch.href = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(`${item.displayName} Harry Potter character portrait`)}`;

  loading.classList.remove('hidden');
  errorEl.classList.add('hidden');
  candidatesEl.innerHTML = '';

  try {
    const params = new URLSearchParams({
      apiName: item.apiName,
      displayName: item.displayName,
      existingApiImage: item.existingApiImage || '',
      species: item.species || 'human'
    });
    const res = await fetch(`/api/candidates?${params}`);
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load candidates');
    }
    currentCandidates = data.candidates || [];
    manualSearch.href = data.manualSearchUrl || manualSearch.href;
    renderCandidates();
  } catch (err) {
    errorEl.textContent = err.message;
    errorEl.classList.remove('hidden');
  } finally {
    loading.classList.add('hidden');
  }
}

function renderCandidates() {
  candidatesEl.innerHTML = '';
  if (currentCandidates.length === 0) {
    errorEl.textContent = 'No good portraits found. Use the Google Images link and paste a direct image URL, or add GOOGLE_CSE_API_KEY + GOOGLE_CSE_CX to .env for automated Google results.';
    errorEl.classList.remove('hidden');
    return;
  }

  currentCandidates.forEach((candidate, i) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'candidate';
    card.setAttribute('aria-label', `Option ${i + 1}: ${candidate.label}`);
    card.innerHTML = `
      ${gamePreviewHtml(candidate.thumbUrl)}
      <div class="label">${i + 1}. ${escapeHtml(candidate.label)}</div>
    `;
    if (i === 0) {
      card.classList.add('recommended');
    }
    card.addEventListener('click', () => selectCandidate(i));
    candidatesEl.appendChild(card);
  });
}

function selectCandidate(i) {
  selectedCandidate = currentCandidates[i];
  approveBtn.disabled = !selectedCandidate;
  [...candidatesEl.querySelectorAll('.candidate')].forEach((el, idx) => {
    el.classList.toggle('selected', idx === i);
  });
  showCropEditor(selectedCandidate.thumbUrl || selectedCandidate.url);
}

async function submitApproval(payload) {
  const item = queue[index];
  if (!item) {
    return false;
  }
  const res = await fetch('/api/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      apiName: item.apiName,
      displayName: item.displayName,
      slug: item.slug,
      ...payload
    })
  });
  if (!res.ok) {
    const data = await res.json();
    errorEl.textContent = data.error || 'Approve failed';
    errorEl.classList.remove('hidden');
    return false;
  }
  await loadQueue();
  return true;
}

async function approve() {
  if (!selectedCandidate || !queue[index]) {
    return;
  }
  approveBtn.disabled = true;
  const editor = getCropEditor();
  const ok = await submitApproval({
    selectedUrl: selectedCandidate.url,
    source: selectedCandidate.source,
    label: selectedCandidate.label,
    crop: editor ? editor.getCropForStorage() : null
  });
  if (!ok) {
    approveBtn.disabled = false;
  }
}

function isLikelyImageUrl(url) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) {
      return false;
    }
    return /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(u.pathname) ||
      u.hostname.includes('wikia.nocookie.net') ||
      u.hostname.includes('imagekit.io') ||
      u.hostname.includes('i.redd.it') ||
      u.hostname.includes('imgur.com');
  } catch {
    return false;
  }
}

function previewCustomUrl() {
  const url = customUrlInput.value.trim();
  customUrlValue = null;
  approveUrlBtn.disabled = true;
  customPreview.classList.add('hidden');
  customPreview.innerHTML = '';

  if (!url) {
    return;
  }
  if (!isLikelyImageUrl(url)) {
    errorEl.textContent = 'That does not look like a direct image link. Copy the image address (ends in .jpg/.png or a wikia/redd.it image URL), not a Reddit post page.';
    errorEl.classList.remove('hidden');
    return;
  }
  errorEl.classList.add('hidden');
  customUrlValue = url;
  approveUrlBtn.disabled = false;
  customPreview.innerHTML = `<div class="game-preview-row">${gamePreviewHtml(url)}</div>`;
  customPreview.classList.remove('hidden');
  showCropEditor(url);
}

async function approveCustomUrl() {
  if (!customUrlValue || !queue[index]) {
    return;
  }
  approveUrlBtn.disabled = true;
  const editor = getCropEditor();
  const ok = await submitApproval({
    selectedUrl: customUrlValue,
    source: 'manual-url',
    label: 'Pasted URL',
    crop: editor ? editor.getCropForStorage() : null
  });
  if (!ok) {
    approveUrlBtn.disabled = false;
  }
}

async function skip() {
  const item = queue[index];
  if (!item) {
    return;
  }
  await fetch('/api/skip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiName: item.apiName })
  });
  await loadQueue();
}

function back() {
  if (index > 0) {
    index -= 1;
    renderCurrent();
  }
}

approveBtn.addEventListener('click', approve);
skipBtn.addEventListener('click', skip);
backBtn.addEventListener('click', back);
previewUrlBtn.addEventListener('click', previewCustomUrl);
approveUrlBtn.addEventListener('click', approveCustomUrl);
customUrlInput.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    previewCustomUrl();
  }
});

document.addEventListener('keydown', event => {
  if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
    return;
  }
  if (event.key >= '1' && event.key <= '3') {
    const idx = Number(event.key) - 1;
    if (currentCandidates[idx]) {
      selectCandidate(idx);
    }
  }
  if (event.key === 'Enter' && selectedCandidate) {
    approve();
  }
  if (event.key === 's' || event.key === 'S') {
    skip();
  }
  if (event.key === 'b' || event.key === 'B') {
    back();
  }
});

navReview.addEventListener('click', () => setView('review'));
navApproved.addEventListener('click', () => setView('gallery'));
emptyViewApprovedBtn.addEventListener('click', () => setView('gallery'));

for (const btn of document.querySelectorAll('.gallery-filter')) {
  btn.addEventListener('click', () => {
    galleryFilter = btn.dataset.filter || 'all';
    for (const b of document.querySelectorAll('.gallery-filter')) {
      b.classList.toggle('active', b === btn);
    }
    renderGalleryGrid();
  });
}

async function checkServerVersion() {
  try {
    const health = await fetchJson('/api/health');
    if ((health.version || 0) < MIN_SERVER_VERSION) {
      window.alert(
        'Image review server is out of date. Stop it (Ctrl+C) and run: npm run image:review\n\nThen hard-refresh this page (Cmd+Shift+R).'
      );
    }
  } catch {
    // fetchJson already surfaces connection issues on first API call
  }
}

checkServerVersion();
loadQueue();
setView('gallery');
