# Real OCR Usage — ClickFlow (Steps 40-41)

> **Status: Real OCR enabled per session, simulation-only execution.**
>
> Steps 40-41 wire Tesseract.js into the OCR tab, the `text_click`
> scenario type, the Step-34 Test OCR panel and the Visual Builder.
> Real OCR runs **only when the user explicitly enables it for the
> current session**; switching providers, recognising text and
> opening the OCR tab never trigger real OCR by themselves.
>
> ClickFlow remains **simulation-only**:
> - the OCR provider produces blocks, never clicks;
> - `text_click` still emits a simulated `text_click` action with
>   `realClick: false`;
> - `realOcr` on an action only marks the SOURCE of the match;
> - the action pipeline still rejects every `realClick: true`
>   outright;
> - `realDesktopActions: false`, `simulationOnly: true`,
>   `nodeIntegration: false`, `contextIsolation: true`, CSP
>   unchanged.

---

## 1. How to enable Tesseract for the current session

1. `npm install` (one-time — pulls `tesseract.js` into
   `node_modules/`).
2. `npm start` to launch ClickFlow.
3. Open **Advanced → OCR**.
4. Press **Enable Tesseract for this session**. A confirmation
   dialog explains:
   > Real OCR may be slower and uses local image processing. No
   > clicks will be performed.
5. After confirming, the **runtime overlay** sets:
   - `realOcr = true`
   - `tesseractProvider = true`

Both flags live in renderer memory only. They are **never**
written to settings, scenarios, profiles or disk. Reloading the
window resets the overlay back to safe defaults
(`realOcr = false`, `tesseractProvider = false`).

`realDesktopActions` and `simulationOnly` are **not**
runtime-togglable. Trying to flip them returns
`{ ok: false, error: 'flagNotRuntimeTogglable' }`.

## 2. How to run real OCR manually

1. Capture a screen preview (Advanced → Screen Capture →
   **Capture preview**).
2. Optionally select a region.
3. Open **Advanced → OCR**.
4. Enable Tesseract for this session (Section 1).
5. Press **Use Tesseract OCR** to switch the active provider.
6. Type a target text into the **Target text** field.
7. Press **Run Real OCR** (next to **Run Mock OCR**).

The button is **disabled** unless every condition is met:
- runtime `realOcr` overlay is true;
- runtime `tesseractProvider` overlay is true;
- the active provider is `tesseract`;
- a screen preview exists.

Hover the disabled button to read the localised hint.

While real OCR runs, the **Real OCR progress** card appears with
the current Tesseract.js stage (`loading tesseract core`,
`loading language traineddata`, `recognizing text`, …) and a
percentage bar. The card also exposes a **Cancel (cancellation
planned)** button — Tesseract.js v5 cannot interrupt a running
recognise call, so cancellation marks the in-flight token and
discards the result on completion.

The result is rendered through the existing OCR result card
(blocks list, overlay, `text_click` action preview) and stamps:

- `mode: 'real-ocr'`
- `provider: 'tesseract'`
- `realOcr: true`
- `realClick: false`

## 3. OCR provider selection

Four buttons on the OCR provider status card give the user
explicit control over the active provider:

| Button | Effect |
|--------|--------|
| **Use Mock OCR** | `setActiveOcrProvider('mock')`. No flags change. |
| **Enable Tesseract for this session** | Flips the runtime overlay. Logs `ocr.real.enabledForSession`. |
| **Use Tesseract OCR** | `setActiveOcrProvider('tesseract')`. Refused unless the runtime overlay is on AND the engine resolver finds a Tesseract instance. |
| **Disable Real OCR** | `resetRuntimeFeatureFlags()` + `setActiveOcrProvider('mock')`. Logs `ocr.real.disabled`. |

Switching providers **never** runs OCR — recognition needs a
separate **Run Real OCR** click.

## 4. text_click with provider

`text_click` scenarios persist a per-scenario `ocrProvider` field:

```json
{
  "type": "text_click",
  "name": "Click on Continue",
  "settings": {
    "targetText": "Continue",
    "language": "ru+en",
    "matchMode": "contains",
    "caseSensitive": false,
    "ocrProvider": "tesseract",
    "region": null,
    "timeoutMs": 10000,
    "intervalMs": 1000,
    "repeatCount": 1
  }
}
```

The form has an **OCR provider** select with two options
(`Use Mock OCR` / `Use Tesseract OCR`). Choosing the Tesseract
provider does NOT auto-enable real OCR — the click-engine
re-checks the runtime overlay on every iteration. Without the
session opt-in:

- the Test OCR panel returns `tesseractDisabledByFeatureFlag`;
- the click engine refuses to start with
  `Tesseract OCR is disabled. Enable it for this session or use
  mock OCR.`

When the runtime overlay is on, `text_click` runs:

1. capture is consumed from the screen-capture slice;
2. region is optionally cropped via canvas (best-effort —
   falls back to the full image if the canvas API rejects);
3. `Tesseract.recognize` runs with the language map
   `ru → 'rus'`, `en → 'eng'`, `ru+en → 'rus+eng'`;
4. recognised blocks are searched for the target text;
5. a simulated `text_click` action is emitted with
   `realClick: false, realOcr: true`. Audit payload carries
   `ocrProvider: 'tesseract'`.

The cursor never moves. `Stop` and `Emergency Stop` still work.

## 5. Visual Builder with provider

The Visual Builder copies the active provider (`mock` or
`tesseract`) into every text_click draft it builds. The draft
preview surfaces:

- `OCR provider used: mock | tesseract`
- `Real OCR: true | false`
- `Real clicks: false` (always)

When the user opens the draft in the scenario form, the
**OCR provider** select picks up the draft's value. The
Visual Builder does **not** auto-enable real OCR.

## 6. Safety notes

- Real OCR runs only after an **explicit user action** — three
  in fact: enable for session, switch active provider, press Run
  Real OCR.
- Real OCR runs only against the **captured screen preview** in
  the renderer's screen-capture slice. There is no live-screen
  capture loop.
- Real OCR result envelopes carry `realClick: false` — the
  action pipeline rejects every `realClick: true` regardless of
  source.
- Real OCR audit payloads carry stable string ids, durations,
  counts, language strings — never the full target text, never
  an `imageDataUrl`, never PII.
- Runtime overlay flags wipe on reload. After restarting the
  app the user must enable Tesseract again before real OCR
  can run.
- `realDesktopActions` is hard-coded `false` and is NOT in the
  runtime-togglable list. Real cursor work stays out of scope.

## 7. Limitations

- **First-call latency.** Tesseract.js initialises a worker, a
  WebAssembly core, and a language pack on first call. Combined
  first-call latency is several seconds. Subsequent calls reuse
  both.
- **Language data.** Tesseract.js v5 loads `eng.traineddata` /
  `rus.traineddata` from its CDN by default. ClickFlow's CSP
  (`default-src 'self'; script-src 'self'; style-src 'self';`)
  blocks remote fetches; in environments without preloaded
  language packs, real OCR fails with
  `Failed to load OCR language data.` and the user can fall
  back to the mock provider. Bundling local language packs is
  planned.
- **Cancellation.** Tesseract.js v5 has no abort handle for
  `Tesseract.recognize`. The Cancel button discards the
  in-flight result on completion but cannot interrupt the
  worker. Worker-based cancellation is planned.
- **Region cropping.** The provider crops the captured preview
  via a `<canvas>` before passing the image to Tesseract.js.
  When the canvas API refuses (CORS, unsupported dataURL) the
  provider falls back to the full image and the recognised
  bounding boxes still account for the region offset.
- **No real click.** Step 40-41 do not enable real cursor work.
  Real desktop actions remain a separate roadmap item with
  their own `docs/REAL_ACTIONS_GO_NO_GO.md` review.
- **Mobile.** No mobile / Android port.

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Run Real OCR button stays disabled | Tesseract not enabled for session, OR active provider is `mock`, OR no screen preview | Press **Enable Tesseract for this session**, then **Use Tesseract OCR**, then capture a preview. |
| Confirmation dialog shown but the flag did not flip | The user pressed **Cancel** | Press **Enable Tesseract for this session** again. |
| Real OCR fails with `Tesseract.js engine is not available` | The renderer could not load `node_modules/tesseract.js/dist/tesseract.min.js` | Run `npm install` from the project root. The `<script src>` falls back silently if the file is missing. |
| Real OCR fails with `Failed to load OCR language data.` | CSP blocked the remote fetch of `*.traineddata` | Real OCR currently expects local language packs. Use the mock provider while local packs are bundled. |
| `text_click` scenario with `tesseract` provider refuses to start | `Tesseract OCR is disabled. Enable it for this session or use mock OCR.` | Open Advanced → OCR and press **Enable Tesseract for this session**, then re-run the scenario. |
| Test OCR panel returns `tesseractDisabledByFeatureFlag` | Same as above (no session opt-in) | Same fix. |

For the full provider contract see
[`OCR_PROVIDER_INTERFACE.md`](./OCR_PROVIDER_INTERFACE.md). For
the dependency status see
[`TESSERACT_PROVIDER.md`](./TESSERACT_PROVIDER.md). For the
plan that brought us to Phase 2 see
[`REAL_OCR_INTEGRATION_PLAN.md`](./REAL_OCR_INTEGRATION_PLAN.md).
