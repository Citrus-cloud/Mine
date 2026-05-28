# ClickFlow 0.1.0-beta — Recommended Release Commit Message

This is the recommended commit message for the **release-prep
commit** that precedes creating the `v0.1.0-beta` tag.

> **This file is documentation only.** Do not paste these
> commands into a CI script. The maintainer types them by hand
> after walking
> [`PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md) and
> signing off
> [`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md) and
> [`PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md).

---

## Recommended commit title

```
Prepare ClickFlow 0.1.0-beta release
```

## Recommended commit body

```
- Finalized beta release documentation
- Updated release readiness checks
- Verified simulation-only safety model
- Confirmed no real desktop actions are included
- Updated smoke-check and release QA docs
- Prepared GitHub release draft and tag guide
```

## How to use

```bash
# After PR for step 24 is merged into main:
git checkout main
git pull --ff-only origin main

# (Walk the manual gates first — see RELEASE_TAG_PLAN.md.)

# Then, if any final touch-up is needed before the tag:
git add .
git commit -m "Prepare ClickFlow 0.1.0-beta release" -m "
- Finalized beta release documentation
- Updated release readiness checks
- Verified simulation-only safety model
- Confirmed no real desktop actions are included
- Updated smoke-check and release QA docs
- Prepared GitHub release draft and tag guide
"
```

If the merged step-24 PR already represents the release-prep
state and no extra files need to land, **skip the commit step**
— there is no value in an empty release-prep commit. Tag the
existing `main` HEAD per
[`RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md).

## Rules

- **No mention of any feature that is not in the build.** The
  body above lists only documentation work; that is intentional.
  ClickFlow `0.1.0-beta` ships the simulation-only beta as
  documented in
  [`FINAL_RELEASE_SUMMARY.md`](./FINAL_RELEASE_SUMMARY.md).
- **No claim of a feature flag flip.** `realDesktopActions`
  remains `false` and any commit that flips it is rejected by
  this release plan; that change requires
  [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).
- **No reformat-only churn.** A release-prep commit is allowed
  to touch only release-related files.

## Forbidden body lines

Do **not** add any of the following to the commit body. They
contradict the build:

- "Implements real desktop actions"
- "Adds OCR"
- "Adds image recognition"
- "Adds mobile build"
- "Re-enables `realDesktopActions`"
- "Activates the real-desktop adapter"

If any of those is what you want to ship, it is a `0.3.x` line
item that must go through
[`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) — not
a release-prep commit on `0.1.x`.
