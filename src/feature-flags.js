// =====================================================================
// ClickFlow — feature-flags.js (Step 16, extended at Steps 38–39)
// ---------------------------------------------------------------------
// Hard-coded, frozen safe defaults for ClickFlow runtime.
//
// IMPORTANT
// - This file ONLY exposes safe defaults to the rest of the renderer.
// - There is NO UI in ClickFlow to enable `realDesktopActions`, `ocr`,
//   or `imageRecognition`. They are read-only false in this build.
// - Real desktop actions ship only after a separate safety review and
//   only after all items in docs/REAL_ACTIONS_GO_NO_GO.md are met.
// - See docs/FEATURE_FLAGS.md for the planned future flags layout.
// =====================================================================

// Safe defaults — these MUST NOT be toggled at runtime in 0.1.x.
const FEATURE_FLAGS = Object.freeze({
  // Hard-coded false until safety review is complete.
  realDesktopActions: false,
  ocr: false,
  imageRecognition: false,
  // Hard-coded true — ClickFlow 0.1.x is simulation-only.
  simulationOnly: true,
  // Capabilities that ARE shipped in 0.1.x.
  globalHotkeys: true,
  profiles: true,
  importExport: true,

  // Step 38 — Real OCR Research + Safe Integration Plan.
  // Step 39 — Real OCR Provider Integration Phase 1.
  //
  // The OCR provider registry exposes the architecture; Step 39 adds
  // the `tesseract.js` dependency declaration and a real OCR provider
  // shell (`src/tesseract-ocr-provider.js`). The real provider is
  // **disabled by default** and **never auto-runs**.
  //
  // - `realOcr` is the umbrella safety flag for "is real OCR allowed
  //   to run". Hard-coded false. Flipping it in source is required
  //   before any real OCR call site fires.
  // - `tesseractProvider` enables the registered Tesseract provider
  //   for selection. Hard-coded false. Even with the dependency
  //   installed, the registry refuses to switch the active provider
  //   unless this flag is true.
  // - `ocrProviderRegistry` enables the readiness UI / diagnostics
  //   surfaces. True so the user can see the architecture, but
  //   flipping it does not unlock any real OCR.
  // - `ocrMockProvider` confirms the mock provider is registered
  //   and available. Hard-coded true.
  //
  // Selection rule (registry):
  //   active provider may switch to `tesseract` only if BOTH
  //   `realOcr === true` AND `tesseractProvider === true`. Otherwise
  //   the selection is BLOCKED and the active provider stays `mock`.
  //
  // Auto-run rule (provider):
  //   `recognizeTextWithTesseract` always re-checks the flags and
  //   returns `{ blocked: true }` when either flag is false.
  realOcr: false,
  ocrProviderRegistry: true,
  ocrMockProvider: true,
  tesseractProvider: false
});

// =====================================================================
// Step 40 — runtime feature-flag overlay (session-scoped only).
// ---------------------------------------------------------------------
// Two flags can be flipped at runtime by an explicit user action so
// the OCR provider Phase 2 UI can enable real OCR for the current
// session without persisting anything to disk:
//   - `realOcr`            (umbrella safety flag for real OCR)
//   - `tesseractProvider`  (per-provider gate)
//
// Every other flag is **immutable** at runtime. The whitelist below
// enforces this. Trying to flip `realDesktopActions`,
// `simulationOnly`, `ocr`, `imageRecognition`, `globalHotkeys`,
// `profiles`, `importExport`, `ocrProviderRegistry`, or
// `ocrMockProvider` returns `{ ok: false, error: ... }`.
//
// Runtime flags live ONLY in this module's `_runtimeFlags` map.
// They are NOT written to settings, NOT written to localStorage,
// NOT written to disk. After a renderer reload the map is empty
// and `getFeatureFlags()` falls back to the frozen safe defaults.
//
// `getFeatureFlags()` returns a merged snapshot: base defaults
// overlaid with any runtime overrides. `isFeatureEnabled(flag)`
// consults the merged snapshot too.
// =====================================================================

var _RUNTIME_TOGGLABLE_FLAGS = ['realOcr', 'tesseractProvider'];
var _runtimeFlags = {};

// Returns `{ ok: true }` on success or
// `{ ok: false, error: stableId }` on failure.
function setRuntimeFeatureFlag(flag, value) {
  if (typeof flag !== 'string' || flag.length === 0) {
    return { ok: false, error: 'invalidFlag' };
  }
  if (_RUNTIME_TOGGLABLE_FLAGS.indexOf(flag) === -1) {
    return { ok: false, error: 'flagNotRuntimeTogglable' };
  }
  _runtimeFlags[flag] = !!value;
  return { ok: true, flag: flag, value: !!value };
}

// Returns a shallow copy of the runtime overlay (mutable but
// disconnected from module state).
function getRuntimeFeatureFlags() {
  return Object.assign({}, _runtimeFlags);
}

// Clear every runtime flag. Call this from the "Disable Real OCR"
// button so a single click reverts the session to safe defaults.
function resetRuntimeFeatureFlags() {
  var hadAny = Object.keys(_runtimeFlags).length > 0;
  _runtimeFlags = {};
  return { ok: true, cleared: hadAny };
}

// Returns the merged base + runtime snapshot. Defensive copy.
function getFeatureFlags() {
  var merged = Object.assign({}, FEATURE_FLAGS);
  for (var k in _runtimeFlags) {
    if (Object.prototype.hasOwnProperty.call(_runtimeFlags, k) &&
        _RUNTIME_TOGGLABLE_FLAGS.indexOf(k) !== -1) {
      merged[k] = _runtimeFlags[k] === true;
    }
  }
  return merged;
}

// Convenience helper. Unknown flag names return false.
// Consults the merged base + runtime snapshot so callers see
// runtime overrides.
function isFeatureEnabled(flag) {
  if (typeof flag !== 'string') return false;
  var merged = getFeatureFlags();
  if (!Object.prototype.hasOwnProperty.call(merged, flag)) return false;
  return merged[flag] === true;
}

// Read-only list of the runtime-togglable flags. UI uses this to
// decide what to render.
function getRuntimeTogglableFlags() {
  return _RUNTIME_TOGGLABLE_FLAGS.slice();
}

// Helper for diagnostics: report flags grouped by safety stance.
// Reads the MERGED snapshot so the UI shows the live runtime view.
function getFeatureFlagsForDiagnostics() {
  var f = getFeatureFlags();
  return {
    safety: {
      simulationOnly: f.simulationOnly,
      realDesktopActions: f.realDesktopActions,
      ocr: f.ocr,
      imageRecognition: f.imageRecognition,
      // Step 38 OCR provider safety stance.
      realOcr: f.realOcr,
      tesseractProvider: f.tesseractProvider
    },
    capabilities: {
      globalHotkeys: f.globalHotkeys,
      profiles: f.profiles,
      importExport: f.importExport,
      // Step 38 architecture-only capability — UI only, no runtime
      // OCR side-effect.
      ocrProviderRegistry: f.ocrProviderRegistry,
      ocrMockProvider: f.ocrMockProvider
    },
    // Step 40 — surface the runtime overlay so testers can see
    // which flags were flipped for the current session.
    runtimeOverlay: getRuntimeFeatureFlags()
  };
}


// ---------------------------------------------------------------------
// Step 39 — Real OCR Provider Integration Phase 1.
// Step 40 — runtime overlay applies to the OCR feature status too.
// ---------------------------------------------------------------------
// `getOcrFeatureStatus()` is the single source of truth for the OCR
// readiness UI / Tesseract provider readiness check / diagnostics
// line. It returns a flat plain-data snapshot of every OCR-related
// safety flag, so the call sites do not have to read `FEATURE_FLAGS`
// directly. The values here are derived from the **merged** base +
// runtime overlay so a runtime "Enable Tesseract for this session"
// toggle is honoured immediately.
function getOcrFeatureStatus() {
  var f = getFeatureFlags();
  // `realOcrAllowed` is true only if every safety flag agrees:
  //   - `realOcr` (umbrella) is true,
  //   - `tesseractProvider` (provider gate) is true,
  //   - `simulationOnly` is NOT true (simulation-only builds refuse).
  // ClickFlow keeps `simulationOnly: true` baked in, so even with
  // both runtime flags flipped this stays `false`. The flag name
  // "allowed" therefore reflects the strict safety umbrella; the
  // OCR provider call sites use `realOcr && tesseractProvider`
  // separately to decide whether real OCR is enabled FOR THIS
  // SESSION.
  var realOcrAllowed = (f.realOcr === true) &&
                       (f.tesseractProvider === true) &&
                       (f.simulationOnly !== true);
  // `realOcrEnabledForSession` is the runtime opt-in the user gave
  // us by clicking "Enable Tesseract for this session". It does
  // NOT bypass `simulationOnly`. text_click and the OCR tab use
  // this flag to decide whether to dispatch to the real provider.
  var realOcrEnabledForSession = (f.realOcr === true) &&
                                 (f.tesseractProvider === true);
  return {
    realOcr:                  f.realOcr === true,
    tesseractProvider:        f.tesseractProvider === true,
    ocrMockProvider:          f.ocrMockProvider === true,
    ocrProviderRegistry:      f.ocrProviderRegistry === true,
    simulationOnly:           f.simulationOnly === true,
    realOcrAllowed:           realOcrAllowed,
    realOcrEnabledForSession: realOcrEnabledForSession,
    realOcrAutoRun:           false   // hard-coded — never auto-run real OCR
  };
}
