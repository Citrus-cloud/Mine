// =====================================================================
// ClickFlow — src/template-matching-engine.js (Step 29)
// ---------------------------------------------------------------------
// Real preview-only template matching engine.
//
// HARD GUARANTEES (Step 29):
//   - The engine analyses **only** the screen-capture preview image
//     (a small thumbnail produced by `desktopCapturer.getSources` in
//     Step 25). It never reads pixels from the live screen, never
//     polls a window, never sees a single pixel outside the preview
//     the user explicitly captured.
//   - The engine NEVER moves the cursor, NEVER clicks, NEVER types,
//     NEVER touches the OS. It just compares two `ImageData` arrays
//     in renderer memory.
//   - The engine NEVER decodes a real screenshot — Step 25 already
//     downscaled it. We may downscale further internally for
//     performance (`maxSearchWidth` / `maxSearchHeight`).
//   - Pure renderer code. No Electron / IPC modules are loaded
//     here, no localStorage writes, no filesystem access.
//   - This file does NOT add OpenCV, opencv.js, opencv-js, sharp,
//     jimp, pixelmatch, looks-same, tesseract, tesseract.js,
//     robotjs, nut.js, iohook, or uiohook-napi. Algorithm is plain
//     JavaScript over `ImageData.data`.
//   - Result is a plain-data record matching the Step 28 mock shape
//     so the same UI / diagnostics / audit code can render both.
// =====================================================================

// ---------------------------------------------------------------------
// Defaults / limits
// ---------------------------------------------------------------------

// Engine-wide caps. The user can lower the threshold/step from the
// UI but cannot bypass these. They keep the algorithm's worst-case
// runtime predictable on a normal laptop (≈ < 1 second per run).
var TEMPLATE_MATCH_DEFAULTS = Object.freeze({
  threshold: 0.75,
  step: 4,
  maxSearchWidth: 1200,
  maxSearchHeight: 800,
  // Templates bigger than these are downscaled for matching. The
  // bounding box returned to the UI is mapped back to the
  // original (un-downscaled) preview coordinates.
  maxTemplateWidth: 320,
  maxTemplateHeight: 320,
  // How many candidates we sample on each axis at the scoring grid.
  // The "step" parameter controls the grid spacing — we never
  // evaluate more than this many positions on either axis.
  maxGridPositionsPerAxis: 1024,
  // Hard cost ceiling. `estimateSearchCost` returns a coarse number
  // of pixel comparisons; if the estimate exceeds this, we emit a
  // warning and reduce the work by raising the effective step.
  costSoftWarningThreshold: 4_000_000,
  costHardLimit:            16_000_000
});

// "Real preview match" — never a real desktop click.
var TEMPLATE_MATCH_MODE_REAL_PREVIEW = 'real-preview';

// ---------------------------------------------------------------------
// Engine status (static — flipping any of these requires a step)
// ---------------------------------------------------------------------

function getTemplateMatchEngineStatus() {
  return {
    engineAvailable:    true,
    algorithm:          'js-mean-rgb-diff',
    realClick:          false,
    ocrImplemented:     false,
    opencvAvailable:    false,
    nativeMatchingAvailable: false,
    analyzesPreviewOnly: true,
    defaults: {
      threshold: TEMPLATE_MATCH_DEFAULTS.threshold,
      step:      TEMPLATE_MATCH_DEFAULTS.step,
      maxSearchWidth:   TEMPLATE_MATCH_DEFAULTS.maxSearchWidth,
      maxSearchHeight:  TEMPLATE_MATCH_DEFAULTS.maxSearchHeight,
      maxTemplateWidth: TEMPLATE_MATCH_DEFAULTS.maxTemplateWidth,
      maxTemplateHeight: TEMPLATE_MATCH_DEFAULTS.maxTemplateHeight
    }
  };
}

// ---------------------------------------------------------------------
// Image-loading helpers
// ---------------------------------------------------------------------

// Load an image from a data URL. Resolves with an HTMLImageElement
// or rejects with a short, generic error. We never log the data URL
// itself — it can be large and may contain pixel data.
function loadImageFromDataUrl(dataUrl) {
  return new Promise(function (resolve, reject) {
    if (typeof dataUrl !== 'string' || dataUrl.indexOf('data:image/') !== 0) {
      reject(new Error('invalid data url'));
      return;
    }
    var img = new Image();
    img.onload = function () {
      if (img.width > 0 && img.height > 0) resolve(img);
      else reject(new Error('image has zero size'));
    };
    img.onerror = function () { reject(new Error('image failed to load')); };
    // No crossorigin attribute: data URLs are same-origin in
    // Electron's renderer and we never load remote URLs.
    img.src = dataUrl;
  });
}

// Render an HTMLImageElement onto a fresh `<canvas>` and return the
// canvas. The canvas is detached from the DOM, so it does not
// affect layout or accessibility.
function imageToCanvas(image, optWidth, optHeight) {
  var w = (typeof optWidth  === 'number' && optWidth  > 0) ? optWidth  : image.width;
  var h = (typeof optHeight === 'number' && optHeight > 0) ? optHeight : image.height;
  var canvas = document.createElement('canvas');
  canvas.width  = w;
  canvas.height = h;
  var ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas 2d context unavailable');
  // willReadFrequently is a hint, not a contract. Mediocre browsers
  // ignore it; that is fine.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'medium';
  ctx.drawImage(image, 0, 0, w, h);
  return canvas;
}

// Convenience: data URL → ImageData. Resolves with
// `{ imageData, width, height }`. Never persists the data URL.
async function getImageDataFromDataUrl(dataUrl, optWidth, optHeight) {
  var img = await loadImageFromDataUrl(dataUrl);
  var canvas = imageToCanvas(img, optWidth, optHeight);
  var ctx = canvas.getContext('2d');
  var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  return { imageData: imageData, width: canvas.width, height: canvas.height };
}

// Crop an ImageData to a rectangle. Returns a fresh ImageData with
// just the pixels inside the rectangle. Coordinates are clamped to
// the source bounds.
function cropImageData(imageData, region) {
  if (!imageData || !region) return imageData;
  var sx = Math.max(0, Math.floor(region.x));
  var sy = Math.max(0, Math.floor(region.y));
  var ex = Math.min(imageData.width,  Math.floor(region.x + region.width));
  var ey = Math.min(imageData.height, Math.floor(region.y + region.height));
  var w = Math.max(0, ex - sx);
  var h = Math.max(0, ey - sy);
  if (w === 0 || h === 0) return null;
  var canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  var ctx = canvas.getContext('2d');
  // putImageData is a sub-rect copy via the dirty-rect arguments.
  ctx.putImageData(imageData, -sx, -sy, sx, sy, w, h);
  return ctx.getImageData(0, 0, w, h);
}

// Downscale an ImageData if either dimension exceeds the cap.
// Returns `{ imageData, scaleX, scaleY }`. `scaleX/Y` are the
// factors to map FROM the downscaled space BACK to the original
// (so `originalX = downscaledX * scaleX`). When no downscale is
// needed both factors are 1.
function resizeImageDataIfNeeded(imageData, maxWidth, maxHeight) {
  if (!imageData) return { imageData: null, scaleX: 1, scaleY: 1 };
  var w = imageData.width, h = imageData.height;
  var mw = (typeof maxWidth  === 'number' && maxWidth  > 0) ? maxWidth  : Infinity;
  var mh = (typeof maxHeight === 'number' && maxHeight > 0) ? maxHeight : Infinity;
  if (w <= mw && h <= mh) return { imageData: imageData, scaleX: 1, scaleY: 1 };
  var ratio = Math.min(mw / w, mh / h);
  var nw = Math.max(1, Math.floor(w * ratio));
  var nh = Math.max(1, Math.floor(h * ratio));
  // Render the source ImageData into a canvas, then re-render onto
  // a smaller canvas. drawImage handles the smoothing.
  var src = document.createElement('canvas');
  src.width = w; src.height = h;
  src.getContext('2d').putImageData(imageData, 0, 0);
  var dst = document.createElement('canvas');
  dst.width = nw; dst.height = nh;
  var dstCtx = dst.getContext('2d');
  dstCtx.imageSmoothingEnabled = true;
  dstCtx.imageSmoothingQuality = 'medium';
  dstCtx.drawImage(src, 0, 0, nw, nh);
  return {
    imageData: dstCtx.getImageData(0, 0, nw, nh),
    scaleX: w / nw,
    scaleY: h / nh
  };
}

// Coarse cost estimate (used for warnings and caps).
function estimateSearchCost(screenSize, templateSize, region) {
  var sw = (region && region.width  > 0) ? region.width  : screenSize.width;
  var sh = (region && region.height > 0) ? region.height : screenSize.height;
  var tw = templateSize.width;
  var th = templateSize.height;
  if (tw <= 0 || th <= 0 || sw <= 0 || sh <= 0) return 0;
  // Comparisons ≈ (positions) × (template pixels). Step is applied
  // outside this function — this gives the unstepped worst case.
  var positions = Math.max(1, (sw - tw + 1)) * Math.max(1, (sh - th + 1));
  var pixels = tw * th;
  return positions * pixels;
}

// ---------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------

// Compare a sub-rect of `screenData` (of width `screenWidth`) at
// position (startX, startY) against `templateData` (of width
// `templateWidth`). Returns a score in [0, 1] where 1 means the two
// patches are identical (RGB-wise; alpha is ignored).
//
// We sample the template on a `pixelStep`-spaced grid for speed.
// `pixelStep = 1` compares every pixel; the engine defaults to 2
// when the template is small and to 3 for larger templates.
function calculatePatchScore(screenData, templateData, screenWidth, templateWidth, startX, startY, options) {
  var opts = options || {};
  var tw = opts.tw | 0;            // template width  (in template space)
  var th = opts.th | 0;            // template height (in template space)
  if (tw <= 0 || th <= 0) return 0;
  var pixelStep = (opts.pixelStep | 0) || 1;
  if (pixelStep < 1) pixelStep = 1;

  var sw = screenWidth | 0;
  var twPixels = templateWidth | 0;

  var diffSum = 0;
  var samples = 0;

  for (var ty = 0; ty < th; ty += pixelStep) {
    var srcRow = (startY + ty) * sw * 4;
    var tplRow = ty * twPixels * 4;
    for (var tx = 0; tx < tw; tx += pixelStep) {
      var si = srcRow + (startX + tx) * 4;
      var ti = tplRow + tx * 4;
      // R/G/B only; alpha is normalised away by the canvas.
      var dr = screenData[si]     - templateData[ti];
      var dg = screenData[si + 1] - templateData[ti + 1];
      var db = screenData[si + 2] - templateData[ti + 2];
      diffSum += (dr < 0 ? -dr : dr) + (dg < 0 ? -dg : dg) + (db < 0 ? -db : db);
      samples++;
    }
  }
  if (samples === 0) return 0;
  // Each sample contributes up to 3 * 255 difference.
  var meanDiff = diffSum / (samples * 3);
  return 1 - (meanDiff / 255);
}

// Find the best-scoring position for `templateImageData` inside
// `screenImageData`. Returns
//   { x, y, width, height, score, samples, scannedPositions }
// in the coordinate space of `screenImageData`.
//
// The grid is regular — every `step` pixels on each axis. We never
// allocate intermediate result arrays; we just keep the running
// best.
function findBestMatch(screenImageData, templateImageData, options) {
  var opts = options || {};
  var step = (opts.step | 0) || TEMPLATE_MATCH_DEFAULTS.step;
  if (step < 1) step = 1;
  var sw = screenImageData.width  | 0;
  var sh = screenImageData.height | 0;
  var tw = templateImageData.width  | 0;
  var th = templateImageData.height | 0;
  if (tw <= 0 || th <= 0 || sw <= 0 || sh <= 0) {
    return { x: 0, y: 0, width: tw, height: th, score: 0, samples: 0, scannedPositions: 0 };
  }
  if (tw > sw || th > sh) {
    return { x: 0, y: 0, width: tw, height: th, score: 0, samples: 0, scannedPositions: 0, error: 'template-too-large' };
  }
  var screenData = screenImageData.data;
  var templateData = templateImageData.data;

  // Pick a per-pixel sampling step so we never compare more than ~
  // 4096 pixels per candidate. For a 64x64 template that is every
  // pixel; for a 256x256 template it is every 4th pixel.
  var pixelStep = 1;
  var tplArea = tw * th;
  if (tplArea > 4096)  pixelStep = 2;
  if (tplArea > 16384) pixelStep = 3;
  if (tplArea > 65536) pixelStep = 4;

  var bestX = 0, bestY = 0, bestScore = -1, scanned = 0;

  // Cap grid positions on each axis as defence-in-depth.
  var maxXSteps = TEMPLATE_MATCH_DEFAULTS.maxGridPositionsPerAxis;
  var maxYSteps = TEMPLATE_MATCH_DEFAULTS.maxGridPositionsPerAxis;
  var xPositions = Math.min(maxXSteps, Math.floor((sw - tw) / step) + 1);
  var yPositions = Math.min(maxYSteps, Math.floor((sh - th) / step) + 1);

  for (var iy = 0; iy < yPositions; iy++) {
    var y = iy * step;
    if (y + th > sh) break;
    for (var ix = 0; ix < xPositions; ix++) {
      var x = ix * step;
      if (x + tw > sw) break;
      var score = calculatePatchScore(
        screenData, templateData,
        sw, tw, x, y,
        { tw: tw, th: th, pixelStep: pixelStep }
      );
      scanned++;
      if (score > bestScore) {
        bestScore = score;
        bestX = x;
        bestY = y;
      }
    }
  }
  if (bestScore < 0) bestScore = 0;
  return {
    x: bestX, y: bestY,
    width: tw, height: th,
    score: bestScore,
    samples: tplArea,
    scannedPositions: scanned,
    pixelStep: pixelStep
  };
}

// ---------------------------------------------------------------------
// Top-level: runTemplateMatch
// ---------------------------------------------------------------------

// `screenDataUrl` and `templateDataUrl` are data URLs (no remote).
// `options` is `{ region, threshold, step, maxSearchWidth,
// maxSearchHeight, screenSize }`.
//
// Returns `{ success: bool, match?: result, error?, warnings: [] }`.
// `success` does NOT mean the user found their template — the user
// also has to pass `match.score >= threshold` (and the renderer
// renders that boolean as `matched`).
async function runTemplateMatch(screenDataUrl, templateDataUrl, options) {
  var opts = options || {};
  var threshold = _clamp01(_isFiniteNum(opts.threshold) ? opts.threshold : TEMPLATE_MATCH_DEFAULTS.threshold);
  var step = (opts.step | 0) || TEMPLATE_MATCH_DEFAULTS.step;
  if (step < 1) step = 1;
  var maxSearchWidth  = (opts.maxSearchWidth  | 0) || TEMPLATE_MATCH_DEFAULTS.maxSearchWidth;
  var maxSearchHeight = (opts.maxSearchHeight | 0) || TEMPLATE_MATCH_DEFAULTS.maxSearchHeight;
  var warnings = [];

  if (typeof screenDataUrl !== 'string' || screenDataUrl.indexOf('data:image/') !== 0) {
    return { success: false, error: 'screen-preview-missing', warnings: warnings };
  }
  if (typeof templateDataUrl !== 'string' || templateDataUrl.indexOf('data:image/') !== 0) {
    return { success: false, error: 'template-image-missing', warnings: warnings };
  }

  var startedAt = Date.now();

  // 1. Decode the preview at its natural size.
  var screenLoaded;
  try {
    screenLoaded = await getImageDataFromDataUrl(screenDataUrl);
  } catch (err) {
    return { success: false, error: 'screen-preview-decode-failed', warnings: warnings };
  }

  // 2. Optionally crop to the user-selected region. The region is
  //    in original-screenshot coordinates (Step 26's image-space),
  //    so we use it BEFORE any further downscale.
  var screenRegionOffsetX = 0, screenRegionOffsetY = 0;
  var workingScreen = screenLoaded.imageData;
  if (opts.region && _isPositiveSize(opts.region)) {
    var cropped = cropImageData(workingScreen, opts.region);
    if (!cropped) {
      return { success: false, error: 'region-empty', warnings: warnings };
    }
    workingScreen = cropped;
    screenRegionOffsetX = Math.max(0, Math.floor(opts.region.x));
    screenRegionOffsetY = Math.max(0, Math.floor(opts.region.y));
  }

  // 3. Downscale the search area if it exceeds the engine cap.
  var screenScale = resizeImageDataIfNeeded(workingScreen, maxSearchWidth, maxSearchHeight);
  if (screenScale.scaleX !== 1 || screenScale.scaleY !== 1) {
    warnings.push('search-area-downscaled');
  }

  // 4. Decode the template.
  var templateLoaded;
  try {
    templateLoaded = await getImageDataFromDataUrl(templateDataUrl);
  } catch (err) {
    return { success: false, error: 'template-decode-failed', warnings: warnings };
  }

  // 5. If the template is huge, downscale it the same proportional
  //    factor we applied to the search area, plus a separate cap.
  //    The user does not see this — we always report bbox in the
  //    original (pre-downscale) preview coordinates.
  var templateInScreenSpace = templateLoaded.imageData;
  // (a) match the search-area downscale.
  if (screenScale.scaleX !== 1 || screenScale.scaleY !== 1) {
    var tplDown = resizeImageDataIfNeeded(
      templateInScreenSpace,
      Math.max(1, Math.floor(templateLoaded.width  / screenScale.scaleX)),
      Math.max(1, Math.floor(templateLoaded.height / screenScale.scaleY))
    );
    templateInScreenSpace = tplDown.imageData;
  }
  // (b) hard template cap.
  var tplCap = resizeImageDataIfNeeded(
    templateInScreenSpace,
    TEMPLATE_MATCH_DEFAULTS.maxTemplateWidth,
    TEMPLATE_MATCH_DEFAULTS.maxTemplateHeight
  );
  if (tplCap.scaleX !== 1 || tplCap.scaleY !== 1) {
    warnings.push('template-downscaled');
  }
  templateInScreenSpace = tplCap.imageData;

  // 6. Reject obviously-broken inputs.
  if (templateInScreenSpace.width  > screenScale.imageData.width ||
      templateInScreenSpace.height > screenScale.imageData.height) {
    return {
      success: false,
      error: 'template-too-large',
      warnings: warnings.concat(['template-too-large'])
    };
  }

  // 7. Cost guard. If the estimated cost exceeds the soft warning
  //    threshold we add a warning; if it exceeds the hard cap we
  //    raise the effective step until it fits.
  var rawCost = estimateSearchCost(
    { width: screenScale.imageData.width, height: screenScale.imageData.height },
    { width: templateInScreenSpace.width, height: templateInScreenSpace.height },
    null
  );
  if (rawCost > TEMPLATE_MATCH_DEFAULTS.costSoftWarningThreshold) {
    warnings.push('search-area-cost-high');
  }
  var effectiveStep = step;
  while (rawCost / (effectiveStep * effectiveStep) > TEMPLATE_MATCH_DEFAULTS.costHardLimit && effectiveStep < 32) {
    effectiveStep *= 2;
    if (warnings.indexOf('step-raised-by-engine') === -1) {
      warnings.push('step-raised-by-engine');
    }
  }

  // 8. Run the matcher.
  var best = findBestMatch(screenScale.imageData, templateInScreenSpace, { step: effectiveStep });
  if (best.error === 'template-too-large') {
    return { success: false, error: 'template-too-large', warnings: warnings.concat(['template-too-large']) };
  }

  // 9. Map result back to ORIGINAL preview coordinates:
  //    downscaled → (region-cropped) screen → original screen.
  var origX = best.x * screenScale.scaleX + screenRegionOffsetX;
  var origY = best.y * screenScale.scaleY + screenRegionOffsetY;
  var origW = best.width  * screenScale.scaleX;
  var origH = best.height * screenScale.scaleY;

  var durationMs = Date.now() - startedAt;

  return {
    success: true,
    match: {
      x:        Math.round(origX),
      y:        Math.round(origY),
      width:    Math.round(origW),
      height:   Math.round(origH),
      score:    best.score,
      threshold: threshold,
      step:     effectiveStep,
      requestedStep: step,
      pixelStep: best.pixelStep,
      scannedPositions: best.scannedPositions,
      samples:  best.samples,
      durationMs: durationMs,
      previewSize: { width: screenLoaded.width, height: screenLoaded.height },
      regionUsed:  opts.region && _isPositiveSize(opts.region)
        ? { x: opts.region.x, y: opts.region.y, width: opts.region.width, height: opts.region.height }
        : null,
      downscaledSearch:   screenScale.scaleX !== 1 || screenScale.scaleY !== 1,
      downscaledTemplate: tplCap.scaleX !== 1 || tplCap.scaleY !== 1,
      mode: TEMPLATE_MATCH_MODE_REAL_PREVIEW
    },
    warnings: warnings
  };
}

// Wrap a `findBestMatch` result + the matching input into the same
// shape `template-matching-mock.js` returns. The renderer renders
// both shapes through the same code path.
//
// `input` is the sanitised input from `createTemplateMatchInput`
// (so it carries `screenPreview` and `template` metadata). `match`
// is the `runTemplateMatch` payload.
function createTemplateMatchResult(match, input) {
  var sp = (input && input.screenPreview) || {};
  var tpl = (input && input.template) || {};
  var bb = {
    x:      Math.max(0, Math.round(match.x)),
    y:      Math.max(0, Math.round(match.y)),
    width:  Math.max(1, Math.round(match.width)),
    height: Math.max(1, Math.round(match.height))
  };
  var matchedFlag = (typeof match.score === 'number') && (match.score >= (match.threshold || TEMPLATE_MATCH_DEFAULTS.threshold));
  return {
    id:           'real-preview-match-' + Date.now() + '-' + Math.floor(Math.random() * 1e6).toString(36),
    mode:         TEMPLATE_MATCH_MODE_REAL_PREVIEW,
    matched:      !!matchedFlag,
    confidence:   typeof match.score === 'number' ? Math.max(0, Math.min(1, match.score)) : 0,
    threshold:    typeof match.threshold === 'number' ? match.threshold : TEMPLATE_MATCH_DEFAULTS.threshold,
    boundingBox:  bb,
    targetPoint:  {
      x: bb.x + Math.round(bb.width  / 2),
      y: bb.y + Math.round(bb.height / 2)
    },
    usedRegion:   match.regionUsed ? Object.assign({}, match.regionUsed) : null,
    templateId:   typeof tpl.id === 'string' ? tpl.id : '',
    templateName: typeof tpl.name === 'string' ? tpl.name : '',
    sourceId:     typeof sp.sourceId === 'string' ? sp.sourceId : '',
    sourceName:   typeof sp.name === 'string' ? sp.name : '',
    previewSize:  match.previewSize ? Object.assign({}, match.previewSize) : null,
    durationMs:   typeof match.durationMs === 'number' ? match.durationMs : 0,
    step:         typeof match.step === 'number' ? match.step : TEMPLATE_MATCH_DEFAULTS.step,
    requestedStep: typeof match.requestedStep === 'number' ? match.requestedStep : null,
    pixelStep:    typeof match.pixelStep === 'number' ? match.pixelStep : 1,
    scannedPositions: typeof match.scannedPositions === 'number' ? match.scannedPositions : 0,
    downscaledSearch:   !!match.downscaledSearch,
    downscaledTemplate: !!match.downscaledTemplate,
    createdAt:    new Date().toISOString(),
    realMatching: false, // "real preview" still does not analyse the live screen
    realClick:    false
  };
}

// ---------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------

function _isFiniteNum(v) { return typeof v === 'number' && isFinite(v); }
function _clamp01(v) { return v < 0 ? 0 : (v > 1 ? 1 : v); }
function _isPositiveSize(p) {
  return p && typeof p === 'object' &&
    _isFiniteNum(p.width)  && p.width  > 0 &&
    _isFiniteNum(p.height) && p.height > 0;
}
