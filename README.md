# ClickFlow Desktop (Mine)

Electron-based desktop application for **ClickFlow** — the cross-platform smart click-automation project.

---

## 🇷🇺 Краткое описание

**Где мы сейчас:**

- 🔄 **Только что сделали:** **Шаг 77** — `real-input-safety-review.js`:
  4 независимых проверки (review / consent 15с / rate ≤10/мин / no E-stop),
  `evaluateGate()`, `canDispatchRealInput()`. 15 тестов.
- ➡️ **Следующий шаг:** **Шаг 78** — реальные `image_click` / `text_click` через
  gate в `real-desktop-adapter-interface.js`.

---

## Status

> **Phase 4 (desktop smart click) — Step 77 done, Step 78 next.**
>
> **Just landed — Step 77:** `real-input-safety-review.js` — 4-check gate
> (reviewPassed, consentFresh 15s TTL, rateLimitOk ≤10/min, emergencyStopClear)
> + `evaluateGate()` + `canDispatchRealInput()` + 15 Node.js tests.
>
> **Next — Step 78:** wire `image_click` and `text_click` through the safety
> gate in the desktop adapter; `recordAction()` called on success.

## Run tests

```bash
node tests/real-input-safety-review.test.js
```

## Roadmap

### Phase 4 (Steps 77–79) — 🔄 in progress
- **Step 77 ✅** — Safety review gate.
- **Step 78 ➡️** — Real `image_click` / `text_click` under the gate.
- **Step 79** — QA + publish `v1.0.0-alpha.1`.

### Phase 5 (Steps 80–84)
- **80** parity + l10n · **81** e2e QA · **82** user docs · **83** public beta · **84** `v1.0.0`.

## License

MIT.
