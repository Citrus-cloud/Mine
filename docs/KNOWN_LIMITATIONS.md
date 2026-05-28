# ClickFlow — Known Limitations (0.1.0-beta)

This document is a single source of truth for what ClickFlow
**does not** do in this release. Some items are temporary; some are
permanently out of scope. Each entry says which.

---

## 1. Execution model

### 1.1 Simulation only — no real clicks
- **Status:** intentional in `0.1.x`. Targeted at `0.3.x` behind a
  separate safety review (see `docs/ROADMAP.md`).
- **Effect:** The `click-engine` does not call any OS input API.
  Scenarios run as a fully internal loop that updates progress and
  logs. No mouse movement, no key presses are emitted.
- **Why:** Real input requires careful threat modeling, explicit
  user confirmation flows, audit logs, and a kill switch. None of
  that is in place yet, so we do not ship the capability at all.

### 1.2 No keyboard automation
- **Status:** same as 1.1.

### 1.3 No native input modules
- **Status:** intentional. ClickFlow does not depend on `robotjs`,
  `nut.js`, `iohook`, `node-key-sender`, or any kernel-level hook.

---

## 2. Recognition / vision

### 2.1 No OCR
- **Status:** research item only. May appear in a future
  `0.4.x+` line and only behind a safety gate.

### 2.2 No image recognition / template matching
- **Status:** research item only. No OpenCV, no `sharp`-based
  matching shipped.

---

## 3. Platform reach

### 3.1 No mobile (iOS / Android) build
- **Status:** out of scope for this release line. Research only.
- **Effect:** the app is desktop-only via Electron.

### 3.2 Tray icon ships empty
- **Status:** temporary. The tray uses an empty `nativeImage`
  placeholder. A packaged build for public distribution must
  provide platform-specific icons; see `docs/PACKAGING.md` and
  `assets/icons/README.md`.

### 3.3 Global hotkey behavior on Linux
- **Status:** known constraint. `globalShortcut` semantics depend on
  the desktop environment, the compositor (X11 vs. Wayland), and
  permission policies. ClickFlow tries to register and reports
  success/failure via Advanced → Safety → "Hotkey status".

### 3.4 No code signing
- **Status:** temporary. `electron-builder` is configured but
  installers are not signed yet. macOS Gatekeeper and Windows
  SmartScreen will warn on first launch.

---

## 4. Sync / lifecycle

### 4.1 No cloud sync
- **Status:** intentional in `0.1.x`. May appear later as an
  optional, opt-in feature only.

### 4.2 No auto-update
- **Status:** intentional in `0.1.x`. Updates are manual: pull or
  download a new release.

### 4.3 No telemetry
- **Status:** intentional. ClickFlow does not phone home. Diagnostics
  stay on your machine and only leave it when you copy them and
  paste them into an issue.

### 4.4 No automated tests
- **Status:** temporary. Manual smoke-test plan only
  (`docs/SMOKE_TESTS.md`). An automated harness is planned for
  `0.1.x` polish.

---

## 5. UI / UX

### 5.1 Theme switch redraws, does not animate
- **Status:** acceptable. Theme change is immediate but does not
  use a smooth transition.

### 5.2 No drag-and-drop reordering of scenarios
- **Status:** planned for a later release.

### 5.3 No rich-text descriptions
- **Status:** intentional. Plain-text only, rendered through
  `textContent`, to keep the DOM safe.

### 5.4 Limited accessibility audit
- **Status:** baseline only. Focus rings exist, but a full
  accessibility audit (screen-reader labels, `aria-live` for status,
  full keyboard navigation across the dashboard) is planned in
  `0.1.x` polish.

---

## 6. Permanently out of scope

These are **never** going to be in ClickFlow:

- **Captcha bypass**, antibot bypass, "I am not a robot" defeats.
- **Ad-click automation** of any kind (publisher fraud, ad arbitrage,
  click farming).
- Automation against **banking, payment, brokerage, exchange, or
  any protected application**.
- Automation against any application whose terms of service or
  whose anti-automation controls forbid programmatic input.
- Anything designed to harass, mislead, scam, or violate the
  privacy of another user or system.

If any of these is what you are looking for, ClickFlow is not the
project for you.

---

## 7. Where to discuss / extend this list

- File a **Feature request** if the limitation is a gap that should
  be closed.
- File a **Safety report** if the limitation is being violated by
  the current build (e.g. real input being fired in a place where
  this document says it is not).
- Read `docs/ROADMAP.md` for which limitations are scheduled to
  be lifted, and when.
