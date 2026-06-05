/**
 * Step 78 — Tests for real image_click + text_click under safety gate.
 *
 * Run with: node tests/real-smart-click.test.js
 */

'use strict';

const assert = require('assert');
const review = require('../src/real-input-safety-review');
const { imageClick, textClick, ClickResultStatus } = require('../src/real-smart-click');

let passed = 0;
let failed = 0;
const results = [];

let fakeNow = 2_000_000;

function useFakeClock() {
  fakeNow = 2_000_000;
  review.setNowProvider(() => fakeNow);
}

function openGate() {
  review.markReviewPassed();
  review.recordConsent();
  // rate ok, no E-stop
}

const mockOkDispatch = () => ({ ok: true });
const mockErrDispatch = () => ({ ok: false, error: 'hw_error' });
const mockThrowDispatch = () => { throw new Error('crash'); };

function test(name, fn) {
  review._resetForTest();
  useFakeClock();
  try {
    fn();
    results.push(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    results.push(`  ✗ ${name}\n      ${e.message}`);
    failed++;
  }
}

// --- imageClick tests ---

test('1. imageClick blocked when gate closed', () => {
  const r = imageClick({ templateId: 'tmpl1' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
  assert.ok(r.blockedBy.includes('reviewPassed'));
});

test('2. imageClick blocked with invalid templateId (empty)', () => {
  openGate();
  const r = imageClick({ templateId: '  ' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
  assert.ok(r.blockedBy.includes('invalid_template_id'));
});

test('3. imageClick blocked with null request', () => {
  openGate();
  const r = imageClick(null, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
});

test('4. imageClick dispatched when gate open and valid', () => {
  openGate();
  const r = imageClick({ templateId: 'tmpl1' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.DISPATCHED);
  assert.strictEqual(r.action, 'image_click');
});

test('5. imageClick returns ERROR on adapter failure', () => {
  openGate();
  const r = imageClick({ templateId: 'tmpl1' }, mockErrDispatch);
  assert.strictEqual(r.status, ClickResultStatus.ERROR);
  assert.strictEqual(r.error, 'hw_error');
});

test('6. imageClick returns ERROR on adapter throw', () => {
  openGate();
  const r = imageClick({ templateId: 'tmpl1' }, mockThrowDispatch);
  assert.strictEqual(r.status, ClickResultStatus.ERROR);
  assert.ok(r.error.includes('crash'));
});

test('7. imageClick clears consent after dispatch (one-use)', () => {
  openGate();
  imageClick({ templateId: 'tmpl1' }, mockOkDispatch);
  // consent should be gone — next call blocked
  const r2 = imageClick({ templateId: 'tmpl1' }, mockOkDispatch);
  assert.strictEqual(r2.status, ClickResultStatus.BLOCKED);
  assert.ok(r2.blockedBy.includes('consentFresh'));
});

test('8. imageClick records action in rate window', () => {
  openGate();
  imageClick({ templateId: 'tmpl1' }, mockOkDispatch);
  // rate limit still ok after 1 action (max is 10)
  assert.strictEqual(review.isRateLimitOk(), true);
});

test('9. imageClick passes regionHint to adapter payload', () => {
  openGate();
  let captured = null;
  const capDispatch = (p) => { captured = p; return { ok: true }; };
  imageClick({ templateId: 't', regionHint: { x: 10, y: 20, width: 100, height: 50 } }, capDispatch);
  assert.deepStrictEqual(captured.regionHint, { x: 10, y: 20, width: 100, height: 50 });
});

// --- textClick tests ---

test('10. textClick blocked when gate closed', () => {
  const r = textClick({ query: 'OK' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
});

test('11. textClick blocked with empty query', () => {
  openGate();
  const r = textClick({ query: '   ' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.BLOCKED);
  assert.ok(r.blockedBy.includes('invalid_query'));
});

test('12. textClick dispatched when gate open and valid', () => {
  openGate();
  const r = textClick({ query: 'Submit' }, mockOkDispatch);
  assert.strictEqual(r.status, ClickResultStatus.DISPATCHED);
  assert.strictEqual(r.action, 'text_click');
});

test('13. textClick passes caseSensitive to adapter', () => {
  openGate();
  let captured = null;
  const cap = (p) => { captured = p; return { ok: true }; };
  textClick({ query: 'OK', caseSensitive: true }, cap);
  assert.strictEqual(captured.caseSensitive, true);
});

test('14. textClick returns ERROR on adapter failure', () => {
  openGate();
  const r = textClick({ query: 'OK' }, mockErrDispatch);
  assert.strictEqual(r.status, ClickResultStatus.ERROR);
});

test('15. textClick clears consent after dispatch', () => {
  openGate();
  textClick({ query: 'OK' }, mockOkDispatch);
  const r2 = textClick({ query: 'OK' }, mockOkDispatch);
  assert.strictEqual(r2.status, ClickResultStatus.BLOCKED);
  assert.ok(r2.blockedBy.includes('consentFresh'));
});

// --- Report ---
console.log('\nStep 78 — real image_click + text_click tests\n');
results.forEach(r => console.log(r));
console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
