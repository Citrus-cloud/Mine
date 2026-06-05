# Beta Readiness Checklist — Step 83

All items must be checked before tagging `v1.0.0-beta.1`.

## Automated tests
- [ ] `node tests/real-input-safety-review.test.js` — 15/15 pass.
- [ ] `node tests/real-smart-click.test.js` — 15/15 pass.
- [ ] `node tests/e2e-runner.js` — 12/12 pass.
- [ ] Android: `./gradlew testDebugUnitTest` — all 93+ JVM tests pass.

## Documentation
- [ ] `docs/user-guide.md` reviewed and accurate.
- [ ] `docs/android-user-guide.md` reviewed.
- [ ] `docs/e2e-qa-scenarios.md` — all 8 scenarios verified manually.
- [ ] `docs/parity-matrix.md` — all ⚠️ items resolved or tracked.

## Safety
- [ ] Emergency stop tested in live Electron session.
- [ ] Consent TTL verified in live session (15 s real time).
- [ ] Rate limit verified: 10 actions dispatched, 11th blocked.

## Release
- [ ] `package.json` version = `1.0.0-beta.1`.
- [ ] Git tag `v1.0.0-beta.1` on HEAD.
- [ ] GitHub Release created with beta notes.
