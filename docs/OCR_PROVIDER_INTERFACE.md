# OCR Provider Interface — ClickFlow

> **Step 38 — formal contract for OCR providers.**
>
> Two pure-renderer modules ship at Step 38:
> [`src/ocr-provider-interface.js`](../src/ocr-provider-interface.js)
> defines the contract; [`src/ocr-provider-registry.js`](../src/ocr-provider-registry.js)
> registers providers and runs a self-test. Both modules are
> **architecture only** — they do not run real OCR, they do not
> import Tesseract, they do not open new IPC channels, and they
> do not store images.

---

## 1. Provider contract

`getOcrProviderContract()` returns a frozen-shape snapshot:

```js
{
  version: 1,
  supportedProviders: ['mock'],
  plannedProviders:   ['tesseract'],
  realOcrAllowed:     false,
  mockOcrAvailable:   true,
  realOcrAvailable:   false,
  requiresUserAction: true,
  storesImages:       false,
  supportedLanguages: ['ru', 'en', 'ru+en'],
  supportedMatchModes: ['contains', 'exact'],
  maxTargetTextLength: 200,
  notes: 'Step 38 — Real OCR Research. Architecture only. Mock is the only active provider.'
}
```

The contract is the canonical source of truth for the OCR
readiness UI, the diagnostics line, and the Step-38 smoke
checks. Future steps may bump `version` when the input or
output shape changes.

## 2. Input format

Every provider must accept the following shape:

```js
{
  screenPreview: {
    sourceId:   string,
    name:       string,
    width:      number > 0,
    height:     number > 0,
    capturedAt: ISOString
  },
  targetText: string (1..200 chars),
  options: {
    language?:      'ru' | 'en' | 'ru+en',
    matchMode?:     'contains' | 'exact',
    caseSensitive?: boolean,
    region?:        { x, y, width, height } | null,
    requestId?:     string
  }
}
```

`validateOcrProviderInput(input)` returns
`{ valid: boolean, errors: [stableId] }`. Stable error IDs:

| ID                          | Meaning                                                |
|-----------------------------|--------------------------------------------------------|
| `inputMissing`              | Input is not an object.                                |
| `screenPreviewMissing`      | `screenPreview` is missing or not an object.           |
| `screenPreviewSizeMissing`  | `width` / `height` is missing or non-positive.         |
| `targetTextMissing`         | `targetText` is empty.                                 |
| `targetTextTooLong`         | `targetText` exceeds 200 chars.                        |
| `languageInvalid`           | `language` is not one of the supported languages.      |
| `matchModeInvalid`          | `matchMode` is not `contains` or `exact`.              |
| `regionInvalid`             | `region` is malformed (non-finite / non-positive).     |
| `regionOutOfBounds`         | `region` lies outside the preview rectangle.           |
| `pixelDataNotAllowed`       | `imageDataUrl` / `previewDataUrl` / pixels in input.   |

**Pixel data MUST NOT enter the input envelope.** Providers look
up the pixel data themselves at execution time. The renderer
keeps `imageDataUrl` inside the screen-capture slice and never
forwards it through the provider input.

`normalizeOcrProviderOptions(options)` returns a plain object
with safe defaults: language `ru+en`, match mode `contains`,
case insensitive, no region, no requestId. Unknown keys are
dropped.

## 3. Output format

Every provider must return an envelope built by
`createOcrProviderResult(success, data, error)`:

```js
{
  success: boolean,
  data: {
    providerId:    string,
    providerName:  string,
    requestId?:    string,
    matched:       boolean,
    confidence:    number (0..1),
    durationMs:    number,
    language:      'ru' | 'en' | 'ru+en',
    matchMode:     'contains' | 'exact',
    caseSensitive: boolean,
    blocksCount:   number,
    blocks: [
      { id, text, confidence, boundingBox: {x,y,width,height}, targetPoint: {x,y} }
    ],
    match: { id, text, confidence, boundingBox, targetPoint } | null,
    region: { x, y, width, height } | null
  } | null,
  error: { id: string, message?: string } | null,
  createdAt: ISOString
}
```

The envelope sanitiser drops anything that smells like pixel
data even if a buggy provider attaches it. `data` carries
counts and small strings only — never the captured screenshot.

## 4. Provider registry

Registered providers (Step 38):

| ID          | Type   | Available | Active | Real OCR | Planned | Disabled reason                              |
|-------------|--------|-----------|--------|----------|---------|----------------------------------------------|
| `mock`      | mock   | yes       | yes    | no       | no      | —                                            |
| `tesseract` | real   | no        | no     | yes      | yes     | Real OCR is not connected in this build      |

Public surface:

- `getOcrProviders()` — deep-copy array of every provider.
- `getOcrProviderById(id)` — deep-copy or `null`.
- `getActiveOcrProvider()` — deep-copy of the active one
  (always `mock` at Step 38).
- `setActiveOcrProvider(id)` — returns `{ ok, provider }` or
  `{ ok: false, error: { id, message } }`. Real providers are
  hard-blocked; selecting `tesseract` returns
  `{ ok: false, error: { id: 'realOcrBlocked' } }`.
- `getOcrProviderRegistryStatus()` — diagnostics-shaped
  snapshot with `activeProviderId`, `activeProviderName`,
  `mockProviderAvailable`, `tesseractProviderAvailable`,
  `realOcrEnabled` (always `false`),
  `realOcrAllowed` (always `false`),
  `supportedLanguages`, `lastProviderSelfTest`,
  `providerRegistryReady`, `storesImages: false`,
  `requiresUserAction: true`, `realClick: false`.
- `isRealOcrProviderRegistered()` — `true` iff a real provider
  is BOTH registered AND available. At Step 38 this is
  ALWAYS `false`.
- `runActiveOcrProvider(input)` — thin dispatcher. Routes to
  the mock engine through the existing `runMockOcr` symbol.

## 5. Mock provider

The mock provider is the Step-32 engine. It accepts the legacy
input shape produced by `createOcrInput(screenPreview, region,
options)` and returns the legacy result shape. The dispatcher
`runActiveOcrProvider(input)` adapts the new contract to the
legacy shape internally so existing consumers keep working.

Self-test details:

- builds a synthetic `1280×720` preview metadata object;
- runs the mock engine with target text `"Continue"`, language
  `ru+en`, match mode `contains`;
- asserts the result envelope has `blocks: [...]` and
  `matched: boolean`;
- emits `ocr.provider.selftest.started` →
  `ocr.provider.selftest.completed` (or `.failed`).

## 6. Planned real provider

`tesseract` is declared in the registry but
`available: false`. Selecting it is BLOCKED by
`setActiveOcrProvider('tesseract')` with stable error
`realOcrBlocked`. The block fires three audit events:

1. `ocr.provider.selection.blocked` with `reason:
   'realOcrBlocked'`;
2. `ocr.provider.real.unavailable` with `requestedId:
   'tesseract'`;
3. (no provider activation event — the active provider stays
   `mock`).

The full integration plan lives in
[`REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md).

## 7. Self-test

`runOcrProviderSelfTest()` returns the report described in
section 4. The OCR readiness card shows the last-run report
inline; a fresh run replaces the previous report. The report
is held in module-local memory only — no disk write.

## 8. Safety rules

- **No real OCR at Step 38.** Every provider with `realOcr:
  true` is unavailable. `isRealOcrAllowed(flags, settings)`
  always returns `false`.
- **No new dependencies.** `package.json` declares zero of
  `tesseract`, `tesseract.js`, `tesseract-ocr`, `node-
  tesseract-ocr`, `opencv4nodejs`, `@u4/opencv4nodejs`,
  `opencv.js`, `opencv-js`, `sharp`, `jimp`, `pixelmatch`,
  `looks-same`, `robotjs`, `nut-js`, `nutjs`, `@nut-tree/nut-js`,
  `iohook`, `uiohook-napi`, `node-key-sender`.
- **No new IPC channel.** The provider interface and registry
  live entirely in the renderer. `main.js` has no
  `ocr.provider.*` handler. `preload.js` exposes no
  `ocrProvider*` API.
- **No image storage.** The contract sets `storesImages:
  false`. Validators reject pixel data inside the input
  envelope.
- **No real click.** The provider envelope has no `realClick`
  field; the action pipeline still rejects every `realClick:
  true` outright.
- **CSP unchanged.** No new script source, no new worker
  source. Step 38 ships pure-renderer JavaScript only.
- **`contextIsolation: true`** and **`nodeIntegration:
  false`** are unchanged.



---

## Tesseract provider — implementation notes (Step 39)

[`src/tesseract-ocr-provider.js`](../src/tesseract-ocr-provider.js)
implements the contract described above for the Tesseract
backend. It is the first real provider to land, but it stays
**disabled by default** at Step 39.

### Engine resolution

The provider does NOT statically `require('tesseract.js')`.
Instead, `_resolveTesseractEngine()` looks for a usable engine
in this order:

1. an explicit injection through `setTesseractEngineForTesting`
   (unit-test seam — never used in production);
2. a renderer global `window.Tesseract` (the Step-40+ wire-up
   path: a `<script src="tesseract.min.js">` tag);
3. a CommonJS `require('tesseract.js')` wrapped in `try/catch`
   (only works under Node-side unit tests; the production
   build keeps `nodeIntegration: false` so this path is dead
   at runtime).

If none resolves, the provider reports `unavailable` instead
of crashing.

### Readiness contract

`checkTesseractProviderReadiness(flagsArg?)` returns:

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

Stable reason IDs include `realOcrFeatureFlagDisabled`,
`tesseractProviderFeatureFlagDisabled`, `simulationOnlyMode`,
`dependencyNotDeclared`, `engineNotLoadable`. The
`flagsArg` parameter accepts a feature-flag override (handy
for unit tests); when omitted the provider asks
`getOcrFeatureStatus()` from
[`src/feature-flags.js`](../src/feature-flags.js).

### Recognise contract — Phase 1 hard-stop

`recognizeTextWithTesseract(input, options?)`:

```js
{
  success: false,
  blocked: true,
  error: 'Real OCR provider is disabled by feature flag',
  providerId: 'tesseract',
  realClick: false,
  realOcr: false
}
```

…whenever any of `realOcr`, `tesseractProvider`,
`!simulationOnly` is false. Even with all three true, the
function returns a defensive blocked envelope at Step 39
because the actual `Tesseract.recognize` call is
intentionally unimplemented. Step 40+ replaces the
hard-stop with the real call.

### Result mapping

`mapTesseractBlocks(rawResult, input)` and
`normalizeTesseractResult(rawResult, input)` are pure
functions that translate the Tesseract.js native shape
(`data.words` / `data.blocks` with `bbox: { x0, y0, x1, y1 }`)
into the unified ClickFlow OCR shape (`{ id, text,
confidence, boundingBox: { x, y, width, height }, targetPoint }`).
Confidence is normalised to `0..1`. Region offset is added
when `input.region` is set.

### Audit events

Six new allowlisted types — `ocr.tesseract.readiness.requested`,
`ocr.tesseract.readiness.completed`,
`ocr.tesseract.readiness.failed`,
`ocr.tesseract.blockedByFeatureFlag`,
`ocr.provider.tesseract.detected`,
`ocr.provider.tesseract.unavailable`. Payloads carry only
flag booleans, error counts, stable reason ids, durations,
and engine-loadability — never the full target text, never
an `imageDataUrl`, never PII.

### Worker termination

`terminateTesseractWorker()` is a no-op that resets the
module-local engine reference at Step 39. Step 40+ replaces
the body with the real worker termination call once the
worker is live.
