# ClickFlow `v0.2.0-smart-beta` — Post-release Checklist

> **Status:** Step 45 — Post-release cleanup and feedback tracking.
>
> This checklist is used **after** the Smart Desktop Beta
> (`v0.2.0-smart-beta`, `package.json` `version: "0.2.0-beta"`)
> has been published as a GitHub **pre-release**. It verifies the
> published artifacts, runs a post-release smoke pass, confirms the
> feedback channels are open, and lists the follow-up planning work.
>
> ClickFlow stays **simulation-only** through this entire phase:
> no real desktop clicks, no real keyboard input, no OCR-driven
> clicks. `realDesktopActions: false`, `simulationOnly: true`,
> `nodeIntegration: false`, `contextIsolation: true`, CSP unchanged.

---

## 1. Release verification

Confirm the published GitHub release is correct and complete.

- [ ] GitHub release exists for `v0.2.0-smart-beta`.
- [ ] Git tag `v0.2.0-smart-beta` exists and points at the
      release commit.
- [ ] Release is marked as **pre-release** (not "Latest"/stable).
- [ ] Release notes are visible and readable
      (see `docs/SMART_BETA_RELEASE_DRAFT.md` for the source body).
- [ ] Build artifacts are uploaded (Windows NSIS, macOS DMG,
      Linux AppImage, as produced by `npm run dist`).
- [ ] Download of at least one artifact works from a clean
      machine / browser session.

## 2. Smoke after release

Re-run a basic smoke pass against the **published** artifact, not
the dev tree.

- [ ] Download the artifact for the current OS.
- [ ] Install / unpack it.
- [ ] Launch the app.
- [ ] Run a basic `simple_click` scenario; confirm the progress
      card fills and **no** real cursor movement happens.
- [ ] Open the **Advanced** dashboard.
- [ ] Check the **Screen Capture** tab (preview only, no disk write).
- [ ] Check the **Templates** tab (assets only, no matching/clicks).
- [ ] Check the **OCR** tab (mock OCR; real OCR stays off until the
      session opt-in; OCR never clicks).
- [ ] Check the **Visual Builder** tab (creates drafts only).
- [ ] Verify **no real clicks**: open **Advanced → Safety →
      Diagnostics**, confirm `simulationOnly: true`,
      `realDesktopActions: false`, `realClick=false`, and no
      private filesystem paths leak.

## 3. Feedback tracking

Confirm the project is ready to receive structured feedback.

- [ ] GitHub Issues are enabled on the repository.
- [ ] Bug report template is available
      (`.github/ISSUE_TEMPLATE/bug_report.md`).
- [ ] Feature request template is available
      (`.github/ISSUE_TEMPLATE/feature_request.md`).
- [ ] Safety report template is available
      (`.github/ISSUE_TEMPLATE/safety_report.md`).
- [ ] Known limitations are linked from the release notes and the
      README (`docs/KNOWN_LIMITATIONS.md`).
- [ ] Triage process is documented (`docs/FEEDBACK_TRIAGE.md`).

## 4. Follow-up

Plan the next iterations. No new large features and no real
clicks are introduced during this phase.

- [ ] Collect incoming bugs from issues / testers.
- [ ] Prioritize blockers using the severity / priority model in
      `docs/FEEDBACK_TRIAGE.md`.
- [ ] Plan a `v0.2.1` patch release for bugfixes only
      (see `docs/V0_2_1_PATCH_PLAN.md`).
- [ ] Plan the `v0.3.0` real-adapter **research** branch — planning
      only, real desktop actions stay disabled
      (see `docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`).

---

## Related documents

- `docs/FEEDBACK_TRIAGE.md` — issue labels, severity, priority,
  triage processes, release-blocker criteria.
- `docs/V0_2_1_PATCH_PLAN.md` — bugfix-only patch plan.
- `docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md` — real-adapter research
  branch plan (planning only).
- `docs/SMART_BETA_RELEASE_NOTES.md` — full smart-beta release notes.
- `docs/SMART_BETA_RELEASE_DRAFT.md` — GitHub release body.
- `docs/KNOWN_LIMITATIONS.md` — what is intentionally not built.
- `docs/PACKAGED_APP_QA.md` — manual packaged-app QA checklist.
