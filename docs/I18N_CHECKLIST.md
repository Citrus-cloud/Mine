# ClickFlow — i18n Checklist (RU / EN)

This is the manual translation review checklist for ClickFlow's
RU / EN localization. It complements the **automatic** parity audit
performed in `docs/BETA_QA_REPORT.md` (which only confirms that the
**keys** match — it cannot tell whether a Russian phrase actually
makes sense to a Russian speaker).

> **Source of truth:** `src/i18n.js`. Both `ru` and `en` blocks
> must always have the same set of keys. Beta-tester language
> review is what catches mistranslations.

---

## 0. Automatic key parity (background)

- 342 keys in `ru`, 342 keys in `en`, **0 mismatches** at the close
  of Step 20.
- Every `data-i18n="…"` attribute in `src/index.html` resolves in
  both locales.
- Every `t('key')` call in the source resolves in both locales.

If any of those become unequal, `npm run smoke` will not catch it
yet (Step 20 ships keys-only smoke). A future check should be
added in Step 21+.

## 1. Language switch

- [ ] Open **Settings**, switch from RU to EN, save.
- [ ] Header, badges, status / scenario rows update immediately.
- [ ] Switch back to RU; header reverts.
- [ ] Reload the app; the previously-saved language is restored.
- [ ] No console error during the switch.

## 2. Main screen

- [ ] App title (`ClickFlow`) and description.
- [ ] "Simulation mode" badge text.
- [ ] Status / Scenario row labels.
- [ ] Progress card title, percentage formatting, "Last action"
      label.
- [ ] **Start** / **Stop** button labels.
- [ ] Secondary links: Choose scenario / Settings / Advanced mode.
- [ ] Footer "Safe mode enabled".

## 3. Scenarios

- [ ] Scenario list page title and "Create scenario" button.
- [ ] Scenario card buttons: Select / Edit / Delete.
- [ ] Default-scenario badge.
- [ ] Scenario-form labels: Name / Description / X / Y / Interval /
      Repeat / Mouse button.
- [ ] Validation messages (intentionally trigger them: empty name,
      negative coordinates, interval below 50 ms).
- [ ] Save / Cancel button labels.

## 4. Settings

- [ ] Settings page title.
- [ ] Language / Theme labels and option labels (System / Light /
      Dark, Russian / English).
- [ ] Safety section title and field labels (Min interval, Max
      repeats).
- [ ] Hotkeys section: hotkey labels and `Ctrl+Alt+S` / `X` / `E`
      values are kept verbatim (they are platform-defined; only
      the surrounding labels are translated).
- [ ] Save / Back button labels.

## 5. Advanced dashboard — tabs

Cycle through every tab and confirm every text element is in the
expected language:

- [ ] **Overview** — Active scenario / Execution status / Statistics
      / Settings summary / Recent events titles and rows.
- [ ] **Scenarios** — Scenario count / Active scenario / Open
      scenario list / Import-Export buttons / Profile names.
- [ ] **Execution** — Status / Execution mode (`simulation`) /
      Progress / Last action / Started / Finished labels.
- [ ] **Logs** — Filter chip labels (All / Info / Success / Warning
      / Error) / Clear logs / "No events" empty state.
- [ ] **Settings** — Same content as the Settings page, plus
      Export / Import / Reset settings buttons.
- [ ] **Safety**:
  - Safety overview card.
  - **Action pipeline** rows (Step 17).
  - **Safety gates** rows (Step 17).
  - **Real actions readiness** checklist labels (Step 17).
  - **Audit events** rows (Step 17).
  - **Desktop adapter status** rows + **Run adapter self-test**
    button (Step 18).
  - **Real action sandbox** rows + **Create dry-run preview**
    button (Step 19) + the warning "Real desktop actions are
    disabled. Dry-run preview is available only.".
  - **Dry-run preview** card: scenario name / action count /
    estimated duration / "No real actions will be executed"
    warning / Actions preview / Permission checklist / Blocked
    reasons / Confirm / Cancel buttons (Step 19).
  - Diagnostics card / System info / Beta health / Feature flags.
  - Error history.
- [ ] **Future** — Future-feature labels and Next safety milestone
      checklist.

## 6. Forms

- [ ] Scenario form — all labels and the validation error region.
- [ ] Settings form — all labels.
- [ ] Profile form (if visible in your build) — all labels.
- [ ] Focus-ring and disabled state visuals do not change with
      language.

## 7. Errors and notifications

- [ ] Trigger a scenario validation error (e.g. interval = 10 ms);
      the message is in the active language.
- [ ] Trigger an import error (pick a non-JSON file); the message
      is localized.
- [ ] Trigger an export cancel (close the save dialog); the log
      entry "Operation cancelled" is localized.
- [ ] Adapter self-test logs (`Adapter self-test started`,
      `Adapter self-test passed`) are localized.
- [ ] Dry-run logs (`Dry-run plan created`, `Dry-run confirmed.
      No real actions executed.`, `Dry-run cancelled`) are localized.

## 8. Diagnostics

- [ ] **Copy diagnostics** label and toast message.
- [ ] System info / Beta health / Feature flags / Action pipeline /
      Safety gates / Audit events / Adapter / Sandbox section
      titles are in the active language.
- [ ] The diagnostics text on the clipboard is intentionally English
      (it is a stable machine-readable format) — confirm but do not
      flag this as a translation bug.

## 9. Sandbox

- [ ] **Real action sandbox** card title and rows.
- [ ] Permission checklist labels (11 items) are localized; status
      badges (`ready / missing / planned / blocked`) are localized.
- [ ] Blocked reasons labels (7 items) are localized.
- [ ] Confirm / Cancel button labels are localized.
- [ ] Top-level warning is localized.

## 10. No mixed language

- [ ] No surface shows half-RU half-EN at the same time.
- [ ] No untranslated raw key (e.g. `actionPipeline`) appears as a
      label.
- [ ] No leftover hard-coded Russian or English string in a place
      where a `data-i18n` attribute or a `t('key')` call should be
      used. (If you find one, file a bug — it is a contributor
      mistake, not a translator one.)

---

## How to file a translation bug

Use `.github/ISSUE_TEMPLATE/bug_report.md`. Include:

- The screen / tab / card / button.
- The active language at the time.
- The wrong text exactly as it appeared.
- A suggested correction (optional).
- A screenshot if possible.

Translation bugs are merged quickly because they only touch
`src/i18n.js`.
