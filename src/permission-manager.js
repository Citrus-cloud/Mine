// =====================================================================
// ClickFlow — permission-manager.js (Step 46)
// ---------------------------------------------------------------------
// Desktop v1 permission / readiness manager. Reports whether the
// environment WOULD be ready for a future real mode and gives the user
// OS-specific guidance. It does NOT grant permissions and does NOT
// enable real actions.
//
// SAFETY (Step 46):
//   - Renderer-only logic. NEVER imports `electron`, `ipcRenderer`,
//     `fs`, or any prohibited native module.
//   - Reports STATUS and GUIDANCE only. There is no "enable real
//     clicks" path anywhere in this module.
//   - Real desktop actions remain disabled regardless of permission
//     status: every item being "ready" does NOT unlock real input —
//     the feature flag + safety review gate is separate.
// =====================================================================

// Status enum kept tiny on purpose.
var PERMISSION_STATUSES = ['ready', 'missing', 'unknown', 'planned', 'notRequired'];

// Detect the platform without Node access. The preload bridge exposes
// `window.clickflow.system.getInfo()` for the real platform; for the
// synchronous checklist we use navigator hints and fall back to
// 'unknown'. The async refresh below upgrades this with the real
// platform string.
function _detectPlatform() {
  try {
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      var ua = navigator.userAgent.toLowerCase();
      if (ua.indexOf('windows') !== -1) return 'win32';
      if (ua.indexOf('mac os') !== -1 || ua.indexOf('macintosh') !== -1) return 'darwin';
      if (ua.indexOf('linux') !== -1) return 'linux';
    }
  } catch (err) { /* ignore */ }
  return 'unknown';
}

function _featureFlags() {
  return (typeof getFeatureFlags === 'function') ? getFeatureFlags() : {};
}

// Screen capture readiness is the one thing we can actually observe:
// the screen-capture client exposes a status helper in the renderer.
function _screenCaptureReady() {
  try {
    if (typeof getScreenCaptureStatus === 'function') {
      var st = getScreenCaptureStatus();
      // getScreenCaptureStatus may be async (returns a promise) in some
      // builds; only trust a synchronous, plain object here.
      if (st && typeof st === 'object' && typeof st.then !== 'function') {
        return st.available === true || st.supported === true;
      }
    }
  } catch (err) { /* ignore */ }
  return null; // unknown
}

// --- Public: build the permission checklist. ---
// Each item: { id, labelKey, status, requiredForRealMode, guidanceKey }
// `settings` is the app settings object; `flags` is the feature flags
// object. Both are optional — sane defaults are used when missing.
function getPermissionChecklist(settings, flags) {
  var s = (settings && typeof settings === 'object') ? settings : {};
  var safety = (s.safety && typeof s.safety === 'object') ? s.safety : {};
  var ff = (flags && typeof flags === 'object') ? flags : _featureFlags();
  var platform = _detectPlatform();

  var scReady = _screenCaptureReady();
  var scStatus = (scReady === true) ? 'ready' : (scReady === false ? 'missing' : 'unknown');

  // macOS is the only desktop OS that needs explicit Accessibility /
  // Input Monitoring grants for real input. On Windows/Linux these are
  // "unknown" or "notRequired" for our purposes at Step 46.
  var accessibilityStatus, inputMonitoringStatus;
  if (platform === 'darwin') {
    accessibilityStatus   = 'unknown';   // guidance shown; not auto-probed
    inputMonitoringStatus = 'unknown';
  } else if (platform === 'win32') {
    accessibilityStatus   = 'notRequired';
    inputMonitoringStatus = 'notRequired';
  } else if (platform === 'linux') {
    accessibilityStatus   = 'notRequired';
    inputMonitoringStatus = 'planned';   // Wayland restricted
  } else {
    accessibilityStatus   = 'unknown';
    inputMonitoringStatus = 'unknown';
  }

  // Adapter availability: real adapter is unavailable in this build.
  var adapterStatus = 'missing';
  try {
    if (typeof isRealAdapterAvailable === 'function') {
      adapterStatus = isRealAdapterAvailable() ? 'ready' : 'missing';
    }
  } catch (err) { adapterStatus = 'missing'; }

  // Audit logs readiness: present iff the manager is loaded.
  var auditStatus = (typeof getAuditLogManagerStatus === 'function') ? 'ready' : 'planned';

  return [
    {
      id: 'screenCapture',
      labelKey: 'screenCapturePermission',
      status: scStatus,
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceScreenCapture'
    },
    {
      id: 'accessibility',
      labelKey: 'accessibilityPermission',
      status: accessibilityStatus,
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceAccessibility'
    },
    {
      id: 'inputMonitoring',
      labelKey: 'inputMonitoringPermission',
      status: inputMonitoringStatus,
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceInputMonitoring'
    },
    {
      id: 'adapterAvailability',
      labelKey: 'adapterAvailability',
      status: adapterStatus,
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceAdapter'
    },
    {
      id: 'safeMode',
      labelKey: 'safeMode',
      status: (safety.safeMode === true) ? 'ready' : 'missing',
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceSafeMode'
    },
    {
      id: 'emergencyStop',
      labelKey: 'emergencyStop',
      status: (safety.emergencyStopEnabled === true) ? 'ready' : 'missing',
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceEmergencyStop'
    },
    {
      id: 'auditLogs',
      labelKey: 'auditLogs',
      status: auditStatus,
      requiredForRealMode: true,
      guidanceKey: 'permissionGuidanceAuditLogs'
    }
  ];
}

// --- Public: the subset that is required-for-real-mode but not ready. ---
function getMissingPermissions(settings, flags) {
  return getPermissionChecklist(settings, flags).filter(function (item) {
    return item.requiredForRealMode === true && item.status !== 'ready' && item.status !== 'notRequired';
  });
}

// --- Public: a compact status snapshot. ---
function getPermissionStatus(settings, flags) {
  var checklist = getPermissionChecklist(settings, flags);
  var missing = checklist.filter(function (i) {
    return i.requiredForRealMode && i.status !== 'ready' && i.status !== 'notRequired';
  });
  return {
    platform: _detectPlatform(),
    total: checklist.length,
    ready: checklist.filter(function (i) { return i.status === 'ready'; }).length,
    missing: missing.length,
    allReady: missing.length === 0,
    // Even if everything is "ready", real mode stays disabled in this
    // build — permissions are necessary but NOT sufficient.
    realModeEnabled: false
  };
}

// --- Public: async refresh. ---
// Upgrades the platform string using the real system info (when the
// preload bridge is present) and re-reads screen-capture status.
// Returns the refreshed checklist + status. Never throws.
async function refreshPermissions(settings, flags) {
  var realPlatform = null;
  try {
    if (typeof window !== 'undefined' && window.clickflow &&
        window.clickflow.system && typeof window.clickflow.system.getInfo === 'function') {
      var info = await window.clickflow.system.getInfo();
      if (info && typeof info.platform === 'string') realPlatform = info.platform;
    }
  } catch (err) { realPlatform = null; }

  var checklist = getPermissionChecklist(settings, flags);
  var status = getPermissionStatus(settings, flags);
  if (realPlatform) status.platform = realPlatform;
  return { success: true, platform: status.platform, checklist: checklist, status: status };
}

// --- Public: manager status for the Safety Center. ---
function getPermissionManagerStatus(settings, flags) {
  var status = getPermissionStatus(settings, flags);
  return {
    ready: true,
    statusOnly: true,        // never grants, never enables real mode
    platform: status.platform,
    total: status.total,
    readyCount: status.ready,
    missingCount: status.missing,
    allReady: status.allReady,
    realModeEnabled: false
  };
}
