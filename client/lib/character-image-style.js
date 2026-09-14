const DEFAULT_CROP = { x: 50, y: 50, zoom: 1 };

function normalizeCrop(crop) {
  if (!crop || typeof crop !== 'object') {
    return { ...DEFAULT_CROP };
  }
  return {
    x: Math.min(100, Math.max(0, Number(crop.x) || DEFAULT_CROP.x)),
    y: Math.min(100, Math.max(0, Number(crop.y) || DEFAULT_CROP.y)),
    zoom: Math.min(2.5, Math.max(1, Number(crop.zoom) || DEFAULT_CROP.zoom))
  };
}

function isDefaultCrop(crop) {
  const c = normalizeCrop(crop);
  return c.x === DEFAULT_CROP.x && c.y === DEFAULT_CROP.y && c.zoom === DEFAULT_CROP.zoom;
}

/** Inline styles for .character-img-lg (object-fit: cover + optional pan/zoom) */
export function getCharacterImageStyle(character) {
  const crop = normalizeCrop(character?.imageCrop);
  if (isDefaultCrop(crop)) {
    return undefined;
  }
  const style = {
    objectPosition: `${crop.x}% ${crop.y}%`
  };
  if (crop.zoom > 1) {
    style.transform = `scale(${crop.zoom})`;
    style.transformOrigin = `${crop.x}% ${crop.y}%`;
  }
  return style;
}
