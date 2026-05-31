# Tesseract OCR Provider — ClickFlow

> **Step 39 — Real OCR Provider Integration Phase 1.**
>
> ClickFlow now declares `tesseract.js` as a runtime dependency
> in [`package.json`](../package.json) and ships
> [`src/tesseract-ocr-provider.js`](../src/tesseract-ocr-provider.js)
> as the **disabled-by-default** real OCR provider shell. The
> mock provider remains the only active provider; selecting the
> Tesseract provider is BLOCKED unless every safety flag is
> flipped in source.
>
> ClickFlow remains **simulation-only**. No real cursor work, no
> real keyboard input, no real OCR call site at runtime in this
> phase.

---

## 1. Purpose

Step 38 formalised the OCR provider contract and the registry.
Step 39 wires the first real provider (Tesseract.js) into that
architecture, but keeps it gated behind:

- the `realOcr` umbrella safety flag (false by default);
- the `tesseractProvider` per-provider flag (false by default);
- the `simulationOnly` umbrella flag (true by default);
- a defensive engine resolver that returns `null` when
  `tesseract.js` is not actually present in `node_modules`;
- a self-test that does NOT execute real OCR even when allowed.

This document is the reference for the dependency, the feature
flags, the readiness check, and the (intentionally absent) call
site.

## 2. Current status

| Capability                                                     | Status                          |
|----------------------------------------------------------------|---------------------------------|
| `tesseract.js` declared in `package.json`                      | Done                            |
| `src/tesseract-ocr-provider.js` shell                          | Done                            |
| Engine resolver (renderer global / `require` fallback)         | Done                            |
| `getTesseractProviderInfo` / `isTesseractProviderAvailable`    | Done                            |
| `checkTesseractProviderReadiness(flags)`                       | Done                            |
| `runTesseractSelfTest()` (manual, never auto)                  | Done — refuses to run real OCR  |
| `recognizeTextWithTesseract(input)` returns blocked envelope   | Done                            |
| Provider registry recognises `tesseract` entry                 | Done — gated by both flags      |
| OCR readiness card surfaces Tesseract status                   | Done                            |
| OCR provider status card + Check Tesseract readiness button    | Done                            |
| Diagnostics line `Real OCR: …`                                 | Done                            |
| Audit events `ocr.tesseract.*` (6 new types)                   | Done                            |
| **Real OCR call site executing recognise**                     | **Not done — Step 40+**         |
| **`text_click` switching to the Tesseract provider**           | **Not done — Step 40+**         |
| **Real cursor / keyboard / click**                             | **Not done**                    |

## 3. Dependency

`package.json`:

```json
"dependencies": {
  "tesseract.js": "^5.0.4"
}
```

The dependency is declared, but the renderer does NOT statically
`require()` it. The provider's engine resolver is defensive:

1. it consults a unit-test seam (`setTesseractEngineForTesting`)
   first;
2. then a renderer global (`window.Tesseract`) for the case where
   a future Step-40+ build loads `tesseract.min.js` via a
   `<script src>` tag;
3. then a `require('tesseract.js')` fallback wrapped in
   `try/catch` for Node-side unit tests that may run with
   `nodeIntegration: true`. The production build keeps
   `nodeIntegration: false`, so this branch is dead at runtime.

If none of the three resolve, `isTesseractProviderAvailable()`
returns `false` and `checkTesseractProviderReadiness()` reports
the stable reason `engineNotLoadable`. The application **never
crashes** because of a missing engine — it falls back to the
mock provider.

## 4. Feature flags

`src/feature-flags.js` (Step 39 safe defaults):

```js
realOcr:             false,   // umbrella — must be true to allow real OCR at all
ocrProviderRegistry: true,    // architecture switch — UI / diagnostics only
ocrMockProvider:     true,    // mock provider registered & active
tesseractProvider:   false,   // per-provider gate — must be true to select Tesseract
```

`getOcrFeatureStatus()` — added at Step 39 — derives a flat
plain-data snapshot used by every OCR call site:

```js
{
  realOcr:             false,
  tesseractProvider:   false,
  ocrMockProvider:     true,
  ocrProviderRegistry: true,
  simulationOnly:      true,
  realOcrAllowed:      false,   // realOcr && tesseractProvider && !simulationOnly
  realOcrAutoRun:      false    // hard-coded — never auto-run real OCR
}
```

The selection rule in
[`src/ocr-provider-registry.js`](../src/ocr-provider-registry.js):

```
active provider may switch to `tesseract` only if BOTH
  `realOcr === true` AND `tesseractProvider === true`
AND the engine resolver reports the engine as loadable.
```

Otherwise the registry returns
`{ ok: false, error: { id: 'realOcrBlocked', reason: '…' } }`
and emits `ocr.provider.selection.blocked` +
`ocr.provider.real.unavailable`.

## 5. Why disabled by default

ClickFlow is **simulation-only**. We added the dependency and
the provider shell to make the integration shape concrete, but
real OCR introduces three new risks that we want surfaced
before we let it run:

- **Performance.** Tesseract.js initialises a worker, a
  WebAssembly core, and a language pack on first call.
  Combined first-call latency is several seconds. The user
  must opt in.
- **Privacy.** The recognised text never leaves the renderer,
  but the worker does receive a portion of the captured
  preview. We need an audit pass before sending pixel data
  through any new code path.
- **Behaviour parity.** The mock engine produces deterministic
  results. The real engine does not. Every consumer
  (`text_click`, the Step-34 Test OCR panel, the Visual
  Builder) must be tested against both before we flip the
  default.

Step 39 lands the architecture; Step 40+ lands the activation
behind a fresh `docs/REAL_OCR_GO_NO_GO.md` review.

## 6. Provider readiness

`checkTesseractProviderReadiness(flags?)` returns:

```js
{
  ready: boolean,
  reasons: [stableId],
  details: {
    featureFlagRealOcr,
    featureFlagTesseractProvider,
    simulationOnly,
    dependencyDeclared,
    engineLoadable,
    engineLoadError: string | null
  },
  checkedAt: ISOString
}
```

Stable reason IDs:

| ID                                       | Meaning                                                      |
|------------------------------------------|--------------------------------------------------------------|
| `realOcrFeatureFlagDisabled`             | The umbrella `realOcr` flag is false (default at Step 39).   |
| `tesseractProviderFeatureFlagDisabled`   | The per-provider `tesseractProvider` flag is false.          |
| `simulationOnlyMode`                     | The `simulationOnly` flag is true (default).                 |
| `dependencyNotDeclared`                  | `package.json` does not declare `tesseract.js`.              |
| `engineNotLoadable`                      | The dependency is declared but `node_modules` is missing it. |

The Advanced → OCR tab surfaces the readiness through two
cards:

- **OCR readiness** (Step 38) — provider list, real-OCR
  flags, supported languages, **Run provider self-test**
  button (mock only).
- **OCR provider status** (Step 39) — Active provider,
  Tesseract installed, Tesseract enabled, Real OCR feature
  flag, Real OCR auto-run disabled, Real clicks disabled,
  **Check Tesseract readiness** button.

## 7. Future activation plan

Step 40 (planned) follows
[`REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md):

1. Land `docs/REAL_OCR_GO_NO_GO.md` with explicit prerequisites.
2. Bundle `eng.traineddata` + `rus.traineddata` under
   `resources/tesseract/lang/`. Update `electron-builder`
   `files`.
3. Load `tesseract.min.js` via a renderer-side `<script>` tag
   so the engine resolver finds `window.Tesseract`. Keep
   `contextIsolation: true`, `nodeIntegration: false`. Add
   `worker-src 'self'` to the CSP if required by the bundle
   layout, but never `unsafe-eval`.
4. Wire `recognizeTextWithTesseract` to the real
   `Tesseract.recognize(imageDataUrl, language, options)`
   call. Keep the function defensive (re-check feature flags
   at the start, never auto-run, return the unified result
   shape via `normalizeTesseractResult`).
5. Provide a **Settings → Real OCR** UI toggle. Default off.
   Toggling it sets `realOcr` and `tesseractProvider` for
   that session only — the safe defaults in
   `src/feature-flags.js` stay false.
6. Manually QA on Windows, macOS, Linux. Confirm `text_click`
   stays on mock until the user explicitly switches.
7. Cut a `0.2.0-beta` tag.

Real cursor work (Branch B — Real Desktop Adapter) waits for at
least one stable Branch A release in the wild plus a fresh
`docs/REAL_ACTIONS_GO_NO_GO.md` review.

## 8. Privacy model

- Recognised text never leaves the renderer. The worker
  consumes a captured `imageDataUrl` and returns recognised
  blocks; the renderer compares the user's target text
  locally.
- Tesseract.js does NOT phone home. We will add a smoke-check
  invariant that confirms no fetch is initiated by the worker
  bundle when Step 40 wires the script tag.
- Audit payloads carry only flag booleans, error counts,
  durations, and stable reason ids. They never carry the full
  target text, an `imageDataUrl`, or PII.
- No screenshot is persisted on disk during a recognise call.
  The captured preview lives in renderer memory only.

## 9. Performance risks

- **First call:** language pack load (200–600 ms) +
  WebAssembly init (~300 ms) + recognise. Realistic worst
  case on a `1920×1080` preview is several seconds.
- **Steady state:** 600–1200 ms per call on a tight region;
  whole-screen calls remain slow.
- **Memory:** ~80–150 MiB per active worker.
- **Concurrency:** the dispatcher queues one request at a
  time. A second request cancels the first.
- **Cancellation:** a session-wide `terminateTesseractWorker()`
  is provided as a hard kill switch.

## 10. Known limitations

- `tesseract.js` is a runtime dependency declared in
  `package.json`, but it is **not** loaded by the renderer at
  Step 39. The dependency only ships once the user runs
  `npm install` and Step 40+ wires the script tag.
- The provider's `recognizeTextWithTesseract` returns a
  blocked envelope at Step 39 even when the flags allow it.
  This is a deliberate hard-stop until Step 40+.
- The self-test does NOT execute real OCR. It exercises the
  envelope shape and the readiness check.
- The mock engine is still the only active provider for
  `text_click`, the Step-34 Test OCR panel, and the Visual
  Builder.

## 11. Safety notes

- `nodeIntegration: false`, `contextIsolation: true`, CSP
  unchanged.
- `simulationOnly: true`, `realDesktopActions: false`,
  `realOcr: false`, `tesseractProvider: false`,
  `realClick: false` in every status response, audit
  payload, and diagnostics line at Step 39.
- `recognizeTextWithTesseract` re-checks the feature flags at
  every call. It returns
  `{ success: false, blocked: true, error: 'Real OCR provider
  is disabled by feature flag' }` whenever any flag is off.
- The provider never opens a new IPC channel. `main.js`
  registers no `ocr.tesseract.*` handler. `preload.js`
  exposes no `ocrTesseract*` API.
- The provider never moves the cursor, never presses a key,
  never persists a screenshot, never saves an `imageDataUrl`
  to disk. The action pipeline still rejects every
  `realClick: true` outright.
- The OCR provider registry keeps `mock` as the active
  provider until BOTH `realOcr` AND `tesseractProvider` are
  flipped in source AND the engine resolver reports the
  engine as loadable. There is no UI to flip the flags at
  Step 39.

See
[`docs/OCR_PROVIDER_INTERFACE.md`](./OCR_PROVIDER_INTERFACE.md)
for the full provider contract,
[`docs/REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md)
for the step-by-step roadmap, and
[`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) for
the consolidated safety checklist.
