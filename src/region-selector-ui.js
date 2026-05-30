// =====================================================================
// ClickFlow — src/region-selector-ui.js (Step 26)
// ---------------------------------------------------------------------
// Renderer UI for the rectangular region selector that sits on top
// of the screenshot preview built by screen-capture-ui.js.
//
// Hard guarantees in this file:
//   - all user-visible text is rendered with textContent — never
//     unsafe innerHTML;
//   - innerHTML is only used as `= ''` to clear a container;
//   - the module never imports Node, never imports `ipcRenderer`,
//     and never touches the file system;
//   - pure region maths live in src/region-selector.js — this file
//     only orchestrates DOM events, app-state mutations, and audit
//     events;
//   - the region selector NEVER triggers a real click, NEVER runs
//     OCR, NEVER runs image matching. Step 26 is a coordinate
//     primitive only.
// =====================================================================

// --- Audit / log helpers (no-ops if upstream modules are missing) ----
function _rsAudit(type, payload) {
  if (typeof recordAuditEvent === 'function') {
    try { recordAuditEvent(type, payload || {}); } catch (e) {}
  }
}
function _rsLog(type, message) {
  if (typeof addLogEntry === 'function' && typeof createLog === 'function') {
    try { addLogEntry(createLog(type, message)); } catch (e) {}
  }
}
function _rsT(key, fallback) {
  if (typeof t === 'function') {
    try { return t(key); } catch (e) {}
  }
  return fallback;
}
function _rsAddCardRow(card, label, value) {
  var row = document.createElement('div'); row.className = 'adv-card-row';
  var lbl = document.createElement('span'); lbl.className = 'adv-card-label'; lbl.textContent = label;
  var val = document.createElement('span'); val.className = 'adv-card-value'; val.textContent = value;
  row.appendChild(lbl); row.appendChild(val); card.appendChild(row);
}

// =====================================================================
// Module-private state. Holds DOM references to the active overlay
// and the in-progress drag. We never store pixel data here.
// =====================================================================
var _rsState = {
  wrapperEl:   null, // .screen-preview-wrapper
  imgEl:       null, // <img> showing the preview
  overlayEl:   null, // .region-overlay
  selectionEl: null, // .region-selection
  badgeEl:     null, // .region-coordinate-badge
  // Drag bookkeeping (preview-space CSS pixels):
  dragging: false,
  startX:   0,
  startY:   0,
  // Bound handlers we can detach symmetrically:
  bound: { mousemove: null, mouseup: null, mousedown: null }
};

// =====================================================================
// Bootstrap (idempotent, safe to call multiple times).
// =====================================================================
function initRegionSelectorUi() {
  // No global listeners are attached at init time — they are bound
  // only while a drag is in progress. Anything left over from a
  // previous tab render is dropped here.
  _detachOverlayListeners();
  _rsState.wrapperEl = null;
  _rsState.imgEl = null;
  _rsState.overlayEl = null;
  _rsState.selectionEl = null;
  _rsState.badgeEl = null;
  _rsState.dragging = false;
}

// Bind the overlay to a freshly rendered preview wrapper. Called
// from screen-capture-ui.js after each renderScreenPreview().
function attachRegionOverlay(wrapperEl, imgEl) {
  if (!wrapperEl || !imgEl) return;
  _detachOverlayListeners();

  _rsState.wrapperEl = wrapperEl;
  _rsState.imgEl = imgEl;

  // Build the overlay only if it does not exist already.
  var overlay = wrapperEl.querySelector('.region-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'region-overlay';
    overlay.id = 'region-overlay';
    var sel = document.createElement('div');
    sel.className = 'region-selection';
    sel.id = 'region-selection';
    overlay.appendChild(sel);
    var badge = document.createElement('div');
    badge.className = 'region-coordinate-badge';
    badge.id = 'region-coordinate-badge';
    overlay.appendChild(badge);
    wrapperEl.appendChild(overlay);
  }
  _rsState.overlayEl   = overlay;
  _rsState.selectionEl = overlay.querySelector('.region-selection');
  _rsState.badgeEl     = overlay.querySelector('.region-coordinate-badge');

  // Mousedown is bound to the overlay; mousemove / mouseup bind
  // lazily when a drag actually starts (so we never leak global
  // listeners).
  _rsState.bound.mousedown = handleRegionMouseDown;
  _rsState.overlayEl.addEventListener('mousedown', _rsState.bound.mousedown);

  // Reflect the current state (selection enabled? region present?).
  _applyOverlayMode();
  renderRegionSelection();

  // Refresh image-space size whenever the overlay binds; the image
  // may have just been (re-)loaded.
  if (_rsState.imgEl.complete) {
    _captureImageOriginalSize();
  } else {
    _rsState.imgEl.addEventListener('load', _captureImageOriginalSize, { once: true });
  }
}

// Drop every listener wired by attachRegionOverlay. Called on tab
// teardown and at the start of each fresh attach.
function _detachOverlayListeners() {
  if (_rsState.overlayEl && _rsState.bound.mousedown) {
    _rsState.overlayEl.removeEventListener('mousedown', _rsState.bound.mousedown);
  }
  if (_rsState.bound.mousemove) {
    document.removeEventListener('mousemove', _rsState.bound.mousemove);
  }
  if (_rsState.bound.mouseup) {
    document.removeEventListener('mouseup', _rsState.bound.mouseup);
  }
  _rsState.bound.mousemove = null;
  _rsState.bound.mouseup = null;
  _rsState.bound.mousedown = null;
  _rsState.dragging = false;
}

// =====================================================================
// Mode toggle (selection enabled / disabled).
// =====================================================================
function enableRegionSelection() {
  if (typeof setRegionSelecting === 'function') setRegionSelecting(true);
  _rsAudit('region.selection.started', {});
  _applyOverlayMode();
  if (typeof renderScreenCapture === 'function') renderScreenCapture();
  else renderRegionInfo();
}

function disableRegionSelection() {
  if (typeof setRegionSelecting === 'function') setRegionSelecting(false);
  _applyOverlayMode();
  if (typeof renderScreenCapture === 'function') renderScreenCapture();
  else renderRegionInfo();
}

function _applyOverlayMode() {
  if (!_rsState.overlayEl) return;
  var st = (typeof getState === 'function') ? getState() : { regionSelector: { isSelecting: false } };
  var enabled = !!(st.regionSelector && st.regionSelector.isSelecting);
  _rsState.overlayEl.classList.toggle('region-overlay-enabled', enabled);
  _rsState.overlayEl.classList.toggle('region-overlay-disabled', !enabled);
}

// =====================================================================
// Pointer / size helpers.
// =====================================================================

// Displayed (CSS-pixel) size of the preview image. Falls back to
// the wrapper rect if the image isn't laid out yet.
function getPreviewElementSize() {
  var img = _rsState.imgEl;
  if (!img) return null;
  var rect = img.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;
  return { width: Math.round(rect.width), height: Math.round(rect.height) };
}

// Original screenshot dimensions. Comes from the IPC payload (via
// app-state.screenCapture.preview) when present, then falls back to
// the <img>'s naturalWidth/naturalHeight.
function getImageOriginalSize() {
  var st = (typeof getState === 'function') ? getState() : { screenCapture: { preview: null } };
  var preview = st.screenCapture ? st.screenCapture.preview : null;
  if (preview && Number(preview.width) > 0 && Number(preview.height) > 0) {
    return { width: Math.round(Number(preview.width)), height: Math.round(Number(preview.height)) };
  }
  if (_rsState.imgEl &&
      _rsState.imgEl.naturalWidth > 0 &&
      _rsState.imgEl.naturalHeight > 0) {
    return {
      width:  _rsState.imgEl.naturalWidth,
      height: _rsState.imgEl.naturalHeight
    };
  }
  return null;
}

// Pointer position relative to the preview image's top-left, in
// CSS pixels. Always clamped to [0, previewSize-1].
function getPointerPositionInPreview(event) {
  if (!_rsState.imgEl || !event) return { x: 0, y: 0 };
  var rect = _rsState.imgEl.getBoundingClientRect();
  var x = (event.clientX || 0) - rect.left;
  var y = (event.clientY || 0) - rect.top;
  if (x < 0) x = 0;
  if (y < 0) y = 0;
  if (rect.width  > 0 && x > rect.width  - 1) x = rect.width  - 1;
  if (rect.height > 0 && y > rect.height - 1) y = rect.height - 1;
  return { x: Math.round(x), y: Math.round(y) };
}

// Cache the preview / image sizes in app-state on first load. Done
// once per overlay attach so a future image-matching step can read
// them straight off `getState().regionSelector`.
function _captureImageOriginalSize() {
  var ps = getPreviewElementSize();
  var is = getImageOriginalSize();
  if (typeof setRegionPreviewSize === 'function') setRegionPreviewSize(ps);
  if (typeof setRegionImageSize === 'function') setRegionImageSize(is);
}

// =====================================================================
// Drag handlers.
// =====================================================================

function handleRegionMouseDown(event) {
  if (!_rsState.overlayEl) return;
  var st = (typeof getState === 'function') ? getState() : { regionSelector: { isSelecting: false } };
  if (!st.regionSelector || !st.regionSelector.isSelecting) return; // overlay is inert
  if (event.button !== undefined && event.button !== 0) return; // left only

  // We always re-capture sizes here (the image may have re-laid out).
  _captureImageOriginalSize();

  event.preventDefault();
  var p = getPointerPositionInPreview(event);
  _rsState.dragging = true;
  _rsState.startX = p.x;
  _rsState.startY = p.y;

  // Provisional rectangle (zero size) — gets updated on first move.
  var initial = (typeof createRegion === 'function')
    ? createRegion(p.x, p.y, p.x, p.y)
    : { x: p.x, y: p.y, width: 0, height: 0 };
  if (typeof setSelectedRegion === 'function') setSelectedRegion(initial);
  if (typeof setNormalizedRegion === 'function') setNormalizedRegion(null);

  // Bind the float listeners only for the duration of the drag.
  _rsState.bound.mousemove = handleRegionMouseMove;
  _rsState.bound.mouseup   = handleRegionMouseUp;
  document.addEventListener('mousemove', _rsState.bound.mousemove);
  document.addEventListener('mouseup',   _rsState.bound.mouseup);

  renderRegionSelection();
  renderRegionInfo();
}

function handleRegionMouseMove(event) {
  if (!_rsState.dragging) return;
  event.preventDefault();
  var p = getPointerPositionInPreview(event);
  var region = (typeof createRegion === 'function')
    ? createRegion(_rsState.startX, _rsState.startY, p.x, p.y)
    : {
        x: Math.min(_rsState.startX, p.x),
        y: Math.min(_rsState.startY, p.y),
        width:  Math.abs(p.x - _rsState.startX),
        height: Math.abs(p.y - _rsState.startY)
      };
  if (typeof setSelectedRegion === 'function') setSelectedRegion(region);

  // Throttled audit pulse — once per ~10 px of motion is plenty;
  // we report only count + size, never pixel data.
  if ((Math.abs(p.x - _rsState.startX) + Math.abs(p.y - _rsState.startY)) % 10 === 0) {
    _rsAudit('region.selection.updated', {
      width:  region.width,
      height: region.height
    });
  }

  renderRegionSelection();
  renderRegionInfo();
}

function handleRegionMouseUp(event) {
  if (!_rsState.dragging) return;
  event.preventDefault();

  // Detach the float listeners as early as possible.
  if (_rsState.bound.mousemove) document.removeEventListener('mousemove', _rsState.bound.mousemove);
  if (_rsState.bound.mouseup)   document.removeEventListener('mouseup',   _rsState.bound.mouseup);
  _rsState.bound.mousemove = null;
  _rsState.bound.mouseup = null;
  _rsState.dragging = false;

  // Final region. Validate; on failure, clear state and surface the
  // reason. We never throw and never emit a real action.
  var st = (typeof getState === 'function') ? getState() : { regionSelector: { selectedRegion: null } };
  var region = st.regionSelector ? st.regionSelector.selectedRegion : null;

  var v = (typeof validateRegion === 'function') ? validateRegion(region) : { valid: !!region, reason: null };
  if (!v.valid) {
    if (typeof setSelectedRegion === 'function') setSelectedRegion(null);
    if (typeof setNormalizedRegion === 'function') setNormalizedRegion(null);
    if (typeof setRegionError === 'function') setRegionError(v.reason || 'invalid region');
    _rsAudit('region.validation.failed', { reason: v.reason || 'unknown' });
    _rsLog('warning', _rsT('selectionTooSmall', 'Selection too small'));
  } else {
    if (typeof setRegionError === 'function') setRegionError(null);
    // Project to image-space and persist alongside the preview-space
    // rectangle. If projection fails (size missing) we keep the
    // preview-space rectangle and clear the normalised one.
    var ps = getPreviewElementSize();
    var is = getImageOriginalSize();
    if (typeof setRegionPreviewSize === 'function') setRegionPreviewSize(ps);
    if (typeof setRegionImageSize === 'function') setRegionImageSize(is);
    var normalized = null;
    if (typeof scaleRegionToImage === 'function') {
      normalized = scaleRegionToImage(region, ps, is);
    }
    if (typeof setNormalizedRegion === 'function') setNormalizedRegion(normalized);
    _rsAudit('region.selection.completed', {
      previewWidth:  region.width,
      previewHeight: region.height,
      imageWidth:    normalized ? normalized.width  : 0,
      imageHeight:   normalized ? normalized.height : 0
    });
    _rsLog('info', _rsT('regionSelectionCompleted', 'Region selection completed') +
      ': ' + ((typeof formatRegion === 'function') ? formatRegion(region) : ''));
  }

  renderRegionSelection();
  renderRegionInfo();
}

// =====================================================================
// Renderers — only update the parts that move (overlay rectangle,
// info card). The host (screen-capture-ui.js) calls them after each
// state change and from its own re-render path.
// =====================================================================

function renderRegionSelection() {
  if (!_rsState.selectionEl) return;
  var st = (typeof getState === 'function') ? getState() : { regionSelector: { selectedRegion: null } };
  var region = st.regionSelector ? st.regionSelector.selectedRegion : null;
  if (!region || region.width <= 0 || region.height <= 0) {
    _rsState.selectionEl.style.display = 'none';
    if (_rsState.badgeEl) _rsState.badgeEl.style.display = 'none';
    return;
  }
  _rsState.selectionEl.style.display = 'block';
  _rsState.selectionEl.style.left   = region.x + 'px';
  _rsState.selectionEl.style.top    = region.y + 'px';
  _rsState.selectionEl.style.width  = region.width  + 'px';
  _rsState.selectionEl.style.height = region.height + 'px';
  if (_rsState.badgeEl) {
    _rsState.badgeEl.style.display = 'block';
    _rsState.badgeEl.style.left = region.x + 'px';
    _rsState.badgeEl.style.top  = (region.y + region.height + 4) + 'px';
    _rsState.badgeEl.textContent =
      (typeof formatRegion === 'function') ? formatRegion(region) :
      (region.x + ',' + region.y + ' · ' + region.width + '×' + region.height);
  }
}

// Build (and re-build) the standalone "Region selector" card — the
// controls + the textual region info + the "what's attached"
// indicator. screen-capture-ui.js inserts this card after the
// preview card on every render.
function renderRegionSelectorCard() {
  var card = document.createElement('div');
  card.className = 'adv-card region-selector-card';

  var title = document.createElement('div');
  title.className = 'adv-card-title';
  title.textContent = _rsT('regionSelector', 'Region Selector');
  card.appendChild(title);

  var st = (typeof getState === 'function') ? getState() : {
    screenCapture: { preview: null },
    regionSelector: { selectedRegion: null, normalizedRegion: null, isSelecting: false, lastUpdatedAt: null, lastError: null },
    selectedScenarioId: null
  };
  var hasPreview = !!(st.screenCapture && st.screenCapture.preview);
  var rs = st.regionSelector || {};

  // Empty state when there is no preview yet.
  if (!hasPreview) {
    var empty = document.createElement('div');
    empty.className = 'adv-log-empty region-selector-empty';
    empty.textContent = _rsT('capturePreviewFirst', 'Capture a screenshot preview first.');
    card.appendChild(empty);
    return card;
  }

  // Buttons.
  var actions = document.createElement('div');
  actions.className = 'adv-btn-group region-selector-actions';

  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'adv-btn'; toggleBtn.id = 'rs-btn-toggle';
  toggleBtn.textContent = rs.isSelecting
    ? _rsT('disableRegionSelection', 'Disable region selection')
    : _rsT('enableRegionSelection',  'Enable region selection');
  toggleBtn.addEventListener('click', function () {
    if (rs.isSelecting) disableRegionSelection(); else enableRegionSelection();
  });
  actions.appendChild(toggleBtn);

  var clearBtn = document.createElement('button');
  clearBtn.className = 'adv-btn adv-btn-secondary'; clearBtn.id = 'rs-btn-clear';
  clearBtn.textContent = _rsT('clearRegion', 'Clear region');
  clearBtn.disabled = !rs.selectedRegion;
  clearBtn.addEventListener('click', clearRegionSelection);
  actions.appendChild(clearBtn);

  var saveBtn = document.createElement('button');
  saveBtn.className = 'adv-btn adv-btn-secondary'; saveBtn.id = 'rs-btn-save';
  saveBtn.textContent = _rsT('saveRegion', 'Save region');
  saveBtn.disabled = !rs.selectedRegion;
  saveBtn.addEventListener('click', saveRegionSelection);
  actions.appendChild(saveBtn);

  var attachBtn = document.createElement('button');
  attachBtn.className = 'adv-btn adv-btn-secondary'; attachBtn.id = 'rs-btn-attach';
  attachBtn.textContent = _rsT('attachRegionToScenario', 'Attach to active scenario');
  attachBtn.disabled = !rs.normalizedRegion || !st.selectedScenarioId;
  attachBtn.addEventListener('click', attachRegionToActiveScenario);
  actions.appendChild(attachBtn);
  card.appendChild(actions);

  // Info — preview-space rectangle.
  card.appendChild(_renderRegionInfoBlock(st));

  return card;
}

// Render the info block (used both inside the card and as a stand-
// alone helper for the diagnostics insert).
function _renderRegionInfoBlock(st) {
  var rs = st.regionSelector || {};
  var box = document.createElement('div'); box.className = 'region-info-block';

  // Selected region (preview pixels).
  var selTitle = document.createElement('div');
  selTitle.className = 'region-info-subtitle';
  selTitle.textContent = _rsT('selectedRegion', 'Selected region') + ' · ' +
                         _rsT('previewCoordinates', 'Preview coordinates');
  box.appendChild(selTitle);
  if (rs.selectedRegion) {
    _rsAddCardRow(box, 'x', String(rs.selectedRegion.x | 0));
    _rsAddCardRow(box, 'y', String(rs.selectedRegion.y | 0));
    _rsAddCardRow(box, 'width',  String(rs.selectedRegion.width  | 0));
    _rsAddCardRow(box, 'height', String(rs.selectedRegion.height | 0));
  } else {
    var noSel = document.createElement('div');
    noSel.className = 'adv-log-empty region-selector-empty';
    noSel.textContent = _rsT('noRegionSelected', 'No region selected');
    box.appendChild(noSel);
  }

  // Normalized region (image / screenshot pixels).
  var normTitle = document.createElement('div');
  normTitle.className = 'region-info-subtitle';
  normTitle.textContent = _rsT('normalizedRegion', 'Normalized region') + ' · ' +
                          _rsT('imageCoordinates', 'Screenshot coordinates');
  box.appendChild(normTitle);
  if (rs.normalizedRegion) {
    _rsAddCardRow(box, 'x', String(rs.normalizedRegion.x | 0));
    _rsAddCardRow(box, 'y', String(rs.normalizedRegion.y | 0));
    _rsAddCardRow(box, 'width',  String(rs.normalizedRegion.width  | 0));
    _rsAddCardRow(box, 'height', String(rs.normalizedRegion.height | 0));
  } else {
    var noNorm = document.createElement('div');
    noNorm.className = 'adv-log-empty region-selector-empty';
    noNorm.textContent = _rsT('noRegionSelected', 'No region selected');
    box.appendChild(noNorm);
  }

  // Area + last updated.
  var area = (typeof getRegionArea === 'function') ? getRegionArea(rs.selectedRegion) : 0;
  _rsAddCardRow(box, _rsT('regionArea', 'Area'), String(area));
  _rsAddCardRow(box, _rsT('capturedAt', 'Captured at'),
    rs.lastUpdatedAt || _rsT('none2', '—'));

  // Attached-to-scenario indicator (textual; renderer only).
  if (st.selectedScenarioId &&
      typeof getScenarioById === 'function' &&
      getScenarioById(st.selectedScenarioId)) {
    var sc = getScenarioById(st.selectedScenarioId);
    var attached = sc && sc.settings && sc.settings.region;
    _rsAddCardRow(box, _rsT('attachedToScenario', 'Attached to scenario'),
      attached
        ? (sc.name + ' (' +
           (sc.settings.region.width  | 0) + '×' +
           (sc.settings.region.height | 0) + ')')
        : _rsT('no', 'no'));
  }
  if (rs.lastError) {
    _rsAddCardRow(box, 'lastError', rs.lastError);
  }
  return box;
}

// Replace the live info block (no full re-render of the card) — fast
// enough for mousemove updates.
function renderRegionInfo() {
  // The info block is rebuilt inside the card by screen-capture-ui's
  // re-render. Here we look up the existing block by class and swap
  // its children for an updated build.
  var existing = document.querySelector('.region-info-block');
  if (!existing) return;
  var st = (typeof getState === 'function') ? getState() : { regionSelector: {} };
  var rebuilt = _renderRegionInfoBlock(st);
  existing.innerHTML = ''; // clear container only
  while (rebuilt.firstChild) existing.appendChild(rebuilt.firstChild);
}

// =====================================================================
// Action handlers.
// =====================================================================

function clearRegionSelection() {
  if (typeof clearSelectedRegion === 'function') clearSelectedRegion();
  _rsAudit('region.selection.cleared', {});
  _rsLog('info', _rsT('regionSelectionCleared', 'Region cleared'));
  renderRegionSelection();
  if (typeof renderScreenCapture === 'function') renderScreenCapture();
  else renderRegionInfo();
}

// Save = re-snapshot preview/image sizes and re-project, so the
// stored "normalized" rectangle is in sync with the current layout.
// We never write to disk on this step — "save" only commits the
// current geometry into app-state, ready for the user to attach it
// to a scenario.
function saveRegionSelection() {
  var st = (typeof getState === 'function') ? getState() : { regionSelector: { selectedRegion: null } };
  var region = st.regionSelector ? st.regionSelector.selectedRegion : null;
  if (!region) return;
  var v = (typeof validateRegion === 'function') ? validateRegion(region) : { valid: true, reason: null };
  if (!v.valid) {
    _rsAudit('region.validation.failed', { reason: v.reason || 'unknown', stage: 'save' });
    if (typeof setRegionError === 'function') setRegionError(v.reason || 'invalid region');
    _rsLog('warning', _rsT('regionValidationFailed', 'Region validation failed') +
      (v.reason ? (' — ' + v.reason) : ''));
    if (typeof renderScreenCapture === 'function') renderScreenCapture();
    return;
  }
  var ps = getPreviewElementSize();
  var is = getImageOriginalSize();
  if (typeof setRegionPreviewSize === 'function') setRegionPreviewSize(ps);
  if (typeof setRegionImageSize === 'function') setRegionImageSize(is);
  var normalized = (typeof scaleRegionToImage === 'function')
    ? scaleRegionToImage(region, ps, is)
    : null;
  if (typeof setNormalizedRegion === 'function') setNormalizedRegion(normalized);
  _rsAudit('region.selection.completed', {
    previewWidth:  region.width,
    previewHeight: region.height,
    imageWidth:    normalized ? normalized.width  : 0,
    imageHeight:   normalized ? normalized.height : 0,
    stage:         'save'
  });
  _rsLog('success', _rsT('regionSelectionCompleted', 'Region selection completed') +
    ': ' + ((typeof formatRegion === 'function') ? formatRegion(region) : ''));
  if (typeof renderScreenCapture === 'function') renderScreenCapture();
  else renderRegionInfo();
}

// Attach the normalized (image-space) rectangle to the active
// scenario. Goes through scenario-manager.updateScenarioRegion(),
// which never lets a region land on a scenario without
// validation, never overwrites unrelated fields, and stamps
// meta.updatedAt.
async function attachRegionToActiveScenario() {
  var st = (typeof getState === 'function') ? getState() : { regionSelector: {}, selectedScenarioId: null };
  var rs = st.regionSelector || {};
  var scenarioId = st.selectedScenarioId;
  var region = rs.normalizedRegion;
  if (!scenarioId) {
    _rsLog('warning', _rsT('noSelectedSource', 'No scenario selected'));
    return;
  }
  if (!region) {
    _rsLog('warning', _rsT('noRegionSelected', 'No region selected'));
    return;
  }
  if (typeof updateScenarioRegion !== 'function') {
    if (typeof setRegionError === 'function') setRegionError('scenario manager unavailable');
    return;
  }
  var resp = updateScenarioRegion(scenarioId, region);
  if (!resp || !resp.success) {
    var reason = (resp && resp.error) ? resp.error : 'attach failed';
    if (typeof setRegionError === 'function') setRegionError(reason);
    _rsAudit('region.validation.failed', { stage: 'attach', reason: reason });
    _rsLog('error', reason);
    if (typeof renderScreenCapture === 'function') renderScreenCapture();
    return;
  }
  // Persist scenarios — same path as every other scenario edit.
  if (typeof saveScenarios === 'function') {
    try { await saveScenarios(); } catch (e) {}
  }
  _rsAudit('region.attached.toScenario', {
    scenarioId: scenarioId,
    width:      region.width  | 0,
    height:     region.height | 0
  });
  _rsLog('success', _rsT('regionAttachedToScenario', 'Region attached to scenario'));
  if (typeof renderScreenCapture === 'function') renderScreenCapture();
}
