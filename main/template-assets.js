// =====================================================================
// ClickFlow — main/template-assets.js (Step 27)
// ---------------------------------------------------------------------
// Main-process module that owns the Template Asset Manager.
//
// HARD GUARANTEES (Step 27):
//   - Templates are stored as image *assets* only. They are NOT
//     searched on a screenshot, fed into OCR, used to trigger a real
//     click, or matched against any pixel. Step 27 stops at storage.
//   - Files arrive ONLY through `dialog.showOpenDialog` with an
//     allow-list of image extensions (png/jpg/jpeg/webp) AND a
//     magic-bytes check. The renderer never sends arbitrary paths.
//   - The image is COPIED into `userData/templates/images/` under a
//     freshly generated id. The original path is forgotten right
//     after the copy. We never persist the original path.
//   - `templates.json` carries metadata only — no base64, no data
//     URLs, no pixel bytes. The data URL needed to draw a preview is
//     materialised at READ TIME (`templates:load`) and at IMPORT
//     time (`templates:import-image`) and is sent to the renderer
//     in memory only.
//   - Corrupt JSON does not crash anything. The handler returns the
//     same `{ success: true, data: [], corrupted: true }` shape as
//     scenarios/settings/profiles, with the broken file quarantined
//     as `templates.json.broken-<timestamp>` for postmortem.
//
// This file is loaded by main.js and registers all five `templates:*`
// IPC handlers plus a small `templates:get-stats` helper used by the
// Beta health card / diagnostics. The exported `getTemplatesStats()`
// stays in process memory so the renderer never needs a sync round
// trip.
// =====================================================================

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------

// Allowed image extensions and their MIME types. Anything outside
// this allow-list is rejected — both at the dialog filter level and
// at the magic-bytes level.
const ALLOWED_TEMPLATE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];
const ALLOWED_TEMPLATE_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// Hard cap to keep disk use bounded. 16 MiB is plenty for UI icons
// and small button captures, far less than what a malicious dialog
// pick could throw at us.
const MAX_TEMPLATE_FILE_BYTES = 16 * 1024 * 1024;

// Limits that match the renderer's `validateTemplateMetadata`. Both
// sides validate; main is the final gate.
const MAX_TEMPLATE_NAME_LEN = 80;
const MAX_TEMPLATE_DESCRIPTION_LEN = 300;

// ---------------------------------------------------------------------
// In-process bookkeeping (used by diagnostics / beta-health)
// ---------------------------------------------------------------------

let _templatesLastError = null;
let _templatesStorageReady = false;

function getTemplatesStats(getUserDataPath) {
  // Best-effort, never throws. Returns the basic numbers needed by
  // the diagnostics card and the smoke harness.
  let count = 0;
  try {
    const json = _safeLoadTemplatesJson(getUserDataPath);
    if (json && Array.isArray(json.templates)) count = json.templates.length;
  } catch (err) {
    // ignore
  }
  return {
    count: count,
    storageReady: _templatesStorageReady,
    lastError: _templatesLastError
  };
}

// ---------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------

function _getTemplatesDir(getUserDataPath) {
  return path.join(getUserDataPath(), 'templates');
}
function _getTemplatesImagesDir(getUserDataPath) {
  return path.join(_getTemplatesDir(getUserDataPath), 'images');
}
function _getTemplatesJsonPath(getUserDataPath) {
  return path.join(_getTemplatesDir(getUserDataPath), 'templates.json');
}

function _ensureTemplatesDirs(getUserDataPath) {
  try {
    const root = _getTemplatesDir(getUserDataPath);
    if (!fs.existsSync(root)) fs.mkdirSync(root, { recursive: true });
    const images = _getTemplatesImagesDir(getUserDataPath);
    if (!fs.existsSync(images)) fs.mkdirSync(images, { recursive: true });
    _templatesStorageReady = true;
    return true;
  } catch (err) {
    _templatesStorageReady = false;
    _templatesLastError = 'Failed to create templates directory';
    return false;
  }
}

// ---------------------------------------------------------------------
// JSON load / save with corruption fallback
// ---------------------------------------------------------------------
// Mirrors the safeLoadJsonFile pattern in main.js. We keep a local
// copy because main/template-assets.js is a self-contained module.

function _safeLoadTemplatesJson(getUserDataPath) {
  const filePath = _getTemplatesJsonPath(getUserDataPath);
  try {
    if (!fs.existsSync(filePath)) {
      return { templates: [], corrupted: false };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') {
        return { templates: [], corrupted: true };
      }
      const templates = Array.isArray(parsed.templates) ? parsed.templates : [];
      return { templates: templates, corrupted: false };
    } catch (parseErr) {
      // Quarantine, never overwrite.
      try {
        const brokenPath = filePath + '.broken-' + Date.now();
        fs.renameSync(filePath, brokenPath);
      } catch (renameErr) {
        // best-effort
      }
      return { templates: [], corrupted: true };
    }
  } catch (err) {
    return { templates: [], corrupted: true };
  }
}

function _saveTemplatesJson(getUserDataPath, templates) {
  if (!_ensureTemplatesDirs(getUserDataPath)) {
    return { success: false, error: 'Templates storage unavailable' };
  }
  try {
    // Persist metadata ONLY — strip preview / image data URLs even if
    // a buggy caller passes them.
    const payload = {
      format: 'clickflow-templates',
      version: 1,
      updatedAt: new Date().toISOString(),
      templates: (Array.isArray(templates) ? templates : []).map(_stripRuntimeOnlyFields)
    };
    fs.writeFileSync(
      _getTemplatesJsonPath(getUserDataPath),
      JSON.stringify(payload, null, 2),
      'utf-8'
    );
    return { success: true };
  } catch (err) {
    _templatesLastError = 'Failed to save templates';
    return { success: false, error: 'Failed to save templates' };
  }
}

function _stripRuntimeOnlyFields(meta) {
  if (!meta || typeof meta !== 'object') return meta;
  const clean = {};
  // Whitelist only the fields documented in the metadata format.
  const allowed = [
    'id', 'name', 'description',
    'fileName', 'originalFileName', 'mimeType',
    'sizeBytes', 'width', 'height',
    'createdAt', 'updatedAt'
  ];
  allowed.forEach(function (k) {
    if (meta[k] !== undefined) clean[k] = meta[k];
  });
  return clean;
}

// ---------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------

function _normalizeExtension(filePath) {
  if (typeof filePath !== 'string') return '';
  const ext = path.extname(filePath).toLowerCase().replace(/^\./, '');
  if (ext === 'jpe') return 'jpg';
  return ext;
}

function _isAllowedExtension(ext) {
  return ALLOWED_TEMPLATE_EXTENSIONS.indexOf(ext) !== -1;
}

function _mimeTypeForExtension(ext) {
  if (ext === 'png') return 'image/png';
  if (ext === 'jpg' || ext === 'jpeg') return 'image/jpeg';
  if (ext === 'webp') return 'image/webp';
  return '';
}

function _isAllowedMimeType(mime) {
  return ALLOWED_TEMPLATE_MIME_TYPES.indexOf(mime) !== -1;
}

// Magic-bytes detection. The dialog filter is helpful UX, but the
// magic-bytes check is the actual gate.
//   PNG  : 89 50 4E 47 0D 0A 1A 0A
//   JPEG : FF D8 FF
//   WebP : RIFF .... WEBP
function _detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return '';
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E &&
      buffer[3] === 0x47 && buffer[4] === 0x0D && buffer[5] === 0x0A &&
      buffer[6] === 0x1A && buffer[7] === 0x0A) {
    return 'png';
  }
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'jpg';
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'webp';
  }
  return '';
}

// ---------------------------------------------------------------------
// Image dimension parsing — header only
// ---------------------------------------------------------------------
// Pure Node, no native deps. We never decode pixels — we only walk
// the format header to read width/height. If parsing fails the
// dimensions fall back to 0 (the metadata is still valid).

function _parsePngDimensions(buf) {
  // PNG: 8-byte signature, then IHDR length(4) | "IHDR"(4) | width(4 BE) | height(4 BE)
  if (buf.length < 24) return null;
  if (buf.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function _parseJpegDimensions(buf) {
  // Walk JPEG markers until we hit a SOFn marker (FFC0..FFC3, FFC5..FFC7, FFC9..FFCB, FFCD..FFCF).
  let i = 2; // skip SOI
  const len = buf.length;
  while (i + 9 < len) {
    if (buf[i] !== 0xFF) return null;
    let marker = buf[i + 1];
    // Skip leading FF padding bytes.
    while (marker === 0xFF && i + 1 < len) { i++; marker = buf[i + 1]; }
    if (marker === 0xD8 || marker === 0xD9) { i += 2; continue; } // SOI/EOI
    const isSof =
      (marker >= 0xC0 && marker <= 0xC3) ||
      (marker >= 0xC5 && marker <= 0xC7) ||
      (marker >= 0xC9 && marker <= 0xCB) ||
      (marker >= 0xCD && marker <= 0xCF);
    const segLen = buf.readUInt16BE(i + 2);
    if (segLen < 2) return null;
    if (isSof) {
      // segment: length(2) | precision(1) | height(2) | width(2) | ...
      if (i + 9 >= len) return null;
      return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
    }
    i += 2 + segLen;
  }
  return null;
}

function _parseWebpDimensions(buf) {
  // WebP container starts with "RIFF" .. "WEBP". Then a chunk
  // ("VP8 ", "VP8L", or "VP8X") describing the image.
  if (buf.length < 30) return null;
  const chunkId = buf.toString('ascii', 12, 16);
  if (chunkId === 'VP8 ') {
    // Lossy WebP. Width / height are 14-bit values right after the
    // 3-byte frame tag at offset 23-29.
    if (buf.length < 30) return null;
    const w = buf.readUInt16LE(26) & 0x3FFF;
    const h = buf.readUInt16LE(28) & 0x3FFF;
    return { width: w, height: h };
  }
  if (chunkId === 'VP8L') {
    // Lossless WebP. After the 5-byte signature, two 14-bit values
    // packed across 4 bytes (LE) starting at offset 21.
    if (buf.length < 25) return null;
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const w = (((b1 & 0x3F) << 8) | b0) + 1;
    const h = (((b3 & 0x0F) << 10) | (b2 << 2) | ((b1 & 0xC0) >>> 6)) + 1;
    return { width: w, height: h };
  }
  if (chunkId === 'VP8X') {
    // Extended WebP. Width-1 / height-1 are 24-bit LE values at
    // offsets 24 and 27.
    if (buf.length < 30) return null;
    const w = (buf[24] | (buf[25] << 8) | (buf[26] << 16)) + 1;
    const h = (buf[27] | (buf[28] << 8) | (buf[29] << 16)) + 1;
    return { width: w, height: h };
  }
  return null;
}

function _detectImageDimensions(buf, imageType) {
  try {
    if (imageType === 'png') return _parsePngDimensions(buf);
    if (imageType === 'jpg' || imageType === 'jpeg') return _parseJpegDimensions(buf);
    if (imageType === 'webp') return _parseWebpDimensions(buf);
  } catch (err) {
    // fall through
  }
  return null;
}

// ---------------------------------------------------------------------
// Id / preview helpers
// ---------------------------------------------------------------------

function _generateTemplateId() {
  // 8 random bytes is overkill but keeps ids unguessable enough that
  // a renderer can't accidentally collide them. We never trust the
  // renderer to pick the id.
  const random = crypto.randomBytes(8).toString('hex');
  return 'template-' + Date.now() + '-' + random;
}

function _bufferToDataUrl(buf, mime) {
  return 'data:' + mime + ';base64,' + buf.toString('base64');
}

function _safeBaseName(originalPath) {
  if (typeof originalPath !== 'string' || !originalPath) return '';
  // Use only the basename — never the directory. Also collapse any
  // path separators a malicious caller might splice in (defence in
  // depth; main process gets paths from dialog only).
  const base = path.basename(originalPath);
  return base.replace(/[\\/]/g, '_');
}

// Defence-in-depth: confirm the filename we just persisted lives
// inside the templates/images directory and not somewhere else.
function _isInsideImagesDir(getUserDataPath, fileName) {
  if (typeof fileName !== 'string' || fileName.length === 0) return false;
  if (fileName.indexOf('/') !== -1 || fileName.indexOf('\\') !== -1) return false;
  if (fileName.indexOf('..') !== -1) return false;
  const imagesDir = _getTemplatesImagesDir(getUserDataPath);
  const target = path.resolve(path.join(imagesDir, fileName));
  return target.indexOf(path.resolve(imagesDir)) === 0;
}

// ---------------------------------------------------------------------
// Validation for save-metadata
// ---------------------------------------------------------------------

function _validateMetadataUpdates(updates) {
  if (!updates || typeof updates !== 'object') {
    return { valid: false, error: 'Invalid metadata' };
  }
  if (typeof updates.name !== 'string') {
    return { valid: false, error: 'Template name is required' };
  }
  const name = updates.name.trim();
  if (name.length === 0) return { valid: false, error: 'Template name is required' };
  if (name.length > MAX_TEMPLATE_NAME_LEN) {
    return { valid: false, error: 'Template name is too long' };
  }
  let description = '';
  if (typeof updates.description === 'string') {
    description = updates.description.trim();
    if (description.length > MAX_TEMPLATE_DESCRIPTION_LEN) {
      return { valid: false, error: 'Template description is too long' };
    }
  }
  return { valid: true, data: { name: name, description: description } };
}

// ---------------------------------------------------------------------
// Public registration entry point
// ---------------------------------------------------------------------

function registerTemplateAssetsIpc(ctx) {
  // ctx = { ipcMain, dialog, getMainWindow, getUserDataPath }
  const ipcMain = ctx.ipcMain;
  const dialog = ctx.dialog;
  const getMainWindow = (typeof ctx.getMainWindow === 'function') ? ctx.getMainWindow : function () { return null; };
  const getUserDataPath = ctx.getUserDataPath;

  // Try to create the directory tree up front. It is also created
  // lazily during writes, but doing it once at boot lets the
  // diagnostics card report `templatesStorageReady=true` immediately.
  _ensureTemplatesDirs(getUserDataPath);

  // ---- templates:load ------------------------------------------------
  ipcMain.handle('templates:load', async function () {
    const json = _safeLoadTemplatesJson(getUserDataPath);
    if (json.corrupted) {
      _templatesLastError = 'templates.json was corrupted, defaults loaded';
    }
    // Materialise preview data URLs for templates whose image still
    // exists on disk. We never persist these — they live only in the
    // returned payload.
    const items = [];
    for (let i = 0; i < json.templates.length; i++) {
      const meta = json.templates[i];
      if (!meta || typeof meta !== 'object') continue;
      const cleanMeta = _stripRuntimeOnlyFields(meta);
      let previewDataUrl = '';
      try {
        if (cleanMeta.fileName && _isInsideImagesDir(getUserDataPath, cleanMeta.fileName)) {
          const filePath = path.join(_getTemplatesImagesDir(getUserDataPath), cleanMeta.fileName);
          if (fs.existsSync(filePath)) {
            const buf = fs.readFileSync(filePath);
            const mime = cleanMeta.mimeType && _isAllowedMimeType(cleanMeta.mimeType)
              ? cleanMeta.mimeType
              : _mimeTypeForExtension(_normalizeExtension(cleanMeta.fileName));
            if (_isAllowedMimeType(mime)) {
              previewDataUrl = _bufferToDataUrl(buf, mime);
            }
          }
        }
      } catch (err) {
        // Drop preview but still return metadata so the user can
        // delete a template whose image is missing.
        previewDataUrl = '';
      }
      items.push(Object.assign({}, cleanMeta, { previewDataUrl: previewDataUrl }));
    }
    return {
      success: true,
      data: { templates: items },
      corrupted: !!json.corrupted
    };
  });

  // ---- templates:import-image ---------------------------------------
  ipcMain.handle('templates:import-image', async function () {
    if (!_ensureTemplatesDirs(getUserDataPath)) {
      return { success: false, error: 'Templates storage unavailable' };
    }
    let dialogResult;
    try {
      dialogResult = await dialog.showOpenDialog(getMainWindow(), {
        title: 'Import template image',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ],
        properties: ['openFile']
      });
    } catch (err) {
      _templatesLastError = 'Import dialog failed';
      return { success: false, error: 'Import failed' };
    }
    if (!dialogResult || dialogResult.canceled) {
      return { success: false, cancelled: true };
    }
    const sourcePath = (Array.isArray(dialogResult.filePaths) && dialogResult.filePaths.length > 0)
      ? dialogResult.filePaths[0]
      : '';
    if (!sourcePath) return { success: false, cancelled: true };

    // Step 1: extension allow-list.
    const ext = _normalizeExtension(sourcePath);
    if (!_isAllowedExtension(ext)) {
      _templatesLastError = 'Unsupported image format';
      return { success: false, error: 'Unsupported image format' };
    }

    // Step 2: size cap.
    let stat;
    try { stat = fs.statSync(sourcePath); }
    catch (err) {
      _templatesLastError = 'Failed to read selected file';
      return { success: false, error: 'Failed to read selected file' };
    }
    if (!stat.isFile()) {
      _templatesLastError = 'Selected path is not a file';
      return { success: false, error: 'Selected path is not a file' };
    }
    if (stat.size > MAX_TEMPLATE_FILE_BYTES) {
      _templatesLastError = 'Image is too large';
      return { success: false, error: 'Image is too large' };
    }

    // Step 3: read once, magic-bytes check.
    let buf;
    try { buf = fs.readFileSync(sourcePath); }
    catch (err) {
      _templatesLastError = 'Failed to read selected file';
      return { success: false, error: 'Failed to read selected file' };
    }
    const detected = _detectImageType(buf);
    if (!_isAllowedExtension(detected)) {
      _templatesLastError = 'File is not a supported image';
      return { success: false, error: 'File is not a supported image' };
    }
    // The detected type is the source of truth. We use it to derive
    // the canonical extension and MIME type for the stored copy.
    const canonicalExt = (detected === 'jpeg') ? 'jpg' : detected;
    const mime = _mimeTypeForExtension(canonicalExt);
    if (!_isAllowedMimeType(mime)) {
      _templatesLastError = 'File is not a supported image';
      return { success: false, error: 'File is not a supported image' };
    }

    // Step 4: copy under a fresh id.
    const id = _generateTemplateId();
    const fileName = id + '.' + canonicalExt;
    const destPath = path.join(_getTemplatesImagesDir(getUserDataPath), fileName);
    try {
      fs.writeFileSync(destPath, buf);
    } catch (err) {
      _templatesLastError = 'Failed to copy image';
      return { success: false, error: 'Failed to copy image' };
    }
    if (!_isInsideImagesDir(getUserDataPath, fileName)) {
      // Defence-in-depth: should be impossible because we picked the
      // name, but if the userData symlink is weird we refuse.
      try { fs.unlinkSync(destPath); } catch (e) {}
      _templatesLastError = 'Storage path validation failed';
      return { success: false, error: 'Storage path validation failed' };
    }

    // Step 5: dimensions (optional; never blocks success).
    const dims = _detectImageDimensions(buf, detected) || { width: 0, height: 0 };

    // Step 6: build metadata, append to JSON, save.
    const now = new Date().toISOString();
    const originalFileName = _safeBaseName(sourcePath);
    const baseName = originalFileName.replace(/\.[^.]+$/, '');
    const meta = {
      id: id,
      name: (baseName && baseName.length > 0)
        ? baseName.slice(0, MAX_TEMPLATE_NAME_LEN)
        : 'Template',
      description: '',
      fileName: fileName,
      originalFileName: originalFileName,
      mimeType: mime,
      sizeBytes: buf.length,
      width: dims.width || 0,
      height: dims.height || 0,
      createdAt: now,
      updatedAt: now
    };
    const json = _safeLoadTemplatesJson(getUserDataPath);
    const next = json.templates.slice();
    next.push(meta);
    const saveRes = _saveTemplatesJson(getUserDataPath, next);
    if (!saveRes.success) {
      // Roll back the copied file so we don't leak orphans.
      try { fs.unlinkSync(destPath); } catch (e) {}
      _templatesLastError = saveRes.error || 'Failed to save templates';
      return { success: false, error: saveRes.error || 'Failed to save templates' };
    }
    _templatesLastError = null;
    return {
      success: true,
      data: {
        template: meta,
        previewDataUrl: _bufferToDataUrl(buf, mime)
      }
    };
  });

  // ---- templates:save-metadata --------------------------------------
  ipcMain.handle('templates:save-metadata', async function (event, templateId, updates) {
    if (typeof templateId !== 'string' || templateId.indexOf('template-') !== 0) {
      return { success: false, error: 'Invalid template id' };
    }
    const validation = _validateMetadataUpdates(updates);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }
    const json = _safeLoadTemplatesJson(getUserDataPath);
    const idx = json.templates.findIndex(function (m) { return m && m.id === templateId; });
    if (idx === -1) {
      return { success: false, error: 'Template not found' };
    }
    const current = _stripRuntimeOnlyFields(json.templates[idx]);
    const updated = Object.assign({}, current, {
      // We deliberately do NOT touch fileName / id / mimeType /
      // sizeBytes / width / height / createdAt — those are
      // file-level facts.
      name: validation.data.name,
      description: validation.data.description,
      updatedAt: new Date().toISOString()
    });
    const next = json.templates.slice();
    next[idx] = updated;
    const saveRes = _saveTemplatesJson(getUserDataPath, next);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save templates' };
    }
    return { success: true, data: { template: updated } };
  });

  // ---- templates:delete ---------------------------------------------
  ipcMain.handle('templates:delete', async function (event, templateId) {
    if (typeof templateId !== 'string' || templateId.indexOf('template-') !== 0) {
      return { success: false, error: 'Invalid template id' };
    }
    const json = _safeLoadTemplatesJson(getUserDataPath);
    const idx = json.templates.findIndex(function (m) { return m && m.id === templateId; });
    if (idx === -1) {
      return { success: false, error: 'Template not found' };
    }
    const meta = json.templates[idx];
    // Remove image file (best-effort).
    try {
      if (meta && meta.fileName && _isInsideImagesDir(getUserDataPath, meta.fileName)) {
        const filePath = path.join(_getTemplatesImagesDir(getUserDataPath), meta.fileName);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }
    } catch (err) {
      // never fatal
    }
    const next = json.templates.slice();
    next.splice(idx, 1);
    const saveRes = _saveTemplatesJson(getUserDataPath, next);
    if (!saveRes.success) {
      return { success: false, error: saveRes.error || 'Failed to save templates' };
    }
    return { success: true, data: { id: templateId } };
  });

  // ---- templates:reset ----------------------------------------------
  ipcMain.handle('templates:reset', async function () {
    // Remove templates.json.
    try {
      const jp = _getTemplatesJsonPath(getUserDataPath);
      if (fs.existsSync(jp)) fs.unlinkSync(jp);
    } catch (err) {
      // continue — we still try to clean images
    }
    // Best-effort: drop all images we recognise as template assets.
    try {
      const dir = _getTemplatesImagesDir(getUserDataPath);
      if (fs.existsSync(dir)) {
        const entries = fs.readdirSync(dir);
        for (let i = 0; i < entries.length; i++) {
          const name = entries[i];
          // Only delete files that look like our generated names.
          if (typeof name !== 'string') continue;
          if (name.indexOf('template-') !== 0) continue;
          if (!_isInsideImagesDir(getUserDataPath, name)) continue;
          try { fs.unlinkSync(path.join(dir, name)); } catch (e) {}
        }
      }
    } catch (err) {
      // never fatal
    }
    _templatesLastError = null;
    return { success: true };
  });

  // ---- templates:get-stats ------------------------------------------
  // Lightweight read-only IPC for the diagnostics card / smoke harness.
  // Never touches images, just counts entries.
  ipcMain.handle('templates:get-stats', async function () {
    return getTemplatesStats(getUserDataPath);
  });
}

// ---------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------

module.exports = {
  registerTemplateAssetsIpc: registerTemplateAssetsIpc,
  getTemplatesStats: getTemplatesStats,
  // Internals exported for tests / smoke (currently unused by smoke,
  // but cheap to expose for future white-box checks).
  _internal: {
    ALLOWED_TEMPLATE_EXTENSIONS: ALLOWED_TEMPLATE_EXTENSIONS,
    ALLOWED_TEMPLATE_MIME_TYPES: ALLOWED_TEMPLATE_MIME_TYPES,
    MAX_TEMPLATE_FILE_BYTES: MAX_TEMPLATE_FILE_BYTES,
    MAX_TEMPLATE_NAME_LEN: MAX_TEMPLATE_NAME_LEN,
    MAX_TEMPLATE_DESCRIPTION_LEN: MAX_TEMPLATE_DESCRIPTION_LEN,
    detectImageType: _detectImageType,
    detectImageDimensions: _detectImageDimensions,
    normalizeExtension: _normalizeExtension,
    isAllowedExtension: _isAllowedExtension,
    isAllowedMimeType: _isAllowedMimeType,
    safeBaseName: _safeBaseName
  }
};
