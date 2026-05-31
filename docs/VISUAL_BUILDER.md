# Visual Builder — ClickFlow

> **Status: simulation-only, foundation tab.** The Visual
> Builder gathers the smart-features (Screen Capture, Region
> Selector, Templates, Template Matching, OCR mock, OCR real
> when enabled, Test OCR) into a single dashboard that lets the
> user assemble scenario drafts. The Visual Builder NEVER moves
> the cursor and NEVER clicks. It produces drafts that the user
> still has to **Save** manually inside the existing scenario
> form.

---

## 1. Overview

The Visual Builder lives at **Advanced → Visual Builder**. It
ships:

- A status row that summarises every smart-features slice
  (`Screen preview`, `Region`, `Template`, `Image match`,
  `OCR result`, `Real clicks: disabled`).
- Onboarding hints that link to the relevant tabs when
  prerequisites are missing.
- An action-type selector (`simple_click`, `image_click`,
  `text_click`).
- A preview area with declarative overlay layers (region,
  template match, template target, OCR blocks, OCR target,
  action target).
- Six overlay checkboxes plus **Show all** / **Hide all** /
  **Clear overlays** buttons.
- A quick-action row (Capture preview, Select region,
  Run image test, Run OCR test, Create scenario draft,
  Open scenario form).
- Three scenario-preset cards (Coordinate basic, Image-click
  basic, Text-click basic).
- A draft-preview card with **Open draft in form** button.

For the in-depth specs of each smart-feature see
[`docs/SCREEN_CAPTURE.md`](./SCREEN_CAPTURE.md),
[`docs/REGION_SELECTOR.md`](./REGION_SELECTOR.md),
[`docs/TEMPLATE_MATCHING_ENGINE.md`](./TEMPLATE_MATCHING_ENGINE.md),
[`docs/OCR_FOUNDATION.md`](./OCR_FOUNDATION.md),
[`docs/REAL_OCR_USAGE.md`](./REAL_OCR_USAGE.md).

## 2. OCR provider support (Step 41)

The Visual Builder now copies the **active OCR provider** into
every text_click draft it builds:

```js
draft.settings.ocrProvider = getActiveOcrProvider().id; // 'mock' | 'tesseract'
```

Default is `mock`. The draft preview card surfaces:

- `Source: visual-builder`
- `OCR provider used: mock | tesseract`
- `Real OCR: true | false`
- `Real clicks: false` (always)

When the user opens the draft in the scenario form, the form's
**OCR provider** select picks up the draft's value
automatically. The Visual Builder NEVER auto-enables real OCR.

## 3. Safety notes

- The Visual Builder is a **draft authoring** tab. It never
  saves a scenario, never runs a scenario, never clicks, never
  performs OCR by itself.
- Overlay layers are visualisation only. Toggling overlays does
  not trigger any computation.
- Quick-action buttons either navigate to the relevant tab
  (Capture preview, Select region, Run image test, Run OCR
  test, Open scenario form) or call pure helpers
  (Create scenario draft).
- The text_click branch of the draft builder consumes
  `state.ocr.lastResult` (mock OR real) — both paths are
  marked accordingly through the `provider` / `realOcr`
  fields. Switching providers in the OCR tab updates the
  draft preview when the user re-renders the Visual Builder
  tab.
- The action pipeline still rejects every `realClick: true`
  outright. The Visual Builder draft does NOT bypass it.

For the user manual on how to enable real OCR for the current
session see [`REAL_OCR_USAGE.md`](./REAL_OCR_USAGE.md).
