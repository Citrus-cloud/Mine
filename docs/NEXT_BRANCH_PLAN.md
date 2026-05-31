# Next Branch Plan — ClickFlow

> **Step 37 — choosing the next big direction.**
>
> ClickFlow currently ships smart-features as a **simulation-only**
> dashboard. The user can capture a preview, pick a region, store
> templates, run mock template matching, run mock OCR, author
> `simple_click` / `image_click` / `text_click` scenario drafts,
> and use the Visual Builder + Scenario Presets to bootstrap a
> draft. None of these touch a real cursor, a real keyboard, or a
> real OCR engine.
>
> Three big branches are on the table for the next major step.
> This document describes each, lists prerequisites, and gives a
> recommendation. Picking one of them is **not** part of Step 37 —
> it is the next decision after Step 37 is merged.

---

## Branch A — Real OCR Integration

> **Goal:** replace the Step 32 mock OCR engine with a real one,
> while keeping clicks simulated.

**Prerequisites**

- Research the available JS OCR backends (`tesseract.js` is the
  obvious candidate; native bindings are out of scope).
- Investigate language data packaging (`eng.traineddata`,
  `rus.traineddata`) and how to ship it next to the app without
  breaking `electron-builder`'s `files` block.
- Decide on a worker setup (web worker vs Electron utility
  process). Workers must not gain `nodeIntegration`.
- Measure performance on a `1920×1080` preview with a `300×100`
  region — expected: hundreds of milliseconds for cached blocks,
  several seconds on first call.
- Define the privacy story (no network calls; recognised text
  never leaves the renderer).
- Build a fallback path so a missing language pack degrades to
  the mock engine.
- Wire a UI progress indicator (OCR currently completes
  synchronously; real OCR is async).
- Keep clicks simulated. **No real cursor work in Branch A.**

**Out of scope of Branch A**

- Real cursor / keyboard input.
- OpenCV / image-recognition replacements.
- Mobile platforms.
- Cloud OCR / external services.

**Risk profile**

- *Medium.* The biggest unknowns are language-pack size and
  per-frame performance. A misbehaving worker is annoying but
  contained.

---

## Branch B — Real Desktop Adapter

> **Goal:** flip the Step 18 mock desktop adapter to a real one
> so `simple_click` finally moves the cursor and clicks.

**Prerequisites**

- A finished safety review (`docs/REAL_ACTIONS_GO_NO_GO.md`).
- A new feature flag (`realDesktopActions`), strictly off by
  default in builds and CI.
- OS-permission handling: macOS Accessibility prompt, Wayland
  capability detection, X11 fallback, Windows UAC behaviour.
- A vetted adapter implementation (the existing `mock-desktop-
  adapter` becomes the simulator; a new `real-desktop-adapter`
  ships behind the flag).
- Audit-log persistence (currently in-memory only; design lives
  in `docs/AUDIT_LOG_PLAN.md`).
- Emergency-stop audit and a verified hotkey path.
- Hard manual QA on each target OS (Windows / macOS / Linux),
  including the packaged build.
- Real click executed only after explicit user approval inside a
  per-scenario confirmation flow.

**Out of scope of Branch B**

- Real OCR (still mock).
- Real image recognition (still preview-only matcher).
- Mobile platforms.

**Risk profile**

- *High.* Touches every safety layer: pipeline, gates, sandbox,
  adapter, audit. Any regression here is a real-world incident
  ("ClickFlow clicked something I didn't agree to"). Must not
  be merged without a manual safety review.

---

## Branch C — Android Research

> **Goal:** understand what an Android port would entail. Pure
> research; no code.

**Prerequisites**

- Map the Android Accessibility Service surface and what gestures
  it can dispatch.
- Map the MediaProjection API for screen capture and confirm the
  user-consent flow on every release.
- List the permissions a real port would request.
- Document hard limitations (per-app overlays, system UI,
  manufacturer differences).
- Decide whether the Android port lives in the same repository or
  a separate one (we recommend a separate one).
- Decide on a UI stack (Kotlin/Compose is the safe pick;
  React Native / Flutter would re-introduce framework risk).

**Out of scope of Branch C**

- Any code change in the existing Electron app.
- iOS — Apple does not expose a comparable API.

**Risk profile**

- *Low (during research).* This is a paper exercise. The risk
  appears only when we start writing code, at which point the
  branch should split out of this repo.

---

## Recommendation

**Start with Branch A — Real OCR Integration.**

- Real OCR is the smallest unsafe surface we can land first: it
  touches the renderer only, never moves the cursor, never
  touches the keyboard, and never opens new IPC channels (a
  worker stays inside the renderer's sandbox).
- It unlocks better text_click usability (matched text becomes
  trustworthy) without changing the safety story.
- It lets us measure real performance numbers before committing
  to Branch B's much larger safety review.
- Branch B (Real Desktop Adapter) is intentionally postponed: a
  buggy real-OCR implementation degrades quality; a buggy
  real-click implementation can damage the user's machine.
- Branch C can run in parallel as documentation work without
  blocking either Branch A or Branch B.

After Branch A ships and is stable (one minor release at minimum
in the wild), reconsider Branch B with a fresh
`docs/REAL_ACTIONS_GO_NO_GO.md` review.

Until Branch A merges, ClickFlow remains **simulation-only**.
