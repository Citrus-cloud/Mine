# ClickFlow Desktop (Mine)

Electron-based desktop application for **ClickFlow** — the cross-platform smart click-automation project.

[![version](https://img.shields.io/badge/version-1.0.0-green)](#)

---

## 🇷🇺 Краткое описание

**ClickFlow Desktop v1.0.0 — финальный релиз 🏁**

Все 5 фаз завершены. 42 десктопных + 93+ Android JVM-тестов.

---

## Status ✅ RELEASED

> **v1.0.0 — All phases complete.**
>
> Safety gate · Real `imageClick`/`textClick` · Parity matrix · ru/en l10n ·
> E2E QA · User docs · Beta checklist · Final release.

## Features

- 🔍 **Image template matching** — click by screenshot region.
- 📝 **OCR text targeting** — click by visible text.
- 🛠️ **Visual scenario builder** — TAP / WAIT / NOTE actions + presets.
- 🔒 **4-check safety gate** — consent + review + rate limit + emergency stop.
- 🛡️ **Emergency stop** — halts all actions instantly.
- 🌐 **ru/en localization.**

## Run tests

```bash
npm test
# Runs 42 automated tests (safety review + smart click + e2e)
```

## Docs

- [User Guide](docs/user-guide.md)
- [Android Guide](docs/android-user-guide.md)
- [E2E Scenarios](docs/e2e-qa-scenarios.md)
- [Parity Matrix](docs/parity-matrix.md)
- [Release Notes](RELEASE_NOTES.md)

## Roadmap (Phases 1–5) ✅ COMPLETE

All 84 steps completed across both repos.

## License

MIT.
