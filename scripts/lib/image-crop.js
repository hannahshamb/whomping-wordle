'use strict';

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

function cropForStorage(crop) {
  return isDefaultCrop(crop) ? null : normalizeCrop(crop);
}

module.exports = {
  DEFAULT_CROP,
  normalizeCrop,
  isDefaultCrop,
  cropForStorage
};
