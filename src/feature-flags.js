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
  importExport: true
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
      imageRecognition: FEATURE_FLAGS.imageRecognition
    },
    capabilities: {
      globalHotkeys: FEATURE_FLAGS.globalHotkeys,
      profiles: FEATURE_FLAGS.profiles,
      importExport: FEATURE_FLAGS.importExport
    }
  };
}
