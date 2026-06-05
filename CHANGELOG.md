# Changelog — ClickFlow Desktop (Mine)

All notable changes are documented here.

## [Unreleased]

### Step 81 — E2E QA scenarios + automated runner

- New `docs/e2e-qa-scenarios.md` — 8 end-to-end test scenarios:
  safety gate lifecycle, imageClick / textClick happy paths, rate limit,
  emergency stop mid-session, adapter error handling, localization switcher,
  Android↔Desktop parity smoke.
- New `tests/e2e-runner.js` — 12 automated e2e tests (Node.js, no deps):
  S1 gate lifecycle (a–e), S2 image happy path + consent one-use, S3 text
  happy path, S4 rate limit at MAX+1, S5 e-stop blocks, S6 adapter error
  / throw.
- Run: `node tests/e2e-runner.js`

### Step 80 — Parity matrix + ru l10n
### Step 79 — QA + v1.0.0-alpha.1
### Steps 51–78 — see git history
