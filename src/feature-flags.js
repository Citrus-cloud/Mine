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

// Returns a defensive copy so callers cannot mutate the frozen object.
function getFeatureFlags() {
  return Object.assign({}, FEATURE_FLAGS);
}

// Convenience helper. Unknown flag names return false.
function isFeatureEnabled(flag) {
  if (typeof flag !== 'string') return false;
  if (!Object.prototype.hasOwnProperty.call(FEATURE_FLAGS, flag)) return false;
  return FEATURE_FLAGS[flag] === true;
}

// Helper for diagnostics: report flags grouped by safety stance.
function getFeatureFlagsForDiagnostics() {
  return {
    safety: {
      simulationOnly: FEATURE_FLAGS.simulationOnly,
      realDesktopActions: FEATURE_FLAGS.realDesktopActions,
      ocr: FEATURE_FLAGS.ocr,
      imageRecognition: FEATURE_FLAGS.imageRecognition,
      // Step 38 OCR provider safety stance.
      realOcr: FEATURE_FLAGS.realOcr,
      tesseractProvider: FEATURE_FLAGS.tesseractProvider
    },
    capabilities: {
      globalHotkeys: FEATURE_FLAGS.globalHotkeys,
      profiles: FEATURE_FLAGS.profiles,
      importExport: FEATURE_FLAGS.importExport,
      // Step 38 architecture-only capability — UI only, no runtime
      // OCR side-effect.
      ocrProviderRegistry: FEATURE_FLAGS.ocrProviderRegistry,
      ocrMockProvider: FEATURE_FLAGS.ocrMockProvider
    }
  };
}


// ---------------------------------------------------------------------
// Step 39 — Real OCR Provider Integration Phase 1.
// ---------------------------------------------------------------------
// `getOcrFeatureStatus()` is the single source of truth for the OCR
// readiness UI / Tesseract provider readiness check / diagnostics
// line. It returns a flat plain-data snapshot of every OCR-related
// safety flag, so the call sites do not have to read `FEATURE_FLAGS`
// directly. The values here are derived only from the frozen flag
// object — there is no runtime mutation.
function getOcrFeatureStatus() {
  // `realOcrAllowed` is true only if every safety flag agrees:
  //   - `realOcr` (umbrella) is true,
  //   - `tesseractProvider` (provider gate) is true,
  //   - `simulationOnly` is false (simulation-only builds refuse).
  // At Step 39 the safe defaults pin all three to a non-allowing
  // state, so this evaluates to `false`. The function deliberately
  // does the boolean math here so call sites do not have to.
  var realOcrAllowed = (FEATURE_FLAGS.realOcr === true) &&
                       (FEATURE_FLAGS.tesseractProvider === true) &&
                       (FEATURE_FLAGS.simulationOnly !== true);
  return {
    realOcr:             FEATURE_FLAGS.realOcr === true,
    tesseractProvider:   FEATURE_FLAGS.tesseractProvider === true,
    ocrMockProvider:     FEATURE_FLAGS.ocrMockProvider === true,
    ocrProviderRegistry: FEATURE_FLAGS.ocrProviderRegistry === true,
    simulationOnly:      FEATURE_FLAGS.simulationOnly === true,
    realOcrAllowed:      realOcrAllowed,
    realOcrAutoRun:      false   // hard-coded — never auto-run real OCR
  };
}
