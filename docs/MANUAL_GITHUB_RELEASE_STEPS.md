# Manual GitHub Release Steps — ClickFlow Desktop v1 Alpha

> **Why this file exists.** An automated release attempt was run inside
> a restricted CI/agent sandbox. The static safety checks all passed,
> but the build toolchain could **not** be installed in that
> environment, and no GitHub Release CLI/API was available there.
> Therefore the tag was **not** created and the GitHub pre-release was
> **not** published automatically. Run the steps below from a normal
> developer machine (full network access + native build tooling) to
> finish the release honestly.

- **Target version:** `1.0.0-alpha.1`
- **Tag:** `v1.0.0-alpha.1`
- **Release title:** `ClickFlow Desktop v1 Alpha`
- **Release type:** pre-release (alpha)
- **Release body source:** `docs/V1_ALPHA_RELEASE_DRAFT.md`

---

## What the sandbox already verified (PASS)

- `npm run smoke` → **PASS** (Total: 1664, Failed: 0).
- `package.json` version is `1.0.0-alpha.1` (matches the release target).
- No `robotjs`, `iohook`, `uiohook-napi`, or `opencv` / `opencv.js` in
  `package.json` (the only runtime dependency is `tesseract.js`).
- `realDesktopActions: false` and `realCoordinateClick: false` by default.
- Real `image_click`, real `text_click`, and keyboard automation are
  hard-coded `false` and are **not** runtime-togglable.
- `contextIsolation: true`, `nodeIntegration: false` in `main.js`.
- CSP in `src/index.html` is not relaxed (no `unsafe-inline` /
  `unsafe-eval`).
- `scripts/smoke-check.js` is static (Node `fs`/`path` only); it
  performs no real click.
- The app performs no real click at startup (`app.whenReady` only
  creates the window, menu, tray, and registers hotkeys).

## What the sandbox could NOT do (must be done locally)

- `npm install` → **FAILED**: the sandbox proxy refused the Electron
  binary download (`npm error code E403 ... GET
  https://registry.npmjs.org/electron`). This is an environment
  restriction, not a project defect.
- `npm start`, `npm run pack`, `npm run dist` → **could not run**
  (Electron / electron-builder were never installed; `command not
  found`). No `dist/` artifacts could be produced.
- GitHub Release publication → **not available** (no `gh` CLI and no
  release API access in the sandbox).

---

## Step 1 — Verify on a normal machine

```bash
git status
npm install
npm run smoke
npm start        # confirm the window launches, then quit
npm run pack
npm run dist
```

Do not continue unless `npm run smoke`, `npm run pack`, and `npm run
dist` succeed and the packaged app launches.

## Step 2 — Manual QA

- `docs/V1_ALPHA_MANUAL_TESTS.md`
- `docs/V1_ALPHA_PRE_RELEASE_CHECKLIST.md`
- `docs/V1_ALPHA_RELEASE_CHECKLIST.md`
- `docs/PACKAGED_APP_QA.md`

Record results in `docs/V1_ALPHA_QA_REPORT.md`. Stop if a real click
happens without confirmation, if any unsupported real action is
enabled, or if the packaged app fails to launch.

## Step 3 — Commit (only if there are changes)

```bash
git add .
git commit -m "Prepare ClickFlow Desktop v1 Alpha release"
```

If there is nothing to commit, that is fine — continue.

## Step 4 — Tag

Check first; do not recreate an existing valid tag:

```bash
git tag -l v1.0.0-alpha.1
```

If it does not exist:

```bash
git tag -a v1.0.0-alpha.1 -m "ClickFlow Desktop v1 Alpha"
```

If it exists, confirm it points at the intended commit
(`git show v1.0.0-alpha.1`) before continuing.

## Step 5 — Push

```bash
git push origin main
git push origin v1.0.0-alpha.1
```

## Step 6 — Create the GitHub pre-release

### Option A — GitHub CLI

```bash
gh release create v1.0.0-alpha.1 \
  --title "ClickFlow Desktop v1 Alpha" \
  --notes-file docs/V1_ALPHA_RELEASE_DRAFT.md \
  --prerelease \
  dist/*.exe dist/*.dmg dist/*.AppImage dist/*.zip dist/*.deb
```

(Only list the artifacts your build actually produced; omit patterns
that do not match.)

### Option B — GitHub web UI

1. Releases → **Draft a new release**.
2. Choose the tag `v1.0.0-alpha.1`.
3. Title: **ClickFlow Desktop v1 Alpha**.
4. Paste the body from `docs/V1_ALPHA_RELEASE_DRAFT.md`.
5. Check **Set as a pre-release**.
6. Upload artifacts from `dist/`.
7. **Publish release.**

## Step 7 — Artifacts to upload (from `dist/` only)

- Windows: NSIS installer (`*.exe`) and/or `*.zip`
- macOS: `*.dmg` and/or `*.zip`
- Linux: `*.AppImage`, `*.deb`, and/or `*.tar.gz`

**Do not upload:** `node_modules`, full source archives, temp files,
`userData`, screenshots, private logs, `.env`, or stale `dist`/cache
files.

## What stays disabled in this build

- Real `image_click`
- Real `text_click`
- Keyboard automation
- Repeat / batch real clicks (one click per fresh confirmation)
- Captcha / anti-bot / ad-click / banking / protected-app automation
  (out of scope permanently)
