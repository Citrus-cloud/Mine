// =====================================================================
// ClickFlow — src/screen-capture-client.js (Step 25)
// ---------------------------------------------------------------------
// Renderer-side wrapper around the safe screen-capture preload API.
//
// The whole subsystem is preview-only:
//   - never saves a screenshot to disk;
//   - never executes a real click;
//   - never runs OCR or image recognition;
//   - never accesses ipcRenderer directly (preload exposes
//     window.clickflow.screenCapture, never raw IPC).
//
// Data lives only in the renderer's process memory. We do NOT
// persist sources, preview imageDataUrl, or any captured metadata
// to localStorage / scenarios / settings / profiles.
// =====================================================================

// In-memory cache for the most recent preview. Renderer-only.
var _lastScreenCapturePreview = null;

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

// A source is considered valid if it has a string id with one of the
// two known Electron prefixes (`screen:` / `window:`) and a string
// name. We never trust id length blindly.
function validateScreenSource(source) {
  if (!source || typeof source !== 'object') return false;
  if (typeof source.id !== 'string') return false;
  if (source.id.length === 0 || source.id.length > 200) return false;
  if (source.id.indexOf('screen:') !== 0 && source.id.indexOf('window:') !== 0) return false;
  if (typeof source.name !== 'string') return false;
  return true;
}

// ---------------------------------------------------------------------
// Status
// ---------------------------------------------------------------------

async function getScreenCaptureStatus() {
  if (!window.clickflow || !window.clickflow.screenCapture ||
      typeof window.clickflow.screenCapture.getStatus !== 'function') {
    return {
      available: false,
      supported: false,
      lastError: 'screen capture API unavailable',
      simulationOnly: true,
      realClicksImplemented: false,
      ocrImplemented: false,
      imageRecognitionImplemented: false,
      savesScreenshotsToDisk: false
    };
  }
  try {
    return await window.clickflow.screenCapture.getStatus();
  } catch (err) {
    return {
      available: false,
      supported: false,
      lastError: 'screen capture status failed',
      simulationOnly: true,
      realClicksImplemented: false,
      ocrImplemented: false,
      imageRecognitionImplemented: false,
      savesScreenshotsToDisk: false
    };
  }
}

// ---------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------

async function listScreenSources() {
  if (!window.clickflow || !window.clickflow.screenCapture ||
      typeof window.clickflow.screenCapture.listSources !== 'function') {
    return { success: false, error: 'screen capture API unavailable', sources: [] };
  }
  try {
    var resp = await window.clickflow.screenCapture.listSources();
    if (!resp || resp.success !== true) {
      return {
        success: false,
        error: (resp && resp.error) ? resp.error : 'Failed to list screen sources',
        sources: []
      };
    }
    var raw = (resp.data && Array.isArray(resp.data.sources)) ? resp.data.sources : [];
    var sources = raw.filter(validateScreenSource);
    return {
      success: true,
      sources: sources,
      capturedAt: (resp.data && resp.data.capturedAt) ? resp.data.capturedAt : null
    };
  } catch (err) {
    return { success: false, error: 'Failed to list screen sources', sources: [] };
  }
}

// ---------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------

async function captureScreenPreview(sourceId) {
  if (typeof sourceId !== 'string' || sourceId.length === 0) {
    return { success: false, error: 'Invalid source id' };
  }
  if (!window.clickflow || !window.clickflow.screenCapture ||
      typeof window.clickflow.screenCapture.capturePreview !== 'function') {
    return { success: false, error: 'screen capture API unavailable' };
  }
  try {
    var resp = await window.clickflow.screenCapture.capturePreview(sourceId);
    if (!resp || resp.success !== true || !resp.data) {
      return {
        success: false,
        error: (resp && resp.error) ? resp.error : 'Failed to capture screen preview'
      };
    }
    var preview = {
      sourceId: typeof resp.data.sourceId === 'string' ? resp.data.sourceId : '',
      name: typeof resp.data.name === 'string' ? resp.data.name : '',
      type: typeof resp.data.type === 'string' ? resp.data.type : 'screen',
      imageDataUrl: typeof resp.data.imageDataUrl === 'string' ? resp.data.imageDataUrl : '',
      width: typeof resp.data.width === 'number' ? resp.data.width : 0,
      height: typeof resp.data.height === 'number' ? resp.data.height : 0,
      capturedAt: typeof resp.data.capturedAt === 'string' ? resp.data.capturedAt : new Date().toISOString()
    };
    if (!preview.sourceId || !preview.imageDataUrl) {
      return { success: false, error: 'Failed to capture screen preview' };
    }
    return { success: true, preview: preview };
  } catch (err) {
    return { success: false, error: 'Failed to capture screen preview' };
  }
}

// ---------------------------------------------------------------------
// Renderer-only memory cache (never persisted)
// ---------------------------------------------------------------------

function getLastScreenCapturePreview() {
  return _lastScreenCapturePreview;
}

function setLastScreenCapturePreview(preview) {
  _lastScreenCapturePreview = (preview && typeof preview === 'object') ? preview : null;
}

// Note: this function intentionally shares its name with the app-state
// helper of the same name. Because script tags share one global scope
// and this file loads AFTER app-state.js, this declaration wins as
// the global `clearScreenCapturePreview`. To preserve both contracts
// it ALSO resets the app-state slice via `setScreenCapturePreview(null)`,
// so callers always get "cache cleared + state cleared" with one call.
function clearScreenCapturePreview() {
  _lastScreenCapturePreview = null;
  if (typeof setScreenCapturePreview === 'function') {
    try { setScreenCapturePreview(null); } catch (e) {}
  }
}
