# Contributing to ClickFlow

Thanks for your interest in ClickFlow. This document is the short
version of "how to work on this codebase without breaking the safety
model". Please read it before opening a pull request.

> **ClickFlow is a simulation-only beta.** Any change that introduces
> real input emulation (mouse / keyboard), OCR, image recognition,
> or platform-level automation **must** go through a separate safety
> review (see [Safety review gate](#safety-review-gate)).

---

## Project at a glance

- **Stack:** Electron 28+, vanilla JavaScript, HTML, CSS.
- **No frameworks:** no React, no Vue, no Angular, no TypeScript,
  no bundler. Renderer is loaded via plain `<script>` tags.
- **Process model:**
  - `main.js` — Electron main process, owns IPC handlers, dialog,
    tray, application menu, global shortcuts, lifecycle.
  - `preload.js` — contextBridge surface; the **only** way the
    renderer talks to Node.
  - `src/*.js` — renderer-side modules (state, scenarios, profiles,
    settings, click-engine, error-manager, logger, i18n, renderer).
- **Persistence:** JSON files under Electron `userData`
  (`scenarios.json`, `settings.json`, `profiles.json`).

---

## Run locally

Requires Node.js 18+ and npm.

```bash
git clone https://github.com/Citrus-cloud/Mine.git clickflow
cd clickflow
npm install
npm start
```

Other scripts:

| Script         | Purpose                                  |
|----------------|------------------------------------------|
| `npm start`    | Run the app via Electron.                |
| `npm run dev`  | Same — kept for parity.                  |
| `npm run pack` | `electron-builder --dir` (unpacked).     |
| `npm run dist` | `electron-builder` (installer / image).  |

For packaging details, see `docs/PACKAGING.md`.

---

## Architecture rules

These rules exist to keep the safety model intact. Do not relax them
without a safety review.

### Electron security

- `contextIsolation: true` — **never** disable.
- `nodeIntegration: false` — **never** enable.
- The renderer **must not** import Node modules directly.
- The renderer **must not** receive a raw `ipcRenderer`. The only IPC
  surface is `window.clickflow.*` defined in `preload.js`.
- The CSP `<meta>` tag in `src/index.html` must remain
  `default-src 'self'; script-src 'self'; style-src 'self';`.
  Do not add `unsafe-inline`, `unsafe-eval`, or remote sources.
- All system operations (file dialogs, file I/O, global shortcuts,
  tray, menu, system info) live in `main.js`.

### DOM safety

- User-provided data (scenario name, description, log message,
  profile name, error message, settings JSON) must be rendered with
  `element.textContent`, **never** `innerHTML`.
- The only legal use of `innerHTML` is `container.innerHTML = ''` to
  clear a container before re-rendering. Even then, prefer
  `replaceChildren()` if you are touching the code.
- Do **not** call `eval`, `Function(...)`, `setTimeout('string',...)`,
  or load remote scripts.

### Localization

- All UI text is in `src/i18n.js` under both `ru` and `en`.
- New UI text must be added under **both** locales in the same PR.
- In HTML, prefer the `data-i18n="key"` attribute and rely on
  `applyTranslations()`. For dynamic UI, call `t('key')` and assign
  to `textContent`.

### IPC

- Add new IPC handlers in `main.js` and expose them via
  `preload.js`. Never expose `ipcRenderer` itself.
- Validate all IPC inputs in main. Treat the renderer as untrusted
  for the purposes of writing files.
- Reject obviously malformed payloads before touching `fs.*`.

### Diagnostics

- Diagnostics output (UI panel and clipboard) **must not** include
  user paths, `userData` paths, machine names, or anything that
  could leak private filesystem topology.
- It is fine to ship: app version, Electron version, platform/arch,
  `isPackaged`, counts of scenarios / profiles / logs / errors,
  feature flags such as `simulationOnly: true`.

### Style / CSS

- All styles live in `src/styles.css`. Sections are numbered.
- Use existing design tokens (`--space-*`, `--radius-*`,
  `--shadow-*`, color tokens). Add new tokens only when the same
  value will be reused at least three times.
- Dark theme is driven by the `[data-theme="dark"]` attribute on the
  `<html>` element. New components must include a dark-theme override
  if they introduce new colored surfaces.
- No CSS frameworks. No `<link>` to remote stylesheets.

---

## Safety review gate

The following changes are **not** routine PRs. They require an
explicit safety review and an explicit, opt-in user confirmation
flow inside the app:

- Real mouse / keyboard input (`robotjs`, `nut.js`, `iohook`,
  `node-key-sender`, native addons, kernel hooks, etc.).
- OCR (`tesseract`, cloud OCR, etc.).
- Image recognition / template matching / OpenCV.
- Network calls outside `localhost`.
- Mobile build targets.
- Anything that could be used for captcha bypass, antibot bypass,
  ad-click automation, automation against banking / payment /
  protected applications.

If your idea touches any of those, please first file a
**Safety report** issue using
`.github/ISSUE_TEMPLATE/safety_report.md`. We will discuss the
threat model, the user-confirmation flow, and the audit-log
requirements **before** any code is written.

ClickFlow `0.1.x` ships **simulation-only**. Real input is targeted
at `0.3.x`, behind a separate safety gate.

---

## Pull request checklist

Use the PR template at `.github/pull_request_template.md`. The
short version:

- [ ] Targets `main`.
- [ ] No frameworks added (React / Vue / TS / bundler).
- [ ] No new direct `ipcRenderer` usage in renderer.
- [ ] No `nodeIntegration` toggling.
- [ ] No new `innerHTML` with user data.
- [ ] All new UI strings exist in both `ru` and `en` in `i18n.js`.
- [ ] `npm start` works.
- [ ] Manual smoke test from `docs/SMOKE_TESTS.md` passes.
- [ ] If diagnostics changed: no private paths leak.
- [ ] If safety-sensitive (see [gate](#safety-review-gate)): linked
      safety report issue + design notes.

---

## Coding style

- Vanilla JavaScript, ES2020+, semicolons.
- Indent: 2 spaces.
- Filenames: `kebab-case.js`.
- One module per file. Renderer modules expose top-level functions
  consumed by `renderer.js`. `main.js` keeps all IPC.
- Keep functions short. If a function exceeds ~80 lines, split it.

---

## Reporting issues

- **Bug** — `.github/ISSUE_TEMPLATE/bug_report.md`.
- **Feature request** — `.github/ISSUE_TEMPLATE/feature_request.md`.
- **Safety concern** — `.github/ISSUE_TEMPLATE/safety_report.md`.

Please be patient — this is a small, slow-paced project.
