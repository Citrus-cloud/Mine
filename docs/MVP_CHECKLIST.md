# ClickFlow — MVP Checklist

Status as of `0.1.0-beta` (Step 14).

## 1. Core functionality

- [x] Electron window launches.
- [x] Main screen with status, scenario, progress.
- [x] Start / Stop buttons work (simulation mode).
- [x] Scenario execution with progress bar.
- [x] Emergency stop (Escape, in-window).
- [x] Double-start protection.
- [x] Hotkeys (in-window): `Ctrl+Alt+S`, `Ctrl+Alt+X`, `Escape`.
- [x] Global hotkeys via `globalShortcut`:
      `CmdOrCtrl+Alt+S/X/E`.

## 2. Safety

- [x] Safe mode enabled by default.
- [x] Minimum interval enforced (50 ms default).
- [x] Maximum repeat count enforced (100 000 default).
- [x] Emergency stop always available.
- [x] No real system clicks.
- [x] `contextIsolation: true`.
- [x] `nodeIntegration: false`.
- [x] CSP `default-src 'self'; script-src 'self'; style-src 'self';`
      not relaxed.
- [x] Diagnostics do not leak private filesystem paths.

## 3. Localization

- [x] Russian (default).
- [x] English.
- [x] Language switch in settings (immediate).
- [x] Language persists between sessions.
- [x] All UI text via the i18n system.
- [x] New beta-polish keys (`simulationBadge`, `safeBadge`,
      `betaVersion`, `knownLimitations`, `roadmap`,
      `releaseNotes`, etc.) present in RU and EN.

## 4. Settings persistence

- [x] Settings save to `userData/settings.json`.
- [x] Settings load on startup.
- [x] Settings normalize on load (fill defaults).
- [x] Settings export / import.
- [x] Settings reset.

## 5. Scenario persistence

- [x] Scenarios save to `userData/scenarios.json`.
- [x] Scenarios load on startup.
- [x] Default scenario always present.
- [x] Create / edit / delete user scenarios.
- [x] Scenario validation.

## 6. Profiles

- [x] Default profiles (default / work / testing / personal).
- [x] Active profile selection.
- [x] Profiles save to `userData/profiles.json`.
- [x] Profile display in advanced dashboard.

## 7. Import / export

- [x] Export all scenarios.
- [x] Export custom (non-default) scenarios.
- [x] Backup scenarios.
- [x] Import scenarios with preview.
- [x] Conflict resolution (duplicate id / name).
- [x] Export settings.
- [x] Import settings with validation.

## 8. Diagnostics

- [x] Technical summary in advanced dashboard.
- [x] Copy diagnostics to clipboard.
- [x] Error history tracking.
- [x] Error manager with codes.
- [x] No private filesystem paths in copied diagnostics.

## 9. Accessibility

- [x] Semantic HTML structure.
- [x] Button elements for interactive controls.
- [x] Disabled states visually clear.
- [x] Status indicator uses color **and** text.
- [x] `:focus-visible` ring on all interactive controls.
- [ ] `aria-label` for icon-only buttons (planned in 0.1.x polish).
- [ ] `aria-live` for status updates (planned).
- [ ] Full keyboard-navigation audit (planned).

## 10. Security

- [x] No `eval()`.
- [x] No `innerHTML` with user data
      (only `= ''` for clearing containers).
- [x] `textContent` for all user-provided text.
- [x] JSON import validation.
- [x] Settings JSON validation.
- [x] IPC wrapper (no direct `ipcRenderer` exposure).
- [x] File dialogs via main process only.
- [x] No dangerous Node.js access in renderer.
- [x] CSP not relaxed.

## 11. Beta polish (Step 13)

- [x] Main screen polished — simulation badge, version badge,
      animated status indicator.
- [x] Advanced dashboard polished — tab states, card shadows,
      log filter chips.
- [x] Forms polished — focus ring via `box-shadow`, disabled,
      `is-invalid` hook, hint helpers.
- [x] Dark theme rewritten — full token override + per-component
      overrides.
- [x] `styles.css` reorganized into 16 numbered sections with
      design tokens (spacing, radius, shadow, focus ring).
- [x] Responsive layout for 1000 x 700 advanced window.
- [x] `assets/` directory + local SVG icon.
- [x] Security review confirmed CSP / textContent / no leaks.

## 12. Release preparation (Step 14)

- [x] `CHANGELOG.md` (0.1.0-beta).
- [x] `RELEASE_NOTES.md`.
- [x] `CONTRIBUTING.md`.
- [x] `.github/ISSUE_TEMPLATE/bug_report.md`.
- [x] `.github/ISSUE_TEMPLATE/feature_request.md`.
- [x] `.github/ISSUE_TEMPLATE/safety_report.md`.
- [x] `.github/pull_request_template.md`.
- [x] `docs/BETA_TESTING_GUIDE.md`.
- [x] `docs/KNOWN_LIMITATIONS.md`.
- [x] `docs/ROADMAP.md`.
- [x] `README.md` updated for `0.1.0-beta`, RU + EN summary.
- [x] `PROJECT_CONTEXT.md` updated to Step 14.
- [x] No-real-clicks verification path documented.

## 13. Final stabilization (Step 15)

- [x] `docs/FINAL_BETA_REVIEW.md` — go/no-go style summary.
- [x] `scripts/README.md` and `scripts/smoke-check.js`.
- [x] `npm run smoke` wired in `package.json`.
- [x] Beta health card in Advanced → Safety
      (simulationOnly, realClicksImplemented, ocrImplemented,
      imageRecognitionImplemented, docsReady, packagingConfigured,
      securityChecklistPresent, actionSchemaPresent).
- [x] Corrupted-JSON guard in `main.js`: scenarios / settings /
      profiles loaders rename broken files to `<file>.broken-<ts>`
      and fall back to defaults without crashing.
- [x] Renderer surfaces corruption fallback as a warning log entry
      and an entry in the error history (`CORRUPT_*_JSON` codes).
- [x] Reset / import / export flows always emit a localized log
      entry on success, cancel, and failure.
- [x] `docs/SMOKE_TESTS.md` updated with `npm run smoke` and
      corrupted-JSON / reset / import-failure tests.

## 14. Handoff to next big branch (Step 16)

- [x] `src/feature-flags.js` (frozen safe defaults: `realDesktopActions: false`,
      `ocr: false`, `imageRecognition: false`, `simulationOnly: true`).
- [x] Diagnostics show feature flags read-only.
- [x] `Next safety milestone` card in Advanced → Future (every
      milestone planned, real mode disabled).
- [x] `docs/REAL_ACTIONS_GO_NO_GO.md` — gate for any future real-input
      shipping.
- [x] `docs/FEATURE_FLAGS.md` — runtime flag layer documentation.
- [x] `docs/AUDIT_LOG_PLAN.md` — design-only audit log doc.
- [x] `docs/PRIVACY.md` — single-page privacy explainer.
- [x] `README.md` updated to step 16.
- [x] `PROJECT_CONTEXT.md` updated to step 16.
- [x] `CHANGELOG.md` updated with steps 15-16.

## 15. Documentation

- [x] `README.md` with full history and `0.1.0-beta` status.
- [x] `PROJECT_CONTEXT.md`.
- [x] `RELEASE_NOTES.md`.
- [x] `CHANGELOG.md`.
- [x] `CONTRIBUTING.md`.
- [x] `docs/TEST_PLAN.md`.
- [x] `docs/MVP_CHECKLIST.md` (this file).
- [x] `docs/SMOKE_TESTS.md`.
- [x] `docs/SECURITY_CHECKLIST.md`.
- [x] `docs/PACKAGING.md`.
- [x] `docs/DESKTOP_ADAPTER_PLAN.md`.
- [x] `docs/ACTION_SCHEMA.md`.
- [x] `docs/BETA_TESTING_GUIDE.md`.
- [x] `docs/KNOWN_LIMITATIONS.md`.
- [x] `docs/ROADMAP.md`.

## 16. Final stabilization & handoff docs (Steps 15-16)

- [x] `docs/FINAL_BETA_REVIEW.md`.
- [x] `docs/REAL_ACTIONS_GO_NO_GO.md`.
- [x] `docs/FEATURE_FLAGS.md`.
- [x] `docs/AUDIT_LOG_PLAN.md`.
- [x] `docs/PRIVACY.md`.
- [x] `scripts/README.md` and `scripts/smoke-check.js`.

## 17. Controlled action pipeline & safety gates (Step 17)

- [x] `src/action-pipeline.js` — `executeAction`, `validateAction`,
      `evaluateActionSafety`, `createActionContext`,
      `executeSimulatedAction`, `blockRealAction`,
      `canExecuteRealAction` (always false),
      `getActionPipelineStatus`. Real-action requests blocked with
      explicit error and audit event.
- [x] `src/safety-gates.js` — predicate layer with
      `isRealActionAllowed` hard-coded false and
      `getRealActionRequirements` returning the 9-item contract.
- [x] `src/audit-events.js` — in-memory event store with fixed
      allowlist. **No file persistence.**
- [x] `click-engine.js` dispatches through `executeAction`.
- [x] Renderer audit instrumentation at start / approved-start /
      stop / completed / emergency-stop / import / export /
      settings.
- [x] Advanced → Safety: cards Action pipeline, Safety gates,
      Real actions readiness, Audit events.
- [x] `Copy diagnostics` includes pipeline / gates / audit lines.
- [x] `npm run smoke` covers Step 17 invariants and new files.
- [x] Docs updated: `REAL_ACTIONS_GO_NO_GO`, `DESKTOP_ADAPTER_PLAN`,
      `AUDIT_LOG_PLAN`, `ACTION_SCHEMA`, `SECURITY_CHECKLIST`,
      `SMOKE_TESTS`, README, PROJECT_CONTEXT, CHANGELOG.

## 18. Desktop adapter interface, mock adapter, registry (Step 18)

- [x] `src/desktop-adapter-interface.js` — adapter contract,
      `validateAdapterAction`, `normalizeAdapterAction`,
      `createAdapterResult`, `getSupportedAdapterActions`,
      `getAdapterContract`, `isRealAdapterAllowed` (hard-coded false).
- [x] `src/mock-desktop-adapter.js` — only `available: true`
      adapter. `executeMockAction`, `runMockAdapterSelfTest` (4
      pure-JS checks), `getMockAdapterStatus`. No OS input.
- [x] `src/adapter-registry.js` — registry with mock active by
      default. `setActiveAdapter("real-desktop")` blocks and
      emits `adapter.selection.blocked` + `adapter.real.unavailable`.
- [x] `src/action-pipeline.js` — simulate path now routes through
      active adapter. Defensive against any adapter that claims
      `realActions: true`.
- [x] `src/audit-events.js` allowlist gained 6 adapter event types.
- [x] Advanced → Safety: **Desktop adapter status** card with
      "Run adapter self-test" button.
- [x] `Copy diagnostics` includes `Adapter:` line.
- [x] `npm run smoke` covers Step 18 invariants and new files.
- [x] `docs/ADAPTER_INTERFACE.md` created.
- [x] Docs updated: `DESKTOP_ADAPTER_PLAN`,
      `REAL_ACTIONS_GO_NO_GO`, `ACTION_SCHEMA`,
      `SECURITY_CHECKLIST`, `SMOKE_TESTS`, README,
      PROJECT_CONTEXT, CHANGELOG.

## 17. Known limitations (single source of truth)

See [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md). Highlights:

- Real system clicks **not implemented** (simulation only).
- OCR **not implemented**.
- Image recognition **not implemented**.
- Mobile version **not implemented**.
- Cloud sync **not implemented**.
- Auto-update **not implemented**.
- Code signing **not configured**.
- Tray icon ships empty placeholder.
- No automated tests yet (manual `SMOKE_TESTS.md` only).
- Captcha / antibot bypass, ad-click automation, automation against
  banking / payment / protected applications — **permanently out of
  scope**.
