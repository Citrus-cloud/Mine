// =====================================================================
// ClickFlow — adapter-registry.js (Step 18)
// ---------------------------------------------------------------------
// Registry of desktop action adapters. The mock adapter is the ONLY
// one that is `available: true`. The real adapter is listed as
// `available: false`, `planned: true`, with a non-null `disabledReason`.
//
// IMPORTANT
//   - `setActiveAdapter("real-desktop")` always returns
//     `{ success: false, blocked: true, error: <reason> }` and emits
//     two audit events (`adapter.selection.blocked`,
//     `adapter.real.unavailable`).
//   - The real adapter cannot be activated by any code path in this
//     build. The future safety review (docs/REAL_ACTIONS_GO_NO_GO.md)
//     is the only way that changes.
// =====================================================================

// Frozen registry data. Adapter records are deep-copied on read so
// callers cannot mutate the registry by holding a reference.
var REGISTRY = {
  adapters: [
    {
      id: 'mock',
      name: 'Mock Desktop Adapter',
      type: 'mock',
      available: true,
      realActions: false,
      simulationOnly: true,
      planned: false,
      disabledReason: null
    },
    {
      id: 'real-desktop',
      name: 'Real Desktop Adapter',
      type: 'real',
      available: false,
      realActions: true,
      simulationOnly: false,
      planned: true,
      disabledReason: 'Real desktop actions are not implemented in this build'
    }
  ],
  activeId: 'mock'
};

function _copy(obj) {
  // Plain JSON deep-copy is sufficient — adapter records contain only
  // primitives and small flat objects.
  if (!obj) return null;
  return JSON.parse(JSON.stringify(obj));
}

function _findById(id) {
  for (var i = 0; i < REGISTRY.adapters.length; i++) {
    if (REGISTRY.adapters[i].id === id) return REGISTRY.adapters[i];
  }
  return null;
}

function getAvailableAdapters() {
  return REGISTRY.adapters.filter(function (a) { return a.available; }).map(_copy);
}

function getAdapterById(id) {
  return _copy(_findById(id));
}

function getActiveAdapter() {
  return _copy(_findById(REGISTRY.activeId));
}

// Activate a registered adapter. Real / unavailable adapters are
// rejected with a structured error and audited.
function setActiveAdapter(id) {
  var target = _findById(id);
  if (!target) {
    return { success: false, error: 'Unknown adapter: ' + id };
  }
  if (target.type === 'real' || target.realActions === true || target.available === false) {
    if (typeof recordAuditEvent === 'function') {
      recordAuditEvent('adapter.selection.blocked', {
        id: target.id,
        type: target.type,
        reason: target.disabledReason || 'unavailable'
      });
      if (target.type === 'real') {
        recordAuditEvent('adapter.real.unavailable', { id: target.id });
      }
    }
    return {
      success: false,
      blocked: true,
      error: target.disabledReason || 'Adapter is not available'
    };
  }
  REGISTRY.activeId = target.id;
  return { success: true, activeId: target.id };
}

function isRealAdapterRegistered() {
  return REGISTRY.adapters.some(function (a) { return a.type === 'real'; });
}

function isRealAdapterAvailable() {
  return REGISTRY.adapters.some(function (a) { return a.type === 'real' && a.available === true; });
}

function getAdapterRegistryStatus() {
  return {
    activeId: REGISTRY.activeId,
    activeAdapter: getActiveAdapter(),
    available: getAvailableAdapters(),
    registered: REGISTRY.adapters.map(_copy),
    realAdapterRegistered: isRealAdapterRegistered(),
    realAdapterAvailable: isRealAdapterAvailable(),
    realActionsAllowed: false,
    simulationOnly: true
  };
}

// Run the self-test of the active adapter. The mock adapter implements
// it via runMockAdapterSelfTest(); other adapters report unsupported.
function runActiveAdapterSelfTest() {
  var active = _findById(REGISTRY.activeId);
  if (!active) {
    return { success: false, error: 'No active adapter' };
  }
  if (active.id === 'mock') {
    if (typeof runMockAdapterSelfTest === 'function') {
      return runMockAdapterSelfTest();
    }
    return { success: false, error: 'Mock adapter not loaded' };
  }
  // Defensive: if somehow an adapter without a self-test became active,
  // do not pretend it passed.
  return { success: false, error: 'Self-test not supported for adapter: ' + active.id };
}
