// =====================================================================
// ClickFlow — audit-events.js (Step 17)
// ---------------------------------------------------------------------
// In-memory audit event model. NO file persistence on this step.
// File-based audit logs are designed in docs/AUDIT_LOG_PLAN.md and
// will land only after the docs/REAL_ACTIONS_GO_NO_GO.md gate is met.
//
// All recorded events are SAFE BY CONSTRUCTION:
//   - no PII;
//   - no filesystem paths;
//   - no machine identifiers;
//   - only event types from the fixed allowlist below.
// =====================================================================

// Stable, frozen allowlist of event types.
var AUDIT_EVENT_TYPES = Object.freeze({
  ScenarioStartRequested:  'scenario.start.requested',
  ScenarioStartApproved:   'scenario.start.approved',
  ScenarioStopRequested:   'scenario.stop.requested',
  ScenarioCompleted:       'scenario.completed',
  EmergencyStop:           'emergency.stop',
  ActionSimulated:         'action.simulated',
  ActionRealBlocked:       'action.real.blocked',
  SafetyValidationFailed:  'safety.validation.failed',
  SettingsChanged:         'settings.changed',
  ImportCompleted:         'import.completed',
  ExportCompleted:         'export.completed',
  // Step 18: adapter lifecycle events
  AdapterSelfTestStarted:   'adapter.selftest.started',
  AdapterSelfTestCompleted: 'adapter.selftest.completed',
  AdapterSelfTestFailed:    'adapter.selftest.failed',
  AdapterSelectionBlocked:  'adapter.selection.blocked',
  AdapterMockExecuted:      'adapter.mock.executed',
  AdapterRealUnavailable:   'adapter.real.unavailable',
  // Step 19: real-action sandbox / dry-run events
  RealSandboxPreviewCreated:        'real.sandbox.preview.created',
  RealSandboxDryRunConfirmed:       'real.sandbox.dryrun.confirmed',
  RealSandboxDryRunCancelled:       'real.sandbox.dryrun.cancelled',
  RealSandboxBlocked:               'real.sandbox.blocked',
  RealPermissionChecklistCreated:   'real.permission.checklist.created',
  RealBlockedReasonGenerated:       'real.blocked.reason.generated',
  // Step 25: screen capture foundation events.
  // No events here ever carry a screenshot or imageDataUrl.
  ScreenCaptureSourcesRequested:    'screen.capture.sources.requested',
  ScreenCaptureSourcesLoaded:       'screen.capture.sources.loaded',
  ScreenCapturePreviewRequested:    'screen.capture.preview.requested',
  ScreenCapturePreviewCreated:      'screen.capture.preview.created',
  ScreenCapturePreviewCleared:      'screen.capture.preview.cleared',
  ScreenCaptureError:               'screen.capture.error',
  // Step 26: region selector foundation events.
  // Payloads carry only numeric rectangle metadata
  // (x/y/width/height) and the target scenario id — never an
  // imageDataUrl, never a screenshot, never PII. The events
  // describe the user's mouse gesture, not any pixel content.
  RegionSelectionStarted:           'region.selection.started',
  RegionSelectionUpdated:           'region.selection.updated',
  RegionSelectionCompleted:         'region.selection.completed',
  RegionSelectionCleared:           'region.selection.cleared',
  RegionAttachedToScenario:         'region.attached.toScenario',
  RegionValidationFailed:           'region.validation.failed',
  // Step 27: template asset manager events.
  // Payloads carry only short metadata (id, name, mime, size) — never
  // the raw image bytes, base64, dataURL, or filesystem paths.
  TemplateImportRequested:          'template.import.requested',
  TemplateImportCompleted:          'template.import.completed',
  TemplateImportCancelled:          'template.import.cancelled',
  TemplateImportFailed:             'template.import.failed',
  TemplateMetadataUpdated:          'template.metadata.updated',
  TemplateSelected:                 'template.selected',
  TemplateDeleted:                  'template.deleted',
  TemplateReset:                    'template.reset',
  // Step 28: template matching mock / dry-run events.
  // Payloads carry only ids, numeric metadata (confidence, target
  // point, bounding box dimensions) and short reasons — never an
  // imageDataUrl, never a thumbnail, never a screenshot.
  TemplateMatchMockRequested:       'template.match.mock.requested',
  TemplateMatchMockCompleted:       'template.match.mock.completed',
  TemplateMatchMockFailed:          'template.match.mock.failed',
  TemplateMatchMockCleared:         'template.match.mock.cleared',
  ImageClickPreviewCreated:         'image.click.preview.created',
  // Step 29: real preview-only matching engine events. Payloads
  // carry only ids, numeric metadata (confidence, target point,
  // bounding box dimensions, durationMs, threshold, step) and
  // short reasons — never an imageDataUrl, never a thumbnail,
  // never a screenshot. The "real preview" name describes that
  // the engine analyses the captured preview image, NOT the live
  // screen. No real cursor movement, no real click.
  TemplateMatchRealPreviewRequested: 'template.match.realPreview.requested',
  TemplateMatchRealPreviewCompleted: 'template.match.realPreview.completed',
  TemplateMatchRealPreviewFailed:    'template.match.realPreview.failed',
  TemplateMatchLowConfidence:        'template.match.lowConfidence',
  TemplateMatchEngineWarning:        'template.match.engine.warning',
  // Step 30: image_click scenario type. Payloads carry only ids,
  // numeric metadata (confidence, target X / Y, durationMs,
  // threshold, step), and short reasons — never an imageDataUrl,
  // never a thumbnail, never a screenshot. The "simulated" /
  // "realBlocked" pair mirrors the Step 17 `action.simulated` /
  // `action.real.blocked` events.
  ScenarioImageClickStarted:        'scenario.imageClick.started',
  ScenarioImageClickStopped:        'scenario.imageClick.stopped',
  ScenarioImageClickMatchStarted:   'scenario.imageClick.match.started',
  ScenarioImageClickMatchCompleted: 'scenario.imageClick.match.completed',
  ScenarioImageClickNoMatch:        'scenario.imageClick.noMatch',
  ScenarioImageClickSimulated:      'scenario.imageClick.simulated',
  ScenarioImageClickFailed:         'scenario.imageClick.failed',
  ActionImageClickSimulated:        'action.imageClick.simulated',
  ActionImageClickRealBlocked:      'action.imageClick.realBlocked',
  // Step 31: image_click Test Match (UX polish + visual test tools).
  // Test Match runs the template matcher against the captured
  // preview to debug a draft scenario BEFORE saving / running it.
  // Payloads carry only ids and numeric metadata (confidence,
  // target X / Y, durationMs, threshold, step, errorsCount,
  // warningsCount, hasRegion: bool) — never an imageDataUrl,
  // never a thumbnail, never a screenshot. Test Match never
  // executes the scenario and never moves the cursor.
  ImageClickTestStarted:            'imageClick.test.started',
  ImageClickTestCompleted:          'imageClick.test.completed',
  ImageClickTestFailed:             'imageClick.test.failed',
  ImageClickTestLowConfidence:      'imageClick.test.lowConfidence',
  ImageClickTestCleared:            'imageClick.test.cleared',
  // Step 32: OCR Foundation (mock only). Mock OCR fabricates
  // recognised-text blocks from the captured preview metadata so
  // the user can shape a future text_click action. NO real OCR
  // engine is connected: no Tesseract, no tesseract.js, no native
  // OCR. Payloads carry only short metadata (matchMode, language,
  // hasRegion: bool, blocksCount, durationMs, target text length —
  // never the full target text, never an imageDataUrl, never PII).
  // The accompanying `text.click.preview.created` event records
  // the action preview the engine builds; that preview is plain
  // data (`type: "text_click"`, `mode: "preview"`,
  // `realClick: false`, `realOcr: false`) and is NEVER consumed
  // by the click engine, the action pipeline, the mock adapter,
  // or the dry-run sandbox at Step 32.
  OcrMockRequested:                 'ocr.mock.requested',
  OcrMockCompleted:                 'ocr.mock.completed',
  OcrMockFailed:                    'ocr.mock.failed',
  OcrMockCleared:                   'ocr.mock.cleared',
  TextClickPreviewCreated:          'text.click.preview.created',
  // Step 33: text_click scenario type. Payloads carry only ids,
  // numeric metadata (confidence, target X / Y, durationMs),
  // small enums (language, matchMode), and short reasons.
  // Payloads NEVER carry the full target text — only `textLen`.
  // Payloads NEVER carry an `imageDataUrl`, a thumbnail, or a
  // screenshot. The "simulated" / "realBlocked" pair mirrors the
  // image_click events.
  ScenarioTextClickStarted:          'scenario.textClick.started',
  ScenarioTextClickOcrStarted:       'scenario.textClick.ocr.started',
  ScenarioTextClickOcrCompleted:     'scenario.textClick.ocr.completed',
  ScenarioTextClickTextFound:        'scenario.textClick.textFound',
  ScenarioTextClickNoTextFound:      'scenario.textClick.noTextFound',
  ScenarioTextClickSimulated:        'scenario.textClick.simulated',
  ScenarioTextClickFailed:           'scenario.textClick.failed',
  ActionTextClickSimulated:          'action.textClick.simulated',
  ActionTextClickRealBlocked:        'action.textClick.realBlocked'
});var KNOWN_TYPES = Object.freeze(
  Object.keys(AUDIT_EVENT_TYPES).map(function (k) { return AUDIT_EVENT_TYPES[k]; })
);

// In-memory ring of recent events. Capped to keep memory bounded.
var AUDIT_MAX_EVENTS = 500;
var auditEvents = [];
var auditCounter = 0;

function _now() {
  return new Date().toISOString();
}

// Build a normalized audit event. Unknown types are accepted but tagged.
function createAuditEvent(type, payload) {
  auditCounter++;
  var safeType = (typeof type === 'string') ? type : 'unknown';
  var known = KNOWN_TYPES.indexOf(safeType) !== -1;
  return {
    id: 'evt-' + auditCounter,
    type: safeType,
    known: known,
    timestamp: _now(),
    payload: (payload && typeof payload === 'object') ? payload : {}
  };
}

// Append an event. Always succeeds; rolls over the oldest if at cap.
function addAuditEvent(event) {
  if (!event || typeof event !== 'object' || typeof event.type !== 'string') {
    return null;
  }
  auditEvents.push(event);
  if (auditEvents.length > AUDIT_MAX_EVENTS) {
    auditEvents.splice(0, auditEvents.length - AUDIT_MAX_EVENTS);
  }
  return event;
}

// Convenience: build + append in one call.
function recordAuditEvent(type, payload) {
  var ev = createAuditEvent(type, payload);
  addAuditEvent(ev);
  return ev;
}

// Defensive copy.
function getAuditEvents() {
  return auditEvents.slice();
}

function clearAuditEvents() {
  auditEvents = [];
  return { cleared: true };
}

// Compact summary for diagnostics / dashboard.
function getAuditSummary() {
  var byType = {};
  for (var i = 0; i < auditEvents.length; i++) {
    var t = auditEvents[i].type;
    byType[t] = (byType[t] || 0) + 1;
  }
  var last = auditEvents.length > 0 ? auditEvents[auditEvents.length - 1] : null;
  return {
    count: auditEvents.length,
    capacity: AUDIT_MAX_EVENTS,
    byType: byType,
    last: last
        ? { type: last.type, timestamp: last.timestamp }
        : null
  };
}
