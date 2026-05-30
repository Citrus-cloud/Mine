// =====================================================================
// ClickFlow — src/screen-capture-ui.js (Step 25)
// ---------------------------------------------------------------------
// Renderer UI for the Advanced → Screen Capture tab.
//
// Hard guarantees in this file:
//   - all user-visible text is rendered with textContent, never with
//     unsafe innerHTML;
//   - innerHTML is used only as `= ''` to clear a container (matches
//     the rest of the renderer);
//   - imageDataUrl values come from the safe preload IPC and are
//     written to <img>.src only — they are NOT inserted into the
//     DOM as raw HTML;
//   - this module never imports Node or `ipcRenderer`; it only calls
//     window.clickflow.screenCapture.* via screen-capture-client.js;
//   - it never persists any data — everything lives in app-state's
//     in-memory screenCapture slice and clears on reset;
//   - it never executes a real click, runs OCR, or triggers image
//     recognition.
// =====================================================================

// --- Audit helper (no-op if audit-events.js is missing) --------------
function _scAudit(type, payload) {
  if (typeof recordAuditEvent === 'function') {
    try { recordAuditEvent(type, payload || {}); } catch (e) {}
  }
}

// --- Logger helper (no-op if logger.js is missing) -------------------
function _scLog(type, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    try { addLogEntry(createLog(type, message)); } catch (e) {}
  }
}

// --- DOM helpers (consistent with renderer.js) -----------------------
function _scAddCardRow(card, label, value) {
  var row = document.createElement('div'); row.className = 'adv-card-row';
  var lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = label;
  var val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = value;
  row.appendChild(lbl); row.appendChild(val); card.appendChild(row);
}

function _scTabContainer() {
  return document.getElementById('advanced-tab-screenCapture');
}

// =====================================================================
// Public entry points
// =====================================================================

// Programmatically open the Screen Capture tab (used by tests/menu).
function openScreenCaptureTab() {
  if (typeof setAdvancedTab === 'function') {
    setAdvancedTab('screenCapture');
  } else {
    renderScreenCapture();
  }
}

// Top-level renderer for the tab. Idempotent — safe to call multiple
// times (it always rebuilds the section).
function renderScreenCapture() {
  var c = _scTabContainer();
  if (!c) return;
  c.innerHTML = ''; // clear container only — never user text

  // 1. Header
  var header = document.createElement('div'); header.className = 'adv-card';
  var headerTitle = document.createElement('div');
  headerTitle.className = 'adv-card-title';
  headerTitle.textContent = (typeof t === 'function') ? t('screenCapture') : 'Screen Capture';
  header.appendChild(headerTitle);
  c.appendChild(header);

  // 2. Safety notice
  var notice = document.createElement('div');
  notice.className = 'adv-warning screen-capture-safety-notice';
  notice.textContent = (typeof t === 'function') ? t('screenCaptureSafetyNotice') :
    'Screenshots are used for preview only. ClickFlow does not perform real clicks or save images without your action.';
  c.appendChild(notice);

  // 3. Action buttons
  var actions = document.createElement('div'); actions.className = 'adv-btn-group screen-capture-actions';
  var refreshBtn = document.createElement('button');
  refreshBtn.className = 'adv-btn'; refreshBtn.id = 'sc-btn-refresh';
  refreshBtn.textContent = (typeof t === 'function') ? t('refreshSources') : 'Refresh sources';
  refreshBtn.addEventListener('click', refreshScreenSources);
  actions.appendChild(refreshBtn);

  var captureBtn = document.createElement('button');
  captureBtn.className = 'adv-btn adv-btn-secondary'; captureBtn.id = 'sc-btn-capture';
  captureBtn.textContent = (typeof t === 'function') ? t('capturePreview') : 'Capture preview';
  captureBtn.addEventListener('click', captureSelectedScreenPreview);
  actions.appendChild(captureBtn);

  var clearBtn = document.createElement('button');
  clearBtn.className = 'adv-btn adv-btn-secondary'; clearBtn.id = 'sc-btn-clear';
  clearBtn.textContent = (typeof t === 'function') ? t('clearPreview') : 'Clear preview';
  clearBtn.addEventListener('click', clearScreenPreview);
  actions.appendChild(clearBtn);
  c.appendChild(actions);

  // 4. Status card (always present so users can see "available / not
  //    supported / last error" without opening Diagnostics).
  c.appendChild(renderScreenCaptureStatus());

  // 5. Selected source card
  var selCard = document.createElement('div'); selCard.className = 'adv-card screen-capture-selected-card';
  var selTitle = document.createElement('div'); selTitle.className = 'adv-card-title';
  selTitle.textContent = (typeof t === 'function') ? t('selectedSource') : 'Selected source';
  selCard.appendChild(selTitle);
  var state = (typeof getState === 'function') ? getState() : { screenCapture: { selectedSourceId: null, sources: [] } };
  var selectedId = state.screenCapture.selectedSourceId;
  var selected = selectedId ? (state.screenCapture.sources || []).find(function (s) { return s && s.id === selectedId; }) : null;
  if (selected) {
    _scAddCardRow(selCard, (typeof t === 'function') ? t('scenarioName') : 'Name', selected.name || '');
    _scAddCardRow(selCard, (typeof t === 'function') ? t('sourceType') : 'Type',
      _scLocaliseType(selected.type));
    _scAddCardRow(selCard, 'id', selected.id || '');
  } else {
    var empty = document.createElement('div');
    empty.className = 'adv-log-empty screen-capture-empty';
    empty.textContent = (typeof t === 'function') ? t('noSelectedSource') : 'No source selected';
    selCard.appendChild(empty);
  }
  c.appendChild(selCard);

  // 6. Sources list
  c.appendChild(renderScreenSourceList());

  // 7. Preview card
  c.appendChild(renderScreenPreview());

  // 8. Region selector card (Step 26). Lives below the preview so
  //    the user always sees the rectangle in the same column. The
  //    card is empty-state aware — it renders a "capture preview
  //    first" message when there is no preview to draw on.
  if (typeof renderRegionSelectorCard === 'function') {
    c.appendChild(renderRegionSelectorCard());
  }

  // Capture button is enabled only when a valid selection exists.
  captureBtn.disabled = !selectedId;
}

// =====================================================================
// Status card
// =====================================================================

function renderScreenCaptureStatus() {
  var card = document.createElement('div'); card.className = 'adv-card screen-capture-status-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = (typeof t === 'function') ? t('screenCaptureStatus') : 'Screen capture status';
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : { screenCapture: {} };
  var sc = state.screenCapture || {};
  _scAddCardRow(card, (typeof t === 'function') ? t('sourcesCount') : 'Sources count',
    String((sc.sources || []).length));
  _scAddCardRow(card, (typeof t === 'function') ? t('selectedScreenSource') : 'Selected source',
    sc.selectedSourceId || ((typeof t === 'function') ? t('noSelectedSource') : 'No source selected'));
  _scAddCardRow(card, (typeof t === 'function') ? t('previewAvailable') : 'Preview available',
    sc.preview ? ((typeof t === 'function') ? t('yes') : 'yes')
               : ((typeof t === 'function') ? t('no') : 'no'));
  _scAddCardRow(card, (typeof t === 'function') ? t('capturedAt') : 'Captured at',
    sc.lastCapturedAt || ((typeof t === 'function') ? t('none2') : '—'));
  if (sc.lastError) {
    _scAddCardRow(card, 'lastError', sc.lastError);
  }

  // Async fetch of the runtime status (available / supported).
  var availRow = document.createElement('div'); availRow.className = 'adv-card-row';
  var availLbl = document.createElement('span'); availLbl.className = 'adv-card-label'; availLbl.textContent = 'available';
  var availVal = document.createElement('span'); availVal.className = 'adv-card-value'; availVal.textContent = '...';
  availRow.appendChild(availLbl); availRow.appendChild(availVal); card.appendChild(availRow);
  if (typeof getScreenCaptureStatus === 'function') {
    getScreenCaptureStatus().then(function (st) {
      availVal.textContent = st && st.available
        ? ((typeof t === 'function') ? t('yes') : 'yes')
        : ((typeof t === 'function') ? t('no') : 'no');
    }).catch(function () { availVal.textContent = '?'; });
  } else {
    availVal.textContent = '?';
  }

  return card;
}

// =====================================================================
// Sources list
// =====================================================================

function renderScreenSourceList() {
  var card = document.createElement('div'); card.className = 'adv-card screen-capture-sources-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = (typeof t === 'function') ? t('screenSources') : 'Screen sources';
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : { screenCapture: { sources: [], selectedSourceId: null, isLoading: false, lastError: null } };
  var sc = state.screenCapture || {};

  if (sc.isLoading) {
    var loading = document.createElement('div'); loading.className = 'adv-log-empty screen-capture-loading';
    loading.textContent = (typeof t === 'function') ? t('statusUpdated') : 'Loading...';
    card.appendChild(loading);
    return card;
  }

  if (sc.lastError) {
    var err = document.createElement('div'); err.className = 'adv-warning screen-capture-error';
    err.textContent = sc.lastError + ' — ' +
      ((typeof t === 'function') ? t('permissionMayBeRequired')
                                 : 'OS permissions may be required.');
    card.appendChild(err);
  }

  var sources = Array.isArray(sc.sources) ? sc.sources : [];
  if (sources.length === 0) {
    var empty = document.createElement('div'); empty.className = 'adv-log-empty screen-capture-empty';
    empty.textContent = (typeof t === 'function') ? t('noScreenSources') : 'No screen sources. Click "Refresh sources".';
    card.appendChild(empty);
    return card;
  }

  var grid = document.createElement('div'); grid.className = 'screen-capture-grid';
  sources.forEach(function (src) {
    if (!src || typeof src !== 'object') return;
    var item = document.createElement('div'); item.className = 'screen-capture-source-card';
    if (sc.selectedSourceId === src.id) item.classList.add('selected');

    if (src.thumbnailDataUrl) {
      var thumb = document.createElement('img');
      thumb.className = 'screen-capture-thumb';
      thumb.alt = ''; // decorative; the name below carries the label
      thumb.src = src.thumbnailDataUrl; // safe DataURL from preload IPC
      item.appendChild(thumb);
    } else {
      var thumbStub = document.createElement('div');
      thumbStub.className = 'screen-capture-thumb screen-capture-thumb-empty';
      thumbStub.textContent = '';
      item.appendChild(thumbStub);
    }

    var name = document.createElement('div'); name.className = 'screen-capture-source-name';
    name.textContent = src.name || ''; // textContent — never innerHTML
    item.appendChild(name);

    var typeBadge = document.createElement('span');
    typeBadge.className = 'screen-capture-source-type';
    typeBadge.textContent = _scLocaliseType(src.type);
    item.appendChild(typeBadge);

    var selBtn = document.createElement('button');
    selBtn.className = 'adv-btn adv-btn-secondary screen-capture-select-btn';
    selBtn.textContent = (typeof t === 'function') ? t('select') : 'Select';
    selBtn.addEventListener('click', function () { selectScreenSource(src.id); });
    item.appendChild(selBtn);

    grid.appendChild(item);
  });
  card.appendChild(grid);
  return card;
}

function _scLocaliseType(type) {
  if (typeof t !== 'function') return type || '';
  if (type === 'screen') return t('sourceScreen');
  if (type === 'window') return t('sourceWindow');
  return type || '';
}

// =====================================================================
// Preview card
// =====================================================================

function renderScreenPreview() {
  var card = document.createElement('div'); card.className = 'adv-card screen-capture-preview-card';
  var title = document.createElement('div'); title.className = 'adv-card-title';
  title.textContent = (typeof t === 'function') ? t('screenPreview') : 'Screen preview';
  card.appendChild(title);

  var state = (typeof getState === 'function') ? getState() : { screenCapture: { preview: null } };
  var preview = state.screenCapture ? state.screenCapture.preview : null;

  if (!preview) {
    var empty = document.createElement('div'); empty.className = 'adv-log-empty screen-capture-empty';
    empty.textContent = (typeof t === 'function') ? t('noPreview') : 'No preview yet.';
    card.appendChild(empty);
    return card;
  }

  // Step 26 — preview is wrapped in a positioning container so the
  // region-selector overlay can stack on top with the SAME bounds
  // as the displayed image. Both the wrapper and the overlay sit
  // INSIDE the existing preview card, so all of the screen-capture
  // styles still apply.
  var wrapper = document.createElement('div');
  wrapper.className = 'screen-preview-wrapper';
  wrapper.id = 'screen-preview-wrapper';

  // Image — DataURL came from the safe IPC; goes only to img.src.
  var img = document.createElement('img');
  img.className = 'screen-capture-preview-image';
  img.id = 'screen-preview-image';
  img.alt = '';
  img.src = preview.imageDataUrl || '';
  // Prevent native drag-image (which would otherwise hijack the
  // mouse-down gesture before our overlay sees it).
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });
  wrapper.appendChild(img);

  card.appendChild(wrapper);

  // Bind the region-selector overlay AFTER the wrapper is in the
  // DOM so getBoundingClientRect() returns sensible numbers. The
  // overlay module is renderer-only, draws an absolutely-positioned
  // div, and never inserts pixel data anywhere.
  if (typeof attachRegionOverlay === 'function') {
    // Wait one frame so the image has its rendered size.
    setTimeout(function () { attachRegionOverlay(wrapper, img); }, 0);
  }

  // Metadata rows (textContent only).
  var meta = document.createElement('div'); meta.className = 'screen-capture-preview-meta';
  _scAddCardRow(meta, (typeof t === 'function') ? t('scenarioName') : 'Name', preview.name || '');
  _scAddCardRow(meta, (typeof t === 'function') ? t('sourceType') : 'Type', _scLocaliseType(preview.type));
  _scAddCardRow(meta, 'id', preview.sourceId || '');
  if (preview.width || preview.height) {
    _scAddCardRow(meta, (typeof t === 'function') ? t('coordinates') : 'Size',
      (preview.width || 0) + ' × ' + (preview.height || 0));
  }
  _scAddCardRow(meta, (typeof t === 'function') ? t('capturedAt') : 'Captured at',
    preview.capturedAt || ((typeof t === 'function') ? t('none2') : '—'));
  card.appendChild(meta);

  // "Preview only" reminder.
  var note = document.createElement('div'); note.className = 'screen-capture-preview-note';
  note.textContent = ((typeof t === 'function') ? t('previewOnly') : 'Preview only') + ' · ' +
                     ((typeof t === 'function') ? t('previewNotSaved') : 'Not saved to disk');
  card.appendChild(note);

  return card;
}

// =====================================================================
// Actions
// =====================================================================

async function refreshScreenSources() {
  _scAudit('screen.capture.sources.requested', {});
  if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(true);
  if (typeof setScreenCaptureError === 'function') setScreenCaptureError(null);
  renderScreenCapture();

  if (typeof listScreenSources !== 'function') {
    if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(false);
    if (typeof setScreenCaptureError === 'function') setScreenCaptureError('screen-capture-client unavailable');
    _scAudit('screen.capture.error', { reason: 'client unavailable' });
    renderScreenCapture();
    return;
  }

  var resp = await listScreenSources();
  if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(false);
  if (resp && resp.success) {
    if (typeof setScreenCaptureSources === 'function') setScreenCaptureSources(resp.sources || []);
    if (typeof setScreenCaptureError === 'function') setScreenCaptureError(null);
    // Drop selection that no longer exists.
    var stillExists = (resp.sources || []).some(function (s) {
      return s && s.id && getState().screenCapture.selectedSourceId === s.id;
    });
    if (!stillExists && typeof setSelectedScreenSource === 'function') {
      setSelectedScreenSource(null);
    }
    _scAudit('screen.capture.sources.loaded', { count: (resp.sources || []).length });
    _scLog('info', ((typeof t === 'function') ? t('screenSources') : 'Sources') + ': ' + (resp.sources || []).length);
  } else {
    var msg = (resp && resp.error) ? resp.error :
      ((typeof t === 'function') ? t('sourcesLoadFailed') : 'Failed to list screen sources');
    if (typeof setScreenCaptureSources === 'function') setScreenCaptureSources([]);
    if (typeof setScreenCaptureError === 'function') setScreenCaptureError(msg);
    _scAudit('screen.capture.error', { stage: 'list-sources', reason: msg });
    _scLog('error', msg);
  }
  renderScreenCapture();
}

function selectScreenSource(sourceId) {
  if (typeof sourceId !== 'string' || sourceId.length === 0) return;
  var state = (typeof getState === 'function') ? getState() : { screenCapture: { sources: [] } };
  var match = (state.screenCapture.sources || []).find(function (s) { return s && s.id === sourceId; });
  if (!match) return;
  if (typeof validateScreenSource === 'function' && !validateScreenSource(match)) return;
  if (typeof setSelectedScreenSource === 'function') setSelectedScreenSource(sourceId);
  renderScreenCapture();
}

async function captureSelectedScreenPreview() {
  var state = (typeof getState === 'function') ? getState() : { screenCapture: { selectedSourceId: null } };
  var sourceId = state.screenCapture.selectedSourceId;
  if (!sourceId) {
    _scAudit('screen.capture.error', { stage: 'capture-preview', reason: 'no source selected' });
    _scLog('warning', (typeof t === 'function') ? t('noSelectedSource') : 'No source selected');
    return;
  }
  _scAudit('screen.capture.preview.requested', { sourceType: _sourceTypeFromId(sourceId) });
  if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(true);
  if (typeof setScreenCaptureError === 'function') setScreenCaptureError(null);
  renderScreenCapture();

  if (typeof captureScreenPreview !== 'function') {
    if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(false);
    if (typeof setScreenCaptureError === 'function') setScreenCaptureError('screen-capture-client unavailable');
    _scAudit('screen.capture.error', { reason: 'client unavailable' });
    renderScreenCapture();
    return;
  }

  var resp = await captureScreenPreview(sourceId);
  if (typeof setScreenCaptureLoading === 'function') setScreenCaptureLoading(false);
  if (resp && resp.success && resp.preview) {
    if (typeof setScreenCapturePreview === 'function') setScreenCapturePreview(resp.preview);
    if (typeof setLastScreenCapturePreview === 'function') setLastScreenCapturePreview(resp.preview);
    _scAudit('screen.capture.preview.created', {
      sourceType: resp.preview.type || _sourceTypeFromId(sourceId),
      width: resp.preview.width || 0,
      height: resp.preview.height || 0
    });
    _scLog('success', ((typeof t === 'function') ? t('screenPreview') : 'Preview') + ': ' + (resp.preview.name || ''));
  } else {
    var msg = (resp && resp.error) ? resp.error :
      ((typeof t === 'function') ? t('captureFailed') : 'Failed to capture screen preview');
    if (typeof setScreenCaptureError === 'function') setScreenCaptureError(msg);
    _scAudit('screen.capture.error', { stage: 'capture-preview', reason: msg });
    _scLog('error', msg);
  }
  renderScreenCapture();
}

function clearScreenPreview() {
  // This single call clears both the renderer-only cache (defined in
  // screen-capture-client.js, which loads after app-state.js and
  // therefore wins the global) and the app-state.screenCapture.preview
  // slice. See the note in screen-capture-client.js.
  if (typeof clearScreenCapturePreview === 'function') {
    try { clearScreenCapturePreview(); } catch (e) {}
  }
  // Step 26 — clearing the preview also drops any region drawn on
  // top of it, since preview-space coordinates are no longer valid
  // without an image. We do NOT clear scenarios that already have
  // a region stored in `settings.region`.
  if (typeof resetRegionSelectorState === 'function') {
    try { resetRegionSelectorState(); } catch (e) {}
  }
  _scAudit('screen.capture.preview.cleared', {});
  _scLog('info', (typeof t === 'function') ? t('clearPreview') : 'Preview cleared');
  renderScreenCapture();
}

function _sourceTypeFromId(id) {
  if (typeof id !== 'string') return 'unknown';
  if (id.indexOf('screen:') === 0) return 'screen';
  if (id.indexOf('window:') === 0) return 'window';
  return 'unknown';
}
