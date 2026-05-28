# ClickFlow — scripts/

This directory holds **node-only**, **dependency-free** helper scripts
that operate on the ClickFlow repository or workspace.

## Rules

- Pure Node.js. No `npm install` deps, no native modules.
- **Never** require Electron. Scripts must not launch the app, must
  not move the cursor, must not press keys.
- **Read-only by default.** A script may write into `scripts/` itself
  for cache, never into `src/`, `main.js`, `preload.js`, `package.json`,
  etc., unless that is its explicit and documented purpose.
- Must not contact the network.
- Must work on Windows, macOS, and Linux.
- Exit code `0` on success, non-zero on failure.

## Files

| File              | Purpose                                       | Used by         |
|-------------------|-----------------------------------------------|-----------------|
| `smoke-check.js`  | Static smoke check of the repo layout, docs, package.json wiring, and simulation-only invariants. | `npm run smoke` |

## Adding a new script

1. Create `scripts/your-script.js`.
2. Use only the Node `fs` and `path` standard modules.
3. Document its purpose in this README's table.
4. Optionally add a wrapper script in `package.json`:
   ```json
   "scripts": {
     "your-script": "node scripts/your-script.js"
   }
   ```

## What lives here later (planned, not implemented)

- A repo-wide check that `package.json` does not declare any of the
  forbidden runtime modules (`robotjs`, `nut.js`, `iohook`,
  `node-key-sender`).
- A "diff against simulation invariants" guard.
- A non-Electron CLI to validate exported scenario JSON files.

These are tracked in `docs/ROADMAP.md` and will be added in `0.1.x`
beta polish only when needed.
