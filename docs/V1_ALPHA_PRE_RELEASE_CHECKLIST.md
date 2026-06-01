# ClickFlow Desktop v1 Alpha — Pre-release Checklist

> Every applicable box must be ticked before tagging `v1.0.0-alpha.1`.
> Tag and publication are **manual**. Items that require a packaged
> binary are walked locally on the target OS.

- [ ] Repository is clean
- [ ] package.json version checked (`1.0.0-alpha.1`)
- [ ] npm install works
- [ ] npm run smoke passes
- [ ] npm start works
- [ ] npm run pack works
- [ ] npm run dist works
- [ ] Packaged app launches
- [ ] Main screen works
- [ ] simple_click simulation works
- [ ] simple_click dry-run works
- [ ] real-coordinate disabled by default
- [ ] real-coordinate blocked without session enable
- [ ] real-coordinate requires fresh confirmation
- [ ] one click per confirmation verified
- [ ] repeatCount > 1 real mode blocked
- [ ] image_click real mode blocked
- [ ] text_click real mode blocked
- [ ] keyboard automation blocked
- [ ] audit logs verified
- [ ] run summary verified
- [ ] emergency stop verified
- [ ] Safety Center verified
- [ ] Diagnostics verified
- [ ] Smart visual features checked
- [ ] OCR mock checked
- [ ] Tesseract session OCR checked, if available
- [ ] Visual Builder checked
- [ ] No prohibited dependencies (robotjs / nut.js / iohook / uiohook-napi / opencv)
- [ ] README updated
- [ ] RELEASE_NOTES updated
- [ ] CHANGELOG updated
- [ ] GitHub release draft ready (`docs/V1_ALPHA_RELEASE_DRAFT.md`)
- [ ] Known limitations documented
- [ ] Release marked as pre-release

---

**Maintainer decision (fill at release time):**

- Date: ____
- Platform(s) walked: ____
- Decision: Proceed / Hold
