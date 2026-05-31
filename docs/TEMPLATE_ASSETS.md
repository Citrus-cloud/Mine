# Template Assets (Step 27)

> **Status: Foundation only — simulation-only, preview-only.**
>
> Step 27 introduces a **Template Asset Manager**: a place to import,
> view, name, edit and delete small reference images that *future*
> steps will use for image search / OCR / template-anchored clicks.
> **Step 27 stops at storage.** ClickFlow does **not** match a
> template against the screenshot, run OCR, or trigger a real click
> on the matched location. The whole MVP remains
> [`simulation-only`](./KNOWN_LIMITATIONS.md).

## Purpose

ClickFlow's smart-visual roadmap (find image, find icon, find text,
template matching, OCR, visual scenario builder) needs a stable
home for the **reference images** the user picks. Without that home
every later step would have to re-invent storage, validation, and
preview rendering.

Step 27 delivers the home, and **only** the home:

- a place to import an image from disk (only via
  `dialog.showOpenDialog`);
- a place to keep its metadata between launches
  (`userData/templates/templates.json`);
- a place to keep the image bytes themselves
  (`userData/templates/images/template-<id>.<ext>`);
- a place in the UI to look at them, name them, and remove them.

Nothing else is wired up yet. The click engine is unaware of
templates. Scenarios cannot reference a template. The Step 25
screen-capture preview cannot be searched. Those connections are
future work, gated by [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).

## Current status

| Capability                                  | Status    |
|---------------------------------------------|-----------|
| Import image from file dialog               | ✅ Done   |
| png / jpg / jpeg / webp allow-list          | ✅ Done   |
| Magic-bytes verification                    | ✅ Done   |
| Copy into `userData/templates/images/`      | ✅ Done   |
| Persist metadata in `templates.json`        | ✅ Done   |
| Render preview in renderer (in memory only) | ✅ Done   |
| Edit name / description                     | ✅ Done   |
| Select active template                      | ✅ Done   |
| Delete a template                           | ✅ Done   |
| Reset all templates                         | ✅ Done   |
| Audit events (`template.*`)                 | ✅ Done   |
| Diagnostics card and `Templates: …` line    | ✅ Done   |
| **Find image on screen**                    | ❌ Not implemented (planned, gated) |
| **Find text on screen (OCR)**               | ❌ Not implemented (planned, gated) |
| **Click on found template**                 | ❌ Not implemented (planned, gated) |
| **Visual scenario builder using templates** | ❌ Not implemented (planned, gated) |

The "Future" tab in the Advanced dashboard already lists these
gaps; Step 27 simply unlocks the first prerequisite for them.

## Storage model

```
userData/
└── templates/
    ├── templates.json
    └── images/
        ├── template-<timestamp>-<hex>.png
        ├── template-<timestamp>-<hex>.jpg
        └── template-<timestamp>-<hex>.webp
```

- `templates.json` is created lazily on first import. If it does not
  exist `templates:load` returns an empty list with `success: true`.
- `templates.json` is **JSON-only metadata**. It deliberately
  contains **no** base64 strings, **no** data URLs, **no** pixel
  bytes, **no** original filesystem path of the picked image.
- A corrupt `templates.json` is renamed to
  `templates.json.broken-<timestamp>` on next read and the app
  starts with an empty list — same fallback strategy as
  `scenarios.json` / `settings.json` / `profiles.json`.
- The image files live next to `templates.json` under
  `images/`. The file name is derived from the freshly generated
  template id and the canonical extension we detected. The
  original filename only exists inside the metadata as a label.
- `templates:reset` deletes `templates.json` *and* removes any file
  in `images/` whose basename starts with `template-`. Files
  outside that allow-list are left alone.

## Supported image formats

| Extension | MIME            | Detected via                              |
|-----------|-----------------|-------------------------------------------|
| `.png`    | `image/png`     | 8-byte PNG signature `89 50 4E 47 0D 0A 1A 0A` |
| `.jpg` / `.jpeg` | `image/jpeg` | `FF D8 FF` SOI marker                  |
| `.webp`   | `image/webp`    | `RIFF ???? WEBP` container                |

Two layers gate the format:

1. The dialog filter restricts the visible files to
   `png / jpg / jpeg / webp`.
2. The main process re-reads the file and runs a magic-bytes check
   independently of the extension. A renamed `.exe` cannot pass.

The maximum accepted size is **16 MiB** per file. Anything larger
fails before the copy with a generic error message (no path leak).

## Metadata format

Each entry in `templates.json` follows this exact shape — the main
process strips any other field before writing:

```json
{
  "id": "template-<unix-ms>-<8 hex bytes>",
  "name": "Submit button",
  "description": "Primary submit button on the login form.",
  "fileName": "template-1717000000000-abcd1234efef5678.png",
  "originalFileName": "submit.png",
  "mimeType": "image/png",
  "sizeBytes": 12345,
  "width": 128,
  "height": 64,
  "createdAt": "2026-05-30T12:00:00.000Z",
  "updatedAt": "2026-05-30T12:00:00.000Z"
}
```

Contract for the renderer:

- **`previewDataUrl`** is *not* part of the JSON. The main process
  attaches it only to the in-memory IPC response of
  `templates:load` and `templates:import-image`. The renderer
  keeps it in `appState.templates.items[i].previewDataUrl`,
  scoped to the current process.
- `id` is generated in the main process. The renderer cannot
  pick it.
- `fileName` is opaque to the renderer; it lives only in the
  metadata so the user can locate the file if they really need
  to.
- `width` / `height` come from header parsing only — pixels are
  never decoded.
- `createdAt` / `updatedAt` are ISO timestamps in UTC.

## Privacy and safety notes

- **No network.** Templates are local-only files in `userData`.
  ClickFlow has no telemetry, no upload, no cloud sync.
- **No path leak.** The renderer never sees the original chosen
  path. Once the bytes are copied the original location is
  forgotten by the main process.
- **No `imageDataUrl` on disk.** Data URLs exist only as in-memory
  arguments inside the renderer. They never reach
  `templates.json`, `settings.json`, `scenarios.json`, or
  `profiles.json`.
- **No real clicks.** The click engine, the action pipeline, the
  mock adapter, and every safety gate carry on with
  `simulationOnly = true` and `realActionsImplemented = false`.
  ClickFlow never performs a click on a matched template at
  Step 27. The matcher itself is not implemented.
- **No OCR / no image matching.** Step 27 ships zero new
  dependencies. `tesseract`, `tesseract.js`, `opencv4nodejs`,
  `@u4/opencv4nodejs`, `sharp`, `jimp`, `pixelmatch` are still
  **not** in `package.json`. The smoke check enforces it. No OCR
  is ever run against the screenshot or against a stored template.
  No image matching, no template matching, no fuzzy match — the
  matcher is not implemented in 0.1.x.
- **No mobile platforms.** Templates remain a desktop-only feature.
- **No background imports.** The main process opens the file
  dialog only when the renderer explicitly calls
  `window.clickflow.templates.importImage()` from a user click.

## What is *not* implemented

Step 27 deliberately stops short of the smart-visual features.
None of the items below ship in this step:

- searching for a template inside a screenshot;
- OCR of a screenshot region;
- pixel-perfect or fuzzy template matching;
- moving the cursor or clicking the location of a found template;
- automatic re-running of templates against the live screen;
- a visual scenario builder that drag-and-drops templates onto
  scenarios;
- referencing a template id from inside `scenario.actions[i]`;
- a "click on template" entry in [`docs/ACTION_SCHEMA.md`](./ACTION_SCHEMA.md);
- exporting templates as part of scenario backup / restore.

These are tracked under the planned `image_click` action type.

## Future use for template matching

When the safety gate in
[`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md)
is met, the storage shipped here will be reused as-is by the
matcher. Concretely:

- The matcher will read the image bytes from
  `userData/templates/images/<fileName>` — the same path the
  Step 27 importer writes to.
- The matcher will read the metadata from `templates.json` —
  the same shape Step 27 documents above.
- The matcher will receive the screenshot from
  `screen-capture:capture-preview` (Step 25) and an optional
  region from `appState.regionSelector.normalizedRegion`
  (Step 26).
- The matcher will run **inside the main process** — never in
  the renderer — so the renderer never gains access to OS input.
- A new `image_click` action type will reference a template by
  `id` and a region by index, and a new safety gate will
  block the action when no `realDesktopActions` adapter is
  installed.

In other words, Step 27 is the *passive* half (assets) and the
matcher is the *active* half. The active half is gated behind the
[real-actions go/no-go review](./REAL_ACTIONS_GO_NO_GO.md), the
[real-action sandbox](./REAL_ACTION_SANDBOX.md), and a successful
adapter self-test.

## Future scenario type `image_click`

Planned, **not** implemented in 0.1.x. Tracked here so the schema
does not drift between this doc and
[`docs/ACTION_SCHEMA.md`](./ACTION_SCHEMA.md).

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

| Field        | Type     | Description                                                |
|--------------|----------|------------------------------------------------------------|
| `templateId` | string   | Id of a stored template asset.                             |
| `region`     | object?  | Optional Step-26 image-space region to scope the search.   |
| `confidence` | number   | Match threshold (0 … 1). 0.9 is a sane default.            |
| `timeout`    | number   | Max time to search before giving up (ms).                  |
| `action`     | string   | What to do once matched: `"click"`, `"doubleClick"`, …     |

Until the gate is met, this object is **not** accepted by the
click engine. The action pipeline rejects unknown types and the
mock adapter has no handler for `image_click`.

## Cross-references

- [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) — the
  "Templates are stored but not matched yet" section.
- [`SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) — the
  "Template Asset Manager (Step 27)" section.
- [`SMOKE_TESTS.md`](./SMOKE_TESTS.md) — the
  "Step 27 — Template Asset Manager" smoke checks.
- [`SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md) — the upstream
  preview source that templates will eventually be matched against.
- [`REGION_SELECTOR.md`](./REGION_SELECTOR.md) — the upstream
  optional region scoping.
- [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) — the
  contract that gates the matcher and any "click on template"
  action.



---

## Step 28 — Templates can now feed the mock matcher

Step 28 introduces a [Template Matching Mock / Dry-run](./TEMPLATE_MATCHING_MOCK.md)
pipeline that consumes templates as **read-only input metadata**
(`{ id, name, width, height }`). The bytes themselves are never
accessed by the matcher in `0.1.x`:

- the matcher is mock — it never decodes a single pixel;
- it never reads `userData/templates/images/<fileName>`;
- it never persists a match result back to `templates.json`;
- it never modifies, renames, or deletes any template asset.

Templates remain stored ASSETS only. The mock matcher just lets
the renderer wire the asset metadata into a future-shaped
bounding-box / target-point pipeline so a real matcher can drop
in later behind the
[real-actions go/no-go](./REAL_ACTIONS_GO_NO_GO.md) gate without
re-shaping the storage layer.

See [`docs/TEMPLATE_MATCHING_MOCK.md`](./TEMPLATE_MATCHING_MOCK.md).



---

## Step 30 — templates can now drive an `image_click` scenario

[Step 30](./IMAGE_CLICK_SCENARIO.md) introduces a new scenario
type that references a template by `id` and runs the Step-29
matcher on every iteration. Templates remain stored ASSETS
only — the scenario carries the `templateId` and a small set
of numeric settings, never an `imageDataUrl`, a thumbnail or a
pixel buffer.

See [`docs/IMAGE_CLICK_SCENARIO.md`](./IMAGE_CLICK_SCENARIO.md).
