# ClickFlow — Packaging Guide

## Development

```bash
npm install
npm start
```

## Build (unpacked directory)

```bash
npm run pack
```

Output: `dist/` directory with unpacked app.

## Distribution (installer)

```bash
npm run dist
```

Output:
- Windows: `dist/ClickFlow Setup.exe` (NSIS)
- macOS: `dist/ClickFlow.dmg`
- Linux: `dist/ClickFlow.AppImage`

## Icons

Place in `assets/` directory:
- `assets/icon.png` (256x256 minimum)
- `assets/icon.ico` (Windows)
- `assets/icon.icns` (macOS)

Currently no custom icons — app builds without them.

## Important Notes

- Simulation-only — no real system clicks
- contextIsolation: true, nodeIntegration: false
- No native modules requiring rebuild
- No code signing configured yet
- No auto-update configured yet

## Platform Notes

### Windows
- NSIS installer, no admin for per-user install

### macOS
- DMG with drag-to-Applications
- Accessibility permissions NOT needed (simulation only)

### Linux
- AppImage portable: `chmod +x ClickFlow.AppImage && ./ClickFlow.AppImage`
