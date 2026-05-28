# ClickFlow — Action Schema

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
