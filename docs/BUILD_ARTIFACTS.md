# ClickFlow — Build Artifacts

This document describes what `npm run pack` and `npm run dist`
produce, where they live, what must **not** end up inside, and how
to name the files that you upload to a GitHub release.

> **Current target:** `0.1.0-beta` (simulation-only). The actual
> set of artifacts depends on which OS you run the build on —
> `electron-builder` ships installers / images for the current
> platform unless cross-build is explicitly configured.

---

## 1. Build commands

| Command                       | Purpose                                                |
|-------------------------------|--------------------------------------------------------|
| `npm run pack`                | Unpacked build under `dist/<platform>-<arch>-unpacked/` for smoke-launch. |
| `npm run dist`                | Packaged installers / images under `dist/`.            |

Both commands invoke `electron-builder`. They read the `build:`
block in `package.json`.

## 2. Output location

- `dist/` — top-level output directory (declared in
  `package.json → build.directories.output`).
- This folder is **ignored by git** (see `.gitignore`).

Never commit `dist/`. Never include `dist/` inside another `dist/`.

## 3. Expected artifacts after `npm run pack`

`electron-builder --dir` produces an unpacked layout. Examples:

| Platform | Path under `dist/`                                  |
|----------|-----------------------------------------------------|
| Windows  | `dist/win-unpacked/ClickFlow.exe` + resources       |
| macOS    | `dist/mac/ClickFlow.app` (Apple Silicon) or `dist/mac-arm64/ClickFlow.app` |
| Linux    | `dist/linux-unpacked/clickflow` + resources         |

These are useful for verifying the bundle. They are **not** suitable
for distribution; do not upload them to a GitHub release.

## 4. Expected artifacts after `npm run dist`

`electron-builder` produces final installers / images per the
`win` / `mac` / `linux` blocks in `package.json`:

| Platform | Default file                       | Notes                          |
|----------|------------------------------------|--------------------------------|
| Windows  | `ClickFlow Setup <version>.exe`    | NSIS installer                 |
| macOS    | `ClickFlow-<version>.dmg`          | DMG image                      |
| Linux    | `ClickFlow-<version>.AppImage`     | Single-file AppImage           |

`<version>` is taken from `package.json → version` (currently
`0.1.0`).

## 5. What must NOT be in the artifact

`electron-builder` controls what is bundled via the `files:` array
in `package.json → build`. Step 21 explicitly excludes:

- `.git/` and `.gitignore` (already filtered).
- `**/*.broken-*` (corruption-quarantine files from the runtime).
- `**/.DS_Store`, `**/Thumbs.db`.
- Any `userData/` (Electron writes that into a system path, not
  into the source tree).
- Nested `dist/` (do not run a build inside `dist/`).
- Local `.env` files. ClickFlow does not use them; if one ever
  appears, it is filtered by `.gitignore`.

Never bundle:

- Personal scenarios from `userData/scenarios.json`.
- Personal settings from `userData/settings.json`.
- Diagnostics dumps from beta testers.

## 6. GitHub release asset naming

After running `npm run dist`, **rename** the artifacts to a uniform
scheme before uploading them to the GitHub release. The shape is:

```
ClickFlow-<version>-<platform>-<arch>.<ext>
```

Where `<version>` is `0.1.0-beta` and `<platform>-<arch>` is the
combination produced. Example asset list for a multi-platform
release:

```
ClickFlow-0.1.0-beta-windows-x64.exe
ClickFlow-0.1.0-beta-windows-x64.zip
ClickFlow-0.1.0-beta-macos-arm64.dmg
ClickFlow-0.1.0-beta-macos-x64.dmg
ClickFlow-0.1.0-beta-linux-x64.AppImage
```

Notes:

- The actual file you produce depends on your build host.
  A Windows host will not produce a `.dmg`; a macOS host will not
  produce a `.exe`. **Do not synthesize cross-platform names** for
  builds that did not actually run.
- A `.zip` of the unpacked Windows folder is optional; it is useful
  for users who cannot run an installer.
- macOS DMGs are **not signed or notarized** in `0.1.0-beta`.
  Gatekeeper will warn on first launch. This is documented in the
  release notes (`docs/GITHUB_RELEASE_DRAFT.md`).
- Always upload artifacts that match the tagged commit.

## 7. Verifying an artifact before upload

For each downloaded / produced file:

1. Inspect its contents (DMG, NSIS, AppImage all support
   inspection without running).
2. Confirm the `package.json` inside the bundle reports
   `version: "0.1.0"` and `name: "clickflow"`.
3. Confirm `assets/icons/clickflow-icon.svg` is present.
4. Launch the artifact on the target OS.
5. From the app, copy diagnostics. Confirm the line
   `Simulation only: true` and that the
   `Sandbox: dryRunAvailable=true, realActionsAllowed=false, ...`
   row appears.
6. Run any single scenario for ~30 seconds in simulation mode and
   visually confirm **no real cursor movement, no input in any
   other application**.

If any of these fails, do not upload. Investigate first.

## 8. Re-using artifacts

GitHub release assets are immutable. If you find a regression after
upload, do not "edit" the asset — create a new patch tag and a new
release. The old release should keep its artifacts so users can
reproduce the regression.
