const DEFAULT_CROP = { x: 50, y: 50, zoom: 1 };

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function normalizeCrop(crop) {
  if (!crop || typeof crop !== 'object') {
    return { ...DEFAULT_CROP };
  }
  return {
    x: clamp(Number(crop.x) || DEFAULT_CROP.x, 0, 100),
    y: clamp(Number(crop.y) || DEFAULT_CROP.y, 0, 100),
    zoom: clamp(Number(crop.zoom) || DEFAULT_CROP.zoom, 1, 2.5)
  };
}

function isDefaultCrop(crop) {
  const c = normalizeCrop(crop);
  return c.x === DEFAULT_CROP.x && c.y === DEFAULT_CROP.y && c.zoom === DEFAULT_CROP.zoom;
}

function cropToCss(crop) {
  const c = normalizeCrop(crop);
  const rules = [`object-position: ${c.x}% ${c.y}%`];
  if (c.zoom > 1) {
    rules.push(`transform: scale(${c.zoom})`);
    rules.push(`transform-origin: ${c.x}% ${c.y}%`);
  }
  return rules.join('; ');
}

class CropEditor {
  constructor(mountEl, { onChange } = {}) {
    this.mountEl = mountEl;
    this.onChange = onChange || (() => {});
    this.crop = { ...DEFAULT_CROP };
    this.dragging = false;
    this.pointerId = null;
    this.startPointer = { x: 0, y: 0 };
    this.startCrop = { ...DEFAULT_CROP };

    mountEl.innerHTML = `
      <div class="crop-editor">
        <div class="crop-viewport img-container game-preview-box" aria-label="Drag to reposition portrait (used in dropdown and guess table)">
          <img class="character-img-lg crop-editor-img" src="" alt="" draggable="false" referrerpolicy="no-referrer">
        </div>
        <div class="crop-controls">
          <label class="crop-control">
            <span>Horizontal</span>
            <input type="range" class="crop-x" min="0" max="100" step="1" value="50">
          </label>
          <label class="crop-control">
            <span>Vertical</span>
            <input type="range" class="crop-y" min="0" max="100" step="1" value="50">
          </label>
          <label class="crop-control">
            <span>Zoom <output class="crop-zoom-out">1.0×</output></span>
            <input type="range" class="crop-zoom" min="100" max="250" step="5" value="100">
          </label>
          <button type="button" class="btn btn-secondary crop-reset">Reset crop</button>
        </div>
      </div>
    `;

    this.viewport = mountEl.querySelector('.crop-viewport');
    this.img = mountEl.querySelector('.crop-editor-img');
    this.xInput = mountEl.querySelector('.crop-x');
    this.yInput = mountEl.querySelector('.crop-y');
    this.zoomInput = mountEl.querySelector('.crop-zoom');
    this.zoomOut = mountEl.querySelector('.crop-zoom-out');
    this.resetBtn = mountEl.querySelector('.crop-reset');

    this.xInput.addEventListener('input', () => this.setCrop({ x: Number(this.xInput.value) }));
    this.yInput.addEventListener('input', () => this.setCrop({ y: Number(this.yInput.value) }));
    this.zoomInput.addEventListener('input', () => {
      this.setCrop({ zoom: Number(this.zoomInput.value) / 100 });
    });
    this.resetBtn.addEventListener('click', () => this.setCrop({ ...DEFAULT_CROP }, true));

    this.viewport.addEventListener('pointerdown', e => this.onPointerDown(e));
    this.viewport.addEventListener('pointermove', e => this.onPointerMove(e));
    this.viewport.addEventListener('pointerup', e => this.onPointerUp(e));
    this.viewport.addEventListener('pointercancel', e => this.onPointerUp(e));
  }

  onPointerDown(event) {
    if (event.button !== 0 || !this.img.src) {
      return;
    }
    this.dragging = true;
    this.pointerId = event.pointerId;
    this.viewport.setPointerCapture(event.pointerId);
    this.startPointer = { x: event.clientX, y: event.clientY };
    this.startCrop = { ...this.crop };
    event.preventDefault();
  }

  onPointerMove(event) {
    if (!this.dragging || event.pointerId !== this.pointerId) {
      return;
    }
    const dx = event.clientX - this.startPointer.x;
    const dy = event.clientY - this.startPointer.y;
    this.setCrop({
      x: this.startCrop.x - dx * 0.25,
      y: this.startCrop.y - dy * 0.25
    });
  }

  onPointerUp(event) {
    if (event.pointerId !== this.pointerId) {
      return;
    }
    this.dragging = false;
    this.pointerId = null;
    try {
      this.viewport.releasePointerCapture(event.pointerId);
    } catch {
      // ignore
    }
  }

  setImage(url, crop) {
    this.img.src = url || '';
    this.setCrop(crop || DEFAULT_CROP, true);
  }

  setCrop(partial, silent) {
    this.crop = normalizeCrop({ ...this.crop, ...partial });
    this.img.style.cssText = `object-fit: cover; width: 100%; height: 100%; border-radius: 4px; ${cropToCss(this.crop)}`;
    this.xInput.value = String(Math.round(this.crop.x));
    this.yInput.value = String(Math.round(this.crop.y));
    this.zoomInput.value = String(Math.round(this.crop.zoom * 100));
    this.zoomOut.textContent = `${this.crop.zoom.toFixed(1)}×`;
    if (!silent) {
      this.onChange(this.getCrop());
    }
  }

  getCrop() {
    return normalizeCrop(this.crop);
  }

  getCropForStorage() {
    return isDefaultCrop(this.crop) ? null : this.getCrop();
  }

  /** Parent panel visibility is controlled by app.js; only reset image here */
  reset() {
    if (this.img) {
      this.img.removeAttribute('src');
    }
    this.setCrop({ ...DEFAULT_CROP }, true);
  }
}

window.CropEditor = CropEditor;
window.cropUtils = { normalizeCrop, isDefaultCrop, cropToCss, DEFAULT_CROP };
