---
name: Bug report
about: Something is broken or behaves unexpectedly in ClickFlow
title: "[Bug] "
labels: ["bug"]
assignees: []
---

<!--
  Thanks for taking the time to file a bug report.
  Please remember: ClickFlow 0.1.x is simulation-only.
  Bug reports about "real clicks not happening" are out of scope —
  see docs/KNOWN_LIMITATIONS.md and docs/ROADMAP.md.
-->

## Summary

A short, plain-English description of what is broken.

## Steps to reproduce

1. ...
2. ...
3. ...

## Expected behavior

What should happen.

## Actual behavior

What actually happens. Include any error text shown in the app.

## Screenshots / recordings (optional)

Drag images here if helpful.

## Environment

- ClickFlow version (see the version badge on the main screen): `vX.Y.Z`
- OS and version (e.g. Windows 11 23H2 / macOS 14.4 / Ubuntu 24.04):
- Electron version (Advanced → Safety → System info):
- Packaged build or `npm start`:

## Diagnostics

Paste the output of **Advanced → Safety → Copy diagnostics** here.
The output **must not** contain private filesystem paths — if it
does, please redact and also file a safety report.

```
(paste diagnostics here)
```

## Additional context

Anything else relevant.

## Confirmation

- [ ] I am running the latest version available on `main`.
- [ ] I have searched existing issues and this is not a duplicate.
- [ ] I confirm this is **not** a request for real input emulation,
      OCR, image recognition, captcha bypass, ad-click automation,
      or automation against banking / payment / protected apps —
      those are intentionally not implemented.
