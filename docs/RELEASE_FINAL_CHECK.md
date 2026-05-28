# ClickFlow 0.1.0-beta Final Release Check

This is the **final pre-tag check** for the `v0.1.0-beta` GitHub
pre-release. Every applicable item below must be confirmed before
the tag is created. Entries that require running a packaged binary
or producing OS-specific installers cannot be confirmed inside the
Kiro sandbox and must be walked locally on the target OS.

> **Cross-references.** Use this page together with
> [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) (the long-form
> checklist) and [`TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md)
> (the manual git / GitHub command sequence). This page is the
> short summary that a maintainer signs off on.

---

## Release target

- **Version:** `0.1.0-beta`.
- **`package.json` version field:** `0.1.0` (the `-beta` qualifier
  is carried by the GitHub tag, not the runtime version).
- **Release type:** beta (`Pre-release` flag must be checked on
  GitHub).
- **Mode:** **simulation-only**.
- **Step:** 22 — GitHub beta release finalization.

## Required checks

Run these from a clean checkout on the build host. **Order matters.**

```bash
# 1. Clean checkout, no untracked files
git status

# 2. Install
npm install

# 3. Static smoke (must be exit 0; should be 130+ checks at step 22)
npm run smoke

# 4. App boots; perform the manual smoke run from
#    docs/SMOKE_TESTS.md "Step 20" and "Step 22 — release smoke"
npm start

# 5. Build artifacts on the target OS
#    (if the build host cannot, document and reschedule)
npm run pack
npm run dist
```

If `npm run pack` or `npm run dist` cannot run on the current build
host (e.g. trying to produce a `.dmg` on Linux without macOS
tooling), this check is **deferred** to the next host and **does
not** count as failed. Document the deferral in the PR.

## Safety checks

- [ ] No real system clicks are produced when a scenario runs.
      Watched cursor + a focused text editor for at least 60 s.
- [ ] No OCR engines bundled.
- [ ] No image-recognition libraries bundled.
- [ ] No mobile build target.
- [ ] No prohibited dependencies in `package.json`
      (`robotjs`, `nut.js`, `iohook`, `uiohook-napi`,
      `node-key-sender`).
- [ ] `contextIsolation: true` in `main.js`.
- [ ] `nodeIntegration: false` in `main.js`.
- [ ] `preload.js` does not expose `ipcRenderer` directly.
- [ ] CSP unchanged: `default-src 'self'; script-src 'self'; style-src 'self';`.

## Documentation checks

- [ ] [`README.md`](../README.md) references step 22 and the
      `0.1.0-beta` release.
- [ ] [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) references
      step 22.
- [ ] [`CHANGELOG.md`](../CHANGELOG.md) has the step 22 entry.
- [ ] [`RELEASE_NOTES.md`](../RELEASE_NOTES.md) is consistent
      with the `0.1.0-beta` release.
- [ ] [`docs/SECURITY_CHECKLIST.md`](./SECURITY_CHECKLIST.md) is
      reviewed; final-release section signed off.
- [ ] [`docs/KNOWN_LIMITATIONS.md`](./KNOWN_LIMITATIONS.md) is
      reviewed; the simulation-only / no-real-clicks / no-OCR /
      no-image-recognition / no-mobile entries are present and
      current.
- [ ] [`docs/GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md)
      is finalized and ready to paste into the GitHub release
      form.
- [ ] [`docs/RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) has
      been walked end-to-end.
- [ ] [`docs/BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md) covers
      every artifact you intend to upload.

## Manual QA checks

Walk the relevant section of
[`docs/SMOKE_TESTS.md`](./SMOKE_TESTS.md):

- [ ] **Main screen** renders and displays the simulation-mode
      badge plus the version badge.
- [ ] **Scenarios** — create / edit / delete; default scenario
      cannot be deleted; persistence survives restart.
- [ ] **Settings** — language and theme switch immediately and
      persist across restart.
- [ ] **RU / EN** parity check; manual spot-check via
      [`docs/I18N_CHECKLIST.md`](./I18N_CHECKLIST.md).
- [ ] **Advanced dashboard** cycles through all 7 tabs without
      console errors.
- [ ] **Diagnostics** card is fully populated; `Copy diagnostics`
      contains `Simulation only: true`, `Sandbox:
      realActionsAllowed=false`, `Adapter: active=mock,
      realActionsAllowed=false`, `Release: ...,
      releaseDocsReady=true`.
- [ ] **Mock adapter self-test** in Advanced → Safety logs
      `Adapter self-test passed (4/4)`.
- [ ] **Dry-run sandbox** (`Create dry-run preview` →
      `Confirm dry-run`) logs
      `Dry-run confirmed. No real actions executed.` followed by
      `Dry-run completed safely`. **No real input fires.**
- [ ] **Import / export** for scenarios and settings round-trips.
- [ ] **Profiles** — selection, persistence.
- [ ] **Emergency stop** — `Escape` aborts a running scenario;
      `CmdOrCtrl+Alt+E` global hotkey aborts when ClickFlow is
      not focused.

## Release decision

- **Release decision:** **Ready after manual verification.**
  - Static checks all pass (`npm run smoke` exit 0; smoke check
    files / docs / security / packaging invariants all OK).
  - Manual QA on at least one platform must be walked before the
    tag is created. The maintainer signing off this page records
    which platform(s) were tested.

- **Blockers (if any):** record below at sign-off time.
  - [ ] —

- **Notes:**
  - macOS DMGs in `0.1.0-beta` are **not** notarized. Gatekeeper
    will warn on first launch. This is documented in
    `docs/GITHUB_RELEASE_DRAFT.md` and `docs/KNOWN_LIMITATIONS.md`.
  - Windows installers in `0.1.0-beta` are **not** Authenticode
    signed. SmartScreen will warn. Same documentation note.
  - GitHub Actions CI is not yet wired (planned for step 23+).
    The smoke run is local-only for `v0.1.0-beta`.
  - `git tag` and the GitHub release publication are **manual**
    by design — see
    [`TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md).

---

**Maintainer sign-off (fill at release time):**

- Date: ____
- Platform(s) walked: ____
- Reviewer: ____
- Decision: Ready / Not ready
