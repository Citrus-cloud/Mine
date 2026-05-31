# Text Click Scenario Type Foundation (Step 33)

> **Status: Simulation-only.** ClickFlow now ships a real
> scenario type called `text_click` that combines the Step-25
> screen-capture preview, the Step-26 region selector, and the
> Step-32 mock OCR engine into a single executable scenario.
> Despite the name, `text_click` **does not move the cursor**,
> **does not click anywhere**, and **does not run real OCR**.
> The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md). Real text
> recognition (Tesseract / native) is not connected at Step 33.

## Purpose

Up to Step 32 ClickFlow had:

- a screen-capture preview (Step 25);
- a region selector on top of the preview (Step 26);
- a template asset manager (Step 27) and a real preview
  template-matcher (Step 29);
- the `image_click` scenario type that wires the matcher into a
  full scenario flow (Step 30) and a Test Match flow inside the
  scenario form (Step 31);
- an Advanced → OCR tab with a mock OCR engine and a `text_click`
  ACTION PREVIEW (Step 32).

What was missing was a **real scenario type** that runs the mock
OCR over the captured preview every iteration and dispatches a
**simulated** `text_click` action through the same
action-pipeline / click-engine stack the other types use.

Step 33 closes that gap by introducing a new scenario type
`text_click` that:

- references a target text typed by the user;
- carries OCR settings (`language`, `matchMode`, `caseSensitive`);
- optionally scopes the search to a Step-26 region;
- runs the Step-32 mock OCR matcher against the captured preview;
- emits a **simulated** `text_click` action through the existing
  action-pipeline;
- updates the same `progress` / `lastAction` / log machinery the
  `simple_click` and `image_click` flows use.

The first half (mock engine + UI) was already in place. Step 33 is
the orchestration layer — and it is intentionally simulation-only
so the safety contract of the previous steps stays intact.

## Current status

| Capability                                                            | Status   |
|-----------------------------------------------------------------------|----------|
| `text_click` scenario type accepted by `validateScenario` dispatch    | Done     |
| `validateTextClickScenario` / `createTextClickScenario` / `updateTextClickScenario` / `getTextClickScenarios` | Done |
| Scenario form has a type selector + text_click-only fields            | Done     |
| `Use selected region` button copies the active region into the form   | Done     |
| `Clear scenario region` button drops the region from the form         | Done     |
| Mock-OCR-only notice banner inside the form                           | Done     |
| "Capture screen preview first" warning when preview is missing        | Done     |
| `click-engine.runTextClickScenario`                                   | Done     |
| `text_click` action accepted by the action-pipeline (simulation)      | Done     |
| `text_click` `realClick: true` rejected outright                      | Done     |
| `text_click` `realOcr: true` rejected outright                        | Done     |
| Audit `scenario.textClick.*` and `action.textClick.*` events          | Done     |
| Diagnostics card and `Text click scenario: …` line                    | Done     |
| **Real cursor movement / real click**                                 | **Not implemented** |
| **Real OCR / Tesseract / native engine**                              | **Not implemented** |
| **`text_click` Test Match panel**                                     | Not in this step |
| **Live-screen continuous OCR**                                        | Out of scope for `0.1.x` |

## Scenario format

```json
{
  "id":   "scenario-1717000000000-abcd1234",
  "name": "Click Continue by text",
  "type": "text_click",
  "description": "",
  "settings": {
    "targetText":    "Continue",
    "language":      "ru+en",
    "matchMode":     "contains",
    "caseSensitive": false,
    "region":        null,
    "timeoutMs":     10000,
    "intervalMs":    1000,
    "repeatCount":   1
  },
  "meta": {
    "createdAt": "2026-05-31T12:34:56.789Z",
    "updatedAt": "2026-05-31T12:34:56.789Z",
    "isDefault": false
  }
}
```

### Field-by-field

| Field                         | Type                       | Constraint                                                  |
|-------------------------------|----------------------------|-------------------------------------------------------------|
| `settings.targetText`         | non-empty string           | Required. Trimmed before validation.                        |
| `settings.language`           | `"ru" \| "en" \| "ru+en"`  | Required. Other values are rejected.                        |
| `settings.matchMode`          | `"contains" \| "exact"`    | Required. Other values are rejected.                        |
| `settings.caseSensitive`      | boolean                    | Defaults to `false` if omitted. Form always passes a bool. |
| `settings.region`             | `null` or `{ x, y, w, h }` | Optional. Numbers only. Validated against the preview rect. |
| `settings.timeoutMs`          | integer ≥ 1000             | Soft per-scenario timeout (not yet enforced — reserved).    |
| `settings.intervalMs`         | integer ≥ 100              | Delay between iterations.                                   |
| `settings.repeatCount`        | integer 1..1000             | Number of iterations.                                       |

The shape is forward-compatible with the planned **real** OCR
backend: when (and only when) a future `REAL_ACTIONS_GO_NO_GO.md`
review approves real text recognition, the same scenario shape
will work without migration.

`text_click` scenarios NEVER carry an `imageDataUrl`, a thumbnail,
or any pixel data. Only ids, numbers, short enums, and the target
text itself are persisted on disk.

## Target text

The user types a target text into the form. The mock OCR engine
fabricates a target block with that exact text plus 1–3
surrounding labels (`OK` / `Cancel` / `Settings`); the click
engine then searches the recognised blocks via
`findTextInOcrBlocks`. By design this means the mock will always
find a match for a non-empty target text — Step 33 demonstrates
the data flow, not real recognition. The real "no match" path is
exercised when:

- the target text is empty (validation rejects early);
- no screen preview was captured;
- the OCR mock engine module fails to load.

## OCR settings

`language`, `matchMode`, and `caseSensitive` are passed straight
through to the Step-32 mock engine via `createOcrInput()`. The
audit timeline records each combination (without the full target
text — only `textLen`).

## Optional region

When the user pressed **Use selected region** in the form, the
form-private `_textClickFormRegion` carries the Step-26 normalized
rectangle. On save it is copied into `settings.region`. At
runtime, `runTextClickScenario` passes the rectangle to
`createOcrInput()` and the mock engine clamps every fabricated
block inside it.

## Execution flow

```
runScenario(scenario)
  └─ scenario.type === 'text_click' ─► runTextClickScenario(scenario)
        ├─ validate prerequisites (target text, preview, mock engine)
        │
        ├─ for i = 1..repeatCount:
        │     ├─ if shouldStop → onStop, return
        │     ├─ audit: scenario.textClick.ocr.started
        │     ├─ ocrInput = createOcrInput(preview, region, options)
        │     ├─ ocrResult = runMockOcr(ocrInput)  ← Step 32 mock
        │     ├─ audit: scenario.textClick.ocr.completed
        │     ├─ if ocrResult.match:
        │     │     ├─ audit: scenario.textClick.textFound
        │     │     ├─ action = { type:'text_click', text, targetPoint,
        │     │     │             boundingBox, confidence, language,
        │     │     │             matchMode, caseSensitive,
        │     │     │             realClick:false, realOcr:false }
        │     │     ├─ executeAction(action, ctx)  ← action-pipeline
        │     │     │     └─ executeSimulatedAction()
        │     │     │           ↳ audit: action.textClick.simulated
        │     │     ├─ audit: scenario.textClick.simulated
        │     │     └─ onAction(action, i, total)
        │     └─ else (no_match):
        │           ├─ audit: scenario.textClick.noTextFound
        │           └─ onAction({ type:'text_click', status:'no_match', … })
        │
        └─ onComplete  /  onError  /  onStop
```

## Simulation-only behavior

- `executionMode` is forced to `"simulation"` by
  `createActionContext`. Any caller that builds a context with
  `executionMode: "real"` is rejected by the action-pipeline with
  `action.textClick.realBlocked`.
- `realClick: true` on a `text_click` action is rejected outright
  by both `validateAction` (in `action-pipeline.js`) and
  `validateActionSafety` (in `safety-gates.js`). The pipeline
  records `action.textClick.realBlocked` with the reason in the
  payload (`reason: "...realClick=true rejected"`).
- `realOcr: true` on a `text_click` action is rejected with the
  same audit event and reason (`"...realOcr=true rejected"`). At
  Step 33 there is no real OCR engine; this hard refusal stops
  any future-state-leak.
- The mock desktop adapter does NOT consume `text_click` — only
  the legacy simulate path. The mock adapter only knows `click`.
- The pipeline's dry-run sandbox does NOT consume `text_click`
  either; only `simple_click` actions are accepted by the dry-run
  preview flow.
- Audit payloads carry only short metadata: `scenarioId`,
  `iteration`, `total`, `confidence`, `targetX`, `targetY`,
  `language`, `matchMode`, `caseSensitive`, `hasRegion`,
  `textLen`. Payloads NEVER carry the full target text, an
  `imageDataUrl`, or PII.

## What is not implemented

- Real text recognition. There is no Tesseract, no `tesseract.js`,
  no native OCR engine. The Step-32 mock fabricates plausible
  recognised-text blocks from preview metadata.
- Real click execution. The cursor never moves. No key is
  pressed. No window is focused.
- A `text_click` Test Match panel inside the form. This is
  Step 34's likely candidate (see PROJECT_CONTEXT.md).
- Live-screen continuous OCR. The mock only sees the preview the
  user explicitly captured in Step 25.
- Multi-match candidates (top-N). The mock returns the
  highest-confidence matching block.
- Image preprocessing pipeline. No binarisation, no deskew, no
  denoise, no scaling.

## Future real OCR integration

When the real OCR gate opens (after a separate
[`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)
review focused specifically on text recognition):

- `runTextClickScenario` will gain a branch for `mode: "real"` —
  the data shapes already match.
- The `text_click` action will keep its current shape; only the
  branch in `action-pipeline.executeAction` will gain a real
  branch behind a separate adapter.
- Until that gate opens, `text_click` is the sandbox where the
  data shapes can be exercised without spending CPU and without
  shipping any non-allowed dependency.

## Future real click integration

When the real-click gate opens:

- The `text_click` action shape stays. Only the simulate branch
  in `action-pipeline.executeAction` will gain a real branch
  behind a separate adapter.
- The action-pipeline will continue to refuse `realClick: true`
  AND `realOcr: true` until BOTH adapters are registered AND the
  user has explicitly enabled real-input mode in Settings AND
  passed the go/no-go review.
- Scenarios will keep their on-disk shape (only ids, numbers,
  short enums, and the target text).

Until that gate opens, `text_click` is the sandbox where the data
shapes can be exercised without touching the OS.

See also:

- [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md)
- [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)
- [`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md)
- [`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md)
- [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md)
- [`docs/ACTION_SCHEMA.md`](./ACTION_SCHEMA.md)
- [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md)
- [`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md)
- [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)
