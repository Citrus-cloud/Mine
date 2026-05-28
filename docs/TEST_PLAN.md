# ClickFlow — Manual Test Plan

## Overview

This document describes manual tests to verify ClickFlow core functionality.
All tests should be performed with `npm start` after a fresh `npm install`.

---

## TC-01: Application Launch

- **Steps**: Run `npm start`
- **Expected**: Electron window opens, title "ClickFlow", main screen visible
- **Status**: Not tested

## TC-02: Main Screen Elements

- **Steps**: Observe the main screen after launch
- **Expected**: Status card (Stopped), scenario name, progress bar, Start/Stop buttons, Choose scenario, Settings, Advanced mode link, Latest events, Safe mode badge
- **Status**: Not tested

## TC-03: Start Scenario (Simulation)

- **Steps**: Click Start with default scenario selected
- **Expected**: Status changes to Running, progress bar fills, logs show actions, completes and returns to Stopped
- **Status**: Not tested

## TC-04: Stop Scenario

- **Steps**: Start scenario, click Stop during execution
- **Expected**: Execution stops, status returns to Stopped, warning log appears
- **Status**: Not tested

## TC-05: Emergency Stop (Escape)

- **Steps**: Start scenario, press Escape during execution
- **Expected**: Immediate stop, warning log "Emergency stop"
- **Status**: Not tested

## TC-06: Hotkey Start (Ctrl+Alt+S)

- **Steps**: Press Ctrl+Alt+S with app window focused
- **Expected**: Scenario starts executing
- **Status**: Not tested

## TC-07: Hotkey Stop (Ctrl+Alt+X)

- **Steps**: Start scenario, press Ctrl+Alt+X
- **Expected**: Scenario stops
- **Status**: Not tested

## TC-08: Create Scenario

- **Steps**: Choose scenario → + Create → fill name, x=100, y=200, interval=200, repeats=50, button=left → Save
- **Expected**: Scenario appears in list, log confirms creation
- **Status**: Not tested

## TC-09: Edit Scenario

- **Steps**: Open scenario list → click Edit on user scenario → change name → Save
- **Expected**: Name updated in list, log confirms update
- **Status**: Not tested

## TC-10: Delete Scenario

- **Steps**: Open scenario list → click Delete on user scenario → confirm
- **Expected**: Scenario removed, log confirms deletion
- **Status**: Not tested

## TC-11: Default Scenario Protection

- **Steps**: Open scenario list → observe default scenario "Быстрый кликер"
- **Expected**: No Delete button for default scenario
- **Status**: Not tested

## TC-12: Scenario Persistence

- **Steps**: Create scenario → close app → reopen app → open scenario list
- **Expected**: Created scenario still present
- **Status**: Not tested

## TC-13: Settings — Language Switch RU→EN

- **Steps**: Open Settings → change language to English → Save
- **Expected**: All interface text changes to English
- **Status**: Not tested

## TC-14: Settings — Language Persistence

- **Steps**: Set language to EN → close app → reopen
- **Expected**: App starts in English
- **Status**: Not tested

## TC-15: Settings — Safety Limits

- **Steps**: Set min interval to 200ms → create scenario with interval 100ms → Start
- **Expected**: Error: interval below safety minimum
- **Status**: Not tested

## TC-16: Advanced Dashboard

- **Steps**: Click "Advanced mode"
- **Expected**: Dashboard with 7 tabs appears (Overview, Scenarios, Execution, Logs, Settings, Safety, Future)
- **Status**: Not tested

## TC-17: Advanced — Logs Tab

- **Steps**: Open Advanced → Logs tab → filter by type
- **Expected**: Logs filter correctly, clear button works with confirmation
- **Status**: Not tested

## TC-18: Import Scenarios

- **Steps**: Advanced → Scenarios → Import → select valid JSON file
- **Expected**: Preview shown, confirm imports scenarios, they appear in list
- **Status**: Not tested

## TC-19: Export Scenarios

- **Steps**: Advanced → Scenarios → Export All → choose save location
- **Expected**: JSON file saved with correct format
- **Status**: Not tested

## TC-20: Profiles

- **Steps**: Advanced → Scenarios → observe profiles, click on different profile
- **Expected**: Active profile changes, saved between sessions
- **Status**: Not tested

## TC-21: Import/Export Settings

- **Steps**: Advanced → Settings → Export settings → Import settings from file
- **Expected**: Settings exported/imported correctly, language applies
- **Status**: Not tested

## TC-22: Diagnostics

- **Steps**: Advanced → Safety → observe diagnostics → click Copy
- **Expected**: Technical summary shown, copied to clipboard (or warning if clipboard unavailable)
- **Status**: Not tested

## TC-23: No Real System Clicks

- **Steps**: Start scenario, observe system behavior
- **Expected**: No actual mouse movement or clicks occur anywhere on screen
- **Status**: Not tested

## TC-24: Security — nodeIntegration

- **Steps**: Check main.js webPreferences
- **Expected**: nodeIntegration: false, contextIsolation: true
- **Status**: Not tested

## TC-25: Security — No Direct ipcRenderer

- **Steps**: Check preload.js
- **Expected**: ipcRenderer not exposed directly, only wrapped methods via contextBridge
- **Status**: Not tested

## TC-26: Double Start Protection

- **Steps**: Start scenario, immediately click Start again
- **Expected**: Warning log "Scenario already running", no double execution
- **Status**: Not tested
