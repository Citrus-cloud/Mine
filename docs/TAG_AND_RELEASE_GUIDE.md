# ClickFlow — Tag & Release Guide

Manual command sequence for creating the `v0.1.0-beta` GitHub
pre-release. Every command is run **manually** by the maintainer.
**Nothing in this repository will create a tag or publish a
release for you.**

> Read [`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md) and
> [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) first. Do not
> proceed if any blocker is open.

---

## 0. Prerequisites

- Local clone of `Citrus-cloud/Mine` on the latest `main`.
- Node.js 18+ and npm.
- Build host that can run the platform you intend to ship
  installers for (Windows for NSIS, macOS for DMG, Linux for
  AppImage). Cross-builds are not configured in `0.1.0-beta`.
- GitHub CLI (`gh`) is **optional**; the steps below show both
  the `gh` path and the web-UI path.

## 1. Confirm the working tree is clean

```bash
git checkout main
git pull --ff-only origin main
git status
```

`git status` must report `nothing to commit, working tree clean`.
If anything is dirty, stash or commit first; do **not** include
local changes in a release.

## 2. Install dependencies

```bash
npm install
```

## 3. Run the smoke check

```bash
npm run smoke
```

Expect `Failed: 0`. If anything fails, **stop** and fix it before
continuing. The release tag is gated on a green smoke run.

## 4. Smoke-launch the app

```bash
npm start
```

Walk the manual QA checklist in
[`RELEASE_FINAL_CHECK.md`](./RELEASE_FINAL_CHECK.md) §4.
Most importantly:

- Confirm a running scenario produces **no real cursor movement**
  and **no input arrives in any other application**.
- Confirm the **Real action sandbox** dry-run preview behaves as
  documented — Confirm logs `Dry-run confirmed. No real actions
  executed.` and **does not** fire any real action.
- Confirm `Copy diagnostics` shows `Release: ...,
  releaseDocsReady=true`.

## 5. Build the artifacts

```bash
# Unpacked tree under dist/<platform>-<arch>-unpacked/
npm run pack

# Final installers / images under dist/
npm run dist
```

Produced files depend on the build host. See
[`BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) for the expected
layout and the canonical asset names.

Verify each artifact per [`BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md)
§7 before continuing.

## 6. Create the tag

```bash
# annotated tag from the latest main commit
git tag -a v0.1.0-beta -m "ClickFlow 0.1.0-beta"

# verify
git tag -l "v*"
git show v0.1.0-beta
```

Do **not** retroactively retag. If you need to re-do a release,
create a new tag (`v0.1.1` or `v0.1.0-beta.2`).

## 7. Push the tag

```bash
git push origin v0.1.0-beta
```

This is the **first push** that makes the tag visible on GitHub.
Until you do this, no one else can see the tag.

## 8. Create the GitHub release

### 8.a — via web UI (recommended for the first release)

1. Open https://github.com/Citrus-cloud/Mine/releases/new.
2. **Choose a tag:** `v0.1.0-beta` (the tag you just pushed).
3. **Target:** `main`.
4. **Release title:** `ClickFlow 0.1.0-beta`.
5. **Description:** paste the entire body of
   [`GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md).
6. **Mark as a pre-release:** check the box.
7. **Attach binaries:** drag-and-drop the artifacts from `dist/`
   after renaming them per
   [`BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) §6.
8. Click **Publish release**.

### 8.b — via `gh` CLI (alternative)

```bash
gh release create v0.1.0-beta \
  --title "ClickFlow 0.1.0-beta" \
  --notes-file docs/GITHUB_RELEASE_DRAFT.md \
  --prerelease \
  dist/ClickFlow-0.1.0-beta-windows-x64.exe \
  dist/ClickFlow-0.1.0-beta-macos-arm64.dmg \
  dist/ClickFlow-0.1.0-beta-linux-x64.AppImage
```

Adjust the asset list to whatever was actually produced on this
build host. Do **not** invent assets.

## 9. Post-publication checks

- Open https://github.com/Citrus-cloud/Mine/releases and confirm
  the release page renders.
- Click each asset link and confirm the download starts.
- On at least one machine that did not build the artifacts:
  - Download the appropriate artifact.
  - Run it.
  - From the app, copy diagnostics. Confirm
    `Simulation only: true`, `Sandbox: realActionsAllowed=false`,
    `Adapter: active=mock`, `Release: ..., releaseDocsReady=true`.
  - Run a scenario for ~30 seconds. Confirm **no real cursor
    movement**.
- Open a follow-up issue titled `Beta feedback — v0.1.0-beta` and
  pin it; ask testers to comment there with bug links and
  general feedback.

## 10. If a regression is discovered

GitHub release assets are immutable. If a regression is found:

1. **Do not** edit the published release in place.
2. Open a Safety report (or a normal bug report).
3. Bump the version (`0.1.1` for a patch).
4. Create a new tag and a new release.
5. Add a brief note at the top of the affected release saying
   "Superseded by `vX.Y.Z`. See …".

## 11. Things this guide will NEVER do for you

- Create the tag.
- Push the tag.
- Publish the release.
- Upload assets.

This guide is documentation only. Every action above is a
keystroke a maintainer must make in person.
