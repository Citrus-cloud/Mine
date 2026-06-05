# ClickFlow Desktop (Mine)

Electron-based desktop application for **ClickFlow**.

---

## 🇷🇺 Краткое описание

**Где мы сейчас:**

- ✅ **Шаги 77–78 сделаны.**
- 🔄 **Только что сделали:** **Шаг 78** — `real-smart-click.js`:
  `imageClick` + `textClick` через safety gate (5 шагов), 15 тестов.
- ➡️ **Следующий шаг:** **Шаг 79** — QA + публикация `v1.0.0-alpha.1`.

---

## Status

> **Phase 4 — Step 78 done, Step 79 next.**
>
> **Just landed — Step 78:** `imageClick` + `textClick` gated by 4-check
> safety review (review / consent 15s TTL / rate ≤10/min / no E-stop).
> One-use consent, injected adapter, 15 Node.js tests.
>
> **Next — Step 79:** QA checklist + bump version to `v1.0.0-alpha.1`.

## Run tests

```bash
node tests/real-input-safety-review.test.js
node tests/real-smart-click.test.js
```

## Roadmap

### Phase 4 (Steps 77–79)
- **77 ✅** Safety review gate · **78 ✅** Real clicks under gate · **79 ➡️** QA + alpha.1

### Phase 5 (Steps 80–84)
- **80** parity + l10n · **81** e2e QA · **82** user docs · **83** public beta · **84** `v1.0.0`

## License

MIT.
