// =====================================================================
// ClickFlow — feature-flags.js (Step 16)
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
  // The OCR provider registry ships as architecture only. The mock
  // provider is the single active provider. Tesseract / tesseract.js
  // is intentionally NOT wired up at runtime.
  //
  // - `realOcr` is the umbrella safety flag for "is real OCR allowed
  //   to run". Hard-coded false until Step 39+ ships the Tesseract
  //   provider behind a separate signed-off review.
  // - `ocrProviderRegistry` enables the new readiness UI / diagnostics
  //   surfaces. It is true at Step 38 so the user can see the
  //   architecture, but flipping it does not unlock any real OCR.
  // - `ocrMockProvider` confirms the mock provider is registered and
  //   available. Hard-coded true.
  // - `tesseractProvider` confirms the Tesseract provider is wired
  //   up at runtime. Hard-coded false at Step 38.
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
