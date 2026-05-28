<!--
  Thanks for contributing to ClickFlow!
  Please read CONTRIBUTING.md before opening this PR.
  ClickFlow is a simulation-only beta; safety rules are non-negotiable.
-->

## Summary

A short description of what this PR changes and why.

## Type of change

- [ ] Bug fix (non-breaking).
- [ ] Feature (non-breaking, no safety impact).
- [ ] Refactor / cleanup (no functional change).
- [ ] Docs / templates / steering only.
- [ ] Beta polish (UI / styles / dark theme / assets).
- [ ] Release preparation (changelog / release notes / templates).
- [ ] **Safety-sensitive** — see linked issue.

## Linked issue(s)

Closes #...

## Screenshots / before-after (UI changes only)

Drop images or short clips here.

## Architecture rules — self-check

- [ ] No new framework added (React / Vue / Angular / TypeScript / bundler).
- [ ] `contextIsolation` stays `true`.
- [ ] `nodeIntegration` stays `false`.
- [ ] Renderer does **not** receive a raw `ipcRenderer`. All new IPC
      goes through `preload.js → window.clickflow.*`.
- [ ] No new `innerHTML` with user-provided data
      (clearing with `= ''` is OK; `textContent` for everything else).
- [ ] CSP `<meta>` is unchanged
      (`default-src 'self'; script-src 'self'; style-src 'self';`).
- [ ] All new UI strings exist in **both** `ru` and `en` in
      `src/i18n.js`.
- [ ] No private filesystem paths leak through diagnostics or logs.
- [ ] No real mouse / keyboard input added.
- [ ] No OCR / image recognition added.
- [ ] No network calls outside `localhost` added.

## Manual smoke test

I have run, on my machine:

- [ ] `npm install`
- [ ] `npm start`
- [ ] Main screen renders, Start / Stop work in simulation.
- [ ] Emergency Stop (Escape and `CmdOrCtrl+Alt+E`) works.
- [ ] RU ↔ EN switch works.
- [ ] Light ↔ Dark theme switch works.
- [ ] Advanced dashboard cycles through all 7 tabs without errors.
- [ ] Existing scenarios / settings / profiles still load correctly.

## Notes for reviewers

Anything specific you want the reviewer to look at — perf concerns,
known follow-ups, intentional trade-offs.
