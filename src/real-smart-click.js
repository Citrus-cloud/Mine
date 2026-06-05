/**
 * Step 78 — Real image_click and text_click under the desktop safety gate.
 *
 * Wraps the real-desktop-adapter dispatch path with the Step 77 safety review.
 * Both actions follow the same five-step protocol:
 *   1. Evaluate the gate (reviewPassed, consentFresh, rateLimitOk, no E-stop).
 *   2. Validate the request parameters.
 *   3. If allowed, invoke the adapter dispatch.
 *   4. Record the action in the rate-limit rolling window.
 *   5. Auto-clear consent (one-use) and return the result.
 *
 * This module does NOT provide a real robot adapter; it accepts an injected
 * `adapterDispatch(action)` function so it is fully unit-testable without
 * spawning Electron processes.
 *
 * Usage:
 *   const { imageClick, textClick } = require('./real-smart-click');
 *   imageClick({ templateId, regionHint }, adapterDispatch);
 */

'use strict';

const safetyReview = require('./real-input-safety-review');

// ---------------------------------------------------------------------------
// Result types
// ---------------------------------------------------------------------------

/** @enum {string} */
const ClickResultStatus = {
  DISPATCHED: 'dispatched',
  BLOCKED:    'blocked',
  ERROR:      'error'
};

/**
 * @typedef 
 *   status: string,
 *   action: string,
 *   blockedBy?: string[],
 *   error?: string,
 *   dispatchedAtMs?: number
 *  ClickResult
 */

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Common pre-dispatch gate check.
 * Returns null if allowed, or a ClickResult.Blocked if not.
 * @param {string} actionName
 * @returns {ClickResult|null}
 */
function _checkGate(actionName) {
  const gate = safetyReview.evaluateGate();
  if (!gate.allowed) {
    return {
      status: ClickResultStatus.BLOCKED,
      action: actionName,
      blockedBy: gate.failedChecks
    };
  }
  return null;
}

/**
 * Common post-dispatch bookkeeping.
 * Clears consent (one-use) and records action in rate window.
 */
function _postDispatch() {
  safetyReview.clearConsent();
  safetyReview.recordAction();
}

// ---------------------------------------------------------------------------
// image_click
// ---------------------------------------------------------------------------

/**
 * Dispatch a real image-template click.
 *
 * @param {{
 *   templateId: string,
 *   regionHint?: { x: number, y: number, width: number, height: number }
 * }} request
 * @param {(payload: object) => { ok: boolean, error?: string }} adapterDispatch
 *   Injected adapter (real or mock). Must be synchronous for now.
 * @returns {ClickResult}
 */
function imageClick(request, adapterDispatch) {
  const blocked = _checkGate('image_click');
  if (blocked) return blocked;

  if (!request || typeof request.templateId !== 'string' || !request.templateId.trim()) {
    return {
      status: ClickResultStatus.BLOCKED,
      action: 'image_click',
      blockedBy: ['invalid_template_id']
    };
  }

  try {
    const payload = {
      type: 'image_click',
      templateId: request.templateId,
      regionHint: request.regionHint || null
    };
    const result = adapterDispatch(payload);
    if (!result.ok) {
      return { status: ClickResultStatus.ERROR, action: 'image_click', error: result.error || 'adapter_error' };
    }
    _postDispatch();
    return { status: ClickResultStatus.DISPATCHED, action: 'image_click', dispatchedAtMs: Date.now() };
  } catch (e) {
    return { status: ClickResultStatus.ERROR, action: 'image_click', error: String(e.message) };
  }
}

// ---------------------------------------------------------------------------
// text_click
// ---------------------------------------------------------------------------

/**
 * Dispatch a real text-target click.
 *
 * @param 
 *   query: string,
 *   caseSensitive?: boolean
 *  request
 * @param {(payload: object) => { ok: boolean, error?: string }} adapterDispatch
 * @returns {ClickResult}
 */
function textClick(request, adapterDispatch) {
  const blocked = _checkGate('text_click');
  if (blocked) return blocked;

  if (!request || typeof request.query !== 'string' || !request.query.trim()) {
    return {
      status: ClickResultStatus.BLOCKED,
      action: 'text_click',
      blockedBy: ['invalid_query']
    };
  }

  try {
    const payload = {
      type: 'text_click',
      query: request.query,
      caseSensitive: request.caseSensitive === true
    };
    const result = adapterDispatch(payload);
    if (!result.ok) {
      return { status: ClickResultStatus.ERROR, action: 'text_click', error: result.error || 'adapter_error' };
    }
    _postDispatch();
    return { status: ClickResultStatus.DISPATCHED, action: 'text_click', dispatchedAtMs: Date.now() };
  } catch (e) {
    return { status: ClickResultStatus.ERROR, action: 'text_click', error: String(e.message) };
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  ClickResultStatus,
  imageClick,
  textClick
};
