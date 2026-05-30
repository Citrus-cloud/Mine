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
