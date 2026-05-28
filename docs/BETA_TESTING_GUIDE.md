# ClickFlow — Beta Testing Guide (0.1.0-beta)

Thank you for helping test ClickFlow. This guide walks you through
everything you should exercise as a beta tester, plus how to verify
that ClickFlow really is **simulation-only** on your machine.

> **TL;DR.** ClickFlow does not move your real mouse and does not
> press real keys. If, while testing this build, you ever see your
> real cursor move on its own, **stop immediately** and file a Safety
> report.

---

## 1. Setup

Requires Node.js 18+ and npm.

```bash
git clone https://github.com/Citrus-cloud/Mine.git clickflow
cd clickflow
npm install
npm start
```

The first launch creates `userData/` in your platform's standard
Electron data directory (no need to know the path; everything is
managed by the app).

---

## 2. What to test

Work through each section in order. The numbers match the
`docs/SMOKE_TESTS.md` checklist when applicable.

### 2.1 Main screen

- [ ] App opens at 1000 x 700 with a clean main view.
- [ ] Header shows the **simulation mode** badge and a version badge.
- [ ] "Status" / "Сценарий" rows are readable.
- [ ] Progress card shows `0 / 0 · 0%` initially.
- [ ] Start / Stop buttons render correctly; Stop is disabled.
- [ ] "Choose scenario", "Settings", "Advanced mode" links work.
- [ ] Footer shows "Safe mode enabled" / "Безопасный режим включён".

### 2.2 Scenarios

- [ ] Open **Choose scenario**. Default scenario is present and
      flagged as default.
- [ ] **Create scenario**: name, description, X, Y, interval, repeat,
      mouse button — all fields validate (empty name rejects, too-low
      interval rejects, etc.).
- [ ] **Edit scenario**: changes persist after Save.
- [ ] **Delete scenario**: only non-default scenarios are deletable.
- [ ] After restart, your scenarios are still present.

### 2.3 Execution (simulation)

- [ ] Select a scenario. Press **Start**.
- [ ] Progress bar fills. Logs append. Status indicator pulses.
- [ ] **No real mouse movement, no real clicks** — your cursor stays
      where you put it; other windows do not receive input.
- [ ] Press **Stop** mid-run. State returns to Stopped.
- [ ] Start again, then press `Escape`. Emergency stop triggers.
- [ ] Trigger global hotkeys with another window focused:
  - `CmdOrCtrl+Alt+S` starts the selected scenario.
  - `CmdOrCtrl+Alt+X` stops it.
  - `CmdOrCtrl+Alt+E` triggers emergency stop.

### 2.4 Settings

- [ ] Switch language to English → Save → all UI text in English.
- [ ] Switch language back to Russian → Save → UI returns.
- [ ] Switch theme to **Dark** → Save → all views (Main, Scenarios,
      Form, Settings, Advanced × 7 tabs) look correct in dark.
- [ ] Switch theme to **Light** → Save → all views revert.
- [ ] Change min-interval to a higher value → Save → confirm settings
      enforce that floor when running.
- [ ] **Reset settings** in Advanced → Settings → confirm prompt →
      defaults restored.

### 2.5 Advanced dashboard

Open **Advanced mode** and walk through each tab.

- [ ] **Overview** — active scenario, execution status, statistics,
      settings summary, recent events all render.
- [ ] **Scenarios** — list, **Import / Export**, profile list. Import
      a JSON file you previously exported; preview shown; confirm
      imports without duplicating.
- [ ] **Execution** — status, mode `simulation`, progress bar, last
      action; Start / Stop work.
- [ ] **Logs** — log filter chips work. Clear logs after confirmation.
- [ ] **Settings** — summary cards, **Export / Import / Reset**
      settings work.
- [ ] **Safety** — safety overview, global hotkeys card with
      Register / Unregister / Refresh, Diagnostics card with **Copy
      diagnostics**, System info card, Error history.
- [ ] **Future** — feature placeholders, desktop adapter readiness
      checklist.

### 2.6 Import / Export

- [ ] **Export All** scenarios → JSON file saves.
- [ ] **Export custom** → only non-default scenarios in the file.
- [ ] **Backup** → backup-named file saves.
- [ ] **Import** that file back → preview → confirm. Counts match.
- [ ] Try importing a malformed JSON → import is rejected with a
      friendly error.
- [ ] **Export settings** / **Import settings** / **Reset settings**
      all work.

### 2.7 Hotkeys

- [ ] In-window: `Escape` triggers emergency stop only when running.
- [ ] In-window: `Ctrl+Alt+S` starts (with window focused).
- [ ] In-window: `Ctrl+Alt+X` stops.
- [ ] Global (other app focused): all three global hotkeys work.
- [ ] Toggling **Unregister** in Advanced → Safety disables the
      global hotkeys; **Register** re-enables them.

### 2.8 Lifecycle

- [ ] While idle, closing the window quits the app.
- [ ] While running, closing the window prompts you. Cancel keeps
      the app open. Quit terminates.
- [ ] On macOS, the app re-opens a window when activated.

---

## 3. How to confirm there are no real clicks

ClickFlow **must not** move your real cursor or press real keys.

Quick checks you can perform yourself:

1. **Eyeball test.** Move your cursor to a corner of the screen and
   press Start. Watch for any movement — there should be none.
2. **Other window test.** Focus a text editor window. Place the
   simulated coordinates somewhere over that window. Press Start.
   No characters or clicks should arrive in the editor.
3. **No native modules.** From the project root:
   ```bash
   ls node_modules | grep -E "robotjs|nut-js|iohook|node-key-sender" || echo "no real-input modules"
   ```
   You should see `no real-input modules`.
4. **Diagnostics.** Open **Advanced → Safety → Copy diagnostics**.
   The output must contain `Simulation only: true`. It must **not**
   contain any filesystem paths from your home directory.

If any check fails, please file a Safety report immediately
(see section 4).

---

## 4. How to send a bug report

Use the right template:

- General bug: **`.github/ISSUE_TEMPLATE/bug_report.md`**
  - Include the version (visible on the main screen).
  - Include the diagnostics dump.
  - Include reproduction steps.
- Feature request: **`.github/ISSUE_TEMPLATE/feature_request.md`**.
- **Safety concern**: **`.github/ISSUE_TEMPLATE/safety_report.md`**
  — please prefer this template over a regular bug report whenever
  the issue could be safety-related.

When in doubt, file a safety report. Safety reports are reviewed
before regular features.

---

## 5. Out of scope for the beta

Do **not** test or report on:

- Real mouse / keyboard automation outside ClickFlow's UI.
- OCR.
- Image recognition.
- Mobile builds.
- Captcha bypass, antibot bypass, ad-click automation, banking /
  payment / protected applications. These are permanently out of
  scope.

See `docs/KNOWN_LIMITATIONS.md` and `docs/ROADMAP.md` for the
full list.

Thank you again for helping test ClickFlow.
