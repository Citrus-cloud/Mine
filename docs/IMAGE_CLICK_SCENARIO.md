# Image Click Scenario Type Foundation (Step 30)

> **Status: Simulation-only.** ClickFlow now ships a real
> scenario type called `image_click` that combines the Step-25
> screen-capture preview, the Step-26 region selector, the
> Step-27 template assets and the Step-29 real preview matching
> engine into a single executable scenario. Despite the name,
> `image_click` **does not move the cursor** and **does not
> click anywhere**. The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md).

## Purpose

Until Step 29 the smart-visual line had four building blocks
(preview, region, template, matcher) but no scenario type that
could exercise them end-to-end. Step 30 closes that gap by
introducing a new scenario type `image_click` that:

- references a stored template by id,
- optionally scopes the search to a Step-26 region,
- runs the Step-29 matcher against the captured preview,
- emits a **simulated** `image_click` action through the
  existing action-pipeline,
- updates the `progress` / `lastAction` / log machinery the
  same way `simple_click` does today.

The first half (storage + matcher) was already in place. Step
30 is the orchestration layer — and it is intentionally
simulation-only so the safety contract of the previous steps
stays intact.

## Current status

| Capability                                                            | Status    |
|-----------------------------------------------------------------------|-----------|
| `image_click` scenario type accepted by `validateScenario`            | ✅ Done   |
| `createImageClickScenario` / `updateImageClickScenario` / helpers     | ✅ Done   |
| Scenario form has a type selector + image_click-only fields          | ✅ Done   |
| `Use selected region` button copies the active region into the form  | ✅ Done   |
| `click-engine.runImageClickScenario`                                  | ✅ Done   |
| `image_click` action accepted by the action-pipeline (simulation)    | ✅ Done   |
| `image_click` `realClick: true` is rejected outright                 | ✅ Done   |
| Audit `scenario.imageClick.*` and `action.imageClick.*` events       | ✅ Done   |
| Diagnostics card and `Image click scenario: …` line                  | ✅ Done   |
| **Real cursor movement / real click**                                 | ❌ Not implemented |
| **OCR / text detection**                                              | ❌ Not implemented |
| **OpenCV / native matcher**                                           | ❌ Not implemented |
| **Live-screen continuous matching**                                   | ❌ Out of scope for `0.1.x` |

## Scenario format

```json
{
  "id": "scenario-1717000000000-abcd1234",
  "name": "Click Submit by image",
  "type": "image_click",
  "description": "",
  "settings": {
    "templateId": "template-1717000000000-abcd1234efef5678",
    "region": null,
    "threshold": 0.75,
    "step": 4,
    "timeoutMs": 10000,
    "intervalMs": 1000,
    "repeatCount": 1
  },
  "meta": {
    "createdAt": "2026-05-31T10:00:00.000Z",
    "updatedAt": "2026-05-31T10:00:00.000Z",
    "isDefault": false
  }
}
```

Field rules (validated in `validateImageClickScenario`):

- `name` — non-empty string.
- `type` — `"image_click"`. Missing `type` is treated as
  `"simple_click"` for backward compatibility.
- `settings.templateId` — non-empty string. Must reference an
  existing template asset.
- `settings.region` — optional `{ x, y, width, height }`,
  validated by Step 26's `validateRegionSettings`.
- `settings.threshold` — number in `[0, 1]`, default `0.75`.
- `settings.step` — one of `1 / 2 / 4 / 8`, default `4`.
- `settings.timeoutMs` — `>= 1000`, default `10000`.
- `settings.intervalMs` — `>= 100`, default `1000`.
- `settings.repeatCount` — `1..1000`, default `1`.

The shape is forward-compatible with the planned scenario
action type described in [`ACTION_SCHEMA.md`](./ACTION_SCHEMA.md).
**No `imageDataUrl`, no thumbnails, no pixel buffers** are ever
written into a scenario. The scenario only carries ids and
numbers.

## Required template

`image_click` requires an active template (Step 27). The
template must already be imported via the Templates tab and
must have a `previewDataUrl` resolved in renderer memory (which
is the default after `templates:load`). If the template is
missing or its image is unavailable the scenario fails with a
clear error and an `scenario.imageClick.failed` audit event
with `reason: 'missing-template'` or `'missing-template-image'`.

## Optional region

If `settings.region` is set, the matcher (Step 29) crops the
screen-capture preview to that rectangle in image-space before
searching. The same region is mirrored back to the user via
the Visual overlay on the Template Matching tab and the
diagnostics card.

If `settings.region` is `null` the matcher walks the entire
preview. The user can pin the active Step-26 region into the
form with the **"Use selected region"** button.

## Threshold / step

These map 1:1 to the Step-29 engine controls:

- `threshold` — confidence cut-off in `[0, 1]`. The result is
  classified as `matched=true` only when `score >= threshold`;
  otherwise the engine returns the best candidate with
  `matched=false` and the click engine emits
  `scenario.imageClick.noMatch`.
- `step` — the grid spacing the engine walks. Smaller values
  search more candidate positions but cost more CPU. The
  engine may **raise** the effective step internally if the
  cost guard kicks in, and that is captured both in the
  result (`requestedStep` vs `step`) and in audit events
  (`template.match.engine.warning` with
  `reason: step-raised-by-engine`).

## Execution flow

```text
Start scenario
  → validateRunnableScenario        [scenario-manager + safety-gates]
  → audit scenario.imageClick.started
  → onStart()
  for iteration in 1..repeatCount:
      if shouldStop:                  audit scenario.imageClick.stopped → onStop()
      audit scenario.imageClick.match.started
      runTemplateMatch(preview, template, region, threshold, step)
      audit scenario.imageClick.match.completed   { confidence, target, matched }
      if !matched:
          audit scenario.imageClick.noMatch
          onAction(noMatchAction)
          continue
      action = { type: image_click, templateId, targetPoint,
                 boundingBox, confidence, realClick: false, simulated: true }
      executeAction(action, ctx)      [action-pipeline]
        → audit action.imageClick.simulated
      audit scenario.imageClick.simulated
      onAction(action)
      onProgress(iteration, total)
      sleep intervalMs
  → onComplete()
```

Every step records an audit event. Every audit payload carries
**only ids and numeric metadata** — no `imageDataUrl`, no
thumbnail, no screenshot.

## Simulation-only behavior

- The action submitted to the action-pipeline carries
  `realClick: false` and `simulated: true`. The pipeline
  refuses anything else for `image_click` outright (it returns
  a `blocked: true` result and emits
  `action.imageClick.realBlocked`).
- The mock desktop adapter does not consume `image_click`.
  The pipeline routes `image_click` through the legacy
  simulate path so the audit event is the dedicated
  `action.imageClick.simulated` instead of the generic
  `action.simulated`.
- The click engine never moves the cursor, never enqueues a
  click, never types. `realClick: false` and `realMatching:
  false` invariants from Step 29 still hold.
- The match result lives only in renderer memory
  (`appState.execution.lastAction` for the latest, plus the
  Step-28/29 `templateMatching.lastResult` if the user also
  ran a one-off match from the Template Matching tab). It is
  never written to `templates.json`, `settings.json`,
  `scenarios.json`, `profiles.json`, or `localStorage`.

## What is *not* implemented

- Real cursor movement, real click, real keyboard.
- OCR / text detection. **No OCR is performed in Step 30.**
- OpenCV / opencv.js / opencv-js / sharp / jimp / pixelmatch /
  looks-same / robotjs / nut.js / iohook / uiohook-napi.
- Auto-rerun against the live screen.
- Multi-match / top-N candidates.
- A scenario action type accepted by a future native matcher.
- Saving any image bytes to disk.

## Future real click integration

When the [real-actions go/no-go review](./REAL_ACTIONS_GO_NO_GO.md)
opens the click gate:

- The `image_click` action shape stays. Only the simulate
  branch in `action-pipeline.executeAction` will gain a real
  branch behind a separate adapter.
- The action-pipeline will continue to refuse `realClick:
  true` until that adapter is registered AND the user has
  explicitly enabled real-input mode in Settings.
- Scenarios will keep their on-disk shape (only ids and
  numbers).

Until that gate opens, `image_click` is the sandbox where the
data shapes can be exercised without touching the OS.

## Test Match (Step 31)

Step 31 ships a Test Match panel inside the `image_click`
scenario form. It runs the Step-29 matcher over the captured
preview using the form's current values (template, region,
threshold, step) and renders a structured debug result, a
visual overlay, and an action preview — **without saving the
scenario and without clicking**.

See [`docs/IMAGE_CLICK_TEST_TOOLS.md`](./IMAGE_CLICK_TEST_TOOLS.md)
for the full data flow, error / warning IDs, and overlay rules.

Test Match is renderer-only logic. It never opens a new IPC
channel, never moves the cursor, never executes the scenario,
never persists the screenshot or the debug result on disk. The
diagnostics card "Image click test diagnostics" in Advanced →
Safety surfaces only ids and numbers.

## Cross-references

- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) — section
  "image_click does not perform real click".
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) — section
  "image_click scenario (Step 30)".
- [`SMOKE_TESTS.md`](./SMOKE_TESTS.md) — Step 30 smoke checks.
- [`ACTION_SCHEMA.md`](./ACTION_SCHEMA.md) — the `image_click`
  action schema entry.
- [`TEMPLATE_MATCHING_ENGINE.md`](./TEMPLATE_MATCHING_ENGINE.md)
  — the matcher used by the new scenario flow.
- [`TEMPLATE_ASSETS.md`](./TEMPLATE_ASSETS.md) — the template
  storage layer the scenario references by id.
- [`REGION_SELECTOR.md`](./REGION_SELECTOR.md) — the optional
  region the scenario can use to scope the search.
- [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) —
  the contract that gates the matcher → click handoff.
