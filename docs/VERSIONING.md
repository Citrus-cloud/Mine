# ClickFlow — Versioning

## Current version

- `package.json → version`: **`0.1.0`**.
- Public release tag: **`v0.1.0-beta`**.
- Stage: **simulation-only** beta MVP.

The runtime `version` field is `0.1.0` (semver-clean). The `-beta`
qualifier is carried by the GitHub tag and the release title.

## Approach

ClickFlow follows [Semantic Versioning 2.0.0](https://semver.org/)
with the conventions described below.

- **Patch** (`0.1.0 → 0.1.1`) — bug fixes, documentation, smoke
  improvements, beta polish that does not change the runtime
  contract or any safety invariant.
- **Minor** (`0.1.x → 0.2.0`) — backward-compatible additions:
  better profiles / templates / import-export UX, additional UI
  panels, additional in-memory audit features, accessibility work.
- **Major** (`0.x → 1.0`) — first stable, non-beta release. Real
  desktop input is **not** part of `1.0` automatically; see below.

Pre-release qualifiers in tags follow `0.1.0-beta`, `0.1.1-rc1`,
etc. The qualifier is informational; semver rules still apply
to the numeric prefix.

## What is **not** a version bump

- Translation fixes (`src/i18n.js` only): patch.
- README / `docs/*` changes: usually no version bump unless they
  document a breaking change.
- `npm run smoke` updates: usually no version bump.
- Reformatting that touches no behavior: no version bump.

## Future release lines

| Line       | Theme                                      | Real input? | Status                                    |
|------------|--------------------------------------------|-------------|-------------------------------------------|
| `0.1.x`    | beta polish, packaging, accessibility, CI  | No          | **Active.** `v0.1.0-beta` is the first tag. Patch tags as needed. |
| `0.2.x`    | profiles, templates, richer import/export, error reporting, audit events UI 1.0 (still in-memory) | No | Planned. |
| `0.3.x`    | desktop action adapter prototype           | **Yes — gated** | **Not started.** Cannot ship until every requirement in [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) is met. |
| `0.4.x`    | OCR / image recognition research           | Local-only research | Research only. May never ship. |
| Future     | `1.0` stable                               | Decided per-line | Not scheduled. |

### Hard rule

A release tag can flip `realDesktopActions` to `true` **only after**:

1. A passing run of the entire checklist in
   [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md).
2. A separate, written safety review filed via the Safety report
   issue template.
3. Maintainer sign-off recorded on the safety review issue.
4. File-based audit log persistence implemented per
   [`docs/AUDIT_LOG_PLAN.md`](./AUDIT_LOG_PLAN.md).
5. UI confirmation flow per [`docs/REAL_ACTIONS_GO_NO_GO.md`](./REAL_ACTIONS_GO_NO_GO.md) §3.

Until those five items are done, every release stays
**simulation-only**.

## Release naming on GitHub

- Tag: `vMAJOR.MINOR.PATCH[-qualifier]` — e.g. `v0.1.0-beta`,
  `v0.1.1`, `v0.2.0-rc1`.
- Release title: `ClickFlow X.Y.Z[-qualifier]`.
- Pre-release flag: checked for any tag with a `-beta` / `-rc*`
  qualifier.
- Asset names: per [`docs/BUILD_ARTIFACTS.md`](./BUILD_ARTIFACTS.md).

## Bump procedure

1. Update `package.json → version` to the new numeric prefix.
2. Update `CHANGELOG.md` and `RELEASE_NOTES.md`.
3. Update [`docs/GITHUB_RELEASE_DRAFT.md`](./GITHUB_RELEASE_DRAFT.md).
4. Update [`docs/ROADMAP.md`](./ROADMAP.md) if a release line
   closes.
5. Run `npm run smoke`. Walk `docs/RELEASE_CHECKLIST.md`.
6. Commit, tag, push, build, upload assets.

No backdated tags. No retagging.
