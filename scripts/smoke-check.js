#!/usr/bin/env node
// =====================================================================
// ClickFlow — scripts/smoke-check.js (Step 15)
// ---------------------------------------------------------------------
// Static smoke check for the ClickFlow repository.
//
// Verifies:
//   - presence of the key application files (main.js, preload.js,
//     src/index.html, src/styles.css, src/renderer.js, package.json,
//     README.md, PROJECT_CONTEXT.md, and the docs that ship the
//     beta safety story);
//   - that package.json declares a "start" script and a "smoke" script;
//   - that README.md mentions simulation-only or "real clicks not
//     implemented";
//   - that PROJECT_CONTEXT.md mentions both nodeIntegration: false
//     and contextIsolation: true;
//   - that docs/SECURITY_CHECKLIST.md and docs/ACTION_SCHEMA.md exist.
//
// IMPORTANT
//   - This script does NOT launch Electron.
//   - This script does NOT touch any user data.
//   - This script uses only Node fs/path (no npm dependencies).
//   - Read-only.
// =====================================================================

'use strict';

const fs = require('fs');
const path = require('path');

// Repository root = parent of scripts/.
const repoRoot = path.resolve(__dirname, '..');

const checks = [];
let failed = 0;

function record(name, ok, detail) {
  checks.push({ name: name, ok: !!ok, detail: detail || '' });
  if (!ok) failed++;
}

function fileExists(rel) {
  try {
    return fs.existsSync(path.join(repoRoot, rel)) &&
           fs.statSync(path.join(repoRoot, rel)).isFile();
  } catch (e) {
    return false;
  }
}

function readText(rel) {
  try {
    return fs.readFileSync(path.join(repoRoot, rel), 'utf-8');
  } catch (e) {
    return '';
  }
}

function safeJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(repoRoot, rel), 'utf-8'));
  } catch (e) {
    return null;
  }
}

// 1. Key files
[
  'main.js',
  'preload.js',
  'package.json',
  'README.md',
  'PROJECT_CONTEXT.md',
  'CHANGELOG.md',
  'src/index.html',
  'src/styles.css',
  'src/renderer.js',
  'src/i18n.js',
  'src/scenario-manager.js',
  'src/settings-manager.js',
  'src/profile-manager.js',
  'src/click-engine.js',
  'src/error-manager.js',
  'src/logger.js',
  'src/app-state.js',
  // Step 17 modules
  'src/action-pipeline.js',
  'src/safety-gates.js',
  'src/audit-events.js',
  'src/feature-flags.js',
  // Step 18 modules
  'src/desktop-adapter-interface.js',
  'src/mock-desktop-adapter.js',
  'src/adapter-registry.js'
].forEach(function (rel) {
  record('file exists: ' + rel, fileExists(rel));
});

// 2. docs presence
[
  'docs/TEST_PLAN.md',
  'docs/MVP_CHECKLIST.md',
  'docs/SMOKE_TESTS.md',
  'docs/PACKAGING.md',
  'docs/SECURITY_CHECKLIST.md',
  'docs/DESKTOP_ADAPTER_PLAN.md',
  'docs/ACTION_SCHEMA.md',
  'docs/KNOWN_LIMITATIONS.md',
  'docs/ROADMAP.md',
  'docs/BETA_TESTING_GUIDE.md',
  // Step 17 docs / earlier safety docs explicitly required again
  'docs/REAL_ACTIONS_GO_NO_GO.md',
  'docs/AUDIT_LOG_PLAN.md',
  'docs/FEATURE_FLAGS.md',
  'docs/PRIVACY.md',
  'docs/FINAL_BETA_REVIEW.md',
  // Step 18 doc
  'docs/ADAPTER_INTERFACE.md'
].forEach(function (rel) {
  record('doc exists: ' + rel, fileExists(rel));
});

// 3. package.json wiring
var pkg = safeJson('package.json');
record('package.json parses', !!pkg);
if (pkg) {
  record(
    'package.json has scripts.start',
    !!(pkg.scripts && typeof pkg.scripts.start === 'string'),
    pkg.scripts ? ('start = ' + pkg.scripts.start) : 'no scripts'
  );
  record(
    'package.json has scripts.smoke',
    !!(pkg.scripts && typeof pkg.scripts.smoke === 'string'),
    pkg.scripts ? ('smoke = ' + pkg.scripts.smoke) : 'no scripts'
  );
  record(
    'package.json has main.js entry point',
    pkg.main === 'main.js',
    'main = ' + pkg.main
  );
}

// 4. README mentions simulation-only or no real clicks
var readme = readText('README.md').toLowerCase();
record(
  'README mentions simulation-only or "no real clicks"',
  readme.indexOf('simulation') !== -1 ||
  readme.indexOf('реальные клики') !== -1 ||
  readme.indexOf('real clicks not implemented') !== -1
);

// 4b. Step 17: README or PROJECT_CONTEXT mentions "simulation-only" / "simulation only"
var projCtxRaw = readText('PROJECT_CONTEXT.md');
var projCtxLow = projCtxRaw.toLowerCase();
record(
  'README or PROJECT_CONTEXT mentions "simulation-only" or "simulation only"',
  readme.indexOf('simulation-only') !== -1 ||
  readme.indexOf('simulation only') !== -1 ||
  projCtxLow.indexOf('simulation-only') !== -1 ||
  projCtxLow.indexOf('simulation only') !== -1
);

// 5. PROJECT_CONTEXT mentions security flags
var projCtx = projCtxRaw;
record(
  'PROJECT_CONTEXT mentions nodeIntegration false',
  /nodeintegration[^a-z]*?:?[^a-z]*?false/i.test(projCtx) ||
  projCtx.indexOf('nodeIntegration: false') !== -1 ||
  projCtx.indexOf('nodeIntegration ВСЕГДА false') !== -1
);
record(
  'PROJECT_CONTEXT mentions contextIsolation true',
  /contextisolation[^a-z]*?:?[^a-z]*?true/i.test(projCtx) ||
  projCtx.indexOf('contextIsolation: true') !== -1
);

// Step 17: PROJECT_CONTEXT explicitly states real actions disabled
record(
  'PROJECT_CONTEXT mentions realDesktopActions=false or real actions disabled',
  projCtx.indexOf('realDesktopActions=false') !== -1 ||
  projCtx.indexOf('realDesktopActions: false') !== -1 ||
  projCtx.indexOf('realDesktopActions всё ещё false') !== -1 ||
  projCtxLow.indexOf('real actions disabled') !== -1 ||
  projCtxLow.indexOf('реальные действия отключены') !== -1
);

// 6. main.js really sets the security flags
var mainTxt = readText('main.js');
record(
  'main.js sets contextIsolation: true',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js sets nodeIntegration: false',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);

// 7. CSP not relaxed in src/index.html
var htmlTxt = readText('src/index.html');
record(
  'src/index.html declares Content-Security-Policy',
  htmlTxt.indexOf('Content-Security-Policy') !== -1
);
record(
  'src/index.html CSP does not declare unsafe-inline / unsafe-eval',
  htmlTxt.indexOf('unsafe-inline') === -1 &&
  htmlTxt.indexOf('unsafe-eval') === -1
);

// 8. Forbidden modules: codebase must not import real-input modules
var forbidden = ['robotjs', 'nut-js', 'nutjs', 'iohook', 'uiohook-napi', 'node-key-sender'];
var sourceFiles = [
  'main.js',
  'preload.js',
  'src/click-engine.js',
  'src/renderer.js',
  'src/scenario-manager.js',
  'src/settings-manager.js',
  'src/profile-manager.js',
  'src/feature-flags.js',
  'src/error-manager.js',
  'src/logger.js',
  'src/app-state.js',
  // Step 17 modules
  'src/action-pipeline.js',
  'src/safety-gates.js',
  'src/audit-events.js',
  // Step 18 modules
  'src/desktop-adapter-interface.js',
  'src/mock-desktop-adapter.js',
  'src/adapter-registry.js'
];
var foundForbidden = [];
sourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  forbidden.forEach(function (mod) {
    var needle = "require('" + mod + "')";
    var needleD = 'require("' + mod + '")';
    if (txt.indexOf(needle) !== -1 || txt.indexOf(needleD) !== -1) {
      foundForbidden.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no real-input native modules required in source',
  foundForbidden.length === 0,
  foundForbidden.length ? foundForbidden.join(', ') : ''
);

// 9. package.json has no forbidden deps (sanity)
if (pkg) {
  var allDeps = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  // Step 17: explicit list — robotjs / nut.js / iohook / uiohook-napi must not be declared.
  var pkgForbidden = ['robotjs', 'nut-js', 'nutjs', 'iohook', 'uiohook-napi', 'node-key-sender'].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps, m);
  });
  record(
    'package.json declares no real-input modules',
    pkgForbidden.length === 0,
    pkgForbidden.length ? pkgForbidden.join(', ') : ''
  );
}

// 10. Step 17: action-pipeline must declare simulationOnly: true and never call real-input modules.
var apTxt = readText('src/action-pipeline.js');
record(
  'action-pipeline declares simulationOnly: true',
  /simulationOnly\s*:\s*true/.test(apTxt)
);
record(
  'action-pipeline declares realActionsEnabled: false',
  /realActionsEnabled\s*:\s*false/.test(apTxt)
);
record(
  'action-pipeline declares realActionsImplemented: false',
  /realActionsImplemented\s*:\s*false/.test(apTxt)
);
record(
  'action-pipeline blocks real actions with explicit error',
  apTxt.indexOf('Real desktop actions are disabled in this build') !== -1
);

// 11. safety-gates: isRealActionAllowed must return false.
var sgTxt = readText('src/safety-gates.js');
record(
  'safety-gates.isRealActionAllowed returns false',
  /function\s+isRealActionAllowed[\s\S]*?return\s+false/.test(sgTxt)
);

// 12. feature-flags: realDesktopActions must be false in source.
var ffTxt = readText('src/feature-flags.js');
record(
  'feature-flags.realDesktopActions = false in source',
  /realDesktopActions\s*:\s*false/.test(ffTxt)
);

// 13. Step 18: adapter registry source-level invariants.
var arTxt = readText('src/adapter-registry.js');
record(
  'adapter-registry registers mock adapter',
  /id:\s*['"]mock['"]/.test(arTxt) && /Mock Desktop Adapter/.test(arTxt)
);
record(
  'adapter-registry registers real-desktop adapter as unavailable / planned',
  /id:\s*['"]real-desktop['"]/.test(arTxt) &&
  /available:\s*false/.test(arTxt) &&
  /planned:\s*true/.test(arTxt)
);
record(
  'adapter-registry sets activeId to mock by default',
  /activeId:\s*['"]mock['"]/.test(arTxt)
);
record(
  'adapter-registry blocks real adapter selection',
  /adapter\.selection\.blocked/.test(arTxt) &&
  /adapter\.real\.unavailable/.test(arTxt)
);
record(
  'adapter-registry has Real desktop disabled reason',
  arTxt.indexOf('Real desktop actions are not implemented in this build') !== -1
);

// 14. Step 18: mock adapter does not perform real OS input.
var mockTxt = readText('src/mock-desktop-adapter.js');
record(
  'mock adapter declares realActions: false',
  /realActions:\s*false/.test(mockTxt)
);
record(
  'mock adapter declares simulationOnly: true',
  /simulationOnly:\s*true/.test(mockTxt)
);
record(
  'mock adapter exposes runMockAdapterSelfTest',
  /function\s+runMockAdapterSelfTest/.test(mockTxt)
);

// 15. Step 18: adapter interface contract.
var ifaceTxt = readText('src/desktop-adapter-interface.js');
record(
  'adapter interface contract has realActionsAllowed: false',
  /realActionsAllowed:\s*false/.test(ifaceTxt)
);
record(
  'adapter interface isRealAdapterAllowed returns false in 0.1.x',
  /function\s+isRealAdapterAllowed[\s\S]{0,500}return\s+false/.test(ifaceTxt)
);

// 16. Step 18: audit allowlist contains the new adapter event types.
var auditTxt = readText('src/audit-events.js');
record(
  'audit allowlist includes adapter.selftest.started',
  auditTxt.indexOf("'adapter.selftest.started'") !== -1
);
record(
  'audit allowlist includes adapter.selftest.completed',
  auditTxt.indexOf("'adapter.selftest.completed'") !== -1
);
record(
  'audit allowlist includes adapter.selftest.failed',
  auditTxt.indexOf("'adapter.selftest.failed'") !== -1
);
record(
  'audit allowlist includes adapter.selection.blocked',
  auditTxt.indexOf("'adapter.selection.blocked'") !== -1
);
record(
  'audit allowlist includes adapter.mock.executed',
  auditTxt.indexOf("'adapter.mock.executed'") !== -1
);
record(
  'audit allowlist includes adapter.real.unavailable',
  auditTxt.indexOf("'adapter.real.unavailable'") !== -1
);

// --- Report ---
console.log('ClickFlow smoke-check\n=====================');
checks.forEach(function (c) {
  var mark = c.ok ? 'OK ' : 'FAIL';
  var detail = c.detail ? ('  -- ' + c.detail) : '';
  console.log(mark + '  ' + c.name + detail);
});
console.log('---------------------');
console.log('Total: ' + checks.length + '   Failed: ' + failed);

process.exit(failed === 0 ? 0 : 1);
