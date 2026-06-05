# ClickFlow Desktop — User Guide

> Version: 1.0.0-alpha.1 · Step 82

---

## What is ClickFlow?

ClickFlow is a smart click-automation tool for desktop and Android.
Instead of recording fixed pixel coordinates, ClickFlow finds click targets
automatically by **image template matching** or **text search (OCR)**.

---

## Quick Start

### 1. Launch the app

```bash
npm start
# or: electron .
```

### 2. Create a template (image click)

1. Open the **Templates** tab.
2. Click **Add template** and draw a region around the button you want to click.
3. Give the template a name (e.g. `Submit button`).
4. Save.

### 3. Create a text target (text click)

1. Open the **Text targets** tab.
2. Enter the visible text of the target (e.g. `OK`).
3. Optionally enable **Case sensitive**.
4. Save.

### 4. Build a scenario

1. Open the **Scenario builder** tab.
2. Add actions: **TAP** (image or text target), **WAIT**, or **NOTE**.
3. Use a preset (**TAP_CENTER** or **TAP_AND_WAIT**) as a starting point.
4. Save the scenario.

### 5. Run

1. The **Safety Center** must show all four checks as ✅:
   - Review passed
   - Consent given (15 s window)
   - Rate limit OK (≤10 actions/min)
   - No emergency stop
2. Click **Give consent** to open the 15-second window.
3. Click **Run scenario**.
4. Press **Emergency Stop** at any time to halt all actions immediately.

---

## Safety model

| Check | What it means |
|-------|---------------|
| Review passed | A one-time sign-off that real input is enabled |
| Consent given | You explicitly approved the next action (15 s TTL) |
| Rate limit OK | No more than 10 real actions per minute |
| No emergency stop | No active halt flag |

All four checks must be green for any real action to execute.
If the app crashes or the window closes, all checks reset to closed.

---

## Keyboard shortcuts

| Action | Shortcut |
|--------|----------|
| Emergency Stop | `Ctrl+Shift+S` / `Cmd+Shift+S` |
| Give consent | `Ctrl+Enter` |
| Open Safety Center | `Ctrl+Shift+G` |

---

## Troubleshooting

**Action blocked — consentFresh failed**
The 15-second consent window expired. Click **Give consent** again.

**Action blocked — rateLimitOk failed**
You dispatched 10 actions in under a minute. Wait ~60 seconds.

**Template not matched**
Ensure the target is visible on screen and the template region is tight
around the button. Try re-capturing the template.

**OCR not finding text**
Check spelling. For mixed-case targets, disable **Case sensitive**.

---

## 🇷🇺 Быстрый старт

1. Запустите приложение (`npm start`).
2. Создайте шаблон (вкладка **Шаблоны**) или текстовую цель (вкладка **Текстовые цели**).
3. Проверьте, что в **Safety Center** все 4 чека зелёные.
4. Нажмите **Дать согласие** → **Запустить сценарий**.
5. Для немедленной остановки: `Ctrl+Shift+S`.
