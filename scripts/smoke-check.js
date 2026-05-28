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
  'src/app-state.js'
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
  'docs/BETA_TESTING_GUIDE.md'
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

// 5. PROJECT_CONTEXT mentions security flags
var projCtx = readText('PROJECT_CONTEXT.md');
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
var forbidden = ['robotjs', 'nut-js', 'nutjs', 'iohook', 'node-key-sender'];
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
  'src/app-state.js'
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
  var pkgForbidden = forbidden.filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps, m);
  });
  record(
    'package.json declares no real-input modules',
    pkgForbidden.length === 0,
    pkgForbidden.length ? pkgForbidden.join(', ') : ''
  );
}

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
