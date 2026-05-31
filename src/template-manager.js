// =====================================================================
// ClickFlow — src/template-manager.js (Step 27)
// ---------------------------------------------------------------------
// Renderer-side wrapper around the safe `templates:*` preload API.
// Mirrors the pattern of screen-capture-client.js: this module
// validates inputs, shapes the responses, and never speaks to
// `ipcRenderer` directly.
//
// HARD GUARANTEES (Step 27):
//   - Imports go ONLY through the main-process `templates:import-image`
//     handler, which itself calls `dialog.showOpenDialog` with a
//     png/jpg/jpeg/webp filter. The renderer never sees raw paths.
//   - `previewDataUrl` lives only in renderer memory (the items
//     returned by `templates:load`). It is NEVER persisted to
//     settings, scenarios, profiles, or templates.json.
//   - This file does not import Node, electron, or ipcRenderer. It
//     only uses `window.clickflow.templates.*`.
//   - This step does NOT trigger image matching, OCR, or any kind
//     of click. Templates are stored ASSETS only.
// =====================================================================

// ---------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------

// Limits must match main/template-assets.js. We validate locally
// first so the user sees errors without an IPC round trip; main is
// still the final gate.
var TEMPLATE_NAME_MAX_LEN = 80;
var TEMPLATE_DESCRIPTION_MAX_LEN = 300;
var TEMPLATE_ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

function validateTemplateMetadata(input) {
  if (!input || typeof input !== 'object') {
    return { valid: false, error: 'Invalid metadata' };
  }
  if (typeof input.name !== 'string' || input.name.trim().length === 0) {
    return { valid: false, error: 'Template name is required' };
  }
  var name = input.name.trim();
  if (name.length > TEMPLATE_NAME_MAX_LEN) {
    return { valid: false, error: 'Template name is too long' };
  }
  var description = '';
  if (typeof input.description === 'string') {
    description = input.description.trim();
    if (description.length > TEMPLATE_DESCRIPTION_MAX_LEN) {
      return { valid: false, error: 'Template description is too long' };
    }
  }
  return { valid: true, data: { name: name, description: description } };
}

function _validTemplateMimeType(mime) {
  return TEMPLATE_ALLOWED_MIME_TYPES.indexOf(mime) !== -1;
}

function _normalizeTemplateRecord(item) {
  if (!item || typeof item !== 'object') return null;
  if (typeof item.id !== 'string' || item.id.indexOf('template-') !== 0) return null;
  if (typeof item.fileName !== 'string' || item.fileName.length === 0) return null;
  // Strip any unexpected keys to keep the renderer slice predictable.
  var clean = {
    id:               item.id,
    name:             typeof item.name === 'string' ? item.name : '',
    description:      typeof item.description === 'string' ? item.description : '',
    fileName:         item.fileName,
    originalFileName: typeof item.originalFileName === 'string' ? item.originalFileName : '',
    mimeType:         typeof item.mimeType === 'string' ? item.mimeType : '',
    sizeBytes:        typeof item.sizeBytes === 'number' ? item.sizeBytes : 0,
    width:            typeof item.width  === 'number' ? item.width  : 0,
    height:           typeof item.height === 'number' ? item.height : 0,
    createdAt:        typeof item.createdAt === 'string' ? item.createdAt : '',
    updatedAt:        typeof item.updatedAt === 'string' ? item.updatedAt : '',
    previewDataUrl:   typeof item.previewDataUrl === 'string' ? item.previewDataUrl : ''
  };
  // Drop a previewDataUrl whose mime type contradicts the metadata.
  if (clean.previewDataUrl && clean.mimeType && !_validTemplateMimeType(clean.mimeType)) {
    clean.previewDataUrl = '';
  }
  return clean;
}

// ---------------------------------------------------------------------
// Bridge availability
// ---------------------------------------------------------------------

function _api() {
  if (window.clickflow && window.clickflow.templates) return window.clickflow.templates;
  return null;
}

// ---------------------------------------------------------------------
// Init / load
// ---------------------------------------------------------------------

// Idempotent: safe to call multiple times. Sets app-state slice and
// returns the loaded items (already normalised).
async function initTemplates() {
  return loadTemplates();
}

async function loadTemplates() {
  var api = _api();
  if (!api || typeof api.load !== 'function') {
    if (typeof setTemplatesError === 'function') setTemplatesError('templates API unavailable');
    return [];
  }
  if (typeof setTemplatesLoading === 'function') setTemplatesLoading(true);
  if (typeof setTemplatesError === 'function') setTemplatesError(null);
  try {
    var resp = await api.load();
    if (!resp || resp.success !== true || !resp.data) {
      var msg = (resp && resp.error) ? resp.error : 'Failed to load templates';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg);
      if (typeof setTemplates === 'function') setTemplates([]);
      return [];
    }
    var raw = Array.isArray(resp.data.templates) ? resp.data.templates : [];
    var items = [];
    for (var i = 0; i < raw.length; i++) {
      var rec = _normalizeTemplateRecord(raw[i]);
      if (rec) items.push(rec);
    }
    if (typeof setTemplates === 'function') setTemplates(items);
    // Drop activeTemplateId if it no longer exists.
    if (typeof getState === 'function' && typeof setActiveTemplateId === 'function') {
      var st = getState();
      var activeId = st.templates && st.templates.activeTemplateId;
      if (activeId && !items.some(function (t) { return t.id === activeId; })) {
        setActiveTemplateId(null);
      }
    }
    return items;
  } catch (err) {
    if (typeof setTemplatesError === 'function') setTemplatesError('Failed to load templates');
    return [];
  } finally {
    if (typeof setTemplatesLoading === 'function') setTemplatesLoading(false);
  }
}

// ---------------------------------------------------------------------
// Selectors (read-only)
// ---------------------------------------------------------------------

function getTemplates() {
  if (typeof getState !== 'function') return [];
  var st = getState();
  return (st.templates && Array.isArray(st.templates.items)) ? st.templates.items.slice() : [];
}

function getTemplateById(id) {
  if (typeof id !== 'string' || id.length === 0) return null;
  var items = getTemplates();
  for (var i = 0; i < items.length; i++) {
    if (items[i] && items[i].id === id) return items[i];
  }
  return null;
}

function getActiveTemplate() {
  if (typeof getState !== 'function') return null;
  var st = getState();
  var activeId = st.templates ? st.templates.activeTemplateId : null;
  if (!activeId) return null;
  return getTemplateById(activeId);
}

function setActiveTemplate(id) {
  // Refuses unknown ids — guards against stale UI selections.
  if (id === null || typeof id === 'undefined') {
    if (typeof setActiveTemplateId === 'function') setActiveTemplateId(null);
    return true;
  }
  if (typeof id !== 'string') return false;
  if (!getTemplateById(id)) return false;
  if (typeof setActiveTemplateId === 'function') setActiveTemplateId(id);
  return true;
}

// ---------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------

async function importTemplateImage() {
  var api = _api();
  if (!api || typeof api.importImage !== 'function') {
    return { success: false, error: 'templates API unavailable' };
  }
  if (typeof setTemplatesError === 'function') setTemplatesError(null);
  try {
    var resp = await api.importImage();
    if (!resp) return { success: false, error: 'Import failed' };
    if (resp.cancelled) return { success: false, cancelled: true };
    if (resp.success !== true || !resp.data || !resp.data.template) {
      var msg = resp.error || 'Import failed';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg);
      return { success: false, error: msg };
    }
    var enriched = Object.assign({}, resp.data.template, {
      previewDataUrl: typeof resp.data.previewDataUrl === 'string' ? resp.data.previewDataUrl : ''
    });
    var record = _normalizeTemplateRecord(enriched);
    if (!record) {
      var msg2 = 'Imported template metadata invalid';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg2);
      return { success: false, error: msg2 };
    }
    var current = getTemplates();
    current.push(record);
    if (typeof setTemplates === 'function') setTemplates(current);
    return { success: true, template: record };
  } catch (err) {
    if (typeof setTemplatesError === 'function') setTemplatesError('Import failed');
    return { success: false, error: 'Import failed' };
  }
}

async function updateTemplateMetadata(id, updates) {
  var api = _api();
  if (!api || typeof api.saveMetadata !== 'function') {
    return { success: false, error: 'templates API unavailable' };
  }
  var validation = validateTemplateMetadata(updates);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }
  try {
    var resp = await api.saveMetadata(id, validation.data);
    if (!resp || resp.success !== true || !resp.data || !resp.data.template) {
      var msg = (resp && resp.error) ? resp.error : 'Failed to save metadata';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg);
      return { success: false, error: msg };
    }
    var current = getTemplates();
    var idx = current.findIndex(function (t) { return t && t.id === id; });
    if (idx !== -1) {
      // Preserve the renderer-side previewDataUrl across the rename.
      var preview = current[idx].previewDataUrl || '';
      current[idx] = _normalizeTemplateRecord(Object.assign({}, resp.data.template, { previewDataUrl: preview }));
      if (typeof setTemplates === 'function') setTemplates(current);
    } else {
      // Race: not in slice — reload to stay in sync.
      await loadTemplates();
    }
    return { success: true, template: getTemplateById(id) };
  } catch (err) {
    if (typeof setTemplatesError === 'function') setTemplatesError('Failed to save metadata');
    return { success: false, error: 'Failed to save metadata' };
  }
}

async function deleteTemplate(id) {
  var api = _api();
  if (!api || typeof api.delete !== 'function') {
    return { success: false, error: 'templates API unavailable' };
  }
  if (typeof id !== 'string' || id.length === 0) {
    return { success: false, error: 'Invalid template id' };
  }
  try {
    var resp = await api.delete(id);
    if (!resp || resp.success !== true) {
      var msg = (resp && resp.error) ? resp.error : 'Failed to delete template';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg);
      return { success: false, error: msg };
    }
    var next = getTemplates().filter(function (t) { return t && t.id !== id; });
    if (typeof setTemplates === 'function') setTemplates(next);
    if (typeof getState === 'function' && typeof setActiveTemplateId === 'function') {
      var st = getState();
      if (st.templates && st.templates.activeTemplateId === id) {
        setActiveTemplateId(null);
      }
    }
    return { success: true };
  } catch (err) {
    if (typeof setTemplatesError === 'function') setTemplatesError('Failed to delete template');
    return { success: false, error: 'Failed to delete template' };
  }
}

async function resetTemplates() {
  var api = _api();
  if (!api || typeof api.reset !== 'function') {
    return { success: false, error: 'templates API unavailable' };
  }
  try {
    var resp = await api.reset();
    if (!resp || resp.success !== true) {
      var msg = (resp && resp.error) ? resp.error : 'Failed to reset templates';
      if (typeof setTemplatesError === 'function') setTemplatesError(msg);
      return { success: false, error: msg };
    }
    if (typeof resetTemplatesState === 'function') resetTemplatesState();
    return { success: true };
  } catch (err) {
    if (typeof setTemplatesError === 'function') setTemplatesError('Failed to reset templates');
    return { success: false, error: 'Failed to reset templates' };
  }
}

// ---------------------------------------------------------------------
// Diagnostics passthrough
// ---------------------------------------------------------------------

async function getTemplatesStats() {
  var api = _api();
  if (!api || typeof api.getStats !== 'function') {
    return { count: 0, storageReady: false, lastError: 'templates API unavailable' };
  }
  try {
    var resp = await api.getStats();
    if (!resp || typeof resp !== 'object') {
      return { count: 0, storageReady: false, lastError: 'invalid stats response' };
    }
    return {
      count:        typeof resp.count === 'number' ? resp.count : 0,
      storageReady: !!resp.storageReady,
      lastError:    typeof resp.lastError === 'string' ? resp.lastError : null
    };
  } catch (err) {
    return { count: 0, storageReady: false, lastError: 'stats request failed' };
  }
}
