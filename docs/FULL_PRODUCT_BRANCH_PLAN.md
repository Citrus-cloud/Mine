# ClickFlow — Full Product Branch Plan

> **Status:** Step 46. Defines the long-lived branches for the product
> and where real desktop work is allowed to happen.
>
> **Key rule:** real desktop actions are developed on a dedicated
> branch and only enabled after a written safety review. Released
> `v0.2.x` artifacts never gain real clicks.

---

## `main`

- **Stable smart beta.** Currently `v0.2.0-smart-beta`.
- Simulation-only at all times: `realDesktopActions:false`,
  `simulationOnly:true`.
- Only well-reviewed, safe changes land here.

## `v1-desktop`

- **Real desktop automation branch.** Where the real adapter,
  confirmation flow, persistent audit logs, and per-OS permissions are
  built.
- Real actions remain **disabled** on this branch until
  `docs/V1_RELEASE_CRITERIA.md` and `docs/REAL_ACTIONS_GO_NO_GO.md` are
  fully satisfied and a written safety review is recorded.
- A real build is a **separate, opt-in, clearly-labelled** artifact —
  never the default download.

## `hotfix/v0.2.x`

- **Smart beta bugfixes only.** Crashes, broken UI, missing
  translations, packaging, docs.
- **`v0.2.x` must not receive real clicks** or any new large feature.
- See `docs/V0_2_1_PATCH_PLAN.md`.

## `v1-android-research`

- **Android future research only.** No automation control shipped.
- Android restricts cross-app automation (Accessibility Service
  policy, Play Store rules); this branch is for feasibility study.
- Its own safety review and release line. iOS remains limited by
  platform design and is not targeted beyond a read-only companion
  concept.

---

## Rules summary

- Real desktop actions are best developed in a **separate branch**
  (`v1-desktop`), isolated from released builds.
- **`v0.2.x` never gets real clicks.**
- `v1-desktop` must **pass a safety review** before real actions are
  enabled, behind a feature flag, with the action pipeline blocking by
  default.
- No branch may add captcha/anti-bot bypass, ad-click automation, or
  banking/payment/protected-app automation.
