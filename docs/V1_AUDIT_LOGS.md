# ClickFlow Desktop v1 — Audit Logs

> **Status:** Step 46. In-memory audit log manager shipped
> (`src/audit-log-manager.js`); persistent file storage is designed
> and prepared but gated.

## Purpose

Provide a redacted, append-only record of safety-relevant events
(scenario lifecycle, action simulation/blocking, adapter/permission
changes, emergency stops) so a user (and a future safety review) can
see exactly what happened.

## Event shape

```
{ id, time, type, severity, scenarioId, scenarioType, actionType,
  mode, realAction, message, metadata }
```

- `severity`: `info` | `warning` | `error` | `safety`.
- `mode`: `simulation` | `real` | `dry-run`.
- `realAction`: always `false` in this build.

## Redaction rules (hard)

The manager **never** stores:

- screenshots, thumbnails, base64, or any `imageDataUrl`/pixel data;
- private filesystem paths or machine identifiers;
- full OCR target text (only a length), or any PII.

`createAuditLogEvent()` strips disallowed fields from `metadata`
defensively, even if a buggy caller passes them.

## API (`src/audit-log-manager.js`)

- `createAuditLogEvent(type, data)`
- `addAuditLogEvent(event)`
- `getAuditLogEvents(filters)`
- `clearAuditLogEvents()`
- `getAuditLogSummary()`
- `exportAuditLog()` — returns a redacted JSON string (export only via
  explicit user action).

## Persistence (prepared / planned)

When the optional preload bridge `window.clickflow.auditLogs` is
present, the manager uses it for `audit:load` / `audit:append` /
`audit:clear` / `audit:export` against a redacted `audit-log.json` in
`userData`. When absent, the manager stays fully in memory. The
renderer never gets direct Node access; export is always user-driven.
