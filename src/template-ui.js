// =====================================================================
// ClickFlow — src/template-ui.js (Step 27)
// ---------------------------------------------------------------------
// Renderer UI for the Advanced → Templates tab.
//
// HARD GUARANTEES (Step 27):
//   - All user-visible text rendered with `textContent`. `innerHTML`
//     is used only as `= ''` to clear a container.
//   - Image previews come from the safe IPC chain (`templates:load`,
//     `templates:import-image`) and are written exclusively to
//     `<img>.src`. They are never re-injected as raw HTML.
//   - This module never imports Node, electron, or `ipcRenderer`. It
//     only calls `window.clickflow.templates.*` indirectly through
//     `template-manager.js`.
//   - This step does NOT perform image matching, OCR, or any kind
//     of click. Templates are stored ASSETS only.
// =====================================================================

// In-memory edit buffer. Kept module-local — never persisted.
var _editingTemplateId = null;

// ---------------------------------------------------------------------
// Audit / log helpers
// ---------------------------------------------------------------------
function _tplAudit(type, payload) {
  if (typeof recordAuditEvent === 'function') {
    try { recordAuditEvent(type, payload || {}); } catch (e) {}
  }
}
function _tplLog(level, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    try { addLogEntry(createLog(level, message)); } catch (e) {}
  }
}
function _tt(key, fallback) {
  if (typeof t === 'function') {
    var v = t(key);
    if (v !== undefined && v !== null) return v;
  }
  return (typeof fallback === 'string') ? fallback : key;
}

// ---------------------------------------------------------------------
// DOM helpers
// ---------------------------------------------------------------------
function _tplAddCardRow(card, label, value) {
  var row = document.createElement('div'); row.className = 'adv-card-row';
  var lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = label;
  var val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = value;
  row.appendChild(lbl); row.appendChild(val); card.appendChild(row);
}

function _tabContainer() {
  return document.getElementById('advanced-tab-templates');
}

function _formatBytes(bytes) {
  var n = Number(bytes) || 0;
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

function _formatSize(width, height) {
  var w = Number(width) || 0;
  var h = Number(height) || 0;
  return w + ' × ' + h;
}

// ---------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------

// Programmatically open the Templates tab (used by app commands).
function openTemplatesTab() {
  if (typeof setAdvancedTab === 'function') {
    setAdvancedTab('templates');
  } else {
    renderTemplatesTab();
  }
}

// Top-level renderer for the tab. Idempotent — safe to call multiple
// times (it always rebuilds the section).
function renderTemplatesTab() {
  var c = _tabContainer();
  if (!c) return;
  c.innerHTML = ''; // clear container only — never user text

  // 1. Header
  var header = document.createElement('div'); header.className = 'adv-card';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'adv-card-title';
  headerTitle.textContent = _tt('imageTemplates', 'Image Templates');
  header.appendChild(headerTitle);
  c.appendChild(header);

  // 2. Safety notice
  var notice = document.createElement('div');
  notice.className = 'adv-warning template-safety-notice';
  notice.textContent = _tt(
    'templateSafetyNote',
    'Templates are stored as image assets only. Screen matching and clicks are not performed yet.'
  );
  c.appendChild(notice);

  // 3. Action buttons
  var actions = document.createElement('div'); actions.className = 'adv-btn-group template-actions';
  var importBtn = document.createElement('button');
  importBtn.className = 'adv-btn'; importBtn.id = 'tpl-btn-import';
  importBtn.textContent = _tt('importTemplate', 'Import template');
  importBtn.addEventListener('click', openTemplateImport);
  actions.appendChild(importBtn);

  var refreshBtn = document.createElement('button');
  refreshBtn.className = 'adv-btn adv-btn-secondary'; refreshBtn.id = 'tpl-btn-refresh';
  refreshBtn.textContent = _tt('refreshTemplates', 'Refresh');
  refreshBtn.addEventListener('click', refreshTemplates);
  actions.appendChild(refreshBtn);

  var resetBtn = document.createElement('button');
  resetBtn.className = 'adv-btn adv-btn-danger'; resetBtn.id = 'tpl-btn-reset';
  resetBtn.textContent = _tt('resetTemplates', 'Reset templates');
  resetBtn.addEventListener('click', resetTemplateAssets);
  actions.appendChild(resetBtn);

  c.appendChild(actions);

  // 4. Active template card
  c.appendChild(renderActiveTemplate());

  // 5. Template list / grid
  c.appendChild(renderTemplateList());
}

// =====================================================================
// Active template card
// =====================================================================

function renderActiveTemplate() {
  var card = document.createElement('div'); card.className = 'adv-card template-active-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('activeTemplate', 'Active template');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : { templates: { activeTemplateId: null } };
  var activeId = state.templates ? state.templates.activeTemplateId : null;
  var active = (typeof getActiveTemplate === 'function') ? getActiveTemplate() : null;

  if (!activeId || !active) {
    var empty = document.createElement('div');
    empty.className = 'adv-log-empty template-empty-state';
    empty.textContent = _tt('noActiveTemplate', 'No template selected');
    card.appendChild(empty);
    return card;
  }

  // preview row
  var previewBox = document.createElement('div'); previewBox.className = 'template-active-preview-box';
  if (active.previewDataUrl) {
    var img = document.createElement('img');
    img.className = 'template-preview-image template-active-preview-image';
    img.alt = '';
    img.src = active.previewDataUrl; // safe DataURL from preload IPC
    img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    previewBox.appendChild(img);
  } else {
    var stub = document.createElement('div');
    stub.className = 'template-preview-image template-preview-image-empty';
    stub.textContent = '';
    previewBox.appendChild(stub);
  }
  card.appendChild(previewBox);

  // metadata
  _tplAddCardRow(card, _tt('templateName',     'Template name'),     active.name || '');
  if (active.description) {
    _tplAddCardRow(card, _tt('templateDescription', 'Description'), active.description);
  }
  _tplAddCardRow(card, _tt('originalFileName', 'Original file name'), active.originalFileName || '');
  _tplAddCardRow(card, _tt('imageSize',        'Image size'),        _formatSize(active.width, active.height));
  _tplAddCardRow(card, _tt('fileSize',         'File size'),         _formatBytes(active.sizeBytes));
  _tplAddCardRow(card, _tt('type',             'Type'),              active.mimeType || '');
  _tplAddCardRow(card, 'id', active.id || '');

  return card;
}

// =====================================================================
// Template list / grid
// =====================================================================

function renderTemplateList() {
  var card = document.createElement('div'); card.className = 'adv-card template-list-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = _tt('templates', 'Templates');
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : { templates: { items: [], isLoading: false, lastError: null, activeTemplateId: null } };
  var slice = state.templates || { items: [], isLoading: false, lastError: null, activeTemplateId: null };

  if (slice.isLoading) {
    var loading = document.createElement('div'); loading.className = 'adv-log-empty template-loading';
    loading.textContent = _tt('statusUpdated', 'Loading...');
    card.appendChild(loading);
    return card;
  }

  if (slice.lastError) {
    var err = document.createElement('div'); err.className = 'adv-warning template-error';
    err.textContent = slice.lastError;
    card.appendChild(err);
  }

  var items = Array.isArray(slice.items) ? slice.items : [];
  if (items.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'adv-log-empty template-empty-state';
    empty.textContent = _tt('noTemplates', 'No templates yet.');
    card.appendChild(empty);
    return card;
  }

  var grid = document.createElement('div'); grid.className = 'template-grid';
  items.forEach(function (item) {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string') return;
    if (_editingTemplateId === item.id) {
      grid.appendChild(_renderEditCard(item));
    } else {
      grid.appendChild(renderTemplateCard(item, slice.activeTemplateId));
    }
  });
  card.appendChild(grid);
  return card;
}

function renderTemplateCard(template, activeTemplateId) {
  var card = document.createElement('div'); card.className = 'template-card';
  if (activeTemplateId === template.id) card.classList.add('selected');

  // Selected badge.
  if (activeTemplateId === template.id) {
    var badge = document.createElement('span'); badge.className = 'template-selected-badge';
    badge.textContent = _tt('selectedTemplate', 'Active');
    card.appendChild(badge);
  }

  // Preview area.
  var previewBox = document.createElement('div'); previewBox.className = 'template-preview-box';
  if (template.previewDataUrl) {
    var img = document.createElement('img');
    img.className = 'template-preview-image';
    img.alt = ''; // decorative; the name below carries the label
    img.src = template.previewDataUrl;
    img.addEventListener('dragstart', function (e) { e.preventDefault(); });
    previewBox.appendChild(img);
  } else {
    var stub = document.createElement('div');
    stub.className = 'template-preview-image template-preview-image-empty';
    stub.textContent = '';
    previewBox.appendChild(stub);
  }
  card.appendChild(previewBox);

  // Name (textContent).
  var name = document.createElement('div'); name.className = 'template-card-name';
  name.textContent = template.name || '';
  card.appendChild(name);

  // Description (textContent, optional).
  if (template.description) {
    var desc = document.createElement('div'); desc.className = 'template-card-description';
    desc.textContent = template.description;
    card.appendChild(desc);
  }

  // Metadata block.
  var metaList = document.createElement('div'); metaList.className = 'template-card-meta';
  _tplAddCardRow(metaList, _tt('originalFileName', 'Original file name'), template.originalFileName || '');
  _tplAddCardRow(metaList, _tt('imageSize',        'Image size'),        _formatSize(template.width, template.height));
  _tplAddCardRow(metaList, _tt('fileSize',         'File size'),         _formatBytes(template.sizeBytes));
  _tplAddCardRow(metaList, _tt('createdAt',        'Created at'),        template.createdAt || '');
  card.appendChild(metaList);

  // Actions.
  var actions = document.createElement('div'); actions.className = 'template-card-actions';

  var selectBtn = document.createElement('button');
  selectBtn.className = 'adv-btn adv-btn-secondary template-btn-select';
  selectBtn.textContent = _tt('selectTemplate', 'Select');
  selectBtn.addEventListener('click', function () { _selectTemplateById(template.id); });
  if (activeTemplateId === template.id) selectBtn.disabled = true;
  actions.appendChild(selectBtn);

  var editBtn = document.createElement('button');
  editBtn.className = 'adv-btn adv-btn-secondary template-btn-edit';
  editBtn.textContent = _tt('editTemplate', 'Edit');
  editBtn.addEventListener('click', function () { openTemplateEdit(template.id); });
  actions.appendChild(editBtn);

  var delBtn = document.createElement('button');
  delBtn.className = 'adv-btn adv-btn-danger template-btn-delete';
  delBtn.textContent = _tt('deleteTemplate', 'Delete');
  delBtn.addEventListener('click', function () { deleteTemplateById(template.id); });
  actions.appendChild(delBtn);

  card.appendChild(actions);
  return card;
}

// =====================================================================
// Inline edit form
// =====================================================================

function _renderEditCard(template) {
  var card = document.createElement('div'); card.className = 'template-card template-card-editing';

  var title = document.createElement('div'); title.className = 'template-edit-title';
  title.textContent = _tt('editTemplate', 'Edit template');
  card.appendChild(title);

  // Name input.
  var nameLabel = document.createElement('label'); nameLabel.className = 'template-edit-label';
  nameLabel.textContent = _tt('templateName', 'Template name');
  var nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'template-edit-input';
  nameInput.id = 'tpl-edit-name';
  nameInput.maxLength = 80;
  nameInput.value = template.name || '';
  card.appendChild(nameLabel);
  card.appendChild(nameInput);

  // Description input.
  var descLabel = document.createElement('label'); descLabel.className = 'template-edit-label';
  descLabel.textContent = _tt('templateDescription', 'Description');
  var descInput = document.createElement('textarea');
  descInput.className = 'template-edit-textarea';
  descInput.id = 'tpl-edit-description';
  descInput.maxLength = 300;
  descInput.rows = 3;
  descInput.value = template.description || '';
  card.appendChild(descLabel);
  card.appendChild(descInput);

  // Inline error placeholder.
  var errBox = document.createElement('div');
  errBox.className = 'template-edit-error';
  errBox.id = 'tpl-edit-error';
  card.appendChild(errBox);

  // Actions.
  var actions = document.createElement('div'); actions.className = 'template-card-actions';

  var saveBtn = document.createElement('button');
  saveBtn.className = 'adv-btn template-btn-save';
  saveBtn.textContent = _tt('save', 'Save');
  saveBtn.addEventListener('click', saveTemplateEdit);
  actions.appendChild(saveBtn);

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'adv-btn adv-btn-secondary template-btn-cancel';
  cancelBtn.textContent = _tt('cancel', 'Cancel');
  cancelBtn.addEventListener('click', cancelTemplateEdit);
  actions.appendChild(cancelBtn);

  card.appendChild(actions);
  return card;
}

// =====================================================================
// Actions
// =====================================================================

async function refreshTemplates() {
  if (typeof loadTemplates !== 'function') {
    _tplLog('error', _tt('templateImportFailed', 'Template import failed'));
    return;
  }
  await loadTemplates();
  renderTemplatesTab();
}

async function openTemplateImport() {
  if (typeof importTemplateImage !== 'function') {
    _tplLog('error', _tt('templateImportFailed', 'Template import failed'));
    return;
  }
  _tplAudit('template.import.requested', {});
  var resp = await importTemplateImage();
  if (resp && resp.success && resp.template) {
    _tplAudit('template.import.completed', {
      id: resp.template.id,
      mimeType: resp.template.mimeType || '',
      sizeBytes: resp.template.sizeBytes || 0
    });
    _tplLog('success', _tt('templateImported', 'Template imported') + ': ' + (resp.template.name || ''));
    // Promote the freshly imported template to active by default —
    // matches the user's intent ("I just picked this image").
    if (typeof setActiveTemplate === 'function') setActiveTemplate(resp.template.id);
  } else if (resp && resp.cancelled) {
    _tplAudit('template.import.cancelled', {});
    _tplLog('info', _tt('templateImportCancelled', 'Template import cancelled'));
  } else {
    var msg = (resp && resp.error) ? resp.error : 'Template import failed';
    _tplAudit('template.import.failed', { reason: msg });
    _tplLog('error', _tt('templateImportFailed', 'Template import failed') + ': ' + msg);
  }
  renderTemplatesTab();
}

function openTemplateEdit(id) {
  if (typeof id !== 'string' || id.length === 0) return;
  if (typeof getTemplateById === 'function' && !getTemplateById(id)) return;
  _editingTemplateId = id;
  renderTemplatesTab();
}

function cancelTemplateEdit() {
  _editingTemplateId = null;
  renderTemplatesTab();
}

async function saveTemplateEdit() {
  if (!_editingTemplateId) return;
  var nameEl = document.getElementById('tpl-edit-name');
  var descEl = document.getElementById('tpl-edit-description');
  var errEl  = document.getElementById('tpl-edit-error');
  if (!nameEl) return;

  var input = {
    name: (nameEl && typeof nameEl.value === 'string') ? nameEl.value : '',
    description: (descEl && typeof descEl.value === 'string') ? descEl.value : ''
  };

  // Local validation (mirrors main).
  if (typeof validateTemplateMetadata === 'function') {
    var validation = validateTemplateMetadata(input);
    if (!validation.valid) {
      var localMsg;
      if (validation.error === 'Template name is required') {
        localMsg = _tt('templateNameRequired', 'Template name is required');
      } else if (validation.error === 'Template name is too long') {
        localMsg = _tt('templateNameTooLong', 'Template name is too long');
      } else if (validation.error === 'Template description is too long') {
        localMsg = _tt('templateDescriptionTooLong', 'Template description is too long');
      } else {
        localMsg = validation.error;
      }
      if (errEl) errEl.textContent = localMsg;
      return;
    }
  }

  if (errEl) errEl.textContent = '';
  if (typeof updateTemplateMetadata !== 'function') {
    if (errEl) errEl.textContent = _tt('templateImportFailed', 'Template update failed');
    return;
  }
  var resp = await updateTemplateMetadata(_editingTemplateId, input);
  if (resp && resp.success) {
    _tplAudit('template.metadata.updated', { id: _editingTemplateId });
    _tplLog('success', _tt('templateMetadataSaved', 'Template metadata saved'));
    _editingTemplateId = null;
    renderTemplatesTab();
  } else {
    var msg = (resp && resp.error) ? resp.error : _tt('templateImportFailed', 'Template update failed');
    if (errEl) errEl.textContent = msg;
  }
}

function _selectTemplateById(id) {
  if (typeof setActiveTemplate !== 'function') return;
  var ok = setActiveTemplate(id);
  if (!ok) return;
  _tplAudit('template.selected', { id: id });
  _tplLog('info', _tt('templateSelected', 'Template selected'));
  renderTemplatesTab();
}

async function deleteTemplateById(id) {
  if (typeof id !== 'string' || id.length === 0) return;
  // Lightweight inline confirm — matches the Step 7 scenario delete flow.
  var template = (typeof getTemplateById === 'function') ? getTemplateById(id) : null;
  var label = template && template.name ? (' "' + template.name + '"') : '';
  var confirmText = _tt('deleteTemplate', 'Delete') + label + '?';
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (!window.confirm(confirmText)) return;
  }
  if (typeof deleteTemplate !== 'function') return;
  var resp = await deleteTemplate(id);
  if (resp && resp.success) {
    _tplAudit('template.deleted', { id: id });
    _tplLog('info', _tt('templateDeleted', 'Template deleted'));
  } else {
    var msg = (resp && resp.error) ? resp.error : _tt('templateImportFailed', 'Template delete failed');
    _tplLog('error', msg);
  }
  // If we were editing this id — drop the edit buffer.
  if (_editingTemplateId === id) _editingTemplateId = null;
  renderTemplatesTab();
}

async function resetTemplateAssets() {
  var confirmText = _tt('resetTemplates', 'Reset templates') + '?';
  if (typeof window !== 'undefined' && typeof window.confirm === 'function') {
    if (!window.confirm(confirmText)) return;
  }
  if (typeof resetTemplates !== 'function') return;
  var resp = await resetTemplates();
  if (resp && resp.success) {
    _tplAudit('template.reset', {});
    _tplLog('warning', _tt('templatesReset', 'Templates reset'));
    _editingTemplateId = null;
  } else {
    var msg = (resp && resp.error) ? resp.error : _tt('templateImportFailed', 'Template reset failed');
    _tplLog('error', msg);
  }
  renderTemplatesTab();
}
