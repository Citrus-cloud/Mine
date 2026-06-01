# ClickFlow Desktop v1 Alpha — Tag Plan

> The repository will **not** create the tag or publish the release for
> you. This is the manual sequence the maintainer runs after QA.

## Suggested tag

`v1.0.0-alpha.1`

## Before tag

```bash
git status
npm install
npm run smoke
npm start
npm run pack
npm run dist
```

## Manual QA

- Use `docs/V1_ALPHA_MANUAL_TESTS.md`
- Use `docs/V1_ALPHA_PRE_RELEASE_CHECKLIST.md`
- Use `docs/V1_ALPHA_RELEASE_CHECKLIST.md`
- Use `docs/PACKAGED_APP_QA.md` if it exists

## After manual QA

```bash
git add .
git commit -m "Prepare ClickFlow Desktop v1 Alpha release"
git tag -a v1.0.0-alpha.1 -m "ClickFlow Desktop v1 Alpha"
git push origin main
git push origin v1.0.0-alpha.1
```

## GitHub Release

- Title: **ClickFlow Desktop v1 Alpha**
- Paste from `docs/V1_ALPHA_RELEASE_DRAFT.md`
- Upload artifacts from `dist/`
- Mark as **pre-release**

## Important

- Do not create the tag before manual QA.
- Do not publish if real clicks happen without confirmation.
- Do not publish if unsupported real actions are enabled.
- Do not publish if the packaged app fails to launch.
