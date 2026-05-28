# ClickFlow — Privacy

ClickFlow is a small desktop application. It runs only on your
machine, talks only to your machine, and stores only the things you
explicitly create.

> **One-line summary.** ClickFlow does not phone home. It does not
> have an account system. It does not collect telemetry. It does
> not sync to the cloud. Your scenarios, settings, and profiles
> stay on disk under your operating-system user account.

---

## What ClickFlow stores

All persistent data lives in Electron's standard
`app.getPath('userData')` folder for ClickFlow. The exact path
depends on your platform; ClickFlow never asks you to type it and
never echoes it inside the app UI or in `Copy diagnostics`.

Files written by ClickFlow:

| File              | Contents                                       |
|-------------------|------------------------------------------------|
| `scenarios.json`  | Your scenario definitions (name, x, y, etc.).  |
| `settings.json`   | Language, theme, safety limits, hotkey labels. |
| `profiles.json`   | Your profile list and the active profile id.   |
| `*.broken-<ts>`   | Files quarantined by the corruption guard.     |

These files are plain JSON. You can open them in any editor and
inspect them.

## What ClickFlow does **not** store

- No account credentials, because there is no account system.
- No screenshots, no clipboard content, no keystroke logs.
- No window titles or app names from other applications.
- No filesystem paths beyond the JSON files listed above.
- No machine identifiers, network identifiers, or device
  fingerprints.
- No usage analytics. There is no telemetry endpoint anywhere in
  the code base. (You can verify this with `npm run smoke` and
  with a `grep` of the `package.json` for HTTP libraries.)

## What ClickFlow sends over the network

Nothing. There is no HTTP client, no fetch call, no IPC bridge to a
backend. The CSP in `src/index.html` is `default-src 'self';
script-src 'self'; style-src 'self';` — it forbids loading any
remote resource at runtime.

## Diagnostics

The Advanced → Safety → "Copy diagnostics" command writes a short
text report to your clipboard. It contains:

- ClickFlow version, Electron version, OS platform / arch.
- `isPackaged: true|false`.
- Counts: number of scenarios, profiles, log entries, errors.
- Booleans: safe mode, simulation only, global hotkeys registered,
  tray available, execution running.
- Feature flags as a single line, e.g. `simulationOnly=true,
  realDesktopActions=false, ocr=false, imageRecognition=false`.
- Beta-health booleans (Step 15): `docsReady`, `packagingConfigured`,
  `securityChecklistPresent`, `actionSchemaPresent`.

The diagnostics output **never** contains:

- Your home directory or any absolute filesystem path.
- The exact location of `userData`.
- Your username or hostname.
- Scenario names or any file content.
- Audit-log content.

## Import / export

Import and export are **manual**. You click a button, you choose a
location with a save / open dialog, you receive a JSON file.
ClickFlow never auto-uploads, never auto-backs-up, and never queues
exports to a cloud.

## Real desktop input, OCR, image recognition

- **Real clicks: not implemented in `0.1.0-beta`.** The runtime
  click engine never calls any OS input API.
- **OCR: not implemented.** No OCR engines are bundled. No text
  recognition is performed on anything.
- **Image recognition: not implemented.** No screenshots are taken.
  No vision libraries are bundled.

The runtime does not even read your screen. If a future ClickFlow
release adds any of those capabilities, they will be gated behind
the requirements in `docs/REAL_ACTIONS_GO_NO_GO.md`, including a
visible audit log (`docs/AUDIT_LOG_PLAN.md`) and an explicit user
confirmation flow.

## Children and sensitive contexts

ClickFlow is a developer tool. It is not designed for, marketed to,
or intended for use by children. If you are using ClickFlow in a
sensitive context (healthcare, finance, government), please review
`docs/SECURITY_CHECKLIST.md` and `docs/KNOWN_LIMITATIONS.md` first
and consult your local compliance requirements.

## Reporting privacy issues

If you find behavior that contradicts anything on this page, please
file a Safety report:
`.github/ISSUE_TEMPLATE/safety_report.md`. Privacy regressions are
treated with the same urgency as security regressions.
