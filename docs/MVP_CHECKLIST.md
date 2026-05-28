# ClickFlow — MVP Checklist

## 1. Core Functionality

- [x] Electron window launches
- [x] Main screen with status, scenario, progress
- [x] Start/Stop buttons work (simulation mode)
- [x] Scenario execution with progress bar
- [x] Emergency stop (Escape)
- [x] Double-start protection
- [x] Hotkeys (Ctrl+Alt+S, Ctrl+Alt+X, Escape)

## 2. Safety

- [x] Safe mode enabled by default
- [x] Minimum interval enforced (50ms default)
- [x] Maximum repeat count enforced (100000 default)
- [x] Emergency stop always available
- [x] No real system clicks
- [x] contextIsolation: true
- [x] nodeIntegration: false

## 3. Localization

- [x] Russian language (default)
- [x] English language
- [x] Language switch in settings
- [x] Language persists between sessions
- [x] All UI text through i18n system

## 4. Settings Persistence

- [x] Settings save to userData/settings.json
- [x] Settings load on startup
- [x] Settings normalize on load (fill defaults)
- [x] Settings export/import
- [x] Settings reset

## 5. Scenario Persistence

- [x] Scenarios save to userData/scenarios.json
- [x] Scenarios load on startup
- [x] Default scenario always present
- [x] Create/edit/delete user scenarios
- [x] Scenario validation

## 6. Profiles

- [x] Default profiles (default, work, testing, personal)
- [x] Active profile selection
- [x] Profiles save to userData/profiles.json
- [x] Profile display in advanced dashboard

## 7. Import/Export

- [x] Export all scenarios
- [x] Export custom (non-default) scenarios
- [x] Backup scenarios
- [x] Import scenarios with preview
- [x] Conflict resolution (duplicate id/name)
- [x] Export settings
- [x] Import settings with validation

## 8. Diagnostics

- [x] Technical summary in advanced dashboard
- [x] Copy diagnostics to clipboard
- [x] Error history tracking
- [x] Error manager with codes

## 9. Accessibility

- [x] Semantic HTML structure
- [x] Button elements for interactive controls
- [x] Disabled states visually clear
- [x] Status indicator uses color + text
- [ ] aria-label for icon buttons (planned)
- [ ] aria-live for status updates (planned)
- [ ] Full keyboard navigation audit (planned)

## 10. Security

- [x] No eval() usage
- [x] No innerHTML with user data
- [x] textContent for user-provided text
- [x] JSON import validation
- [x] Settings JSON validation
- [x] IPC wrapper (no direct ipcRenderer exposure)
- [x] File dialogs via main process only
- [x] No dangerous Node.js access in renderer

## 11. Documentation

- [x] README.md with full history
- [x] PROJECT_CONTEXT.md
- [x] TEST_PLAN.md
- [x] MVP_CHECKLIST.md
- [x] DESKTOP_ADAPTER_PLAN.md
- [x] ACTION_SCHEMA.md

## 12. Known Limitations

- Real system clicks are NOT implemented (simulation only)
- OCR is NOT implemented
- Image recognition is NOT implemented
- Mobile version is NOT implemented
- Hotkeys work only while app window is focused
- Theme switching (light/dark) has limited visual effect
- Global hotkeys via Electron globalShortcut not yet added
- No automated tests (manual test plan only)
- No app packaging/distribution setup
