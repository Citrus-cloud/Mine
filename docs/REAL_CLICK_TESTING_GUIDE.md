# ClickFlow — Real Click Testing Guide (Step 47)

> Applies to the experimental real coordinate-click prototype. Real
> clicks are **disabled by default** and **session-only**. Read this
> before enabling anything.

## Before testing

- Understand this performs a **real** OS mouse click at a screen
  coordinate.
- Close sensitive windows. Never test over banking, payment, or other
  protected applications.
- Know your emergency stop: **Escape** or **Ctrl+Alt+E**.
- The native backend must be installed for a real click to actually
  fire; otherwise the adapter is **unavailable** and the click is
  blocked (the dry-run still works).

## Required checks

Open **Advanced → Safety Center → Real adapter prototype** and confirm:

- Adapter available / dependency loaded (if not, only blocking can be
  demonstrated).
- Safe mode on, emergency stop enabled, audit logs ready.
- Run **Run safety check** — it lists any unmet requirements.

## Dry-run first

Always click **Test dry-run coordinate click** first. It shows a
preview (`realClick=false`) and performs **no** input. Verify the
coordinates and button are what you expect.

## One click per confirmation

- Enable the session via **Enable real coordinate click for this
  session** and tick the "I understand…" checkbox.
- Each **Test real coordinate click** shows its own confirmation modal.
  There is no loop and no repeat — exactly one click per confirmation.

## Safe test target

Use the coordinates of a harmless, visible target you control (e.g. an
empty area of your own test window). The default coordinates come from
your selected `simple_click` scenario.

## What not to click

- Banking / payment / protected apps.
- Captcha / anti-bot challenges.
- Ads, or anything to violate a service's rules.
- Anything off-screen or in a hidden/background window.

## Emergency stop

Press **Escape** or **Ctrl+Alt+E** at any time. Disable the session
with **Disable real coordinate click**, or just restart the app — both
revert to simulation-only.

## Troubleshooting

- **"dependency not installed" / adapter unavailable:** the optional
  native backend is not present. Real clicks cannot fire; dry-run and
  blocking still work.
- **"Safety check failed":** the gate lists unmet requirements (enable
  session, safe mode, emergency stop, audit logs, permissions).
- **Real click blocked despite enabling:** main re-validates the full
  context; confirm every requirement and that the action is a plain
  coordinate `click`.
