# ClickFlow — Action Schema

> **Step 17 update.** Action validation is now centralized in
> `src/action-pipeline.js` (`validateAction()` is the single source
> of truth for the schema, `evaluateActionSafety()` adds safety-gate
> checks, and `executeAction()` is the only entry point used by the
> click engine).
>
> **Step 18 update.** The same schema is also enforced at the adapter
> boundary by `src/desktop-adapter-interface.js`
> (`validateAdapterAction()`, `normalizeAdapterAction()`,
> `getSupportedAdapterActions()` returns `["click"]`). The mock
> adapter (`src/mock-desktop-adapter.js`) and the future real
> adapter both consume this schema. **The currently supported action
> is the simulated click only** — `executeMockAction()` records the
> attempt and emits `adapter.mock.executed`; it does not produce any
> OS input. Any caller that requests `executionMode === "real"` is
> rejected by `blockRealAction()` with an `action.real.blocked` audit
> event.
>
> **Step 19 update.** Action *previews* exist now via
> `src/real-action-sandbox.js` (`createDryRunPlan()`,
> `createRealActionPreview()`). **A preview is not an execution.**
> The plan is a description: `mode: "dry-run"`, `realExecution: false`,
> `actionsPreview` capped at 10 items, `truncated` reports whether
> the underlying scenario contains more iterations. The pipeline
> recognises `executionMode === "dry-run"` as a no-op that emits
> `real.sandbox.preview.created`.

## Overview

This document describes the action format used by ClickFlow's click-engine. Actions represent individual operations that the engine executes (currently in simulation mode only).

## Current Action: click

The only currently implemented action type.

```json
{
  "type": "click",
  "x": 500,
  "y": 400,
  "button": "left"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| type | string | yes | Action type. Currently only `"click"` |
| x | number | yes | X coordinate (pixels from top-left), >= 0 |
| y | number | yes | Y coordinate (pixels from top-left), >= 0 |
| button | string | yes | Mouse button: `"left"`, `"right"`, or `"middle"` |

### Validation Rules

- `x` must be a number >= 0
- `y` must be a number >= 0
- `button` must be one of: `"left"`, `"right"`, `"middle"`
- When safety mode is active:
  - Scenario `intervalMs` must be >= `safetySettings.minIntervalMs`
  - Scenario `repeatCount` must be <= `safetySettings.maxRepeatCount`

### Current Behavior

In simulation mode, `simulateClick(action)` returns:

```json
{
  "ok": true,
  "simulated": true,
  "action": { "type": "click", "x": 500, "y": 400, "button": "left" },
  "timestamp": "2025-01-15T10:30:00.000Z"
}
```

No actual OS-level mouse action occurs.

---

## Optional `settings.region` (Step 26)

> **Step 26 update.** `simple_click` scenarios may now carry an
> optional `settings.region` rectangle in the **original
> screenshot's coordinate space**. The field is **inert** in
> `0.1.x` — the click engine never reads it; it exists as an
> anchor for future image-matching / OCR steps that have not yet
> shipped (and that will go through `docs/REAL_ACTIONS_GO_NO_GO.md`
> before they do). See [`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md)
> for the user-facing description.

```json
{
  "id": "demo",
  "name": "Demo",
  "type": "simple_click",
  "settings": {
    "x": 500,
    "y": 400,
    "intervalMs": 500,
    "repeatCount": 100,
    "button": "left",
    "region": { "x": 320, "y": 180, "width": 480, "height": 270 }
  },
  "meta": { "createdAt": "...", "updatedAt": "..." }
}
```

### Region fields

| Field          | Type   | Required | Description                                                                  |
|----------------|--------|----------|------------------------------------------------------------------------------|
| region         | object | no       | Optional rectangle in the original screenshot's pixel space.                 |
| region.x       | number | yes (if region present) | Top-left X, must be a non-negative finite number.             |
| region.y       | number | yes (if region present) | Top-left Y, must be a non-negative finite number.             |
| region.width   | number | yes (if region present) | Must be a positive finite number.                             |
| region.height  | number | yes (if region present) | Must be a positive finite number.                             |

### Validation rules (Step 26)

`scenario-manager.validateRegionSettings(region)` returns
`{ valid: boolean, error: string|null }`:

- `region === null` / `undefined` → valid (the field is optional).
- All four members must be finite numbers.
- `region.x >= 0`, `region.y >= 0`.
- `region.width > 0`, `region.height > 0`.

### Backwards compatibility

- Old scenarios without `settings.region` keep working unchanged.
- The click engine ignores `settings.region`; the field is consumed
  by future image-matching / OCR steps only.
- `clearScenarioRegion(scenarioId)` removes only the `region` field
  and stamps `meta.updatedAt`; everything else under `settings.*`
  is preserved.

---

## Future Action Types (Planned, NOT Implemented)

### doubleClick

```json
{
  "type": "doubleClick",
  "x": 500,
  "y": 400,
  "button": "left"
}
```

### move

```json
{
  "type": "move",
  "x": 300,
  "y": 200,
  "duration": 100
}
```

| Field | Type | Description |
|-------|------|-------------|
| duration | number | Movement duration in ms (0 = instant) |

### scroll

```json
{
  "type": "scroll",
  "x": 500,
  "y": 400,
  "direction": "down",
  "amount": 3
}
```

| Field | Type | Description |
|-------|------|-------------|
| direction | string | `"up"`, `"down"`, `"left"`, `"right"` |
| amount | number | Scroll units (positive integer) |

### keyPress

```json
{
  "type": "keyPress",
  "key": "enter"
}
```

| Field | Type | Description |
|-------|------|-------------|
| key | string | Key name (e.g., `"a"`, `"enter"`, `"tab"`, `"escape"`) |

### hotkey

```json
{
  "type": "hotkey",
  "keys": ["ctrl", "c"]
}
```

| Field | Type | Description |
|-------|------|-------------|
| keys | string[] | Array of keys pressed simultaneously |

### wait

```json
{
  "type": "wait",
  "duration": 1000
}
```

| Field | Type | Description |
|-------|------|-------------|
| duration | number | Wait time in milliseconds |

### findText (Planned — requires OCR)

```json
{
  "type": "findText",
  "text": "Submit",
  "action": "click",
  "timeout": 5000
}
```

| Field | Type | Description |
|-------|------|-------------|
| text | string | Text to find on screen |
| action | string | What to do when found: `"click"`, `"doubleClick"` |
| timeout | number | Max time to search (ms) |

### findImage (Planned — requires image recognition)

```json
{
  "type": "findImage",
  "imagePath": "button.png",
  "action": "click",
  "confidence": 0.9,
  "timeout": 5000
}
```

| Field | Type | Description |
|-------|------|-------------|
| imagePath | string | Path to reference image |
| action | string | What to do when found |
| confidence | number | Match confidence threshold (0-1) |
| timeout | number | Max time to search (ms) |

---

## Validation Rules (Future Real Mode)

When `executionMode === "real"`:

1. Action must be validated in **renderer** (click-engine) AND in **main process**
2. Main process is the final safety gate — it can reject any action
3. Coordinates must be within detected screen bounds
4. For keyboard actions, blocked key combinations should be configurable
5. Rate limiting applies to all action types
6. Each action must have an audit log entry BEFORE execution

## Implementation Status

| Action Type | Status |
|-------------|--------|
| click | ✅ Implemented (simulation only) |
| doubleClick | ❌ Planned |
| move | ❌ Planned |
| scroll | ❌ Planned |
| keyPress | ❌ Planned |
| hotkey | ❌ Planned |
| wait | ❌ Planned |
| findText | ❌ Planned (requires OCR) |
| findImage | ❌ Planned (requires image recognition) |



---

## Future: Step 27 introduces template ASSETS only

[Step 27](./TEMPLATE_ASSETS.md) ships a Template Asset Manager
that stores small reference images in
`userData/templates/templates.json` +
`userData/templates/images/template-<id>.<ext>`. **It does not
match templates against the screenshot, run OCR, or trigger any
click.** The matcher and the action type below are still
**planned only** in `0.1.x` and remain blocked by
[`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).

### image_click (Planned — requires template asset + matcher)

```json
{
  "type": "image_click",
  "templateId": "template-<unix-ms>-<8 hex bytes>",
  "region": { "x": 0, "y": 0, "width": 0, "height": 0 },
  "confidence": 0.9,
  "timeout": 5000,
  "action": "click"
}
```

| Field        | Type    | Description                                                                                       |
|--------------|---------|---------------------------------------------------------------------------------------------------|
| `templateId` | string  | Id of a stored template asset (Step 27).                                                          |
| `region`     | object? | Optional Step-26 image-space region scoping the search.                                           |
| `confidence` | number  | Match-confidence threshold (0 … 1). Default 0.9.                                                  |
| `timeout`    | number  | Max time to search before giving up (ms).                                                         |
| `action`     | string  | What to do once matched: `"click"`, `"doubleClick"`, …                                            |

The action references a **stored template by id**, not the image
bytes. The matcher resolves the id to a file path inside
`userData/templates/images/` at execution time. Until the safety
gate is met:

- `image_click` is **not** a recognised action in
  `src/click-engine.js`.
- `src/action-pipeline.js` rejects unknown action types.
- The mock adapter has no handler for it.
- No scenario validation accepts `templateId` in
  `scenario.actions[i]` yet.

When the gate opens, the matcher will:

- run **inside the main process** — not the renderer;
- read the screenshot from `screen-capture:capture-preview`
  (Step 25);
- read the optional region from
  `appState.regionSelector.normalizedRegion` (Step 26);
- read the template image bytes from the path described in
  `docs/TEMPLATE_ASSETS.md`.

| Action Type   | Status                                                                                  |
|---------------|------------------------------------------------------------------------------------------|
| `image_click` | ❌ Planned (requires template matcher + Step 27 storage). Stored ASSETS already exist.   |



---

## Step 28 — `image_click` action preview (still mock / not executed)

[Step 28](./TEMPLATE_MATCHING_MOCK.md) materialises the **shape**
of the planned `image_click` action through
`createImageClickActionPreview(match)`. The result is rendered in
the new Advanced → **Template Matching** tab as a JSON-like text
block, never as HTML. The click engine, the action pipeline, the
mock adapter, and the dry-run sandbox **still do not understand
`image_click`** — Step 28 stops at the preview.

```json
{
  "type":         "image_click",
  "mode":         "preview",
  "templateId":   "template-<unix-ms>-<8 hex bytes>",
  "templateName": "Submit button",
  "targetPoint":  { "x": 320, "y": 180 },
  "boundingBox":  { "x": 256, "y": 148, "width": 128, "height": 64 },
  "confidence":   0.87,
  "usedRegion":   null,
  "realClick":    false,
  "realMatching": false,
  "note":         "Preview only. Not executed by the click engine."
}
```

| Field          | Type     | Description                                                                |
|----------------|----------|----------------------------------------------------------------------------|
| `type`         | string   | Always `"image_click"`. Recognised only as a preview at Step 28.           |
| `mode`         | string   | Always `"preview"` at Step 28. Real execution requires the future matcher. |
| `templateId`   | string   | Id of a stored template asset (Step 27).                                   |
| `templateName` | string   | Display name copied from the template asset.                               |
| `targetPoint`  | object   | `{ x, y }` — the center of the mock bounding box.                          |
| `boundingBox`  | object   | `{ x, y, width, height }` produced by the mock pipeline.                   |
| `confidence`   | number   | Mock confidence, deterministic from the input metadata, in `[0, 1]`.       |
| `usedRegion`   | object?  | Optional Step-26 region used to scope the search.                          |
| `realClick`    | boolean  | Always `false` at Step 28. The click engine does not consume this preview. |
| `realMatching` | boolean  | Always `false` at Step 28.                                                 |
| `note`         | string   | Human-readable reminder that this is a preview, not an action.             |

When the [real-actions go/no-go](./REAL_ACTIONS_GO_NO_GO.md) gate
opens, the same shape will be promoted to a real
`scenario.actions[i]` entry validated by `click-engine` /
`action-pipeline`. Step 28's preview defines the wire format.

| Action Type    | Status                                                                                        |
|----------------|------------------------------------------------------------------------------------------------|
| `image_click`  | ❌ Planned. Step 27 storage + Step 28 mock match preview. Real matcher and execution still gated. |



---

## Step 29 — `image_click` action preview now carries real-engine numbers

The `image_click` action preview is unchanged in shape, but the
fields it carries can now come from the **real preview matching
engine** (Step 29) instead of the deterministic mock (Step 28).

- `confidence` is a real number computed by the engine, in
  `[0, 1]`. Default threshold is `0.75`.
- `boundingBox` and `targetPoint` are in the original preview
  coordinate space (image-space), even when the engine had to
  downscale internally for performance.
- `usedRegion` carries the user-drawn region (Step 26) when
  present.

The action preview is **still not executed** by the click engine,
the action pipeline, the mock adapter, or the dry-run sandbox.
Step 29 stops at producing the shape; flipping the click switch
remains gated by [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).



---

## Step 30 — `image_click` is now an executable simulation-only action

[Step 30](./IMAGE_CLICK_SCENARIO.md) promotes the
`image_click` shape from a Step-28 preview to a real
**simulation-only** action that the click engine and the
action pipeline both understand.

```json
{
  "type":        "image_click",
  "templateId":  "template-1717000000000-abcd1234efef5678",
  "targetPoint": { "x": 320, "y": 180 },
  "boundingBox": { "x": 256, "y": 148, "width": 128, "height": 64 },
  "confidence":  0.87,
  "realClick":   false,
  "simulated":   true
}
```

| Field         | Type     | Description                                                                               |
|---------------|----------|-------------------------------------------------------------------------------------------|
| `type`        | string   | Always `"image_click"`.                                                                   |
| `templateId`  | string   | Id of a stored template asset (Step 27).                                                  |
| `targetPoint` | object   | `{ x, y }` — the center of the matched bounding box.                                      |
| `boundingBox` | object   | `{ x, y, width, height }` produced by the matcher (Step 29).                              |
| `confidence`  | number   | Real confidence score from the engine, in `[0, 1]`.                                       |
| `realClick`   | boolean  | **MUST be `false`** at Step 30. `true` is rejected by the action-pipeline.                |
| `simulated`   | boolean  | `true` — the action goes through the simulate path; the cursor does not move.             |
| `status`      | string?  | Optional `"no_match"` for the on-screen "best candidate" result of a low-confidence run.  |

The action-pipeline accepts `image_click` ONLY through the
simulate path. The mock desktop adapter does not consume it
(only `click` actions go through the adapter); `image_click`
flows through the legacy simulate branch and emits
`action.imageClick.simulated`. Any caller that asks for
`executionMode: "real"` is rejected and emits
`action.imageClick.realBlocked`. There is no real-click
integration in `0.1.x`.

| Action Type    | Status                                                                                          |
|----------------|-------------------------------------------------------------------------------------------------|
| `image_click`  | ✅ Simulation-only (Step 30). Real click integration gated behind `REAL_ACTIONS_GO_NO_GO.md`.   |
