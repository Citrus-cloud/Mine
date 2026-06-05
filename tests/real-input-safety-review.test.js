/**
 * Step 77 — Tests for real-input safety review (Node.js, no external deps).
 *
 * Run with: node tests/real-input-safety-review.test.js
 */

'use strict';

const assert = require('assert');
const review = require('../src/real-input-safety-review');

let passed = 0;
let failed = 0;
const results = [];

function test(name, fn) {
  review._resetForTest();
  try {
    fn();
    results.push(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    results.push(`  ✗ ${name}\n      ${e.message}`);
    failed++;
  }
}

// Stable fake clock
let fakeNow = 1_000_000;
function useFakeClock() {
  fakeNow = 1_000_000;
  review.setNowProvider(() => fakeNow);
}

// --- Tests ---

test('1. Gate closed by default — all checks fail', () => {
  const g = review.evaluateGate();
  assert.strictEqual(g.allowed, false);
  assert.ok(g.failedChecks.includes('reviewPassed'));
  assert.ok(g.failedChecks.includes('consentFresh'));
  assert.ok(g.failedChecks.includes('emergencyStopClear') === false); // no E-stop initially
  assert.strictEqual(g.checks.emergencyStopClear, true);
});

test('2. markReviewPassed sets reviewPassed check', () => {
  review.markReviewPassed();
  assert.strictEqual(review.evaluateGate().checks.reviewPassed, true);
});

test('3. revokeReview clears reviewPassed', () => {
  review.markReviewPassed();
  review.revokeReview();
  assert.strictEqual(review.evaluateGate().checks.reviewPassed, false);
});

test('4. recordConsent sets consentFresh', () => {
  useFakeClock();
  review.recordConsent();
  assert.strictEqual(review.isConsentFresh(), true);
});

test('5. Consent expires after CONSENT_TTL_MS', () => {
  useFakeClock();
  review.recordConsent();
  fakeNow += review.CONSENT_TTL_MS; // exactly at TTL boundary → expired
  assert.strictEqual(review.isConsentFresh(), false);
});

test('6. clearConsent nulls consent', () => {
  useFakeClock();
  review.recordConsent();
  review.clearConsent();
  assert.strictEqual(review.isConsentFresh(), false);
});

test('7. Rate limit OK when no actions recorded', () => {
  assert.strictEqual(review.isRateLimitOk(), true);
});

test('8. Rate limit exceeded after MAX_ACTIONS_PER_MINUTE actions', () => {
  useFakeClock();
  for (let i = 0; i < review.MAX_ACTIONS_PER_MINUTE; i++) {
    review.recordAction();
  }
  assert.strictEqual(review.isRateLimitOk(), false);
});

test('9. Rate limit resets after rolling window', () => {
  useFakeClock();
  for (let i = 0; i < review.MAX_ACTIONS_PER_MINUTE; i++) {
    review.recordAction();
  }
  fakeNow += review.RATE_WINDOW_MS + 1; // advance past window
  review.recordAction(); // triggers trim
  assert.strictEqual(review.isRateLimitOk(), true);
});

test('10. Emergency stop blocks gate', () => {
  review.activateEmergencyStop();
  assert.strictEqual(review.isEmergencyStopClear(), false);
  assert.strictEqual(review.evaluateGate().checks.emergencyStopClear, false);
});

test('11. Emergency stop also clears consent', () => {
  useFakeClock();
  review.recordConsent();
  review.activateEmergencyStop();
  assert.strictEqual(review.isConsentFresh(), false);
});

test('12. deactivateEmergencyStop re-opens gate (stop check)', () => {
  review.activateEmergencyStop();
  review.deactivateEmergencyStop();
  assert.strictEqual(review.isEmergencyStopClear(), true);
});

test('13. canDispatchRealInput false when any check fails', () => {
  review.markReviewPassed(); // review ok
  // consent missing, rate ok, no E-stop
  assert.strictEqual(review.canDispatchRealInput(), false);
});

test('14. canDispatchRealInput true when all checks pass', () => {
  useFakeClock();
  review.markReviewPassed();
  review.recordConsent();
  // rate limit ok, no E-stop
  assert.strictEqual(review.canDispatchRealInput(), true);
});

test('15. evaluateGate failedChecks lists only failed ones', () => {
  useFakeClock();
  review.markReviewPassed();
  review.recordConsent();
  review.activateEmergencyStop();
  const g = review.evaluateGate();
  assert.deepStrictEqual(g.failedChecks, ['consentFresh', 'emergencyStopClear']);
});

// --- Report ---
console.log('\nStep 77 — real-input safety review tests\n');
results.forEach(r => console.log(r));
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
