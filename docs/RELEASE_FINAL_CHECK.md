# ClickFlow 0.1.0-beta Final Release Check

This is the **final pre-tag check** for the `v0.1.0-beta` GitHub
pre-release. Every applicable item below must be confirmed before
the tag is created. Entries that require running a packaged binary
or producing OS-specific installers cannot be confirmed inside the
Kiro sandbox and must be walked locally on the target OS.

> **Cross-references.** Use this page together with
> [`FINAL_RELEASE_SUMMARY.md`](./FINAL_RELEASE_SUMMARY.md) (the
> single-page snapshot),
> [`PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md) (the
> boxes the maintainer ticks),
> [`RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md) (the manual
> command sequence),
> [`RELEASE_COMMIT_MESSAGE.md`](./RELEASE_COMMIT_MESSAGE.md)
> (the recommended commit message),
> [`RELEASE_CHECKLIST.md`](./RELEASE_CHECKLIST.md) (long-form
> checklist), and
> [`TAG_AND_RELEASE_GUIDE.md`](./TAG_AND_RELEASE_GUIDE.md) (the
> longer git / GitHub command sequence). This page is the
> short summary the maintainer signs off on.

---

## Release target

- **Version:** `0.1.0-beta`.
- **`package.json` version field:** `0.1.0` (the `-beta` qualifier
  is carried by the GitHub tag, not the runtime version).
- **Release type:** beta (`Pre-release` flag must be checked on
  GitHub).
- **Mode:** **simulation-only**.
- **Step:** 23 — Post-pack QA and release blocker pass.

## Required checks

Run these from a clean checkout on the build host. **Order matters.**

```bash
# 1. Clean checkout, no untracked files
git status

# 2. Install
npm install

# 3. Static smoke (must be exit 0; should be 149+ checks at step 23)
npm run smoke

# 4. App boots; perform the manual smoke run from
#    docs/SMOKE_TESTS.md "Step 20" and "Step 22 — release smoke"
npm start

# 5. Build artifacts on the target OS
#    (if the build host cannot, document and reschedule)
npm run pack
npm run dist

# 6. Walk docs/PACKAGED_APP_QA.md against the produced binary
#    on the target OS. Any blocker found goes into
#    docs/RELEASE_BLOCKERS.md.
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

- [ ] [`README.md`](../README.md) references step 23 and the
      `0.1.0-beta` release.
- [ ] [`PROJECT_CONTEXT.md`](../PROJECT_CONTEXT.md) references
      step 23.
- [ ] [`CHANGELOG.md`](../CHANGELOG.md) has the step 23 entry.
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
- [ ] [`docs/RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md)
      "Release decision" line currently says "Ready after manual
      packaged-app QA". No active rows in the **Blockers**
      table.
- [ ] [`docs/PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md) has been
      walked on at least one target OS and the sign-off line is
      filled.
- [ ] [`docs/FINAL_RELEASE_SUMMARY.md`](./FINAL_RELEASE_SUMMARY.md)
      "Release recommendation" line says "Ready for beta
      pre-release after manual packaged-app QA" and the sign-off
      line is filled.
- [ ] [`docs/PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md)
      has every box ticked; the maintainer line at the bottom
      records `Decision: Proceed`.
- [ ] [`docs/RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md) has
      been read; the prerequisite chain at the top of that page
      is satisfied.
- [ ] [`docs/RELEASE_COMMIT_MESSAGE.md`](./RELEASE_COMMIT_MESSAGE.md)
      provides the recommended title and body if a release-prep
      commit is needed.

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

- **Release decision:** **Ready for beta pre-release after
  manual packaged-app QA.**
  - Static checks all pass (`npm run smoke` exit 0; smoke check
    files / docs / security / packaging invariants all OK).
  - **Packaged-app QA from
    [`docs/PACKAGED_APP_QA.md`](./PACKAGED_APP_QA.md) must be
    walked on at least one target OS** before the tag is
    created.
  - **All boxes in
    [`docs/PRE_RELEASE_CHECKLIST.md`](./PRE_RELEASE_CHECKLIST.md)
    must be ticked.**
  - Any new blocker discovered during that walk is recorded in
    [`docs/RELEASE_BLOCKERS.md`](./RELEASE_BLOCKERS.md). Tag is
    not created while the **Release decision** at the bottom of
    `RELEASE_BLOCKERS.md` is "Not ready".
  - Tag and publication follow
    [`docs/RELEASE_TAG_PLAN.md`](./RELEASE_TAG_PLAN.md). The
    repository will not create a tag or publish a release for
    you.
  - The maintainer signing off this page records which platform(s)
    were tested.

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
