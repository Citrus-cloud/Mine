/**
 * Step 77 — Desktop real-input safety review.
 *
 * Before any real image_click or text_click is dispatched through the
 * desktop adapter, all checks defined here must pass. This module is
 * the single source of truth for the desktop safety gate state.
 *
 * Checks (all must be true):
 *   1. REVIEW_PASSED   — a human reviewer has signed off on real input.
 *   2. CONSENT_FRESH   — explicit per-action user consent recorded < TTL.
 *   3. RATE_LIMIT_OK   — no more than MAX_ACTIONS_PER_MINUTE dispatched.
 *   4. EMERGENCY_STOP  — no active emergency stop flag.
 *
 * This module does NOT dispatch any real input. It only evaluates and
 * reports the gate state. Actual dispatch is Step 78.
 */

'use strict';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONSENT_TTL_MS = 15_000;       // 15 seconds
const MAX_ACTIONS_PER_MINUTE = 10;   // rate cap
const RATE_WINDOW_MS = 60_000;       // rolling 1-minute window

// ---------------------------------------------------------------------------
// Gate state (process-local, never persisted)
// ---------------------------------------------------------------------------

let _reviewPassed = false;
let _consentRecordedAtMs = null;     // timestamp of last user consent
let _emergencyStopActive = false;
let _actionTimestamps = [];          // rolling log for rate limiting
let _nowProvider = () => Date.now();

/**
 * Inject a custom clock (for testing).
 * @param {() => number} fn
 */
function setNowProvider(fn) {
  _nowProvider = fn;
}

// ---------------------------------------------------------------------------
// Review pass/fail
// ---------------------------------------------------------------------------

/** Mark the safety review as passed (human sign-off). */
function markReviewPassed() {
  _reviewPassed = true;
}

/** Revoke the safety review pass. */
function revokeReview() {
  _reviewPassed = false;
}

// ---------------------------------------------------------------------------
// Consent
// ---------------------------------------------------------------------------

/** Record explicit user consent right now. */
function recordConsent() {
  _consentRecordedAtMs = _nowProvider();
}

/** Clear any pending consent. */
function clearConsent() {
  _consentRecordedAtMs = null;
}

/**
 * Return true when a valid, non-expired consent is present.
 * @returns {boolean}
 */
function isConsentFresh() {
  if (_consentRecordedAtMs === null) return false;
  return (_nowProvider() - _consentRecordedAtMs) < CONSENT_TTL_MS;
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------

/**
 * Record that one real action was dispatched at the current time.
 * Call this AFTER a successful dispatch (Step 78).
 */
function recordAction() {
  const now = _nowProvider();
  _actionTimestamps.push(now);
  // Trim old entries outside the rolling window
  _actionTimestamps = _actionTimestamps.filter(t => (now - t) < RATE_WINDOW_MS);
}

/**
 * Return true when the rate limit is NOT exceeded.
 * @returns {boolean}
 */
function isRateLimitOk() {
  const now = _nowProvider();
  const recent = _actionTimestamps.filter(t => (now - t) < RATE_WINDOW_MS);
  return recent.length < MAX_ACTIONS_PER_MINUTE;
}

// ---------------------------------------------------------------------------
// Emergency stop
// ---------------------------------------------------------------------------

/** Activate emergency stop — blocks all real input immediately. */
function activateEmergencyStop() {
  _emergencyStopActive = true;
  _consentRecordedAtMs = null; // also clear consent
}

/** Deactivate emergency stop (requires explicit human action). */
function deactivateEmergencyStop() {
  _emergencyStopActive = false;
}

/** Return true when no emergency stop is active. */
function isEmergencyStopClear() {
  return !_emergencyStopActive;
}

// ---------------------------------------------------------------------------
// Composite gate
// ---------------------------------------------------------------------------

/**
 * Return the full gate evaluation result.
 *
 * @returns {{
 *   allowed: boolean,
 *   failedChecks: string[],
 *   checks: {
 *     reviewPassed: boolean,
 *     consentFresh: boolean,
 *     rateLimitOk: boolean,
 *     emergencyStopClear: boolean
 *   }
 * }}
 */
function evaluateGate() {
  const checks = {
    reviewPassed: _reviewPassed,
    consentFresh: isConsentFresh(),
    rateLimitOk: isRateLimitOk(),
    emergencyStopClear: isEmergencyStopClear()
  };

  const failedChecks = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    allowed: failedChecks.length === 0,
    failedChecks,
    checks
  };
}

/**
 * Convenience: return true only when ALL gate checks pass.
 * @returns {boolean}
 */
function canDispatchRealInput() {
  return evaluateGate().allowed;
}

// ---------------------------------------------------------------------------
// Reset (test helper)
// ---------------------------------------------------------------------------

/** Reset all gate state to initial (closed) values. For testing only. */
function _resetForTest() {
  _reviewPassed = false;
  _consentRecordedAtMs = null;
  _emergencyStopActive = false;
  _actionTimestamps = [];
  _nowProvider = () => Date.now();
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  // Constants
  CONSENT_TTL_MS,
  MAX_ACTIONS_PER_MINUTE,
  RATE_WINDOW_MS,

  // Clock injection
  setNowProvider,

  // Review
  markReviewPassed,
  revokeReview,

  // Consent
  recordConsent,
  clearConsent,
  isConsentFresh,

  // Rate limiting
  recordAction,
  isRateLimitOk,

  // Emergency stop
  activateEmergencyStop,
  deactivateEmergencyStop,
  isEmergencyStopClear,

  // Gate
  evaluateGate,
  canDispatchRealInput,

  // Test helper
  _resetForTest
};
