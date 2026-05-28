# ClickFlow 0.1.0-beta — Release Tag Plan

This is the **plan**, not a script. Every command below is
typed by the maintainer **manually**. The repository will not
create a tag, push, or publish a release for you.

> **Prerequisites.** Walk the gates in this order before
> running any of the commands here:
>
> 1. [`PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md)
>    — every box ticked.
> 2. [`PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md) — sign-off
>    line at the bottom filled.
> 3. [`RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md) — Release
>    decision = "Ready"; **no active rows** in the Blockers
>    table.
> 4. [`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md) —
>    maintainer sign-off line filled.

---

## Tag

`v0.1.0-beta`

- The numeric prefix matches `package.json → version` (`0.1.0`).
- The `-beta` qualifier lives on the GitHub tag and the
  release title; `package.json → version` is **not** edited
  for the qualifier.
- Marked as **Pre-release** on GitHub.

## Pre-tag verification commands

Run these on the build host. **Order matters.** If anything
fails, fix and restart from the top.

```bash
# 1. Clean working tree
git status                       # must show "nothing to commit"

# 2. Install dependencies
npm install

# 3. Static smoke
npm run smoke                    # must report Failed: 0

# 4. App boots; manual smoke run from
#    docs/SMOKE_TESTS.md Step 20 (#115-#134) and Step 22
#    (#135-#150)
npm start

# 5. Build artifacts on the target OS (per docs/BUILD_ARTIFACTS.md)
npm run pack
npm run dist

# 6. Walk docs/PACKAGED_APP_QA.md against the produced binary.
#    Section 13 ("No real clicks verification") is mandatory.
```

If `npm run pack` / `npm run dist` cannot run on the current
build host, document the deferral in the PR and reschedule on
the correct target OS.

## Release-prep commit (optional)

In most cases the merged step-24 PR is sufficient and no
release-prep commit is needed. If you must touch the tree:

```bash
git checkout main
git pull --ff-only origin main

# (Only if there are last-minute documentation tweaks)
git add .
git commit -m "Prepare ClickFlow 0.1.0-beta release"
```

See [`RELEASE_COMMIT_MESSAGE.md`](./RELEASE_COMMIT_MESSAGE.md)
for the recommended title and body.

## Tag commands

```bash
# 1. Annotated tag from the latest main commit
git tag -a v0.1.0-beta -m "ClickFlow 0.1.0-beta"

# 2. Verify the tag locally
git tag -l "v*"
git show v0.1.0-beta

# 3. Push main first (only if a release-prep commit was made)
git push origin main

# 4. Push the tag — this is what makes the tag visible on GitHub
git push origin v0.1.0-beta
```

> **Do not retag.** If you need to re-do the release, create a
> new tag (`v0.1.1-beta` / `v0.1.0-beta.2`) and a new release.

## Publish the GitHub Release

Use [`GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md) as
the body. Mark the release as **Pre-release**.

### Web UI path (recommended for the first release)

1. Open https://github.com/Citrus-cloud/Mine/releases/new.
2. Choose tag `v0.1.0-beta` (the tag you just pushed).
3. Target: `main`.
4. Title: `ClickFlow 0.1.0-beta`.
5. Description: paste the body of
   [`GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md).
6. **Mark as a pre-release.**
7. Attach binaries from `dist/` after renaming per
   [`BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) §6.
8. Click **Publish release**.

### `gh` CLI path (alternative)

```bash
gh release create v0.1.0-beta \
  --title "ClickFlow 0.1.0-beta" \
  --notes-file docs/GITHUB_RELEASE_DRAFT.md \
  --prerelease \
  dist/ClickFlow-0.1.0-beta-windows-x64.exe \
  dist/ClickFlow-0.1.0-beta-macos-arm64.dmg \
  dist/ClickFlow-0.1.0-beta-linux-x64.AppImage
```

Adjust the asset list to whatever was actually produced on the
build host. **Do not invent assets.**

## Post-publication

- Open https://github.com/Citrus-cloud/Mine/releases. Verify
  the release page renders and every asset link starts a
  download.
- On a machine that did not build the artifacts: download the
  appropriate one, run it, and confirm:
  - `Copy diagnostics` shows `Simulation only: true`,
    `Sandbox: realActionsAllowed=false`,
    `Adapter: active=mock, ...realActionsAllowed=false`,
    `Release: ..., readyAfterManualQa=true`.
  - Running a scenario for ~30 s does not move the cursor and
    does not deliver input to any other application.
- Open a follow-up issue titled `Beta feedback — v0.1.0-beta`
  and pin it.

## Hard rules

- **No** automation in this repository creates tags or publishes
  releases.
- **No** force-push to `main` or to any release tag.
- **No** retroactive retag of `v0.1.0-beta`.
- **No** new `realDesktopActions` flip in this tag — that path
  is gated by
  [`REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) and
  is `0.3.x` work.
- **No** code signing assumed for this tag — Gatekeeper /
  SmartScreen will warn on first launch (documented in
  [`KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) and the
  release draft).
