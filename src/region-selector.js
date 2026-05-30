// =====================================================================
// ClickFlow — src/region-selector.js (Step 26)
// ---------------------------------------------------------------------
// Pure-logic region module. NO DOM, NO IPC, NO disk I/O.
//
// A "region" is a rectangle in PIXEL coordinates with a well-defined
// origin (top-left of the relevant coordinate space):
//
//   {
//     x:      number,  // top-left X, >= 0
//     y:      number,  // top-left Y, >= 0
//     width:  number,  // > 5
//     height: number   // > 5
//   }
//
// We always work with TWO coordinate spaces:
//
//   1. PREVIEW space — the rectangle in the renderer's <img> element
//      (DPR-independent CSS pixels of the displayed thumbnail);
//   2. IMAGE space — the same rectangle re-projected onto the
//      original screenshot the IPC returned (preview.width × .height).
//
// The renderer always *captures* in preview space and *stores* the
// projection to image space alongside it via scaleRegionToImage().
// Image-space coordinates are the ones a future image-matching / OCR
// step would consume.
//
// Hard guarantees:
//   - this module never reads or writes a pixel — it only handles
//     numbers (x, y, width, height);
//   - it never produces a real click;
//   - it never persists anything (renderer-side memory only);
//   - it never depends on `window.clickflow.*` or `ipcRenderer`.
// =====================================================================

// Minimum side, in PIXELS of the relevant coordinate space, required
// for a region to be considered usable. Below this we treat the
// gesture as an accidental click and reject it.
var REGION_MIN_SIDE = 6;

// Upper sanity bound — any side this large is almost certainly a
// numeric mistake (Number.MAX_SAFE_INTEGER class). We reject early
// so a future image-matching step never has to guard against it.
var REGION_MAX_SIDE = 1000000;

// ---------------------------------------------------------------------
// Construction & normalisation
// ---------------------------------------------------------------------

// Build a region from any two corner points. The points may be in
// either order: (top-left, bottom-right), (bottom-right, top-left),
// (top-right, bottom-left), or (bottom-left, top-right). The result
// always has positive `width` and `height` and a top-left origin.
//
// Non-numeric / NaN / negative inputs collapse to 0 in their
// respective dimensions; the caller decides whether to keep or drop
// the resulting region via `validateRegion`.
function createRegion(startX, startY, endX, endY) {
  var sx = _toFiniteNumber(startX);
  var sy = _toFiniteNumber(startY);
  var ex = _toFiniteNumber(endX);
  var ey = _toFiniteNumber(endY);
  var x = Math.min(sx, ex);
  var y = Math.min(sy, ey);
  var w = Math.abs(ex - sx);
  var h = Math.abs(ey - sy);
  if (x < 0) { w = Math.max(0, w + x); x = 0; }
  if (y < 0) { h = Math.max(0, h + y); y = 0; }
  return {
    x:      Math.round(x),
    y:      Math.round(y),
    width:  Math.round(w),
    height: Math.round(h)
  };
}

// Coerce a region object to the canonical shape (rounded ints,
// non-negative origin, non-negative dimensions). Returns a NEW
// object; never mutates the input.
function normalizeRegion(region) {
  if (!region || typeof region !== 'object') return null;
  var x = _toFiniteNumber(region.x);
  var y = _toFiniteNumber(region.y);
  var w = _toFiniteNumber(region.width);
  var h = _toFiniteNumber(region.height);
  if (x < 0) { w = Math.max(0, w + x); x = 0; }
  if (y < 0) { h = Math.max(0, h + y); y = 0; }
  if (w < 0) w = 0;
  if (h < 0) h = 0;
  return {
    x:      Math.round(x),
    y:      Math.round(y),
    width:  Math.round(w),
    height: Math.round(h)
  };
}

// Internal: coerce to a finite number; non-finite → 0.
function _toFiniteNumber(v) {
  var n = Number(v);
  return (typeof n === 'number' && isFinite(n)) ? n : 0;
}

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

// Pure predicate. Accepts a region (or anything; we type-guard).
// Returns { valid: bool, reason: string|null }.
function validateRegion(region) {
  if (!region || typeof region !== 'object') {
    return { valid: false, reason: 'region is missing' };
  }
  if (typeof region.x !== 'number' || !isFinite(region.x) || region.x < 0) {
    return { valid: false, reason: 'x must be a non-negative finite number' };
  }
  if (typeof region.y !== 'number' || !isFinite(region.y) || region.y < 0) {
    return { valid: false, reason: 'y must be a non-negative finite number' };
  }
  if (typeof region.width !== 'number' || !isFinite(region.width)) {
    return { valid: false, reason: 'width must be a finite number' };
  }
  if (typeof region.height !== 'number' || !isFinite(region.height)) {
    return { valid: false, reason: 'height must be a finite number' };
  }
  if (region.width < REGION_MIN_SIDE) {
    // Spec says width > 5; REGION_MIN_SIDE is 6 → strict > 5.
    return { valid: false, reason: 'width must be > 5' };
  }
  if (region.height < REGION_MIN_SIDE) {
    return { valid: false, reason: 'height must be > 5' };
  }
  if (region.width > REGION_MAX_SIDE || region.height > REGION_MAX_SIDE) {
    return { valid: false, reason: 'region is unreasonably large' };
  }
  return { valid: true, reason: null };
}

// ---------------------------------------------------------------------
// Coordinate-space projection
// ---------------------------------------------------------------------

// Map a region from preview space to the original image space.
// Both sizes must be { width, height } with positive numbers; the
// projection is uniform (independent X and Y scales).
//
// If either size is missing or non-positive, returns null so the
// caller can render a clear "size unknown" empty state.
function scaleRegionToImage(region, previewSize, imageSize) {
  var n = normalizeRegion(region);
  if (!n) return null;
  if (!_isPositiveSize(previewSize) || !_isPositiveSize(imageSize)) return null;
  var sx = imageSize.width  / previewSize.width;
  var sy = imageSize.height / previewSize.height;
  var x  = Math.round(n.x * sx);
  var y  = Math.round(n.y * sy);
  var w  = Math.round(n.width  * sx);
  var h  = Math.round(n.height * sy);
  // Clamp to the image bounds so a future template-matching step
  // never receives a rectangle that lies outside the screenshot.
  if (x < 0) { w = Math.max(0, w + x); x = 0; }
  if (y < 0) { h = Math.max(0, h + y); y = 0; }
  if (x + w > imageSize.width)  w = Math.max(0, imageSize.width  - x);
  if (y + h > imageSize.height) h = Math.max(0, imageSize.height - y);
  return { x: x, y: y, width: w, height: h };
}

// Inverse projection: image space → preview space. Same contract.
function scaleRegionToPreview(region, imageSize, previewSize) {
  // The math is symmetrical, so we can re-use scaleRegionToImage by
  // swapping the two sizes.
  return scaleRegionToImage(region, imageSize, previewSize);
}

function _isPositiveSize(s) {
  return s && typeof s === 'object' &&
         typeof s.width  === 'number' && isFinite(s.width)  && s.width  > 0 &&
         typeof s.height === 'number' && isFinite(s.height) && s.height > 0;
}

// ---------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------

// Area of the region (width × height). Returns 0 for missing /
// invalid regions; never throws.
function getRegionArea(region) {
  var n = normalizeRegion(region);
  if (!n) return 0;
  return n.width * n.height;
}

// Human-readable rectangle, e.g. "100,100 · 300×200". Used by the
// UI / diagnostics layer; the format itself never crosses an IPC
// boundary.
function formatRegion(region) {
  var n = normalizeRegion(region);
  if (!n) return '—';
  return n.x + ',' + n.y + ' · ' + n.width + '×' + n.height;
}

// The canonical empty regionSelector state. The renderer (and the
// app-state slice) initialise to exactly this shape; resetting goes
// through this constructor so we never drift.
function createEmptyRegionState() {
  return {
    region:           null,
    normalizedRegion: null,
    isSelecting:      false,
    startPoint:       null,
    endPoint:         null,
    lastUpdatedAt:    null
  };
}
