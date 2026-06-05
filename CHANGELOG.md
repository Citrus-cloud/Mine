# Changelog — ClickFlow Desktop (Mine)

All notable changes are documented here.

## [Unreleased]

### Step 80 — Parity matrix + Russian localization for smart-click

- New `docs/parity-matrix.md` — Android ↔ Desktop feature parity table
  covering all 16 feature groups (Steps 66–79). Status: ✅ all critical paths
  covered; ⚠️ Android ru localization in progress.
- New `src/i18n-ru-smartclick.js` — 30 Russian strings for Phase 3–4 features:
  safety gate checks, real-click dispatch results, emergency-stop UI,
  consent dialog. Keys follow existing `i18n.js` convention.
- Phase 5 begins.

## v1.0.0-alpha.1 (Step 79)

### Step 79 — QA checklist + release
- `docs/qa-checklist-alpha1.md`, `RELEASE_NOTES.md`, `package.json` → 1.0.0-alpha.1.

### Step 78 — Real image_click + text_click
- `real-smart-click.js` + 15 tests.

### Step 77 — Safety review gate
- `real-input-safety-review.js` + 15 tests.

### Step 51 and earlier — see git history
