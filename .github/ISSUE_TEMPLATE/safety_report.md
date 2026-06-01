---
name: Safety report
about: A safety concern, a privacy concern, or a proposal that would change ClickFlow's safety model
title: "[Safety] "
labels: ["safety", "needs-review"]
assignees: []
---

<!--
  Use this template if any of the following are true:
    - You found something in ClickFlow that looks like a safety
      regression: real input being fired, private filesystem paths
      leaking in diagnostics, CSP relaxed, ipcRenderer leaking,
      nodeIntegration enabled, etc.
    - You want to propose work that would change ClickFlow's safety
      posture: real mouse / keyboard input, OCR, image recognition,
      network calls outside localhost, mobile, automated execution
      against third-party apps, etc.
  Please do not file these as regular feature requests.
-->

> ⚠️ **Do not include sensitive data.** Do not paste passwords,
> API keys, tokens, personal information, or full screenshots of
> private windows. Redact private filesystem paths, account names,
> and any PII before submitting. If you cannot describe the issue
> without sensitive data, contact a maintainer privately instead.

## Type

- [ ] Safety regression in the current code (bug-level).
- [ ] Proposal that would change ClickFlow's safety posture.

## Description

What is the concern, in your own words?

## Affected area

Tick all that apply:

- [ ] Real input (mouse / keyboard) — currently **not** implemented.
- [ ] OCR / image recognition — currently **not** implemented.
- [ ] Network calls outside `localhost`.
- [ ] CSP / Electron security flags
      (`contextIsolation`, `nodeIntegration`).
- [ ] IPC surface in `preload.js`.
- [ ] Filesystem access in `main.js`.
- [ ] Diagnostics output (paths, machine info, identifiers).
- [ ] Mobile build.
- [ ] Automation against banking / payment / protected apps —
      always out of scope.
- [ ] Captcha / antibot bypass — always out of scope.
- [ ] Ad-click automation — always out of scope.

## Reproduction (if regression)

Steps that show the unsafe behavior. Include a diagnostics dump
from **Advanced → Safety → Copy diagnostics** if relevant.
**Redact any sensitive data first.**

## Unsafe behavior

Describe the unsafe behavior precisely: what ClickFlow does that it
should not do.

## Expected safe behavior

Describe what the safe behavior should be instead (e.g. "the action
pipeline should reject `realClick: true`", "diagnostics should not
contain absolute home-directory paths", "the build should stay
simulation-only").

## Threat model (if proposal)

- Who is the user?
- What new capability are you proposing?
- Who could be harmed if this capability is misused?
- What user-confirmation flow do you propose?
- What audit logs do you propose?
- What kill switch / emergency stop is preserved?

## References

- `CONTRIBUTING.md` (Safety review gate)
- `docs/SECURITY_CHECKLIST.md`
- `docs/DESKTOP_ADAPTER_PLAN.md`
- `docs/KNOWN_LIMITATIONS.md`
- `docs/ROADMAP.md`

## Confirmation

- [ ] I understand that ClickFlow is intentionally simulation-only.
- [ ] I understand that real input shipping requires a separate
      review and is not guaranteed to be merged.
