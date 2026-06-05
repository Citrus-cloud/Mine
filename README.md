# ClickFlow Desktop (Mine)

Electron-based desktop application for **ClickFlow** — the cross-platform smart click-automation project.

---

## 🇷🇺 Краткое описание

**Где мы сейчас:**

- ✅ **Сделано:** Шаги 51–79. **Phase 4 завершена. v1.0.0-alpha.1 готова.**
- 🔄 **Только что сделали:** **Шаг 79** — QA-чеклист + `RELEASE_NOTES.md` +
  `package.json` → `1.0.0-alpha.1`.
- ➡️ **Следующий шаг:** **Шаг 80** — паритет Android↔Desktop + локализация
  (начало Phase 5).

---

## Status

> **v1.0.0-alpha.1 — Phase 4 COMPLETE.**
>
> All four safety checks, real `imageClick` / `textClick`, 30 new tests.
> QA checklist: `docs/qa-checklist-alpha1.md`.
>
> **Next — Step 80 (Phase 5):** feature parity + localization.

## Run tests

```bash
node tests/real-input-safety-review.test.js
node tests/real-smart-click.test.js
# or:
npm test
```

## Roadmap

### Phase 4 (Steps 77–79) ✅ COMPLETE
### Phase 5 (Steps 80–84) 🔄 starting
- **80 ➡️** parity + l10n · **81** e2e QA · **82** user docs · **83** public beta · **84** `v1.0.0`

## License

MIT.
