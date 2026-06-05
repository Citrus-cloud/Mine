# ClickFlow Android — User Guide

> Version: 0.1.0-prealpha · Step 82

---

## What is ClickFlow Android?

ClickFlow Android is the mobile companion to ClickFlow Desktop.
It provides the same smart-click logic (template matching, OCR, scenario builder)
with an Android-native UI and a controlled tap session model.

---

## Architecture overview

```
Screen capture (MediaProjection)
        ↓
Region selector → Template manager → TemplateMatcher
        ↓                    ↓
 ImageTargetController    OcrController → TextTargetController
        ↓                    ↓
         └──────────────────┘
                  ↓
         SmartTargetTapController
                  ↓
     ControlledTapSessionManager
                  ↓
          SafetyGate (4 flags)
                  ↓
           Audit + Emergency Stop
```

---

## Build & run

```bash
./gradlew assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

## Run tests

```bash
./gradlew testDebugUnitTest
```

---

## Safety model

Same four-check model as the desktop:
`reviewPassed` + `consentFresh` + `rateLimitOk` + `emergencyStopClear`.

`SafetyGate.canRunRealTap()` = `false` in this pre-alpha build.
Real taps are admitted only through `ControlledTapSessionManager` with all
four flags set. Emergency stop: call `SmartSessionEmergencyStop.execute()`.

---

## 🇷🇺 Краткая документация

Приложение находится в стадии pre-alpha. Реальные нажатия через `SafetyGate`
появятся в Phase 3 (Шаги 74–76). Доменный слой и все JVM-тесты уже готовы.
