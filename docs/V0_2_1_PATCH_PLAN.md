# ClickFlow `v0.2.1` — Patch Plan

> **Status:** Step 45 — planning a possible bugfix release after the
> Smart Desktop Beta (`v0.2.0-smart-beta`).
>
> `v0.2.1` is a **bugfix-only** patch line. It exists to fix
> problems found by beta testers without changing what the product
> does. It introduces **no new large features** and **no real
> desktop clicks**.
>
> ClickFlow stays **simulation-only**: `realDesktopActions: false`,
> `simulationOnly: true`, `nodeIntegration: false`,
> `contextIsolation: true`, CSP unchanged. The action pipeline keeps
> rejecting every `realClick: true`.

---

## Scope

- Target version: `v0.2.1` (`package.json` `version` would become
  `0.2.1-beta` or `0.2.1` depending on the release decision at the
  time).
- Goal: stabilize `v0.2.0-smart-beta` based on post-release feedback.
- Source of work: the P0/P1 items triaged via
  `docs/FEEDBACK_TRIAGE.md`.
- Out of theme: anything that adds capability, changes the safety
  model, or requires a safety review.

## Allowed changes

- **Crash fixes** — anything that prevents launch or crashes a flow.
- **Broken UI fixes** — layout breakage, unclickable controls,
  broken tab switching, dark-theme regressions.
- **Missing translations** — add or correct RU / EN strings;
  preserve i18n parity.
- **Packaging fixes** — installer, `build.files`, artifact, or
  `electron-builder` configuration problems.
- **Smoke-check fixes** — repair or extend `scripts/smoke-check.js`
  invariants (the check must stay Electron-free and network-free).
- **Docs corrections** — fix wrong instructions, dead links, typos.
- **Minor UX improvements** — small, low-risk polish that does not
  add a new feature (e.g. clearer error text, a disabled-state fix).

## Not allowed changes

- **Real desktop clicks** — no real mouse or keyboard input.
- **New OCR engine changes** — no new OCR engine, no auto-run OCR,
  no bundling work beyond what already shipped.
- **New OpenCV** — no `opencv*`, no native image-matching libraries.
- **Mobile version** — no Android / iOS port.
- **Major refactor** — no large architectural rewrites.
- Any **permanently out-of-scope** capability: captcha / antibot
  bypass, ad-click automation, banking / payment / protected-app
  automation.

> Forbidden dependencies (must not be added): `robotjs`, `nut.js` /
> `nut-js` / `@nut-tree/nut-js`, `iohook`, `uiohook-napi`,
> `node-key-sender`, `opencv*`, `opencv.js`.

## Candidate fixes

This list is populated from triage. Items are examples of the
**kind** of fix that belongs in `v0.2.1`; the real list comes from
issues.

- [ ] (P0) Any S0 safety regression found after the beta.
- [ ] (P0/P1) Any S1 launch failure on a supported OS.
- [ ] (P1) Core-flow (S2) bugs: scenario create/run/stop, settings,
      import/export, emergency stop.
- [ ] (P1) Smart-features tab bugs that block authoring drafts.
- [ ] (P1) Packaging / installer defects.
- [ ] (P1/P2) Missing or wrong RU/EN translations.
- [ ] (P2) Documentation corrections.

## QA checklist

Before tagging `v0.2.1`:

- [ ] `npm install` succeeds.
- [ ] `npm run smoke` passes (0 failures).
- [ ] `npm start` launches the app.
- [ ] `npm run pack` and `npm run dist` succeed.
- [ ] Manual packaged-app QA per `docs/PACKAGED_APP_QA.md` on at
      least one target OS.
- [ ] Verify **no real clicks**: diagnostics show
      `simulationOnly: true`, `realDesktopActions: false`,
      `realClick=false`.
- [ ] Each fixed issue has a reproduction confirmed as resolved.
- [ ] i18n parity preserved (RU count === EN count).

## Release checklist

- [ ] Update `CHANGELOG.md` with the `v0.2.1` entry.
- [ ] Update `RELEASE_NOTES.md` if user-facing behavior changed.
- [ ] Bump `package.json` `version`.
- [ ] Follow `docs/TAG_AND_RELEASE_GUIDE.md` for the tag /
      pre-release publication (tagging stays a manual step).
- [ ] Mark the GitHub release as a **pre-release**.
- [ ] Confirm the release notes restate the simulation-only model
      and "no real clicks".
- [ ] Update `docs/POST_RELEASE_CHECKLIST.md` usage for the new tag.
