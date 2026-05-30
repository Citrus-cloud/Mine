# Screen Capture (Step 25)

ClickFlow `0.1.x` has a **screen-capture foundation**. This document
describes what the foundation is, what it deliberately is **not**, and
the safety/privacy contract it ships with.

> Status: **simulation-only** and **preview-only**. The
> screen-capture subsystem only produces preview thumbnails. No
> real clicks, no OCR, no image recognition, no automatic actions
> of any kind are ever taken on the captured pixels.

---

## 1. Purpose

The screen-capture foundation exists so that future ClickFlow steps
can build smart visual features on top of a small, audited entry
point. The features themselves are out of scope for `0.1.x`. The
roadmap targets:

- "click on a found image / icon",
- "click on a found text",
- "screen-region selection",
- "template matching against a screenshot",
- "OCR",
- "visual scenario builder".

None of those features are implemented in Step 25. Step 25 only adds
the plumbing that lets a future step read pixels safely.

---

## 2. Current status

- IPC: three handlers in `main.js`
  (`screen-capture:list-sources`, `screen-capture:capture-preview`,
  `screen-capture:get-status`).
- Preload API: `window.clickflow.screenCapture.{listSources,
  capturePreview, getStatus}` (no raw `ipcRenderer`).
- Renderer client: `src/screen-capture-client.js`.
- Renderer state: `appState.screenCapture` slice in
  `src/app-state.js`.
- Renderer UI: Advanced dashboard → **Screen Capture** tab
  (`src/screen-capture-ui.js`, `src/index.html`).
- Diagnostics: a compact `screen capture status` card in
  Advanced → Safety, plus a `Screen capture: ...` line in
  `Copy diagnostics`.
- Audit events: six allowlisted types in `src/audit-events.js`
  (`screen.capture.sources.requested`,
  `screen.capture.sources.loaded`,
  `screen.capture.preview.requested`,
  `screen.capture.preview.created`,
  `screen.capture.preview.cleared`,
  `screen.capture.error`).
- Localisation: 24 RU + 24 EN keys in `src/i18n.js`.
- Smoke check: extended in `scripts/smoke-check.js`.

---

## 3. What works

- The user can open Advanced → Screen Capture.
- "Refresh sources" lists available `screen` and `window` sources
  via Electron `desktopCapturer`.
- Each source is shown with name, type badge, and a small thumbnail.
- The user can select a source and click "Capture preview" to get
  a preview thumbnail (max ~1280×720) of that source.
- The user can click "Clear preview" to drop the in-memory preview.
- Diagnostics shows `available`, `sourcesCount`, `selectedSource`,
  `previewAvailable`, `lastCapturedAt`, `lastError`.
- All actions emit allowlisted audit events.

---

## 4. What is **not** implemented

The following are intentionally absent in Step 25 and remain blocked
by the existing safety contract:

- real mouse / keyboard input;
- automatic clicks on a found image or icon;
- automatic clicks on found text;
- screen-region selection (UI for cropping a preview);
- template matching;
- OCR;
- image recognition;
- captcha / anti-bot bypass;
- automation against banking, payment, or other protected apps;
- mobile platforms;
- saving screenshots to disk;
- screenshots taken automatically at app startup.

If any future step adds one of these, it goes through a separate
safety review per `docs/REAL_ACTIONS_GO_NO_GO.md`.

---

## 5. Privacy model

- **No disk persistence by default.** The main process never writes
  the preview to disk. The renderer never writes the preview to
  `localStorage`, `userData/scenarios.json`,
  `userData/settings.json`, or `userData/profiles.json`. The
  preview lives only in renderer memory and is dropped on tab
  re-render after `Clear preview` or after `resetScreenCaptureState()`.
- **No background capture.** The handlers are only invoked in
  response to a user click on `Refresh sources` or
  `Capture preview`.
- **Allowlisted, redacted IPC payload.** Sources are normalised to
  `{ id, name, type, thumbnailDataUrl, display_id, [width, height] }`
  before crossing the IPC boundary. No window owners, no PIDs, no
  filesystem paths, no full Electron `Display` objects are exposed
  to the renderer.
- **Source id validation.** `screen-capture:capture-preview` only
  accepts ids that begin with `screen:` or `window:` and are at
  most 200 characters; anything else is rejected.
- **Errors are generic strings.** No stack traces, native error
  messages, or PII reach the renderer.
- **Audit payloads carry no pixels.** The six allowlisted audit
  events carry only counts, ids, and source types — never an
  `imageDataUrl`.

---

## 6. No disk saving by default

ClickFlow `0.1.x` does **not** save a screenshot to disk under any
circumstance. The future "Save preview" / "Export preview" gestures
that may appear in a later step will be opt-in, gated by a system
file-save dialog, and recorded in the audit log.

---

## 7. IPC flow

```
Renderer UI (screen-capture-ui.js)
  → screen-capture-client.js
    → window.clickflow.screenCapture.{listSources, capturePreview, getStatus}
      → preload.js (contextBridge.exposeInMainWorld)
        → ipcRenderer.invoke('screen-capture:...')
          → main.js IPC handler
            → desktopCapturer.getSources(...)
              → returns normalised, allowlisted JSON
        ← preload returns the response unchanged
      ← client validates and trims to safe shape
    ← UI updates app-state and re-renders
  ← user sees thumbnails / preview / diagnostics
```

The renderer never imports Node, never imports `ipcRenderer`, and
never has access to an Electron module. `contextIsolation: true`
and `nodeIntegration: false` are unchanged from the rest of the
build.

---

## 8. Future use for image matching / OCR

The screen-capture foundation is *only* a foundation. Any step that
adds image matching, template matching, or OCR will:

1. file a safety review (`docs/REAL_ACTIONS_GO_NO_GO.md`);
2. introduce a new feature flag with safe defaults
   (`src/feature-flags.js`);
3. extend the audit allowlist (`src/audit-events.js`);
4. update this document, `docs/SECURITY_CHECKLIST.md`, and
   `docs/KNOWN_LIMITATIONS.md`;
5. extend `npm run smoke` with new invariants.

Until then, the screen-capture preview is read-only and inert.

---

## 9. Known limitations by OS

- **Windows.** `desktopCapturer.getSources` works on Win10/Win11
  without prompts in most desktop sessions. On a remote desktop
  session, thumbnails may be empty for windows that the session
  does not own.
- **macOS.** Starting with macOS 10.15 the OS may show a system
  permission prompt the first time `desktopCapturer.getSources`
  is called; the user must grant **Screen Recording** in
  System Settings → Privacy & Security. Without the grant, the
  call may return an empty source list or empty thumbnails. The
  app surfaces this in the **Screen capture status** card and as
  a notice in the sources list.
- **Linux (X11).** Works in most desktop environments.
- **Linux (Wayland).** `desktopCapturer` may return an empty list
  on strict Wayland compositors. Some compositors require
  per-application Pipewire portal grants.
- **Headless / CI.** The IPC may return
  `{ success: false, error: "Screen capture is not available on
  this system" }`. ClickFlow surfaces this in the diagnostics
  line and never crashes.

---

## 10. Files touched in Step 25

- `main.js` — desktopCapturer import, three IPC handlers, status
  bookkeeping.
- `preload.js` — `window.clickflow.screenCapture` API.
- `src/screen-capture-client.js` — renderer wrapper + memory cache.
- `src/screen-capture-ui.js` — Advanced → Screen Capture tab.
- `src/app-state.js` — `screenCapture` state slice + 7 mutators.
- `src/audit-events.js` — 6 new allowlisted event types.
- `src/i18n.js` — 24 RU + 24 EN keys.
- `src/index.html` — new tab + section + script tags.
- `src/styles.css` — Section 17, screen-capture styles.
- `src/renderer.js` — tab dispatch, diagnostics card, copy
  diagnostics line.
- `scripts/smoke-check.js` — new invariants.
- `docs/SCREEN_CAPTURE.md` (this file).
- README, PROJECT_CONTEXT, CHANGELOG, SMOKE_TESTS,
  SECURITY_CHECKLIST, KNOWN_LIMITATIONS — Step 25 entries.
