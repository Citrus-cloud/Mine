# Release Blockers — ClickFlow 0.1.0-beta

This page tracks anything that blocks publishing the
`v0.1.0-beta` GitHub Release. It is updated at the close of every
step that touches release readiness.

## Status

- **Current status:** **Pending manual verification.**
  No automated/static release blockers at this stage. All
  static / structural / source-level checks pass at the close of
  step 24. **Manual packaged-app QA on at least one target OS
  is still required before publishing.** See
  [`docs/PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md) and
  [`docs/PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md).
- **Smoke check:** `npm run smoke` reports `Failed: 0` (170+ checks
  at step 24).
- **Last updated:** end of Step 24 — Final beta release
  preparation.

---

## Blockers

| ID  | Severity | Area | Description | Status | Notes |
|-----|----------|------|-------------|--------|-------|
| —   | —        | —    | _No known automated/static release blockers at this stage. Manual packaged-app QA on at least one target OS is still required before publishing._ | — | The walk may add entries to this table. |

> If you add a row here, also update **Status** above and the
> **Release decision** at the bottom of this page.

## Non-blocking known issues

These are intentional limitations or "ship later" items that do
**not** block a `0.1.0-beta` pre-release tag. Reference:
[`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md).

| ID    | Area              | Description                                                                                  | Workaround                                                                  | Planned fix      |
|-------|-------------------|----------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------|------------------|
| KNI-1 | Code signing      | Windows installers are not Authenticode-signed; SmartScreen will warn on first launch.       | First-launch dialog; document on the GitHub release page.                   | `0.1.x` polish.  |
| KNI-2 | Code signing      | macOS DMGs are not notarized; Gatekeeper will warn.                                          | Right-click → Open or System Settings → Privacy & Security → "Open anyway". | `0.1.x` polish.  |
| KNI-3 | Tray icon         | Tray ships an empty `nativeImage` placeholder.                                               | Functionality intact; no visible icon on some shells.                       | `0.1.x` polish.  |
| KNI-4 | Audit persistence | Audit events are in-memory only. No JSONL files written.                                     | None for `0.1.0-beta`. Diagnostics show counters.                           | `0.2.x`.         |
| KNI-5 | CI                | GitHub Actions is not yet wired. `npm run smoke` runs locally only.                          | Maintainer runs `npm run smoke` before tagging.                             | Step 24+.        |
| KNI-6 | Linux hotkeys     | `globalShortcut` may behave differently across X11 / Wayland / desktop environments.         | Surfaced in Advanced → Safety → Hotkey status.                              | Investigation in `0.1.x`. |
| KNI-7 | Cross-builds      | `electron-builder` is configured for the current platform only. Cross-builds are not set up. | Build on each target OS.                                                    | `0.1.x` polish.  |

## Verification notes

### Smoke-check
- `npm run smoke` — **149+ / 149+ OK, exit 0** at the close of
  step 23 (count grows with each step; current is in the smoke
  output).
- All structural / security / simulation-only / packaging /
  documentation invariants pass at source level.

### Manual QA
- The manual packaged-app QA must be walked on at least one
  target OS using
  [`docs/PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md). It cannot
  be replaced by automated checks for `0.1.0-beta`.
- The Step 20 smoke run from `docs/SMOKE_TESTS.md`
  (#115–#134) and the Step 22 release smoke sequence (#135–#150)
  are also part of the manual gate.

### Packaging
- `package.json → build` is configured for Windows NSIS, macOS
  DMG, Linux AppImage. Cross-platform builds are out of scope —
  build each target on its native OS.
- Asset names per
  [`docs/BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) §6.

### Security
- Six independent runtime layers refuse real desktop input.
  Verified at source by the smoke check and at runtime via the
  vm-based unit-style harness (every step PR has the result
  pasted into the PR description).
- CSP unchanged: `default-src 'self'; script-src 'self'; style-src 'self';`.
- `contextIsolation: true`, `nodeIntegration: false`.
- `preload.js` does not expose `ipcRenderer` directly. (Smoke
  check `preload.js does not expose ipcRenderer directly` is
  `OK`.)
- `package.json` declares no `robotjs` / `nut.js` / `iohook` /
  `uiohook-napi` / `node-key-sender`.

### Localization
- 368 `ru` keys = 368 `en` keys, 0 mismatches.
- All 55 `data-i18n` attributes and all 237 `t()` calls resolve
  in both locales.
- See [`docs/I18N_CHECKLIST.md`](./I18N_CHECKLIST.md) for the
  manual review.

## Release decision

**Ready after manual packaged-app QA.**

Static and source-level checks all pass. The remaining gate is
the manual walk-through in `docs/PACKAGED_APP_QA.md` performed
against an actual `npm run pack` / `npm run dist` artifact on at
least one target OS. Update this page if that walk discovers any
blocker.



---

## Desktop v1 Alpha blockers (Step 51)

- **Current status (v1 alpha):** No known automated/static blockers for
  Desktop v1 Alpha. `npm run smoke` reports `Failed: 0`. Manual
  packaged-app QA on at least one target OS is still required before
  publishing `v1.0.0-alpha.1`.
- **Release target:** `v1.0.0-alpha.1` (pre-release/alpha).

| ID | Severity | Area | Description | Status | Notes |
|----|----------|------|-------------|--------|-------|
| —  | —        | —    | _No known automated/static blockers for Desktop v1 Alpha._ | — | Manual packaged-app QA still required. |

Safety posture unchanged: real coordinate click disabled by default,
session-only, one click per fresh confirmation; real image/text and
keyboard automation disabled; no prohibited dependencies;
`contextIsolation: true`, `nodeIntegration: false`, CSP unchanged.

**Release decision (v1 alpha):** Ready for Desktop v1 Alpha pre-release
after manual packaged-app QA.
