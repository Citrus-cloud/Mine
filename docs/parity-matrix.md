# Android ↔ Desktop Parity Matrix (Step 80)

This document tracks feature parity between ClickFlow Android (`Smart-Android-Click`)
and ClickFlow Desktop (`Mine`). Updated at Step 80.

| Feature | Android | Desktop | Notes |
|---------|---------|---------|-------|
| Screen capture | ✅ MediaProjection | ✅ Electron desktopCapturer | |
| Region selector | ✅ CaptureRegion | ✅ region-selector.js | |
| Template manager | ✅ TemplateManager | ✅ template-manager.js | |
| Template matching | ✅ TemplateMatcher | ✅ template-matching-engine.js | |
| Image-target controller | ✅ ImageTargetController | ✅ image-click-test-tools.js | |
| OCR provider | ✅ OcrController (stub) | ✅ Tesseract + mock | |
| Text-target controller | ✅ TextTargetController | ✅ text-click-test-tools.js | |
| Visual scenario builder | ✅ VisualScenarioBuilder | ✅ visual-builder.js | |
| Scenario presets | ✅ BuiltInPresets | ✅ scenario-presets.js | |
| Controlled tap session | ✅ ControlledTapSessionManager | ⚠️ desktop uses consent flow | No native tap on desktop |
| Smart-target controller | ✅ SmartTargetTapController | ✅ real-smart-click.js | |
| Audit log | ✅ SmartSessionAuditLog | ✅ audit-log-manager.js | |
| Emergency stop | ✅ SmartSessionEmergencyStop | ✅ activateEmergencyStop() | |
| Safety gate | ✅ SafetyGate (4 flags) | ✅ real-input-safety-review.js | |
| Localization | ⚠️ en only | ✅ i18n.js (en + ru Step 80) | Android ru: Step 80 |
| QA checklist | ✅ JVM tests | ✅ docs/qa-checklist-alpha1.md | |

**Parity status:** ✅ All critical paths covered. ⚠️ = partial / in-progress.
