# Real OCR Integration Plan — ClickFlow

> **Step 38 — Real OCR Research + Safe Integration Plan.**
>
> This document captures the path from today's mock OCR engine
> (Step 32) to a real OCR backend without a single real click and
> without shipping a heavy OCR runtime in `0.1.x`.
>
> ClickFlow stays **simulation-only** throughout. No real cursor
> work, no real keyboard input, no real OCR engine execution at
> Step 38.

---

## 1. Purpose

The Step 36 Visual Builder + Scenario Presets and the Step 37 QA
pass made it obvious that the next big direction is **Real OCR
Integration** (Branch A from `docs/NEXT_BRANCH_PLAN.md`). Before
we install a runtime OCR engine, we need:

- a stable provider contract every backend can satisfy;
- a registry that exposes the providers without unlocking them;
- a UI that surfaces readiness without running anything heavy;
- diagnostics so testers can see exactly which provider is
  active;
- audit events so security reviewers can trace provider activity;
- documentation that turns "switch on Tesseract" into a
  reviewed checklist instead of a one-line dependency add.

Step 38 ships all of the above. Step 39+ will ship the real
provider behind the architecture this document describes.

## 2. Current status

| Capability                                                | Status   |
|-----------------------------------------------------------|----------|
| OCR provider contract (`ocr-provider-interface.js`)       | Done     |
| OCR provider registry (`ocr-provider-registry.js`)        | Done     |
| Mock provider registered as the active provider           | Done     |
| Tesseract provider declared as planned, unavailable       | Done     |
| `setActiveOcrProvider('tesseract')` is BLOCKED            | Done     |
| OCR readiness card in the Advanced → OCR tab              | Done     |
| Provider self-test button (mock-only)                     | Done     |
| Audit events (6 new types)                                | Done     |
| Diagnostics line `OCR provider: ...`                      | Done     |
| Feature flags (`realOcr`, `ocrProviderRegistry`,          | Done     |
|   `ocrMockProvider`, `tesseractProvider`)                 |          |
| Smoke-check Step-38 invariants                            | Done     |
| **Real Tesseract runtime**                                | **Not done** |
| **Real OCR execution path**                               | **Not done** |
| **Real cursor / keyboard / click**                        | **Not done** |

## 3. Why an OCR provider architecture?

ClickFlow's smart-features chain (Screen Capture → Region →
Templates → Matching → Image Click → OCR → Text Click → Visual
Builder) currently ends at the Step-32 mock OCR. The mock is a
deterministic block-fabricator: it produces plausible recognised
text from preview metadata so the data shapes can be exercised
end-to-end.

Replacing the mock with a real backend without an explicit
contract would mean:

- the mock and the real backend exposing slightly different
  result shapes;
- the renderer threading flags through call sites instead of a
  central gate;
- the audit trail mixing "real OCR" and "mock OCR" without a
  stable provider id;
- security review having to walk every consumer to confirm the
  flag is honoured.

A provider architecture inverts that: every backend implements
the same contract, the registry decides who is active, and the
renderer asks the registry instead of branching on flags.

## 4. Mock provider

The mock provider is the Step-32 engine wrapped in the new
contract.

- `id: 'mock'`, `type: 'mock'`, `available: true`, `active: true`,
  `realOcr: false`.
- Implementation lives in `src/ocr-mock-engine.js`.
- The dispatcher `runActiveOcrProvider(input)` in
  `src/ocr-provider-registry.js` routes to the mock engine.
- The mock provider supports the same languages as the future
  real provider (`ru`, `en`, `ru+en`) so call sites can switch
  without changing options.
- The mock provider's `runOcrProviderSelfTest()` is the only
  self-test runnable at Step 38.

## 5. Planned Tesseract provider

The Tesseract provider is **declared but not connected**. The
registry advertises it as `planned: true, available: false,
disabledReason: "Real OCR is not connected in this build"`.
Selecting it is BLOCKED by `setActiveOcrProvider`.

When Step 39+ wires up the real provider, the work splits into
the following layers:

### 5.1 Library

- Pin `tesseract.js` (last published: see project's package
  manager, do not pre-pin a specific version in this document).
- Tesseract.js bundles its OCR core in a worker and loads
  language data on demand.
- Native bindings (`node-tesseract-ocr`, `tesseract`) are NOT
  used — they require a system Tesseract install which we cannot
  guarantee.

### 5.2 Language data

- Two language packs at minimum: `eng.traineddata` and
  `rus.traineddata`. Combined size around 30 MiB.
- Packs ship inside the app bundle under
  `resources/tesseract/lang/`, accessed through Electron's
  `app.getAppPath()`.
- `electron-builder` `files` entry includes the new directory.
- A fallback path falls back to the mock provider if a pack is
  missing on disk (offline support, smaller distribution
  variants).

### 5.3 Worker model

- Tesseract.js runs inside a web worker spawned from the
  renderer.
- The worker has `nodeIntegration: false`, no preload script,
  and no `require` access. It only sees `postMessage`.
- The worker receives the captured `imageDataUrl` plus the
  region rectangle and the language code. The worker NEVER
  receives the user's full target text. Matching is performed
  back in the renderer against the OCR blocks the worker
  returns.
- Cancellation: every request is associated with a `requestId`.
  A second request cancels the previous one before starting.
- Idle workers are torn down after 60 seconds to release memory.

### 5.4 Performance risks

- First-call latency: language pack load (200–600 ms) + WebAssembly
  init (~300 ms). Subsequent calls reuse both.
- Per-frame latency on `1920×1080`: 600–1200 ms with a tight
  region; whole-screen calls can take several seconds.
- We will run a `text_click` scenario only if the previous
  iteration completed; we will NOT queue overlapping requests.
- Memory: the language pack stays in memory until the worker
  is torn down. Anticipate ~80–150 MiB per active worker.

### 5.5 Privacy

- The recognised text never leaves the renderer. The worker
  receives the image; the renderer compares text locally.
- The OCR engine is bundled with the app — there is no
  network call. We will add a smoke-check invariant that
  Tesseract.js does not initiate fetches.
- Audit events still carry `targetTextLen` only — never the
  full target text, never an `imageDataUrl`, never a
  thumbnail.

### 5.6 Security

- No new IPC channel: the worker is renderer-side only.
- `contextIsolation: true`, `nodeIntegration: false` apply to
  the parent renderer; the worker inherits a stricter sandbox.
- CSP must be extended carefully to allow `worker-src 'self'`
  if the bundler emits a separate worker file. We will NOT
  add `unsafe-eval` or `unsafe-inline`.
- A signed-off `docs/REAL_OCR_GO_NO_GO.md` (planned Step 39)
  must accompany the dependency add.

### 5.7 UI progress

- The OCR readiness card already shows `Real OCR enabled: no`.
  Step 39 adds a download/init progress bar inside the card
  while the worker initialises.
- The Test OCR panel already shows duration metrics. Step 39
  surfaces a per-iteration spinner with cancel.
- Settings: language picker stays the same. A new informational
  row "Provider engine: tesseract.js (worker)" surfaces.

### 5.8 No real click

- Real OCR ships **without** real clicks. The action pipeline
  still rejects every `realClick: true` outright. The Real
  Desktop Adapter (Branch B) is a separate roadmap item with
  its own `docs/REAL_ACTIONS_GO_NO_GO.md`.

## 6. What is NOT implemented yet

- No `tesseract.js` dependency declared.
- No worker file shipped.
- No language pack bundled.
- No real OCR call site.
- No real cursor / keyboard / click.
- No mobile / Android port.

## 7. Step-by-step future integration plan

Each step should be its own PR + manual review. None of these
land in Step 38.

1. **Document the GO/NO-GO checklist.** Author
   `docs/REAL_OCR_GO_NO_GO.md` listing the prerequisites:
   contract stability, audit event completeness, smoke-check
   invariants, language-pack story, worker sandbox, fallback
   path, security review sign-off.
2. **Land the worker shell.** Add an empty worker file that
   echoes back its `requestId`. No OCR yet. Verify CSP +
   bundler integration. Verify audit events fire.
3. **Land Tesseract.js as an optional dependency.** Pinned
   version. Worker imports it. Still echoes back. Verify
   Tesseract.js does not phone home. Add a smoke-check
   invariant that disallowed network domains are not present
   in the worker.
4. **Wire the real provider.** Implement the Tesseract
   provider behind `flags.tesseractProvider === true`. Default
   `false`. Register it but mark it unavailable until the
   `realOcr` flag is also true.
5. **Add a feature flag UI.** A single toggle inside Advanced →
   Settings → "Try real OCR (beta)". Persists per-machine.
   Default off. Toggling it does NOT enable real clicks.
6. **Run real OCR.** Wire `runActiveOcrProvider` to the real
   provider when active. Update the diagnostics line to read
   `realOcrEnabled=true` if and only if the registry has an
   active real provider AND the umbrella flag is true.
7. **Add a fallback.** If the worker fails to initialise or a
   language pack is missing, the dispatcher silently switches
   back to the mock and emits
   `ocr.provider.real.unavailable` so the UI can surface a
   warning.
8. **Update the manual QA pass.** Extend
   `docs/SMART_FEATURES_QA.md` with a Real OCR section. Run
   it on Windows, macOS, Linux.
9. **Beta tag.** Cut a `0.2.0-beta` tag. Real OCR ships, real
   clicks do not.

After Step 39's beta tag is stable in the wild for at least one
minor release, Branch B (Real Desktop Adapter) can be reopened
with a fresh `docs/REAL_ACTIONS_GO_NO_GO.md` review.

Until then, ClickFlow remains **simulation-only**.
