// =====================================================================
// ClickFlow — real-action-sandbox.js (Step 19)
// ---------------------------------------------------------------------
// Safety sandbox for the future real desktop adapter. Every public
// function in this file is **read-only** with respect to the OS:
//   - it builds a dry-run preview of what would happen IF a real
//     adapter were available;
//   - it never asks any adapter to actually execute;
//   - it never moves the mouse or presses keys;
//   - it explicitly enumerates every reason real execution is blocked.
//
// IMPORTANT
//   - Real desktop actions are NOT implemented in this build.
//   - `evaluateRealActionReadiness()` ALWAYS returns
//     `{ allowed: false, ... }` in 0.1.x.
//   - `confirmDryRunPlan()` only confirms the dry-run; it never asks
//     for real execution and never crosses into the real adapter
//     path in `action-pipeline.js`.
// =====================================================================

// Cap the number of actions shown in the preview. The actual scenario
// can have up to 100 000 repeats; we never materialize all of them.
var SANDBOX_PREVIEW_MAX = 10;

// In-memory bookkeeping for the diagnostics card.
var sandboxState = {
  lastDryRunAt: null,
  lastDryRunActionCount: 0,
  lastConfirmedAt: null,
  lastCancelledAt: null
};

// --- Public status snapshot for diagnostics. ---
function getSandboxStatus() {
  return {
    simulationOnly: true,
    realActionsImplemented: false,
    realActionsAllowed: false,
    dryRunAvailable: true,
    lastDryRunAt: sandboxState.lastDryRunAt,
    lastDryRunActionCount: sandboxState.lastDryRunActionCount,
    lastConfirmedAt: sandboxState.lastConfirmedAt,
    lastCancelledAt: sandboxState.lastCancelledAt
  };
}

// --- Hard readiness gate. ALWAYS denies real execution. ---
function evaluateRealActionReadiness(settings, flags) {
  var ff = (flags && typeof flags === 'object')
    ? flags
    : ((typeof getFeatureFlags === 'function') ? getFeatureFlags() : {});
  var blocked = getRealActionBlockedReasons(settings, ff);
  return {
    allowed: false,
    realActionsImplemented: false,
    realActionsAllowed: false,
    blockedReasons: blocked,
    blockedReasonsCount: blocked.length,
    timestamp: new Date().toISOString()
  };
}

// --- Enumerated blocked reasons. ---
// IDs are stable so the UI can localize them. Labels are English here
// and translated at the renderer via i18n keys; they are also useful
// when the registry / pipeline emits them in audit events.
function getRealActionBlockedReasons(settings, flags) {
  var ff = (flags && typeof flags === 'object')
    ? flags
    : ((typeof getFeatureFlags === 'function') ? getFeatureFlags() : {});

  var reasons = [];
  if (ff.realDesktopActions !== true) {
    reasons.push({
      id: 'realDesktopActionsFlagDisabled',
      label: 'realDesktopActions feature flag is disabled'
    });
  }
  if (ff.simulationOnly !== false) {
    reasons.push({
      id: 'simulationOnlyEnabled',
      label: 'simulationOnly build is enabled'
    });
  }
  // Real adapter is not installed (registry contract).
  var realAvailable = false;
  if (typeof isRealAdapterAvailable === 'function') {
    realAvailable = isRealAdapterAvailable();
  }
  if (!realAvailable) {
    reasons.push({
      id: 'realAdapterNotInstalled',
      label: 'real adapter is not installed'
    });
  }
  // OS permission probe is not implemented in 0.1.x.
  reasons.push({
    id: 'osPermissionsNotVerified',
    label: 'OS permissions are not verified'
  });
  // Final safety review (docs/REAL_ACTIONS_GO_NO_GO.md).
  reasons.push({
    id: 'finalSafetyReviewNotPassed',
    label: 'final safety review has not passed'
  });
  // Audit log persistence is not implemented (in-memory only).
  reasons.push({
    id: 'auditPersistenceNotImplemented',
    label: 'audit log persistence is not implemented'
  });
  // Hard project-level decision.
  reasons.push({
    id: 'realActionsIntentionallyDisabled',
    label: 'real actions are intentionally disabled in this build'
  });

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.blocked.reason.generated', {
      count: reasons.length
    });
  }
  return reasons;
}

// --- Permission checklist. ---
// Each item: { id, label, status: "ready" | "missing" | "planned" | "blocked" }.
function createPermissionChecklist(settings, flags) {
  var s = settings || {};
  var safety = s.safety || {};
  var ff = (flags && typeof flags === 'object')
    ? flags
    : ((typeof getFeatureFlags === 'function') ? getFeatureFlags() : {});

  var realAdapterRegistered = (typeof isRealAdapterRegistered === 'function')
    ? isRealAdapterRegistered() : false;
  var realAdapterAvailable = (typeof isRealAdapterAvailable === 'function')
    ? isRealAdapterAvailable() : false;
  var adapterInterfaceAvailable = (typeof getAdapterContract === 'function');
  var auditAvailable = (typeof recordAuditEvent === 'function');

  var items = [
    {
      id: 'safeMode',
      label: 'Safe mode enabled',
      status: safety.safeMode === true ? 'ready' : 'missing'
    },
    {
      id: 'emergencyStop',
      label: 'Emergency Stop enabled',
      status: safety.emergencyStopEnabled === true ? 'ready' : 'missing'
    },
    {
      id: 'safetyLimits',
      label: 'Safety limits configured',
      status: (typeof safety.minIntervalMs === 'number' &&
               typeof safety.maxRepeatCount === 'number') ? 'ready' : 'missing'
    },
    {
      id: 'userConfirmation',
      label: 'User confirmation required',
      status: 'planned'
    },
    {
      id: 'auditEvents',
      label: 'Audit events available',
      status: auditAvailable ? 'ready' : 'missing'
    },
    {
      id: 'adapterInterface',
      label: 'Adapter interface available',
      status: adapterInterfaceAvailable ? 'ready' : 'missing'
    },
    {
      id: 'mockAdapter',
      label: 'Mock adapter available',
      status: (typeof checkMockAdapterAvailability === 'function' &&
               checkMockAdapterAvailability().available) ? 'ready' : 'missing'
    },
    {
      id: 'realAdapterInstalled',
      label: 'Real adapter installed',
      status: realAdapterAvailable
        ? 'ready'
        : (realAdapterRegistered ? 'blocked' : 'missing')
    },
    {
      id: 'osPermissions',
      label: 'OS permissions verified',
      status: 'missing'
    },
    {
      id: 'finalSafetyReview',
      label: 'Final safety review passed',
      status: 'missing'
    },
    {
      id: 'realFeatureFlag',
      label: 'Real feature flag enabled',
      status: ff.realDesktopActions === true ? 'ready' : 'blocked'
    }
  ];

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.permission.checklist.created', {
      total: items.length,
      ready: items.filter(function (x) { return x.status === 'ready'; }).length
    });
  }
  return items;
}

// --- Build a defensive list of preview actions (capped). ---
function _buildActionsPreviewList(scenario, actions) {
  // If the caller already supplied an actions array, we cap it.
  if (actions && Array.isArray(actions) && actions.length > 0) {
    var limit = Math.min(actions.length, SANDBOX_PREVIEW_MAX);
    var out = [];
    for (var i = 0; i < limit; i++) {
      var a = actions[i] || {};
      out.push({
        index: i + 1,
        type: 'click',
        x: typeof a.x === 'number' ? a.x : 0,
        y: typeof a.y === 'number' ? a.y : 0,
        button: typeof a.button === 'string' ? a.button : 'left'
      });
    }
    return { preview: out, total: actions.length };
  }
  // Otherwise we synthesize the preview from the scenario settings.
  // Every iteration produces the same click — that is the current
  // simple_click semantics in click-engine.js.
  if (!scenario || !scenario.settings) {
    return { preview: [], total: 0 };
  }
  var s = scenario.settings;
  var total = (typeof s.repeatCount === 'number' && s.repeatCount > 0) ? s.repeatCount : 0;
  var cap = Math.min(total, SANDBOX_PREVIEW_MAX);
  var preview = [];
  for (var j = 0; j < cap; j++) {
    preview.push({
      index: j + 1,
      type: 'click',
      x: typeof s.x === 'number' ? s.x : 0,
      y: typeof s.y === 'number' ? s.y : 0,
      button: typeof s.button === 'string' ? s.button : 'left'
    });
  }
  return { preview: preview, total: total };
}

// --- Build a dry-run plan. ---
// The plan is a *description* of what would happen. It carries no
// behavior. It can never be turned into a real execution by code in
// this file.
function createDryRunPlan(scenario, actions, settings) {
  if (!scenario || typeof scenario !== 'object') {
    return { ok: false, error: 'Scenario is missing' };
  }

  var built = _buildActionsPreviewList(scenario, actions);
  var actionCount = built.total;

  var intervalMs = (scenario.settings && typeof scenario.settings.intervalMs === 'number')
    ? scenario.settings.intervalMs : 0;
  var estimatedDurationMs = intervalMs * Math.max(0, actionCount);

  var ff = (typeof getFeatureFlags === 'function') ? getFeatureFlags() : {};
  var blocked = getRealActionBlockedReasons(settings, ff);
  var checklist = createPermissionChecklist(settings, ff);

  var plan = {
    id: 'dryrun-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8),
    scenarioId: scenario.id || null,
    scenarioName: scenario.name || null,
    createdAt: new Date().toISOString(),
    mode: 'dry-run',
    realExecution: false,
    actionCount: actionCount,
    estimatedDurationMs: estimatedDurationMs,
    actionsPreview: built.preview,
    truncated: actionCount > built.preview.length,
    blockedReasons: blocked,
    permissionChecklist: checklist
  };
  return { ok: true, plan: plan };
}

// --- Public entry: build + record a preview. ---
function createRealActionPreview(scenario, actions, settings) {
  // Hard gate: even when only previewing, we sanity-check readiness so
  // the preview itself documents why real execution is denied.
  evaluateRealActionReadiness(settings, undefined);

  var built = createDryRunPlan(scenario, actions, settings);
  if (!built.ok) {
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('real.sandbox.blocked', {
        reason: built.error || 'unknown'
      });
    }
    return built;
  }

  sandboxState.lastDryRunAt = built.plan.createdAt;
  sandboxState.lastDryRunActionCount = built.plan.actionCount;

  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.sandbox.preview.created', {
      planId: built.plan.id,
      scenarioId: built.plan.scenarioId,
      actionCount: built.plan.actionCount,
      truncated: built.plan.truncated,
      blockedReasonsCount: built.plan.blockedReasons.length
    });
  }
  return built;
}

// --- Confirm a dry-run plan. NO real execution. ---
// This function exists only so the UI can record the user's
// "I have inspected the dry-run" decision. It returns immediately
// with a result that carries `realExecution: false`.
function confirmDryRunPlan(plan) {
  if (!plan || typeof plan !== 'object' || plan.mode !== 'dry-run') {
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('real.sandbox.blocked', { reason: 'invalid plan' });
    }
    return {
      ok: false,
      realExecution: false,
      error: 'Invalid dry-run plan'
    };
  }
  sandboxState.lastConfirmedAt = new Date().toISOString();
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.sandbox.dryrun.confirmed', {
      planId: plan.id,
      scenarioId: plan.scenarioId,
      actionCount: plan.actionCount
    });
  }
  return {
    ok: true,
    realExecution: false,
    confirmed: true,
    timestamp: sandboxState.lastConfirmedAt,
    message: 'Dry-run confirmed. No real actions executed.'
  };
}

// --- Cancel a dry-run plan. NO real execution either way. ---
function cancelDryRunPlan(plan) {
  sandboxState.lastCancelledAt = new Date().toISOString();
  if (typeof recordAuditEvent === 'function') {
    recordAuditEvent('real.sandbox.dryrun.cancelled', {
      planId: plan && plan.id ? plan.id : null,
      scenarioId: plan && plan.scenarioId ? plan.scenarioId : null
    });
  }
  return {
    ok: true,
    realExecution: false,
    cancelled: true,
    timestamp: sandboxState.lastCancelledAt
  };
}
