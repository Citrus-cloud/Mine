/**
 * Step 81 — Lightweight e2e test runner for ClickFlow Desktop.
 *
 * Exercises the scenarios from docs/e2e-qa-scenarios.md using the
 * real module implementations (no mocks for gate, mocked adapter only).
 *
 * Run: node tests/e2e-runner.js
 */

'use strict';

const assert = require('assert');
const review = require('../src/real-input-safety-review');
const { imageClick, textClick, ClickResultStatus } = require('../src/real-smart-click');

let passed = 0, failed = 0;
const log = [];
let fakeNow = 5_000_000;

review.setNowProvider(() => fakeNow);

function test(name, fn) {
  review._resetForTest();
  review.setNowProvider(() => fakeNow);
  fakeNow = 5_000_000;
  try {
    fn();
    log.push(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    log.push(`  ✗ ${name}\n      ${e.message}`);
    failed++;
  }
}

const ok = () => ({ ok: true });

// --- Scenario 1: Safety gate lifecycle ---

test('S1-a: gate closed on start', () => {
  assert.strictEqual(review.canDispatchRealInput(), false);
});

test('S1-b: review alone insufficient', () => {
  review.markReviewPassed();
  assert.strictEqual(review.canDispatchRealInput(), false);
});

test('S1-c: review + consent opens gate', () => {
  review.markReviewPassed();
  review.recordConsent();
  assert.strictEqual(review.canDispatchRealInput(), true);
});

test('S1-d: consent expires at TTL', () => {
  review.markReviewPassed();
  review.recordConsent();
  fakeNow += review.CONSENT_TTL_MS;
  assert.strictEqual(review.isConsentFresh(), false);
});

test('S1-e: emergency stop closes gate + clears consent', () => {
  review.markReviewPassed();
  review.recordConsent();
  review.activateEmergencyStop();
  assert.strictEqual(review.canDispatchRealInput(), false);
  assert.strictEqual(review.isConsentFresh(), false);
});

// --- Scenario 2: image_click happy path ---

test('S2-a: imageClick happy path → DISPATCHED', () => {
  review.markReviewPassed();
  review.recordConsent();
  const r = imageClick({ templateId: 'tmpl' }, ok);
  assert.strictEqual(r.status, ClickResultStatus.DISPATCHED);
});

test('S2-b: consent cleared after dispatch', () => {
  review.markReviewPassed();
  review.recordConsent();
  imageClick({ templateId: 'tmpl' }, ok);
  const r2 = imageClick({ templateId: 'tmpl' }, ok);
  assert.strictEqual(r2.status, ClickResultStatus.BLOCKED);
});

// --- Scenario 3: text_click happy path ---

test('S3: textClick happy path → DISPATCHED', () => {
  review.markReviewPassed();
  review.recordConsent();
  const r = textClick({ query: 'Submit' }, ok);
  assert.strictEqual(r.status, ClickResultStatus.DISPATCHED);
});

// --- Scenario 4: Rate limit ---

test('S4: rate limit blocks at MAX+1', () => {
  review.markReviewPassed();
  for (let i = 0; i < review.MAX_ACTIONS_PER_MINUTE; i++) {
    review.recordConsent();
    imageClick({ templateId: 'tmpl' }, ok);
  }
  review.recordConsent();
  const r = imageClick({ templateId: 'tmpl' }, ok);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
  assert.ok(r.blockedBy.includes('rateLimitOk'));
});

// --- Scenario 5: Emergency stop mid-session ---

test('S5: emergency stop blocks next dispatch', () => {
  review.markReviewPassed();
  review.recordConsent();
  review.activateEmergencyStop();
  const r = imageClick({ templateId: 'tmpl' }, ok);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
});

// --- Scenario 6: Adapter error ---

test('S6-a: adapter error → ClickResultStatus.ERROR', () => {
  review.markReviewPassed();
  review.recordConsent();
  const r = imageClick({ templateId: 'tmpl' }, () => ({ ok: false, error: 'hw' }));
  assert.strictEqual(r.status, ClickResultStatus.ERROR);
});

test('S6-b: adapter throw → ClickResultStatus.ERROR', () => {
  review.markReviewPassed();
  review.recordConsent();
  const r = imageClick({ templateId: 'tmpl' }, () => { throw new Error('crash'); });
  assert.strictEqual(r.status, ClickResultStatus.ERROR);
});

// --- Report ---
console.log('\nStep 81 — E2E runner\n');
log.forEach(l => console.log(l));
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
