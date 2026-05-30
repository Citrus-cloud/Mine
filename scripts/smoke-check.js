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
  'src/adapter-registry.js',
  // Step 19 module
  'src/real-action-sandbox.js'
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
  'docs/ADAPTER_INTERFACE.md',
  // Step 19 doc
  'docs/REAL_ACTION_SANDBOX.md',
  // Step 21 docs
  'docs/RELEASE_CHECKLIST.md',
  'docs/BUILD_ARTIFACTS.md',
  'docs/GITHUB_RELEASE_DRAFT.md',
  'docs/VERSIONING.md',
  // Step 22 docs
  'docs/RELEASE_FINAL_CHECK.md',
  'docs/TAG_AND_RELEASE_GUIDE.md',
  // Step 23 docs
  'docs/RELEASE_BLOCKERS.md',
  'docs/PACKAGED_APP_QA.md',
  // Step 24 docs
  'docs/FINAL_RELEASE_SUMMARY.md',
  'docs/PRE_RELEASE_CHECKLIST.md',
  'docs/RELEASE_TAG_PLAN.md',
  'docs/RELEASE_COMMIT_MESSAGE.md'
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
  'src/adapter-registry.js',
  // Step 19 module
  'src/real-action-sandbox.js'
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
  apTxt.indexOf('Real desktop actions are disabled') !== -1
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

// 17. Step 19: real-action sandbox source-level invariants.
var sboxTxt = readText('src/real-action-sandbox.js');
record(
  'real-action-sandbox getSandboxStatus returns realActionsAllowed: false',
  /getSandboxStatus[\s\S]{0,400}realActionsAllowed:\s*false/.test(sboxTxt)
);
record(
  'real-action-sandbox dryRunAvailable: true',
  /dryRunAvailable:\s*true/.test(sboxTxt)
);
record(
  'real-action-sandbox evaluateRealActionReadiness returns allowed: false',
  /evaluateRealActionReadiness[\s\S]{0,800}allowed:\s*false/.test(sboxTxt)
);
record(
  'real-action-sandbox confirmDryRunPlan never sets realExecution: true',
  sboxTxt.indexOf('realExecution: true') === -1
);
record(
  'audit allowlist includes real.sandbox.preview.created',
  auditTxt.indexOf("'real.sandbox.preview.created'") !== -1
);
record(
  'audit allowlist includes real.sandbox.dryrun.confirmed',
  auditTxt.indexOf("'real.sandbox.dryrun.confirmed'") !== -1
);
record(
  'audit allowlist includes real.sandbox.dryrun.cancelled',
  auditTxt.indexOf("'real.sandbox.dryrun.cancelled'") !== -1
);
record(
  'audit allowlist includes real.sandbox.blocked',
  auditTxt.indexOf("'real.sandbox.blocked'") !== -1
);
record(
  'audit allowlist includes real.permission.checklist.created',
  auditTxt.indexOf("'real.permission.checklist.created'") !== -1
);
record(
  'audit allowlist includes real.blocked.reason.generated',
  auditTxt.indexOf("'real.blocked.reason.generated'") !== -1
);

// 18. Step 19: README or PROJECT_CONTEXT mentions dry-run / sandbox.
record(
  'README or PROJECT_CONTEXT mentions dry-run or sandbox',
  readme.indexOf('dry-run') !== -1 ||
  readme.indexOf('sandbox') !== -1 ||
  projCtxLow.indexOf('dry-run') !== -1 ||
  projCtxLow.indexOf('sandbox') !== -1
);

// 19. Step 19: action-pipeline updated block message mentions dry-run.
record(
  'action-pipeline block message mentions dry-run preview',
  apTxt.indexOf('Dry-run preview is available only') !== -1
);

// 20. Step 20: preload.js does not expose `ipcRenderer` directly via contextBridge.
var preloadTxt = readText('preload.js');
// Find the contextBridge expose call and verify the exposed object never names `ipcRenderer`.
// We accept any line of the contextBridge.exposeInMainWorld(...) body that contains
// `ipcRenderer:` (a key) or `ipcRenderer,` (a shorthand), but NOT the import line.
var exposesRaw = false;
// Strip the import line to avoid false positives.
var preloadAfterImport = preloadTxt.replace(/const\s*\{\s*[^}]*ipcRenderer[^}]*\}\s*=\s*require\(['"]electron['"]\);?/, '');
if (/\bipcRenderer\s*:/.test(preloadAfterImport) || /\bipcRenderer\s*,/.test(preloadAfterImport)) {
  exposesRaw = true;
}
record(
  'preload.js does not expose ipcRenderer directly',
  !exposesRaw
);

// 21. Step 20: every renderer-side script tag listed in index.html exists on disk.
var htmlTxt2 = readText('src/index.html');
var scriptRe = /<script\s+src=['"]([^'"]+)['"]\s*>/g;
var missingScripts = [];
var sm;
while ((sm = scriptRe.exec(htmlTxt2)) !== null) {
  var srcAttr = sm[1];
  if (/^https?:/.test(srcAttr)) {
    // CSP forbids remote, but let's surface it just in case.
    missingScripts.push('REMOTE: ' + srcAttr);
    continue;
  }
  var rel = path.posix.join('src', srcAttr);
  if (!fileExists(rel)) missingScripts.push(rel);
}
record(
  'all <script src=...> in index.html resolve on disk',
  missingScripts.length === 0,
  missingScripts.length ? missingScripts.join(', ') : ''
);

// 22. Step 20: docs explicitly required by the Step 20 prompt exist.
[
  'docs/BETA_QA_REPORT.md',
  'docs/I18N_CHECKLIST.md'
].forEach(function (rel) {
  record('Step 20 doc exists: ' + rel, fileExists(rel));
});

// 23. Step 20: README/PROJECT_CONTEXT acknowledge step 20.
record(
  'README or PROJECT_CONTEXT mentions step 20',
  /step\s*20|шаг\s*20|Step 20|Шаг 20/.test(readText('README.md')) ||
  /step\s*20|шаг\s*20|Step 20|Шаг 20/.test(readText('PROJECT_CONTEXT.md'))
);

// --- Step 21: beta release packaging pass ---

// 24. Root-level release files exist.
[
  '.gitignore',
  'CHANGELOG.md',
  'RELEASE_NOTES.md',
  'CONTRIBUTING.md'
].forEach(function (rel) {
  record('release file exists: ' + rel, fileExists(rel));
});

// 25. .gitignore covers the things it must.
var giTxt = readText('.gitignore');
[
  'node_modules',
  'dist',
  '.DS_Store',
  'Thumbs.db',
  '*.log'
].forEach(function (token) {
  record(
    '.gitignore covers ' + token,
    giTxt.indexOf(token) !== -1
  );
});

// 26. package.json scripts.pack and scripts.dist.
if (pkg) {
  record(
    'package.json has scripts.pack',
    !!(pkg.scripts && typeof pkg.scripts.pack === 'string'),
    pkg.scripts ? ('pack = ' + pkg.scripts.pack) : 'no scripts'
  );
  record(
    'package.json has scripts.dist',
    !!(pkg.scripts && typeof pkg.scripts.dist === 'string'),
    pkg.scripts ? ('dist = ' + pkg.scripts.dist) : 'no scripts'
  );
  // 27. If pack/dist invoke electron-builder, electron-builder must be a devDependency.
  var packStr = (pkg.scripts && pkg.scripts.pack) || '';
  var distStr = (pkg.scripts && pkg.scripts.dist) || '';
  var usesEB  = packStr.indexOf('electron-builder') !== -1 ||
                distStr.indexOf('electron-builder') !== -1;
  if (usesEB) {
    var hasEB = !!(pkg.devDependencies && pkg.devDependencies['electron-builder']);
    record(
      'electron-builder is a devDependency (used by pack/dist)',
      hasEB
    );
  }
  // 28. build block has appId, productName, files[], directories.output and directories.buildResources.
  var b = pkg.build;
  record(
    'package.json build.appId is set',
    !!(b && typeof b.appId === 'string' && b.appId.length > 0),
    b ? ('appId = ' + b.appId) : 'no build block'
  );
  record(
    'package.json build.productName is set',
    !!(b && typeof b.productName === 'string' && b.productName.length > 0)
  );
  record(
    'package.json build.files is a non-empty array',
    !!(b && Array.isArray(b.files) && b.files.length > 0)
  );
  record(
    'package.json build.directories.output is set',
    !!(b && b.directories && typeof b.directories.output === 'string')
  );
  record(
    'package.json build.directories.buildResources is set',
    !!(b && b.directories && typeof b.directories.buildResources === 'string')
  );
}

// 29. Release docs presence (already added above) — surface a single
// aggregate row so the report is readable.
var releaseDocs = [
  'docs/RELEASE_CHECKLIST.md',
  'docs/BUILD_ARTIFACTS.md',
  'docs/GITHUB_RELEASE_DRAFT.md',
  'docs/VERSIONING.md'
];
record(
  'all step 21 release docs exist',
  releaseDocs.every(function (rel) { return fileExists(rel); }),
  releaseDocs.filter(function (rel) { return !fileExists(rel); }).join(', ')
);

// 30. README / PROJECT_CONTEXT acknowledge step 21.
record(
  'README or PROJECT_CONTEXT mentions step 21',
  /step\s*21|шаг\s*21|Step 21|Шаг 21/.test(readText('README.md')) ||
  /step\s*21|шаг\s*21|Step 21|Шаг 21/.test(readText('PROJECT_CONTEXT.md'))
);

// 31. RELEASE_NOTES mentions simulation-only or no real clicks.
var rn = readText('RELEASE_NOTES.md').toLowerCase();
record(
  'RELEASE_NOTES.md mentions simulation-only / no real clicks',
  rn.indexOf('simulation') !== -1 ||
  rn.indexOf('реальные клики') !== -1 ||
  rn.indexOf('real clicks not implemented') !== -1
);

// 32. RELEASE_CHECKLIST and GITHUB_RELEASE_DRAFT explicitly assert simulation-only.
var rcLow = readText('docs/RELEASE_CHECKLIST.md').toLowerCase();
record(
  'docs/RELEASE_CHECKLIST.md asserts simulation-only',
  rcLow.indexOf('simulation-only') !== -1 ||
  rcLow.indexOf('simulation only') !== -1 ||
  rcLow.indexOf('no real') !== -1
);
var grLow = readText('docs/GITHUB_RELEASE_DRAFT.md').toLowerCase();
record(
  'docs/GITHUB_RELEASE_DRAFT.md asserts simulation-only',
  grLow.indexOf('simulation-only') !== -1 ||
  grLow.indexOf('simulation only') !== -1
);
record(
  'docs/GITHUB_RELEASE_DRAFT.md states no real clicks / OCR / image recognition',
  /no\s+real(\s+system)?\s+clicks/.test(grLow) ||
  /no real input/.test(grLow) ||
  (grLow.indexOf('no ocr') !== -1 && grLow.indexOf('no image recognition') !== -1)
);

// --- Step 22: GitHub beta release finalization ---

// 33. docs/RELEASE_FINAL_CHECK.md content sanity.
var rfcTxt = readText('docs/RELEASE_FINAL_CHECK.md');
record(
  'docs/RELEASE_FINAL_CHECK.md exists and mentions 0.1.0-beta',
  rfcTxt.indexOf('0.1.0-beta') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md asserts simulation-only',
  /simulation-only|simulation only/i.test(rfcTxt)
);

// 34. docs/TAG_AND_RELEASE_GUIDE.md content sanity.
var tagTxt = readText('docs/TAG_AND_RELEASE_GUIDE.md');
record(
  'docs/TAG_AND_RELEASE_GUIDE.md mentions git tag command',
  /git\s+tag\s+-a\s+v0\.1\.0-beta/.test(tagTxt)
);
record(
  'docs/TAG_AND_RELEASE_GUIDE.md mentions git push origin v0.1.0-beta',
  tagTxt.indexOf('git push origin v0.1.0-beta') !== -1
);
record(
  'docs/TAG_AND_RELEASE_GUIDE.md states pre-release on GitHub',
  /pre-?release/i.test(tagTxt)
);

// 35. docs/GITHUB_RELEASE_DRAFT.md is concrete to 0.1.0-beta.
record(
  'docs/GITHUB_RELEASE_DRAFT.md mentions 0.1.0-beta',
  readText('docs/GITHUB_RELEASE_DRAFT.md').indexOf('0.1.0-beta') !== -1
);

// 36. RELEASE_NOTES.md mentions 0.1.0-beta and simulation-only.
record(
  'RELEASE_NOTES.md mentions 0.1.0-beta',
  readText('RELEASE_NOTES.md').indexOf('0.1.0-beta') !== -1
);

// 37. README mentions 0.1.0-beta.
record(
  'README.md mentions 0.1.0-beta',
  readText('README.md').indexOf('0.1.0-beta') !== -1
);

// 38. PROJECT_CONTEXT mentions step 22.
record(
  'README or PROJECT_CONTEXT mentions step 22',
  /step\s*22|шаг\s*22|Step 22|Шаг 22/.test(readText('README.md')) ||
  /step\s*22|шаг\s*22|Step 22|Шаг 22/.test(readText('PROJECT_CONTEXT.md'))
);

// 39. package.json version is 0.1.0 (the `-beta` qualifier lives on the GitHub tag).
if (pkg) {
  record(
    'package.json version is 0.1.0',
    pkg.version === '0.1.0',
    'version = ' + pkg.version
  );
  // 40. package.json declares scripts.smoke (already checked above) — re-assert here.
  record(
    'package.json scripts.smoke uses scripts/smoke-check.js',
    !!(pkg.scripts && pkg.scripts.smoke && pkg.scripts.smoke.indexOf('scripts/smoke-check.js') !== -1)
  );
}

// 41. RELEASE_CHECKLIST.md references the Step 22 docs.
var rcTxt = readText('docs/RELEASE_CHECKLIST.md');
record(
  'docs/RELEASE_CHECKLIST.md references RELEASE_NOTES.md',
  rcTxt.indexOf('RELEASE_NOTES.md') !== -1
);
record(
  'docs/RELEASE_CHECKLIST.md references GITHUB_RELEASE_DRAFT.md',
  rcTxt.indexOf('GITHUB_RELEASE_DRAFT.md') !== -1
);

// 42. SECURITY_CHECKLIST.md final-release section is present.
var scTxt = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has final release security section',
  /final\s+release\s+security/i.test(scTxt)
);

// 43. KNOWN_LIMITATIONS.md mentions Step 22 / dry-run sandbox / mock adapter only.
var klTxt = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md covers dry-run sandbox preview-only',
  /dry-?run\s+sandbox\s+is\s+preview-only/i.test(klTxt) ||
  /preview\s+only/i.test(klTxt)
);
record(
  'docs/KNOWN_LIMITATIONS.md mentions mock adapter only',
  /mock\s+adapter\s+only/i.test(klTxt)
);

// --- Step 23: post-pack QA and release blocker pass ---

// 44. Step 23 docs sanity.
var rbTxt = readText('docs/RELEASE_BLOCKERS.md');
record(
  'docs/RELEASE_BLOCKERS.md mentions 0.1.0-beta',
  rbTxt.indexOf('0.1.0-beta') !== -1
);
record(
  'docs/RELEASE_BLOCKERS.md has a Release decision section',
  /Release decision/i.test(rbTxt)
);
record(
  'docs/RELEASE_BLOCKERS.md asserts no known blockers from automated checks',
  /no\s+release\s+blockers|no\s+known\s+release\s+blockers|No release blockers found|no\s+(known\s+)?automated\/static\s+release\s+blockers/i.test(rbTxt)
);

var pqTxt = readText('docs/PACKAGED_APP_QA.md');
record(
  'docs/PACKAGED_APP_QA.md is the manual checklist for npm run pack/dist',
  /npm run pack/.test(pqTxt) && /npm run dist/.test(pqTxt)
);
record(
  'docs/PACKAGED_APP_QA.md asserts no real clicks verification',
  /no real cursor movement/i.test(pqTxt) ||
  /no real clicks verification/i.test(pqTxt)
);
record(
  'docs/PACKAGED_APP_QA.md asks the build to remain simulation-only',
  /simulation-only|simulation only/i.test(pqTxt)
);

// 45. RELEASE_FINAL_CHECK references the new docs.
var rfcTxt2 = readText('docs/RELEASE_FINAL_CHECK.md');
record(
  'docs/RELEASE_FINAL_CHECK.md references PACKAGED_APP_QA.md',
  rfcTxt2.indexOf('PACKAGED_APP_QA.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md references RELEASE_BLOCKERS.md',
  rfcTxt2.indexOf('RELEASE_BLOCKERS.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md says ready for beta release after packaged app QA',
  /Ready\s+for\s+beta\s+(pre-?)?release\s+after\s+(manual\s+)?packaged-?app\s+QA/i.test(rfcTxt2)
);

// 46. TAG_AND_RELEASE_GUIDE references PACKAGED_APP_QA / RELEASE_BLOCKERS.
var tagTxt2 = readText('docs/TAG_AND_RELEASE_GUIDE.md');
record(
  'docs/TAG_AND_RELEASE_GUIDE.md references PACKAGED_APP_QA.md',
  tagTxt2.indexOf('PACKAGED_APP_QA.md') !== -1
);
record(
  'docs/TAG_AND_RELEASE_GUIDE.md references RELEASE_BLOCKERS.md',
  tagTxt2.indexOf('RELEASE_BLOCKERS.md') !== -1
);
record(
  'docs/TAG_AND_RELEASE_GUIDE.md warns "do not tag from a broken working tree"',
  /broken working tree/i.test(tagTxt2)
);

// 47. GITHUB_RELEASE_DRAFT mentions Beta QA status / packaged testing.
var grTxt = readText('docs/GITHUB_RELEASE_DRAFT.md');
record(
  'docs/GITHUB_RELEASE_DRAFT.md has a Beta QA status section',
  /Beta QA status/i.test(grTxt)
);
record(
  'docs/GITHUB_RELEASE_DRAFT.md mentions Manual packaged-app testing',
  /Manual packaged-app testing/i.test(grTxt) ||
  /manual packaged.+testing/i.test(grTxt)
);
record(
  'docs/GITHUB_RELEASE_DRAFT.md mentions known release blockers tracking',
  /RELEASE_BLOCKERS\.md|known release blockers/i.test(grTxt)
);

// 48. README / PROJECT_CONTEXT mention step 23.
record(
  'README or PROJECT_CONTEXT mentions step 23',
  /step\s*23|шаг\s*23|Step 23|Шаг 23/.test(readText('README.md')) ||
  /step\s*23|шаг\s*23|Step 23|Шаг 23/.test(readText('PROJECT_CONTEXT.md'))
);

// 49. RELEASE_NOTES warns the build is beta + simulation-only + no real clicks.
var rnLow = readText('RELEASE_NOTES.md').toLowerCase();
record(
  'RELEASE_NOTES.md mentions beta',
  rnLow.indexOf('beta') !== -1
);
record(
  'RELEASE_NOTES.md mentions simulation-only / no real clicks',
  rnLow.indexOf('simulation') !== -1 ||
  rnLow.indexOf('no real') !== -1
);
record(
  'RELEASE_NOTES.md mentions packaged-app testing',
  rnLow.indexOf('packaged') !== -1
);

// 50. SECURITY_CHECKLIST asserts contextIsolation true and nodeIntegration false in source-level wording.
var scTxtLow = readText('docs/SECURITY_CHECKLIST.md').toLowerCase();
record(
  'docs/SECURITY_CHECKLIST.md asserts contextIsolation: true',
  scTxtLow.indexOf('contextisolation: true') !== -1
);
record(
  'docs/SECURITY_CHECKLIST.md asserts nodeIntegration: false',
  scTxtLow.indexOf('nodeintegration: false') !== -1
);

// --- Step 24: final beta release preparation ---

// 51. Step 24 docs content sanity.
var frsTxt = readText('docs/FINAL_RELEASE_SUMMARY.md');
record(
  'docs/FINAL_RELEASE_SUMMARY.md mentions 0.1.0-beta',
  frsTxt.indexOf('0.1.0-beta') !== -1
);
record(
  'docs/FINAL_RELEASE_SUMMARY.md asserts simulation-only',
  /simulation-only|simulation only/i.test(frsTxt)
);
record(
  'docs/FINAL_RELEASE_SUMMARY.md "Release recommendation" mentions packaged-app QA',
  /Release recommendation[\s\S]{0,400}packaged.{0,30}QA/i.test(frsTxt)
);
record(
  'docs/FINAL_RELEASE_SUMMARY.md lists the six safety layers',
  /six\s+independent\s+layers/i.test(frsTxt) ||
  (/feature[- ]flags/i.test(frsTxt) &&
   /safety[- ]gates/i.test(frsTxt) &&
   /adapter[- ]interface/i.test(frsTxt) &&
   /adapter[- ]registry/i.test(frsTxt) &&
   /action[- ]pipeline/i.test(frsTxt) &&
   /sandbox/i.test(frsTxt))
);

var prcTxt = readText('docs/PRE_RELEASE_CHECKLIST.md');
record(
  'docs/PRE_RELEASE_CHECKLIST.md uses [ ] checkbox format',
  prcTxt.indexOf('- [ ]') !== -1
);
record(
  'docs/PRE_RELEASE_CHECKLIST.md mentions npm run smoke',
  /npm run smoke/.test(prcTxt)
);
record(
  'docs/PRE_RELEASE_CHECKLIST.md mentions PACKAGED_APP_QA.md',
  prcTxt.indexOf('PACKAGED_APP_QA.md') !== -1
);
record(
  'docs/PRE_RELEASE_CHECKLIST.md asserts no real clicks',
  /no real (cursor movement|clicks|input)/i.test(prcTxt)
);

var tpTxt = readText('docs/RELEASE_TAG_PLAN.md');
record(
  'docs/RELEASE_TAG_PLAN.md mentions git tag -a v0.1.0-beta',
  /git\s+tag\s+-a\s+v0\.1\.0-beta/.test(tpTxt)
);
record(
  'docs/RELEASE_TAG_PLAN.md mentions git push origin v0.1.0-beta',
  tpTxt.indexOf('git push origin v0.1.0-beta') !== -1
);
record(
  'docs/RELEASE_TAG_PLAN.md says tag and publication remain manual',
  /manual|manually|will not create a tag|will not.*publish/i.test(tpTxt)
);
record(
  'docs/RELEASE_TAG_PLAN.md mentions pre-release',
  /pre-?release/i.test(tpTxt)
);

var rcmTxt = readText('docs/RELEASE_COMMIT_MESSAGE.md');
record(
  'docs/RELEASE_COMMIT_MESSAGE.md provides the recommended title',
  rcmTxt.indexOf('Prepare ClickFlow 0.1.0-beta release') !== -1
);
record(
  'docs/RELEASE_COMMIT_MESSAGE.md lists forbidden body lines',
  /forbidden body lines/i.test(rcmTxt) &&
  rcmTxt.indexOf('Implements real desktop actions') !== -1
);

// 52. RELEASE_FINAL_CHECK references the Step 24 docs.
var rfcTxt3 = readText('docs/RELEASE_FINAL_CHECK.md');
record(
  'docs/RELEASE_FINAL_CHECK.md references FINAL_RELEASE_SUMMARY.md',
  rfcTxt3.indexOf('FINAL_RELEASE_SUMMARY.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md references PRE_RELEASE_CHECKLIST.md',
  rfcTxt3.indexOf('PRE_RELEASE_CHECKLIST.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md references RELEASE_TAG_PLAN.md',
  rfcTxt3.indexOf('RELEASE_TAG_PLAN.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md references RELEASE_COMMIT_MESSAGE.md',
  rfcTxt3.indexOf('RELEASE_COMMIT_MESSAGE.md') !== -1
);
record(
  'docs/RELEASE_FINAL_CHECK.md says ready for beta pre-release after manual packaged-app QA',
  /Ready\s+for\s+beta\s+pre-?release\s+after\s+manual\s+packaged-?app\s+QA/i.test(rfcTxt3)
);

// 53. README / PROJECT_CONTEXT mention step 24.
record(
  'README or PROJECT_CONTEXT mentions step 24',
  /step\s*24|шаг\s*24|Step 24|Шаг 24/.test(readText('README.md')) ||
  /step\s*24|шаг\s*24|Step 24|Шаг 24/.test(readText('PROJECT_CONTEXT.md'))
);

// 54. RELEASE_NOTES.md still asserts simulation-only / no real clicks at step 24.
record(
  'RELEASE_NOTES.md asserts no real clicks or simulation-only',
  /no real (system )?clicks/i.test(readText('RELEASE_NOTES.md')) ||
  /simulation-only|simulation only/i.test(readText('RELEASE_NOTES.md'))
);

// 55. RELEASE_BLOCKERS.md asserts no automated/static blockers at step 24.
var rbTxt2 = readText('docs/RELEASE_BLOCKERS.md');
record(
  'docs/RELEASE_BLOCKERS.md asserts no automated/static release blockers',
  /no\s+(known\s+)?automated\/static\s+release\s+blockers/i.test(rbTxt2) ||
  /No release blockers found|No known release blockers/i.test(rbTxt2)
);
record(
  'docs/RELEASE_BLOCKERS.md says manual packaged-app QA required',
  /manual packaged-?app QA|manual\s+QA\s+is\s+still\s+required/i.test(rbTxt2)
);

// 56. README.md mentions 0.1.0-beta at step 24.
record(
  'README.md mentions 0.1.0-beta (step 24)',
  readText('README.md').indexOf('0.1.0-beta') !== -1
);

// --- Step 25: Screen Capture Foundation ---

// 57. New source / doc files exist.
[
  'src/screen-capture-client.js',
  'src/screen-capture-ui.js'
].forEach(function (rel) {
  record('Step 25 file exists: ' + rel, fileExists(rel));
});
record('Step 25 doc exists: docs/SCREEN_CAPTURE.md', fileExists('docs/SCREEN_CAPTURE.md'));

// 58. preload.js exposes the screenCapture API (no raw ipcRenderer).
record(
  'preload.js exposes screenCapture API',
  /screenCapture\s*:\s*\{[\s\S]{0,500}listSources/.test(preloadTxt) &&
  preloadTxt.indexOf("'screen-capture:list-sources'") !== -1 &&
  preloadTxt.indexOf("'screen-capture:capture-preview'") !== -1 &&
  preloadTxt.indexOf("'screen-capture:get-status'") !== -1
);
// preload.js still does not expose ipcRenderer (re-asserted from earlier check).
// (Already covered by check #20; no need to duplicate.)

// 59. main.js registers the three IPC handlers and imports desktopCapturer.
record(
  'main.js imports desktopCapturer',
  /require\(['"]electron['"]\)/.test(mainTxt) &&
  /\bdesktopCapturer\b/.test(mainTxt)
);
record(
  "main.js handles ipcMain 'screen-capture:list-sources'",
  mainTxt.indexOf("ipcMain.handle('screen-capture:list-sources'") !== -1
);
record(
  "main.js handles ipcMain 'screen-capture:capture-preview'",
  mainTxt.indexOf("ipcMain.handle('screen-capture:capture-preview'") !== -1
);
record(
  "main.js handles ipcMain 'screen-capture:get-status'",
  mainTxt.indexOf("ipcMain.handle('screen-capture:get-status'") !== -1
);
record(
  'main.js validates sourceId prefix (screen:/window:)',
  mainTxt.indexOf("'screen:'") !== -1 && mainTxt.indexOf("'window:'") !== -1
);
record(
  'main.js does not write screenshots to disk',
  // The handlers in main.js use desktopCapturer + getSources only;
  // they never call fs.writeFile* with thumbnail / image data.
  !/desktopCapturer[\s\S]{0,3000}fs\.writeFile/.test(mainTxt)
);

// 60. screen-capture-client.js exports the documented surface.
var scClient = readText('src/screen-capture-client.js');
[
  'function listScreenSources',
  'function captureScreenPreview',
  'function getScreenCaptureStatus',
  'function validateScreenSource',
  'function getLastScreenCapturePreview',
  'function setLastScreenCapturePreview',
  'function clearScreenCapturePreview'
].forEach(function (needle) {
  record(
    'screen-capture-client.js declares ' + needle,
    scClient.indexOf(needle) !== -1
  );
});
record(
  'screen-capture-client.js does not require ipcRenderer or electron',
  scClient.indexOf("require('electron')") === -1 &&
  scClient.indexOf("require('ipcRenderer')") === -1 &&
  scClient.indexOf('ipcRenderer.invoke') === -1
);
record(
  'screen-capture-client.js never persists previews via localStorage',
  // Strip line/block comments before checking.
  (function () {
    var stripped = scClient
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);

// 61. screen-capture-ui.js exports the documented surface and is DOM-safe.
var scUi = readText('src/screen-capture-ui.js');
[
  'function openScreenCaptureTab',
  'function renderScreenCapture',
  'function renderScreenCaptureStatus',
  'function renderScreenSourceList',
  'function renderScreenPreview',
  'function refreshScreenSources',
  'function selectScreenSource',
  'function captureSelectedScreenPreview',
  'function clearScreenPreview'
].forEach(function (needle) {
  record(
    'screen-capture-ui.js declares ' + needle,
    scUi.indexOf(needle) !== -1
  );
});
record(
  'screen-capture-ui.js never assigns innerHTML to user data',
  // innerHTML may only appear as `= ''` (container clear), nowhere else.
  // Allow `.innerHTML = ''` and `.innerHTML = ""`; reject any other RHS.
  (function () {
    var lines = scUi.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var ln = lines[i];
      // strip line comments first
      var code = ln.replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue; // only in comment, fine
      // must be of the form `<x>.innerHTML = '';` or "";
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);
record(
  'screen-capture-ui.js does not require ipcRenderer or electron',
  scUi.indexOf("require('electron')") === -1 &&
  scUi.indexOf('ipcRenderer.invoke') === -1
);

// 62. app-state.js declares the screenCapture slice and mutators.
var appStateTxt = readText('src/app-state.js');
record(
  'app-state.js declares appState.screenCapture slice',
  /screenCapture\s*:\s*\{[\s\S]{0,400}sources/.test(appStateTxt)
);
[
  'function setScreenCaptureSources',
  'function setSelectedScreenSource',
  'function setScreenCapturePreview',
  'function setScreenCaptureLoading',
  'function setScreenCaptureError',
  'function clearScreenCapturePreview',
  'function resetScreenCaptureState'
].forEach(function (needle) {
  record(
    'app-state.js declares ' + needle,
    appStateTxt.indexOf(needle) !== -1
  );
});

// 63. audit-events.js allowlist contains the six new types.
[
  "'screen.capture.sources.requested'",
  "'screen.capture.sources.loaded'",
  "'screen.capture.preview.requested'",
  "'screen.capture.preview.created'",
  "'screen.capture.preview.cleared'",
  "'screen.capture.error'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 64. index.html wires the new tab + scripts.
var htmlTxt3 = readText('src/index.html');
record(
  'index.html has Screen Capture tab button',
  /data-advanced-tab=['"]screenCapture['"]/.test(htmlTxt3)
);
record(
  'index.html has Screen Capture section',
  /id=['"]advanced-tab-screenCapture['"]/.test(htmlTxt3)
);
record(
  'index.html loads screen-capture-client.js',
  /src=['"]screen-capture-client\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads screen-capture-ui.js',
  /src=['"]screen-capture-ui\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads screen-capture-client.js BEFORE screen-capture-ui.js',
  htmlTxt3.indexOf('screen-capture-client.js') !== -1 &&
  htmlTxt3.indexOf('screen-capture-ui.js') !== -1 &&
  htmlTxt3.indexOf('screen-capture-client.js') < htmlTxt3.indexOf('screen-capture-ui.js')
);
record(
  'index.html loads screen-capture-ui.js BEFORE renderer.js',
  htmlTxt3.indexOf('screen-capture-ui.js') !== -1 &&
  htmlTxt3.indexOf('renderer.js') !== -1 &&
  htmlTxt3.indexOf('screen-capture-ui.js') < htmlTxt3.indexOf('renderer.js')
);

// 65. README / PROJECT_CONTEXT mention step 25 and screen capture.
record(
  'README or PROJECT_CONTEXT mentions step 25',
  /step\s*25|шаг\s*25|Step 25|Шаг 25/.test(readText('README.md')) ||
  /step\s*25|шаг\s*25|Step 25|Шаг 25/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions screen capture / захват экрана',
  /screen[\s-]capture|захват\s*экрана|Screen Capture/i.test(readText('README.md')) ||
  /screen[\s-]capture|захват\s*экрана|Screen Capture/i.test(readText('PROJECT_CONTEXT.md'))
);

// 66. docs/SCREEN_CAPTURE.md asserts simulation-only / preview-only / no-disk-saving.
var scDoc = readText('docs/SCREEN_CAPTURE.md');
record(
  'docs/SCREEN_CAPTURE.md asserts simulation-only',
  /simulation-only|simulation only/i.test(scDoc)
);
record(
  'docs/SCREEN_CAPTURE.md asserts preview only',
  /preview[- ]only|preview\s+only/i.test(scDoc)
);
record(
  'docs/SCREEN_CAPTURE.md asserts no disk saving',
  /never\s+(saved|written)\s+to\s+disk|no\s+disk\s+saving|not\s+saved\s+to\s+disk/i.test(scDoc)
);
record(
  'docs/SCREEN_CAPTURE.md mentions OS limitations (macOS / Wayland / Windows)',
  /macOS/i.test(scDoc) && /Wayland|Linux/i.test(scDoc) && /Windows/i.test(scDoc)
);

// 67. SECURITY_CHECKLIST has a Screen capture (Step 25) section.
var scSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has Screen capture (Step 25) section',
  /screen\s+capture\s*\(?step\s*25/i.test(scSec) ||
  /## Screen capture/i.test(scSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts screenshots not saved to disk',
  // Allow markdown emphasis (`**not**`) between the words.
  /not[\s\S]{0,8}saved\s+to\s+disk|never[\s\S]{0,8}(saved|written)[\s\S]{0,8}to\s+disk/i.test(scSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts no OCR / image recognition / real clicks at step 25',
  /no ocr/i.test(scSec) && /no image recognition|no template matching/i.test(scSec) && /no real clicks/i.test(scSec)
);

// 68. KNOWN_LIMITATIONS / SMOKE_TESTS reference step 25.
var klTxt2 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a Screen capture (Step 25) section',
  /screen\s+capture\s*\(?step\s*25/i.test(klTxt2) ||
  /##\s*9\.\s*Screen capture/i.test(klTxt2)
);
var stTxt = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 25 screen capture block',
  /Step\s*25\s*[—-]\s*Screen Capture/i.test(stTxt) ||
  /Step 25.*Screen Capture/i.test(stTxt)
);

// 69. CHANGELOG mentions Step 25 / Screen Capture Foundation.
var chTxt = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 25 — Screen Capture Foundation',
  /Step\s*25.*Screen Capture Foundation/i.test(chTxt) ||
  /Шаг\s*25.*Screen Capture/i.test(chTxt) ||
  /Screen Capture Foundation/i.test(chTxt)
);

// 70. package.json must NOT pull in OCR / OpenCV / robotjs / nut.js / image
//     recognition libraries.
if (pkg) {
  var allDeps2 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step25Forbidden = [
    'tesseract.js', 'tesseract', 'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps2, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-recognition / real-input modules at step 25',
    step25Forbidden.length === 0,
    step25Forbidden.length ? step25Forbidden.join(', ') : ''
  );
}

// 71. Source files don't import OCR / OpenCV / image-recognition / sharp.
var step25SourceFiles = [
  'main.js', 'preload.js',
  'src/screen-capture-client.js',
  'src/screen-capture-ui.js'
];
var step25Imports = ['tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs', 'sharp', 'jimp'];
var foundStep25Imports = [];
step25SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step25Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep25Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-recognition modules required in step 25 source files',
  foundStep25Imports.length === 0,
  foundStep25Imports.length ? foundStep25Imports.join(', ') : ''
);

// 72. main.js still does not flip the simulation-only safety flags.
record(
  'main.js still sets contextIsolation: true (re-checked at step 25)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 25)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);

// 73. CSP not relaxed at step 25.
record(
  'src/index.html CSP unchanged at step 25 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
);

// --- Step 26: Region Selector Foundation ---

// 74. New source / doc files exist.
[
  'src/region-selector.js',
  'src/region-selector-ui.js'
].forEach(function (rel) {
  record('Step 26 file exists: ' + rel, fileExists(rel));
});
record('Step 26 doc exists: docs/REGION_SELECTOR.md', fileExists('docs/REGION_SELECTOR.md'));

// 75. region-selector.js (pure logic) declares the documented surface.
var rsCore = readText('src/region-selector.js');
[
  'function createRegion',
  'function normalizeRegion',
  'function validateRegion',
  'function scaleRegionToImage',
  'function scaleRegionToPreview',
  'function getRegionArea',
  'function formatRegion',
  'function createEmptyRegionState'
].forEach(function (needle) {
  record(
    'region-selector.js declares ' + needle,
    rsCore.indexOf(needle) !== -1
  );
});
record(
  'region-selector.js does not require electron or ipcRenderer',
  rsCore.indexOf("require('electron')") === -1 &&
  rsCore.indexOf("require('ipcRenderer')") === -1 &&
  rsCore.indexOf('ipcRenderer.invoke') === -1
);
record(
  'region-selector.js does not touch the DOM or fs',
  rsCore.indexOf('document.') === -1 &&
  rsCore.indexOf('fs.write') === -1 &&
  rsCore.indexOf('localStorage') === -1
);

// 76. region-selector-ui.js declares the documented surface and is DOM-safe.
var rsUi = readText('src/region-selector-ui.js');
[
  'function initRegionSelectorUi',
  'function attachRegionOverlay',
  'function enableRegionSelection',
  'function disableRegionSelection',
  'function handleRegionMouseDown',
  'function handleRegionMouseMove',
  'function handleRegionMouseUp',
  'function renderRegionSelection',
  'function renderRegionInfo',
  'function renderRegionSelectorCard',
  'function clearRegionSelection',
  'function saveRegionSelection',
  'function attachRegionToActiveScenario',
  'function getPreviewElementSize',
  'function getImageOriginalSize',
  'function getPointerPositionInPreview'
].forEach(function (needle) {
  record(
    'region-selector-ui.js declares ' + needle,
    rsUi.indexOf(needle) !== -1
  );
});
record(
  'region-selector-ui.js does not require electron or ipcRenderer',
  rsUi.indexOf("require('electron')") === -1 &&
  rsUi.indexOf('ipcRenderer.invoke') === -1
);
record(
  'region-selector-ui.js never persists previews via localStorage',
  (function () {
    var stripped = rsUi
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);
record(
  'region-selector-ui.js never assigns innerHTML to user data',
  (function () {
    var lines = rsUi.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);

// 77. app-state.js declares the regionSelector slice and 8 mutators.
record(
  'app-state.js declares appState.regionSelector slice',
  /regionSelector\s*:\s*\{[\s\S]{0,400}selectedRegion/.test(appStateTxt)
);
[
  'function setRegionSelecting',
  'function setSelectedRegion',
  'function setNormalizedRegion',
  'function setRegionPreviewSize',
  'function setRegionImageSize',
  'function setRegionError',
  'function clearSelectedRegion',
  'function resetRegionSelectorState'
].forEach(function (needle) {
  record(
    'app-state.js declares ' + needle,
    appStateTxt.indexOf(needle) !== -1
  );
});

// 78. audit-events.js allowlist contains the six new region.* types.
[
  "'region.selection.started'",
  "'region.selection.updated'",
  "'region.selection.completed'",
  "'region.selection.cleared'",
  "'region.attached.toScenario'",
  "'region.validation.failed'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 79. scenario-manager.js gained the three region helpers.
var smTxt = readText('src/scenario-manager.js');
[
  'function validateRegionSettings',
  'function updateScenarioRegion',
  'function clearScenarioRegion'
].forEach(function (needle) {
  record(
    'scenario-manager.js declares ' + needle,
    smTxt.indexOf(needle) !== -1
  );
});
record(
  'scenario-manager.js validateRegionSettings treats null/undefined as valid (region is optional)',
  /validateRegionSettings[\s\S]{0,400}region\s*===\s*null/.test(smTxt) ||
  /region\s*===\s*null[\s\S]{0,200}\{\s*valid:\s*true/.test(smTxt)
);

// 80. index.html wires the new scripts in the correct order.
record(
  'index.html loads region-selector.js',
  /src=['"]region-selector\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads region-selector-ui.js',
  /src=['"]region-selector-ui\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads region-selector.js BEFORE region-selector-ui.js',
  htmlTxt3.indexOf('region-selector.js') !== -1 &&
  htmlTxt3.indexOf('region-selector-ui.js') !== -1 &&
  htmlTxt3.indexOf('region-selector.js') < htmlTxt3.indexOf('region-selector-ui.js')
);
record(
  'index.html loads region-selector-ui.js BEFORE renderer.js',
  htmlTxt3.indexOf('region-selector-ui.js') !== -1 &&
  htmlTxt3.indexOf('renderer.js') !== -1 &&
  htmlTxt3.indexOf('region-selector-ui.js') < htmlTxt3.indexOf('renderer.js')
);

// 81. screen-capture-ui.js wraps the preview and attaches the overlay.
record(
  'screen-capture-ui.js wraps preview in .screen-preview-wrapper',
  scUi.indexOf("class = 'screen-preview-wrapper'") !== -1 ||
  scUi.indexOf("'screen-preview-wrapper'") !== -1
);
record(
  'screen-capture-ui.js calls attachRegionOverlay on the preview',
  scUi.indexOf('attachRegionOverlay(') !== -1
);
record(
  'screen-capture-ui.js appends the region selector card',
  scUi.indexOf('renderRegionSelectorCard(') !== -1
);

// 82. renderer.js diagnostics + copyDiagnostics line.
var rendTxt = readText('src/renderer.js');
record(
  'renderer.js has Region selector diagnostics card',
  rendTxt.indexOf("t('regionSelectorStatus')") !== -1
);
record(
  'renderer.js Copy diagnostics has Region selector line',
  /Region selector:[\s\S]{0,800}imageMatchingImplemented=false/.test(rendTxt)
);

// 83. README / PROJECT_CONTEXT mention step 26 / region selector.
record(
  'README or PROJECT_CONTEXT mentions step 26',
  /step\s*26|шаг\s*26|Step 26|Шаг 26/.test(readText('README.md')) ||
  /step\s*26|шаг\s*26|Step 26|Шаг 26/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions region selector / выделение области',
  /region\s*selector|Region Selector|выделение\s*области|выбор\s*области|выбран(ная|ной)\s*области/i.test(readText('README.md')) ||
  /region\s*selector|Region Selector|выделение\s*области|выбор\s*области|выбран(ная|ной)\s*области/i.test(readText('PROJECT_CONTEXT.md'))
);

// 84. docs/REGION_SELECTOR.md asserts simulation-only / preview-only.
var rsDoc = readText('docs/REGION_SELECTOR.md');
record(
  'docs/REGION_SELECTOR.md asserts simulation-only',
  /simulation-only|simulation only/i.test(rsDoc)
);
record(
  'docs/REGION_SELECTOR.md asserts preview only',
  /preview[- ]only|preview\s+only/i.test(rsDoc)
);
record(
  'docs/REGION_SELECTOR.md asserts no real clicks / OCR / image matching at step 26',
  /(no real clicks|never\s+performs\s+a\s+click|real mouse\s*\/\s*keyboard input)/i.test(rsDoc) &&
  /(no ocr|never runs ocr|ocr is\s+(not|deliberately)|ocr scoped)/i.test(rsDoc) &&
  /(no image matching|no image recognition|no template matching|never runs image matching|template matching scoped)/i.test(rsDoc)
);
record(
  'docs/REGION_SELECTOR.md describes preview vs image coordinates',
  /preview[\s-]+coord|preview\s+pixels|image\s+pixels|image[\s-]+coord/i.test(rsDoc)
);

// 85. SECURITY_CHECKLIST has a Region selector (Step 26) section.
var rsSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has Region selector (Step 26) section',
  /region\s+selector\s*\(?step\s*26/i.test(rsSec) ||
  /## Region selector/i.test(rsSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts region selector does not execute actions',
  /no real clicks/i.test(rsSec) &&
  /no automatic action triggered by a region|never\s+(fires|triggers)\s+a\s+click/i.test(rsSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts region uses preview only / numbers only',
  /numbers\s+only|four\s+numbers|stored\s+as\s+numbers/i.test(rsSec) ||
  /preview-only/i.test(rsSec)
);

// 86. KNOWN_LIMITATIONS / SMOKE_TESTS / SCREEN_CAPTURE / ACTION_SCHEMA reference step 26.
var klTxt3 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a Region selector (Step 26) section',
  /region\s+selector\s*\(?step\s*26/i.test(klTxt3) ||
  /##\s*10\.\s*Region selector/i.test(klTxt3)
);
var stTxt2 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 26 region selector block',
  /Step\s*26\s*[—-]\s*Region Selector/i.test(stTxt2) ||
  /Step 26.*Region Selector/i.test(stTxt2)
);
var scDoc2 = readText('docs/SCREEN_CAPTURE.md');
record(
  'docs/SCREEN_CAPTURE.md links to REGION_SELECTOR.md',
  scDoc2.indexOf('REGION_SELECTOR.md') !== -1
);
var asDoc = readText('docs/ACTION_SCHEMA.md');
record(
  'docs/ACTION_SCHEMA.md describes optional settings.region (Step 26)',
  /Optional\s+`?settings\.region`?\s*\(?Step\s*26\)?/i.test(asDoc) &&
  /region\.x|region\.width|region:\s*\{/.test(asDoc)
);

// 87. CHANGELOG mentions Step 26 / Region Selector Foundation.
var chTxt2 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 26 — Region Selector Foundation',
  /Step\s*26.*Region Selector Foundation/i.test(chTxt2) ||
  /Шаг\s*26.*Region Selector/i.test(chTxt2) ||
  /Region Selector Foundation/i.test(chTxt2)
);

// 88. package.json must STILL NOT pull in OCR / OpenCV / robotjs / nut.js
//     / image recognition / template matching / sharp at step 26.
if (pkg) {
  var allDeps3 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step26Forbidden = [
    'tesseract.js', 'tesseract', 'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps3, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 26',
    step26Forbidden.length === 0,
    step26Forbidden.length ? step26Forbidden.join(', ') : ''
  );
}

// 89. Source files don't import OCR / OpenCV / image-recognition / sharp at step 26.
var step26SourceFiles = [
  'main.js', 'preload.js',
  'src/region-selector.js',
  'src/region-selector-ui.js',
  'src/scenario-manager.js'
];
var step26Imports = ['tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs', 'sharp', 'jimp', 'pixelmatch', 'looks-same'];
var foundStep26Imports = [];
step26SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step26Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep26Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching modules required in step 26 source files',
  foundStep26Imports.length === 0,
  foundStep26Imports.length ? foundStep26Imports.join(', ') : ''
);

// 90. Region selector adds no new IPC channel (renderer-only).
record(
  'main.js does not register any region.* IPC handler at step 26',
  !/ipcMain\.handle\(['"]region\./.test(mainTxt)
);
record(
  'preload.js does not expose any region.* API at step 26',
  preloadTxt.indexOf("'region.") === -1 &&
  preloadTxt.indexOf('"region.') === -1
);

// 91. main.js still does not flip the simulation-only safety flags at step 26.
record(
  'main.js still sets contextIsolation: true (re-checked at step 26)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 26)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 26 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
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
