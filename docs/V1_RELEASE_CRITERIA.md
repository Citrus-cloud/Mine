# ClickFlow Desktop v1 — Release Criteria

> **Status:** Step 46. These criteria gate any future v1 release. A
> **real** build cannot ship until all of them are met. Until then,
> only simulation-only builds are released.

## Hard safety gates (all required for a real build)

- [ ] Written safety review sign-off recorded in the repo.
- [ ] `docs/REAL_ACTIONS_GO_NO_GO.md` fully satisfied.
- [ ] `realDesktopActions` enabled only in a dedicated, opt-in build —
      never the default download.
- [ ] Action pipeline blocks real mode by default; multi-condition gate
      verified.
- [ ] Per-run user confirmation flow implemented and tested.
- [ ] Persistent, redacted audit logs (no screenshots/base64/paths/PII).
- [ ] Emergency stop interrupts a real run within one action cycle.
- [ ] Per-OS permissions handled with graceful degradation.
- [ ] Target allowlist + permanent denylist enforced
      (no banking/payment/protected apps).

## Functional criteria

- [ ] Real `click`, `image_click`, `text_click` work behind the gate.
- [ ] Simulation mode remains the default and is unaffected.
- [ ] Scenario metadata `version: 1` migration is stable.
- [ ] Run summaries recorded for each run.

## Quality criteria

- [ ] `npm install`, `npm run smoke`, `npm start`, `npm run pack`,
      `npm run dist` all pass.
- [ ] Manual packaged-app QA on Windows, macOS, Linux.
- [ ] Soak test: no crashes, no memory growth over a long run.
- [ ] i18n parity (RU === EN key counts).

## Invariants (must hold in every build)

- [ ] `contextIsolation: true`, `nodeIntegration: false`, CSP not
      weakened.
- [ ] No `robotjs` / `iohook` / `uiohook-napi` / OpenCV in default
      build.
- [ ] No real action auto-runs at app start.
- [ ] No screenshots written to disk; no `imageDataUrl` persisted.

## Release lines

- Simulation-only builds: released from `main` (`v0.2.x`).
- Real build: released from `v1-desktop` only after every hard safety
  gate above is checked off. See `docs/FULL_PRODUCT_BRANCH_PLAN.md`.
