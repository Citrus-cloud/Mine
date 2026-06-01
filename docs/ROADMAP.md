# ClickFlow — Roadmap

This roadmap is intentionally short. ClickFlow is a small, slow-paced
project that prioritizes **safety** and **simplicity** over speed and
breadth. Each release line below lists the goals; nothing on this
roadmap is a commitment.

> **Hard rule.** No release will ever introduce captcha bypass,
> antibot bypass, ad-click automation, or automation against banking /
> payment / protected applications. These are permanently out of scope.
> See `docs/KNOWN_LIMITATIONS.md`.

---

## Current line — Smart Desktop Beta (`v0.2.0-smart-beta`)

`v0.2.0-smart-beta` is the current Smart Desktop Beta pre-release
(`package.json` `version: "0.2.0-beta"`). It is **simulation-only**.
The smart-features chain (Screen Capture → Region Selector →
Templates → Template Matching → image_click → Mock/Real-session OCR
→ text_click → Visual Builder → Scenario Presets) is feature-complete
and audited; the project is in post-release cleanup + feedback
tracking (Step 45). See `docs/POST_RELEASE_CHECKLIST.md` and
`docs/FEEDBACK_TRIAGE.md`.

## Desktop v1 (`v1-desktop` branch) — Step 46 foundation

The full Desktop v1 line. **Real desktop actions remain disabled until
a written safety review passes** — Step 46 only lays the architecture +
safety foundation (no real clicks).

- [x] v1 product plan + implementation checklist + branch model
      (`docs/V1_DESKTOP_PRODUCT_PLAN.md`,
      `docs/V1_IMPLEMENTATION_CHECKLIST.md`,
      `docs/FULL_PRODUCT_BRANCH_PLAN.md`).
- [x] v1 safety docs + action pipeline v1-ready (blocks real by
      default).
- [x] Persistent audit log manager (in-memory + prepared persistence).
- [x] Permission manager (status/guidance only).
- [x] Real desktop adapter **interface** (execution disabled).
- [x] Safety Center UI + V1 readiness + scenario v1 metadata + run
      summaries.
- [ ] **Real desktop adapter** (separate `v1-desktop` branch, behind a
      feature flag, after safety review). Candidate backend: nut.js
      (`docs/NUTJS_INTEGRATION_PLAN.md` — plan only).
- [ ] Per-run confirmation flow, OS permission probes, persisted audit
      file, real-mode test matrix.

Branch model: `main` (stable smart beta), `v1-desktop` (real desktop
work), `hotfix/v0.2.x` (smart-beta bugfixes, no real clicks),
`v1-android-research` (Android future research). See
`docs/FULL_PRODUCT_BRANCH_PLAN.md`. No captcha / anti-bot / ad-click /
banking automation, ever.

## v0.2.1 — Bugfix patch (next)

Theme: stabilize the smart beta from feedback. **Bugfix-only — no
new features, no real clicks.** See `docs/V0_2_1_PATCH_PLAN.md`.

- [ ] Bugfixes (crash / core-flow / smart-features tab bugs).
- [ ] Packaging fixes (installer / `build.files` / artifacts).
- [ ] UI fixes (layout, dark theme, broken controls).
- [ ] Translation fixes (RU / EN parity).
- [ ] Docs fixes (wrong instructions, dead links, typos).

Still simulation-only. No `robotjs` / `nut.js` / `iohook` /
`uiohook-napi` / OpenCV. No new OCR engine, no mobile, no major
refactor.

## v0.3.0 — Real desktop adapter (research branch, gated)

Theme: research a *possible* real desktop-action adapter. **Planning
only — real desktop actions remain disabled until a written safety
review passes.** See `docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`.

- [ ] Real desktop adapter research branch (separate from release
      branches).
- [ ] Safety gates (reuse the existing six-layer model).
- [ ] Audit persistence (persisted audit logs; see
      `docs/AUDIT_LOG_PLAN.md`).
- [ ] Feature flag (real adapter behind a dedicated, default-off
      flag; `realDesktopActions` stays off and out of the runtime
      whitelist).
- [ ] Confirmation flow (explicit, per-scenario, per-run user
      confirmation).
- [ ] OS permissions (macOS / Windows / Linux X11+Wayland; fail
      closed when denied).
- [ ] Emergency stop audit (Escape / global hotkey / focus-loss;
      verified to halt a real run within one action cycle).

The action pipeline must block real actions **by default**. No
captcha / anti-bot bypass, no ad-click automation, no banking /
payment / protected-app automation — ever.

## Future research (no release line yet)

No commitment that these will ship.

- [ ] Improved OCR (local-only; never sends screenshots off-device).
- [ ] Better template matching (local-only authoring helper).
- [ ] Android research (read-only companion concept only; no
      automation control from mobile).
- [ ] Plugin system (heavily sandboxed; requires a separate safety
      review and a permission model first).

---

## 0.1.x — Beta polish (current line)

Theme: harden, polish, document the simulation-only MVP.

- [x] Step 13 — visual polish, dark theme, design tokens, assets.
- [x] Step 14 — release scaffolding (CHANGELOG, RELEASE_NOTES,
      CONTRIBUTING, GitHub templates, beta testing guide,
      known limitations, this roadmap).
- [ ] Accessibility pass: `aria-label` for icon-only buttons,
      `aria-live="polite"` for status updates, full keyboard
      navigation across the Advanced dashboard.
- [ ] Automated smoke harness (Playwright or Spectron alternative)
      that verifies: app boots, no real input fires, dark theme is
      visually stable, RU/EN switch works.
- [ ] Tray icon ships a real PNG / ICO / ICNS for packaged builds.
- [ ] Code-signing notes & first signed builds (Win + macOS).

Release target: a tagged `v0.1.0-beta` GitHub pre-release after this
work is merged.

---

## 0.2.x — Profiles, templates, import / export polish

Theme: better authoring of scenarios; safer data exchange.

- [ ] Per-profile default scenario.
- [ ] Scenario templates (a small library of useful examples,
      simulation-only).
- [ ] Drag-and-drop reorder for scenarios within a profile.
- [ ] Richer import: dry-run mode, conflict resolution UI for name
      collisions, partial import.
- [ ] Richer export: choose by tag / profile / date.
- [ ] Better error reporting: error groups in diagnostics, "open
      diagnostics for this error" link from the toast / log entry.
- [ ] Optional encrypted backups (passphrase-protected JSON).

Still simulation-only. No new input capability ships in `0.2.x`.

---

## 0.3.x — Desktop action adapter (gated)

Theme: introduce the *possibility* of real desktop input — behind a
mandatory safety review.

This release line will only ship after:

1. A complete **safety review** of the desktop adapter design.
2. An explicit **per-scenario user confirmation** flow.
3. **Audit logs** of every real action, with timestamps and a
   visible counter on the main screen.
4. A hard-coded **kill switch**: any active real-input scenario
   stops on `Escape`, on focus loss of the ClickFlow window if the
   user opted into that, and on global emergency hotkey.
5. **Allowlist** of supported targets — and an explicit denylist
   for any restricted application class.

Until those five items land, the adapter ships as a non-functional
prototype: scenarios can be marked "real-action" in their schema,
but the engine refuses to run them and shows a notice instead.

See `docs/DESKTOP_ADAPTER_PLAN.md` and `docs/ACTION_SCHEMA.md` for
the design.

---

## Future research (no release line yet)

These are **research items**. There is no commitment that they will
ever ship.

- **OCR.** Possible local-only OCR (e.g. Tesseract) for scenario
  authoring assistance, never as a runtime dependency. Out of scope
  if it would require sending screenshots off-device.
- **Image recognition / template matching.** Possible local-only
  helper for scenario authoring. Same constraints as OCR.
- **Mobile companion.** A possible read-only companion app for
  inspecting a desktop ClickFlow's state over a local network, with
  authentication and explicit user pairing. No automation control
  from mobile.
- **Plugin system.** A heavily sandboxed plugin model. Would
  require a separate safety review and a permission system before
  any plugin can run.

None of the above will land before the `0.3.x` safety gate is in
place.

---

## How decisions are made

- A roadmap item is promoted to a release line only after a written
  design and a written safety review (where applicable).
- A release line is closed when its checklist is complete or when
  reality forces a re-scope. In the latter case, the roadmap is
  updated and the change is logged in `CHANGELOG.md`.
- "Permanently out of scope" items in `docs/KNOWN_LIMITATIONS.md`
  are not negotiable through a feature request. Use a Safety report
  if you believe one is being violated.
