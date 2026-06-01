// =====================================================================
// ClickFlow — src/smart-beta-health.js (Step 42)
// ---------------------------------------------------------------------
// Pure-renderer module that builds the Smart-Beta-status snapshot
// surfaced by the Step-42 diagnostics line and the Step-42 QA docs.
//
// `getSmartBetaHealth()` consolidates every smart-features readiness
// boolean into a single compact shape. The function never runs OCR,
// never moves the cursor, never opens a new IPC channel. It only
// READS the renderer's slices and the OCR-provider modules.
//
// SAFETY (Step 42):
//   - Pure renderer code. No `electron`, no `ipcRenderer`, no `fs`.
//   - No prohibited imports (no tesseract / opencv / robotjs / …).
//   - The readiness booleans are derived from existing module APIs
//     (`getOcrFeatureStatus`, `getActiveOcrProvider`,
//     `getOcrProviderRegistryStatus`, `getTesseractProviderDiagnostics`,
//     `getScenarioPresets`, `getVisualBuilderDiagnostics`, the
//     renderer state). They are advisory; they DO NOT enable real
//     OCR or real clicks.
//
// Public surface:
//   - getSmartBetaHealth()
//   - getSmartBetaHealthDiagnostics()
//   - countSmartBetaReleaseBlockers()
// =====================================================================

'use strict';

function getSmartBetaHealth() {
  var state = (typeof getState === 'function') ? _safeCall(getState, null) : null;

  var screenCaptureReady =
    (typeof refreshScreenSources === 'function' || typeof captureScreenPreview === 'function') &&
    !!(state && state.screenCapture);

  var regionSelectorReady =
    (typeof renderRegionSelectorUi === 'function' || typeof setRegionSelectorRegion === 'function') &&
    !!(state && state.regionSelector);

  var templatesReady =
    (typeof getTemplates === 'function' && typeof renderTemplatesTab === 'function') &&
    !!(state && state.templates);

  var templateMatchingReady =
    (typeof renderTemplateMatchingTab === 'function') ||
    (typeof runTemplateMatchingMock === 'function');

  var imageClickReady =
    (typeof validateImageClickScenario === 'function') &&
    (typeof runImageClickScenario === 'function');

  var ocrMockReady =
    (typeof runMockOcr === 'function') &&
    (typeof createOcrInput === 'function');

  var tesseractProviderReady =
    (typeof recognizeTextWithTesseract === 'function') &&
    (typeof getTesseractProviderInfo === 'function') &&
    (typeof setRuntimeFeatureFlag === 'function');

  var textClickReady =
    (typeof validateTextClickScenario === 'function') &&
    (typeof runTextClickScenario === 'function');

  var visualBuilderReady =
    (typeof renderVisualBuilderTab === 'function') &&
    (typeof getVisualBuilderState === 'function');

  var presetsReady =
    (typeof getScenarioPresets === 'function') &&
    (typeof createScenarioDraftFromPreset === 'function');

  return {
    screenCaptureReady:     !!screenCaptureReady,
    regionSelectorReady:    !!regionSelectorReady,
    templatesReady:         !!templatesReady,
    templateMatchingReady:  !!templateMatchingReady,
    imageClickReady:        !!imageClickReady,
    ocrMockReady:           !!ocrMockReady,
    tesseractProviderReady: !!tesseractProviderReady,
    textClickReady:         !!textClickReady,
    visualBuilderReady:     !!visualBuilderReady,
    presetsReady:           !!presetsReady,
    realClicksEnabled:      false,
    releaseBlockersCount:   countSmartBetaReleaseBlockers()
  };
}

// Helper used by the diagnostics line + the Smart-Beta QA report.
// Counts "smart-features readiness booleans currently false". A
// production build with every module loaded should report `0`.
// Visible-but-non-blocking signals (e.g. `realClicksEnabled` is
// hard-coded false) do NOT count as blockers.
function countSmartBetaReleaseBlockers() {
  var blockers = 0;
  if (!(typeof refreshScreenSources === 'function' || typeof captureScreenPreview === 'function')) blockers++;
  if (!(typeof renderRegionSelectorUi === 'function' || typeof setRegionSelectorRegion === 'function')) blockers++;
  if (!(typeof getTemplates === 'function' && typeof renderTemplatesTab === 'function')) blockers++;
  if (!(typeof renderTemplateMatchingTab === 'function' || typeof runTemplateMatchingMock === 'function')) blockers++;
  if (!(typeof validateImageClickScenario === 'function' && typeof runImageClickScenario === 'function')) blockers++;
  if (!(typeof runMockOcr === 'function' && typeof createOcrInput === 'function')) blockers++;
  if (!(typeof recognizeTextWithTesseract === 'function' && typeof getTesseractProviderInfo === 'function' && typeof setRuntimeFeatureFlag === 'function')) blockers++;
  if (!(typeof validateTextClickScenario === 'function' && typeof runTextClickScenario === 'function')) blockers++;
  if (!(typeof renderVisualBuilderTab === 'function' && typeof getVisualBuilderState === 'function')) blockers++;
  if (!(typeof getScenarioPresets === 'function' && typeof createScenarioDraftFromPreset === 'function')) blockers++;
  return blockers;
}

// `getSmartBetaHealthDiagnostics()` — alias, exposed for
// symmetry with `getOcr*Diagnostics()` etc.
function getSmartBetaHealthDiagnostics() {
  return getSmartBetaHealth();
}

function _safeCall(fn, fallback) {
  try { return fn(); } catch (e) { return fallback; }
}
