# ClickFlow Desktop v1 — Implementation Checklist

> **Status:** Step 46 — foundation laid. Most boxes below are
> deliberately unchecked: they describe the full v1 journey, which
> spans many steps. **Real desktop actions stay disabled until the
> safety review passes.**

## 1. Core stability

- [x] Simulation-only smart beta shipped (`v0.2.0-smart-beta`).
- [x] Uniform action-result shape across modes.
- [x] Action-type taxonomy (active + planned/disabled).
- [ ] Crash-free long-run soak test on each OS.
- [ ] Deterministic scenario engine under load.

## 2. Real adapter safety gates

- [x] Real adapter **interface** exists, execution disabled.
- [x] Pipeline blocks real mode by default (multi-condition gate).
- [x] Adapter registry refuses to activate the real adapter.
- [ ] Written safety review sign-off recorded in repo.
- [ ] Per-run user confirmation flow implemented.

## 3. Real coordinate click

- [ ] Real `click` via adapter (gated, audited, confirmed).
- [ ] Emergency stop verified to interrupt within one action cycle.
- [ ] Target allowlist / denylist enforced.

## 4. Real image click

- [ ] Live-screen capture → match → real `image_click` (gated).
- [ ] Confidence threshold + no-match safe abort.

## 5. Real text click

- [ ] Real OCR → match → real `text_click` (gated).
- [ ] OCR stays local-only; never clicks without confirmation.

## 6. Visual Builder v1

- [x] Drafts-only authoring preserved.
- [ ] "Will perform real action once enabled" banner.
- [ ] Per-action safety annotations.

## 7. Audit logs

- [x] In-memory audit log manager (`src/audit-log-manager.js`).
- [x] Redaction rules (no screenshots/base64/paths/PII).
- [ ] Persistent, append-only file storage via main IPC.
- [ ] Export via explicit user action.

## 8. Permissions

- [x] Permission manager (status/guidance only).
- [x] Permission checklist UI in Safety Center.
- [ ] Per-OS automated probes where safe.

## 9. UI/UX polish

- [x] Safety Center tab.
- [x] V1 readiness dashboard.
- [ ] First-run safety walkthrough.
- [ ] Real-mode confirmation dialogs.

## 10. Packaging

- [x] electron-builder pack/dist config (simulation-only build).
- [ ] Separate, clearly-labelled opt-in real build (future).
- [ ] Per-OS permission prompts wired into packaged app.

## 11. QA

- [x] `npm run smoke` green.
- [ ] Manual packaged-app QA per OS for v1 foundation.
- [ ] Real-mode test matrix (only after sign-off).

## 12. Release

- [x] Smart beta released (`v0.2.0-smart-beta`).
- [ ] `v1-desktop` branch created for real work.
- [ ] `docs/V1_RELEASE_CRITERIA.md` fully satisfied before any real
      build ships.
