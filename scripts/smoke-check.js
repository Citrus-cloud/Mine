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
  // Step 40: optional `<script src="../node_modules/...">` tags
  // are best-effort. They resolve only after `npm install`. The
  // sandbox / CI may not have the dependency unpacked. We skip
  // those entries here because the renderer's defensive engine
  // resolver handles a missing file gracefully.
  if (srcAttr.indexOf('../node_modules/') === 0 || srcAttr.indexOf('node_modules/') === 0) {
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

// 39. package.json version. At Step 21 the version was pinned to
// 0.1.0 (the `-beta` qualifier lived on the GitHub tag). At
// Step 43 the version bumps to `0.2.0-beta` (semver-clean
// pre-release identifier; the GitHub release tag is
// `v0.2.0-smart-beta`). The check now accepts either, so
// historical snapshots and current builds both stay green.
if (pkg) {
  record(
    'package.json version matches a known release target',
    pkg.version === '0.1.0' || pkg.version === '0.2.0-beta',
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
    'tesseract-ocr', 'node-tesseract-ocr',
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
    'tesseract-ocr', 'node-tesseract-ocr',
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

// --- Step 27: Template Asset Manager ---

// 92. New source / doc files exist.
[
  'main/template-assets.js',
  'src/template-manager.js',
  'src/template-ui.js'
].forEach(function (rel) {
  record('Step 27 file exists: ' + rel, fileExists(rel));
});
record('Step 27 doc exists: docs/TEMPLATE_ASSETS.md', fileExists('docs/TEMPLATE_ASSETS.md'));

// 93. main.js wires the templates module.
record(
  "main.js requires ./main/template-assets",
  /require\(['"]\.\/main\/template-assets['"]\)/.test(mainTxt)
);
record(
  'main.js calls registerTemplateAssetsIpc',
  mainTxt.indexOf('registerTemplateAssetsIpc(') !== -1
);

// 94. main/template-assets.js declares the documented surface and
//     keeps the simulation-only invariants.
var taTxt = readText('main/template-assets.js');
[
  'function registerTemplateAssetsIpc',
  'function getTemplatesStats',
  "ALLOWED_TEMPLATE_EXTENSIONS",
  "ALLOWED_TEMPLATE_MIME_TYPES",
  "MAX_TEMPLATE_FILE_BYTES",
  "MAX_TEMPLATE_NAME_LEN",
  "MAX_TEMPLATE_DESCRIPTION_LEN"
].forEach(function (needle) {
  record(
    'main/template-assets.js declares ' + needle,
    taTxt.indexOf(needle) !== -1
  );
});
record(
  'main/template-assets.js registers ipcMain.handle(\'templates:load\')',
  taTxt.indexOf("ipcMain.handle('templates:load'") !== -1
);
record(
  'main/template-assets.js registers ipcMain.handle(\'templates:import-image\')',
  taTxt.indexOf("ipcMain.handle('templates:import-image'") !== -1
);
record(
  'main/template-assets.js registers ipcMain.handle(\'templates:save-metadata\')',
  taTxt.indexOf("ipcMain.handle('templates:save-metadata'") !== -1
);
record(
  'main/template-assets.js registers ipcMain.handle(\'templates:delete\')',
  taTxt.indexOf("ipcMain.handle('templates:delete'") !== -1
);
record(
  'main/template-assets.js registers ipcMain.handle(\'templates:reset\')',
  taTxt.indexOf("ipcMain.handle('templates:reset'") !== -1
);
record(
  'main/template-assets.js opens dialog.showOpenDialog only in import-image',
  /templates:import-image[\s\S]{0,3000}dialog\.showOpenDialog/.test(taTxt)
);
record(
  'main/template-assets.js declares the png/jpg/jpeg/webp allow-list',
  /['"]png['"][\s\S]{0,40}['"]jpg['"][\s\S]{0,40}['"]jpeg['"][\s\S]{0,40}['"]webp['"]/.test(taTxt)
);
record(
  'main/template-assets.js performs a magic-bytes detection',
  taTxt.indexOf('_detectImageType') !== -1 && /0x89/.test(taTxt) && /0xFF/.test(taTxt)
);
record(
  'main/template-assets.js never decodes pixels (no sharp/jimp/opencv/tesseract require)',
  taTxt.indexOf("require('sharp')") === -1 &&
  taTxt.indexOf("require('jimp')") === -1 &&
  taTxt.indexOf("require('opencv4nodejs')") === -1 &&
  taTxt.indexOf("require('@u4/opencv4nodejs')") === -1 &&
  taTxt.indexOf("require('tesseract.js')") === -1 &&
  taTxt.indexOf("require('tesseract')") === -1 &&
  taTxt.indexOf("require('pixelmatch')") === -1
);

// 95. preload.js exposes the templates API and still does not leak ipcRenderer.
record(
  'preload.js exposes templates API',
  /templates\s*:\s*\{[\s\S]{0,800}importImage/.test(preloadTxt) &&
  preloadTxt.indexOf("'templates:load'") !== -1 &&
  preloadTxt.indexOf("'templates:import-image'") !== -1 &&
  preloadTxt.indexOf("'templates:save-metadata'") !== -1 &&
  preloadTxt.indexOf("'templates:delete'") !== -1 &&
  preloadTxt.indexOf("'templates:reset'") !== -1
);

// 96. src/template-manager.js exports the documented surface.
var tmTxt = readText('src/template-manager.js');
[
  'function initTemplates',
  'function getTemplates',
  'function getTemplateById',
  'function getActiveTemplate',
  'function setActiveTemplate',
  'function importTemplateImage',
  'function updateTemplateMetadata',
  'function deleteTemplate',
  'function resetTemplates',
  'function validateTemplateMetadata',
  'function loadTemplates',
  'function getTemplatesStats'
].forEach(function (needle) {
  record(
    'template-manager.js declares ' + needle,
    tmTxt.indexOf(needle) !== -1
  );
});
record(
  'template-manager.js does not require electron or ipcRenderer',
  tmTxt.indexOf("require('electron')") === -1 &&
  tmTxt.indexOf("require('ipcRenderer')") === -1 &&
  tmTxt.indexOf('ipcRenderer.invoke') === -1
);
record(
  'template-manager.js never persists previews via localStorage',
  (function () {
    var stripped = tmTxt
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);

// 97. src/template-ui.js declares the documented surface and is DOM-safe.
var tuTxt = readText('src/template-ui.js');
[
  'function renderTemplatesTab',
  'function renderTemplateList',
  'function renderTemplateCard',
  'function renderActiveTemplate',
  'function openTemplateImport',
  'function openTemplateEdit',
  'function saveTemplateEdit',
  'function cancelTemplateEdit',
  'function deleteTemplateById',
  'function resetTemplateAssets',
  'function refreshTemplates'
].forEach(function (needle) {
  record(
    'template-ui.js declares ' + needle,
    tuTxt.indexOf(needle) !== -1
  );
});
record(
  'template-ui.js does not require electron or ipcRenderer',
  tuTxt.indexOf("require('electron')") === -1 &&
  tuTxt.indexOf('ipcRenderer.invoke') === -1
);
record(
  'template-ui.js never persists previews via localStorage',
  (function () {
    var stripped = tuTxt
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);
record(
  'template-ui.js never assigns innerHTML to user data',
  (function () {
    var lines = tuTxt.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);

// 98. app-state.js declares the templates slice and 5 mutators.
record(
  'app-state.js declares appState.templates slice',
  /templates\s*:\s*\{[\s\S]{0,300}items\s*:\s*\[\]/.test(appStateTxt)
);
[
  'function setTemplates',
  'function setActiveTemplateId',
  'function setTemplatesLoading',
  'function setTemplatesError',
  'function resetTemplatesState'
].forEach(function (needle) {
  record(
    'app-state.js declares ' + needle,
    appStateTxt.indexOf(needle) !== -1
  );
});

// 99. audit-events.js allowlist contains the eight new template.* types.
[
  "'template.import.requested'",
  "'template.import.completed'",
  "'template.import.cancelled'",
  "'template.import.failed'",
  "'template.metadata.updated'",
  "'template.selected'",
  "'template.deleted'",
  "'template.reset'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 100. index.html wires the new tab + scripts in the right order.
record(
  'index.html has Templates tab button',
  /data-advanced-tab=['"]templates['"]/.test(htmlTxt3)
);
record(
  'index.html has Templates section',
  /id=['"]advanced-tab-templates['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-manager.js',
  /src=['"]template-manager\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-ui.js',
  /src=['"]template-ui\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-manager.js BEFORE template-ui.js',
  htmlTxt3.indexOf('template-manager.js') !== -1 &&
  htmlTxt3.indexOf('template-ui.js') !== -1 &&
  htmlTxt3.indexOf('template-manager.js') < htmlTxt3.indexOf('template-ui.js')
);
record(
  'index.html loads template-ui.js BEFORE renderer.js',
  htmlTxt3.indexOf('template-ui.js') !== -1 &&
  htmlTxt3.indexOf('renderer.js') !== -1 &&
  htmlTxt3.indexOf('template-ui.js') < htmlTxt3.indexOf('renderer.js')
);

// 101. renderer.js diagnostics card + Copy diagnostics line.
record(
  'renderer.js wires Templates tab into setAdvancedTab switch',
  /case 'templates'[\s\S]{0,80}renderTemplatesTab/.test(rendTxt)
);
record(
  'renderer.js has Image templates diagnostics card',
  rendTxt.indexOf("t('templatesDiagnostics')") !== -1
);
record(
  'renderer.js Copy diagnostics has Templates line',
  /Templates: count=[\s\S]{0,400}screenMatchingImplemented=false/.test(rendTxt)
);
record(
  'renderer.js init() calls initTemplates()',
  /await initTemplates\(\)/.test(rendTxt) || /initTemplates\(\)/.test(rendTxt)
);

// 102. README / PROJECT_CONTEXT mention step 27 / template asset manager.
record(
  'README or PROJECT_CONTEXT mentions step 27',
  /step\s*27|шаг\s*27|Step 27|Шаг 27/.test(readText('README.md')) ||
  /step\s*27|шаг\s*27|Step 27|Шаг 27/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions templates / шаблон',
  /template[\s-]?asset|Image Templates|Шаблон/i.test(readText('README.md')) ||
  /template[\s-]?asset|Image Templates|Шаблон/i.test(readText('PROJECT_CONTEXT.md'))
);

// 103. docs/TEMPLATE_ASSETS.md asserts simulation-only / preview-only.
var taDoc = readText('docs/TEMPLATE_ASSETS.md');
record(
  'docs/TEMPLATE_ASSETS.md asserts simulation-only',
  /simulation-only|simulation only/i.test(taDoc)
);
record(
  'docs/TEMPLATE_ASSETS.md asserts no image matching / OCR / clicks at step 27',
  /no\s+template\s+matching|no\s+image\s+matching|matcher\s+is\s+not\s+implemented/i.test(taDoc) &&
  /(no ocr|never runs ocr|ocr is\s+(not|deliberately))/i.test(taDoc) &&
  /(no real clicks|never\s+performs\s+a\s+click|click engine[\s\S]{0,80}unaware)/i.test(taDoc)
);
record(
  'docs/TEMPLATE_ASSETS.md describes the userData/templates storage',
  /userData[\s\S]{0,30}templates/.test(taDoc) &&
  /templates\.json/.test(taDoc) &&
  /images/.test(taDoc)
);
record(
  'docs/TEMPLATE_ASSETS.md mentions the planned image_click action',
  /image_click/i.test(taDoc)
);

// 104. SECURITY_CHECKLIST has a Template asset manager (Step 27) section.
var taSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has Template Asset Manager (Step 27) section',
  /template\s+asset\s+manager\s*\(?step\s*27/i.test(taSec) ||
  /## Template Asset Manager/i.test(taSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts dialog-only import + format allow-list',
  /dialog\.showOpenDialog/.test(taSec) &&
  /png/i.test(taSec) && /jpg/i.test(taSec) && /webp/i.test(taSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts metadata-only / no base64 in templates.json',
  /metadata\s+only|no\s+base64|no\s+pixel\s+data/i.test(taSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts no OCR / no image matching / no real clicks at step 27',
  /no real clicks/i.test(taSec) &&
  /no template matching|no image matching|no image recognition/i.test(taSec) &&
  /no ocr/i.test(taSec)
);

// 105. KNOWN_LIMITATIONS / SMOKE_TESTS / ACTION_SCHEMA reference step 27.
var klTxt27 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a Template asset manager (Step 27) section',
  /template\s+asset\s+manager\s*\(?step\s*27/i.test(klTxt27) ||
  /##\s*11\.\s*Template asset manager/i.test(klTxt27) ||
  /Templates are stored but not matched yet/i.test(klTxt27)
);
var stTxt27 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 27 template asset manager block',
  /Step\s*27\s*[—-]\s*Template Asset Manager/i.test(stTxt27) ||
  /Step 27.*Template Asset Manager/i.test(stTxt27)
);
var asDoc27 = readText('docs/ACTION_SCHEMA.md');
record(
  'docs/ACTION_SCHEMA.md describes the planned image_click action (Step 27)',
  /image_click/i.test(asDoc27) && /templateId/.test(asDoc27)
);

// 106. CHANGELOG mentions Step 27 / Template Asset Manager.
var chTxt27 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 27 — Template Asset Manager',
  /Step\s*27.*Template Asset Manager/i.test(chTxt27) ||
  /Шаг\s*27.*Template Asset/i.test(chTxt27) ||
  /Template Asset Manager/i.test(chTxt27)
);

// 107. package.json must STILL NOT pull in OCR / OpenCV / robotjs / nut.js
//     / image recognition / template matching / sharp / jimp / pixelmatch
//     / looks-same at step 27.
if (pkg) {
  var allDeps27 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step27Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps27, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 27',
    step27Forbidden.length === 0,
    step27Forbidden.length ? step27Forbidden.join(', ') : ''
  );
}

// 108. Source files don't import OCR / OpenCV / image-recognition / sharp at step 27.
var step27SourceFiles = [
  'main.js', 'preload.js',
  'main/template-assets.js',
  'src/template-manager.js',
  'src/template-ui.js'
];
var step27Imports = [
  'tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep27Imports = [];
step27SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step27Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep27Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 27 source files',
  foundStep27Imports.length === 0,
  foundStep27Imports.length ? foundStep27Imports.join(', ') : ''
);

// 109. main.js still does not flip the simulation-only safety flags at step 27.
record(
  'main.js still sets contextIsolation: true (re-checked at step 27)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 27)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 27 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
);

// --- Step 28: Template Matching Mock / Dry-run ---

// 110. New source / doc files exist.
[
  'src/template-matching-mock.js',
  'src/template-matching-ui.js'
].forEach(function (rel) {
  record('Step 28 file exists: ' + rel, fileExists(rel));
});
record('Step 28 doc exists: docs/TEMPLATE_MATCHING_MOCK.md', fileExists('docs/TEMPLATE_MATCHING_MOCK.md'));

// 111. template-matching-mock.js declares the documented surface
//     and stays renderer-pure (no electron, no ipcRenderer, no fs).
var tmMock = readText('src/template-matching-mock.js');
[
  'function createTemplateMatchInput',
  'function validateTemplateMatchInput',
  'function runMockTemplateMatch',
  'function createMockMatchResult',
  'function getMockTargetPoint',
  'function createImageClickActionPreview',
  'function clearMockMatchResult',
  'function getTemplateMatchingMockStatus'
].forEach(function (needle) {
  record(
    'template-matching-mock.js declares ' + needle,
    tmMock.indexOf(needle) !== -1
  );
});
record(
  'template-matching-mock.js does not require electron or ipcRenderer',
  tmMock.indexOf("require('electron')") === -1 &&
  tmMock.indexOf("require('ipcRenderer')") === -1 &&
  tmMock.indexOf('ipcRenderer.invoke') === -1
);
record(
  'template-matching-mock.js never persists results via localStorage',
  (function () {
    var stripped = tmMock
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);
record(
  'template-matching-mock.js stamps realMatching=false / realClick=false on results',
  /realMatching\s*:\s*false/.test(tmMock) && /realClick\s*:\s*false/.test(tmMock)
);

// 112. template-matching-ui.js declares the documented surface,
//     stays DOM-safe, and never speaks to ipcRenderer.
var tmUi = readText('src/template-matching-ui.js');
[
  'function renderTemplateMatchingTab',
  'function buildTemplateMatchInputFromState',
  'function runTemplateMatchingMock',
  'function clearTemplateMatchingMockResult',
  'function renderTemplateMatchingRequirements',
  'function renderTemplateMatchingInputSummary',
  'function renderTemplateMatchingResult',
  'function renderTemplateMatchingOverlay',
  'function renderActionPreview'
].forEach(function (needle) {
  record(
    'template-matching-ui.js declares ' + needle,
    tmUi.indexOf(needle) !== -1
  );
});
record(
  'template-matching-ui.js does not require electron or ipcRenderer',
  tmUi.indexOf("require('electron')") === -1 &&
  tmUi.indexOf('ipcRenderer.invoke') === -1
);
record(
  'template-matching-ui.js never persists results via localStorage',
  (function () {
    var stripped = tmUi
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);
record(
  'template-matching-ui.js never assigns innerHTML to user data',
  (function () {
    var lines = tmUi.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);

// 113. app-state.js declares the templateMatching slice and 6 mutators.
record(
  'app-state.js declares appState.templateMatching slice',
  /templateMatching\s*:\s*\{[\s\S]{0,400}lastResult/.test(appStateTxt)
);
[
  'function setTemplateMatchingInput',
  'function setTemplateMatchingResult',
  'function setTemplateMatchingRunning',
  'function setTemplateMatchingError',
  'function clearTemplateMatchingResult',
  'function resetTemplateMatchingState'
].forEach(function (needle) {
  record(
    'app-state.js declares ' + needle,
    appStateTxt.indexOf(needle) !== -1
  );
});

// 114. audit-events.js allowlist contains the five new template.match.* /
//     image.click.preview.* types.
[
  "'template.match.mock.requested'",
  "'template.match.mock.completed'",
  "'template.match.mock.failed'",
  "'template.match.mock.cleared'",
  "'image.click.preview.created'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 115. index.html wires the new tab + scripts in the right order.
record(
  'index.html has Template Matching tab button',
  /data-advanced-tab=['"]templateMatching['"]/.test(htmlTxt3)
);
record(
  'index.html has Template Matching section',
  /id=['"]advanced-tab-templateMatching['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-matching-mock.js',
  /src=['"]template-matching-mock\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-matching-ui.js',
  /src=['"]template-matching-ui\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-matching-mock.js BEFORE template-matching-ui.js',
  htmlTxt3.indexOf('template-matching-mock.js') !== -1 &&
  htmlTxt3.indexOf('template-matching-ui.js') !== -1 &&
  htmlTxt3.indexOf('template-matching-mock.js') < htmlTxt3.indexOf('template-matching-ui.js')
);
record(
  'index.html loads template-matching-ui.js BEFORE renderer.js',
  htmlTxt3.indexOf('template-matching-ui.js') !== -1 &&
  htmlTxt3.indexOf('renderer.js') !== -1 &&
  htmlTxt3.indexOf('template-matching-ui.js') < htmlTxt3.indexOf('renderer.js')
);

// 116. renderer.js diagnostics card + Copy diagnostics line.
record(
  'renderer.js wires Template Matching tab into setAdvancedTab switch',
  /case 'templateMatching'[\s\S]{0,80}renderTemplateMatchingTab/.test(rendTxt)
);
record(
  'renderer.js has Template matching (mock) diagnostics card',
  rendTxt.indexOf("t('templateMatchingDiagnostics')") !== -1
);
record(
  'renderer.js Copy diagnostics has Template matching mock line',
  // Step 28 introduced this line; Step 29 broadened the prefix to
  // cover both `mock` and `real-preview` modes. Either prefix is
  // accepted here; the safety stamps must still be present.
  /Template matching(?: mock)?: lastRunAt=[\s\S]{0,800}realMatching=false[\s\S]{0,200}realClick=false/.test(rendTxt)
);

// 117. README / PROJECT_CONTEXT mention step 28 / template matching mock.
record(
  'README or PROJECT_CONTEXT mentions step 28',
  /step\s*28|шаг\s*28|Step 28|Шаг 28/.test(readText('README.md')) ||
  /step\s*28|шаг\s*28|Step 28|Шаг 28/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions template matching mock / mock matching / Поиск шаблона',
  /template[\s-]matching\s*mock|mock\s*matching|Template Matching|Поиск\s*шаблона/i.test(readText('README.md')) ||
  /template[\s-]matching\s*mock|mock\s*matching|Template Matching|Поиск\s*шаблона/i.test(readText('PROJECT_CONTEXT.md'))
);

// 118. docs/TEMPLATE_MATCHING_MOCK.md asserts simulation-only / mock-only.
var tmDoc = readText('docs/TEMPLATE_MATCHING_MOCK.md');
record(
  'docs/TEMPLATE_MATCHING_MOCK.md asserts simulation-only',
  /simulation-only|simulation only/i.test(tmDoc)
);
record(
  'docs/TEMPLATE_MATCHING_MOCK.md asserts mock / dry-run only',
  /mock\s*\/\s*dry-?run|mock-only|mock\s+only|dry-?run\s+only/i.test(tmDoc)
);
record(
  'docs/TEMPLATE_MATCHING_MOCK.md asserts no real clicks / OCR / image matching at step 28',
  /(no real clicks|never\s+executes\s+a\s+real\s+click|no real cursor)/i.test(tmDoc) &&
  /(no ocr|no\s+OCR|never runs ocr)/i.test(tmDoc) &&
  /(no real image matching|no\s+real\s+image\s+matching|matcher.+(?:still\s+)?not\s+implemented)/i.test(tmDoc)
);
record(
  'docs/TEMPLATE_MATCHING_MOCK.md describes the mock result format',
  /boundingBox/i.test(tmDoc) && /targetPoint/i.test(tmDoc) && /confidence/i.test(tmDoc) && /usedRegion/i.test(tmDoc)
);
record(
  'docs/TEMPLATE_MATCHING_MOCK.md describes the image_click action preview',
  /image_click/i.test(tmDoc) && /preview/i.test(tmDoc)
);

// 119. SECURITY_CHECKLIST has a Template matching mock (Step 28) section.
var tmSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has Template matching mock (Step 28) section',
  /template\s+matching\s+mock\s*\(?step\s*28/i.test(tmSec) ||
  /## Template matching mock/i.test(tmSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts mock matching only / no OpenCV / no real clicks at step 28',
  /no real clicks/i.test(tmSec) &&
  /no\s+OpenCV/i.test(tmSec) &&
  (/mock matching only|mock\s*\/\s*dry-?run|mock-only/i.test(tmSec))
);

// 120. KNOWN_LIMITATIONS / SMOKE_TESTS / ACTION_SCHEMA reference step 28.
var klTxt28 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a Template matching is mock only (Step 28) section',
  /template\s+matching\s+is\s+mock\s+only/i.test(klTxt28) ||
  /##\s*12\.\s*Template matching/i.test(klTxt28)
);
var stTxt28 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 28 template matching mock block',
  /Step\s*28\s*[—-]\s*Template Matching Mock/i.test(stTxt28) ||
  /Step 28.*Template Matching Mock/i.test(stTxt28)
);
var asDoc28 = readText('docs/ACTION_SCHEMA.md');
record(
  'docs/ACTION_SCHEMA.md describes the image_click action preview (Step 28)',
  /image_click/i.test(asDoc28) && /preview/i.test(asDoc28) && /templateId/i.test(asDoc28)
);

// 121. CHANGELOG mentions Step 28 / Template Matching Mock.
var chTxt28 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 28 — Template Matching Mock',
  /Step\s*28.*Template Matching Mock/i.test(chTxt28) ||
  /Шаг\s*28.*Template Matching Mock/i.test(chTxt28) ||
  /Template Matching Mock/i.test(chTxt28)
);

// 122. package.json must STILL NOT pull in OCR / OpenCV / robotjs / nut.js
//     / image recognition / template matching / sharp / jimp / pixelmatch
//     / looks-same / opencv.js at step 28.
if (pkg) {
  var allDeps28 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step28Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps28, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 28',
    step28Forbidden.length === 0,
    step28Forbidden.length ? step28Forbidden.join(', ') : ''
  );
}

// 123. Source files don't import OCR / OpenCV / image-recognition / sharp at step 28.
var step28SourceFiles = [
  'main.js', 'preload.js',
  'src/template-matching-mock.js',
  'src/template-matching-ui.js'
];
var step28Imports = [
  'tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs',
  'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep28Imports = [];
step28SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step28Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep28Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 28 source files',
  foundStep28Imports.length === 0,
  foundStep28Imports.length ? foundStep28Imports.join(', ') : ''
);

// 124. main.js still does not flip the simulation-only safety flags at step 28.
record(
  'main.js still sets contextIsolation: true (re-checked at step 28)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 28)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 28 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
);

// 125. Step 28 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any template.match.* IPC handler at step 28',
  !/ipcMain\.handle\(['"]template\.match/.test(mainTxt)
);
record(
  'preload.js does not expose any template.match.* API at step 28',
  preloadTxt.indexOf("'template.match.") === -1 &&
  preloadTxt.indexOf('"template.match.') === -1
);

// --- Step 29: Real Template Matching Engine Foundation ---

// 126. New source / doc files exist.
record(
  'Step 29 file exists: src/template-matching-engine.js',
  fileExists('src/template-matching-engine.js')
);
record(
  'Step 29 doc exists: docs/TEMPLATE_MATCHING_ENGINE.md',
  fileExists('docs/TEMPLATE_MATCHING_ENGINE.md')
);

// 127. template-matching-engine.js declares the documented surface
//     and stays renderer-pure (no electron, no ipcRenderer, no fs).
var tmEngine = readText('src/template-matching-engine.js');
[
  'function loadImageFromDataUrl',
  'function imageToCanvas',
  'function getImageDataFromDataUrl',
  'function cropImageData',
  'function resizeImageDataIfNeeded',
  'function runTemplateMatch',
  'function findBestMatch',
  'function calculatePatchScore',
  'function createTemplateMatchResult',
  'function getTemplateMatchEngineStatus',
  'function estimateSearchCost'
].forEach(function (needle) {
  record(
    'template-matching-engine.js declares ' + needle,
    tmEngine.indexOf(needle) !== -1
  );
});
record(
  'template-matching-engine.js does not require electron or ipcRenderer',
  tmEngine.indexOf("require('electron')") === -1 &&
  tmEngine.indexOf("require('ipcRenderer')") === -1 &&
  tmEngine.indexOf('ipcRenderer.invoke') === -1
);
record(
  'template-matching-engine.js does not require fs',
  tmEngine.indexOf("require('fs')") === -1
);
record(
  'template-matching-engine.js never persists results via localStorage',
  (function () {
    var stripped = tmEngine
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .split('\n')
      .map(function (ln) { return ln.replace(/\/\/.*$/, ''); })
      .join('\n');
    return stripped.indexOf('localStorage') === -1;
  })()
);
record(
  'template-matching-engine.js stamps realClick=false / realMatching=false / opencvAvailable=false',
  /realClick\s*:\s*false/.test(tmEngine) &&
  /realMatching\s*:\s*false/.test(tmEngine) &&
  /opencvAvailable\s*:\s*false/.test(tmEngine)
);
record(
  'template-matching-engine.js does not import OCR / OpenCV / sharp / jimp at step 29',
  tmEngine.indexOf("require('tesseract.js')") === -1 &&
  tmEngine.indexOf("require('tesseract')") === -1 &&
  tmEngine.indexOf("require('opencv4nodejs')") === -1 &&
  tmEngine.indexOf("require('@u4/opencv4nodejs')") === -1 &&
  tmEngine.indexOf("require('opencv.js')") === -1 &&
  tmEngine.indexOf("require('opencv-js')") === -1 &&
  tmEngine.indexOf("require('sharp')") === -1 &&
  tmEngine.indexOf("require('jimp')") === -1 &&
  tmEngine.indexOf("require('pixelmatch')") === -1 &&
  tmEngine.indexOf("require('looks-same')") === -1
);

// 128. app-state.js declares the Step 29 mode/threshold/step
//     fields and the three setters.
record(
  'app-state.js declares mode/threshold/step on the templateMatching slice',
  /templateMatching\s*:\s*\{[\s\S]{0,800}mode\s*:\s*['"]mock['"][\s\S]{0,200}threshold[\s\S]{0,80}step/.test(appStateTxt)
);
[
  'function setTemplateMatchingMode',
  'function setTemplateMatchingThreshold',
  'function setTemplateMatchingStep'
].forEach(function (needle) {
  record(
    'app-state.js declares ' + needle,
    appStateTxt.indexOf(needle) !== -1
  );
});

// 129. audit-events.js allowlist contains the five new types.
[
  "'template.match.realPreview.requested'",
  "'template.match.realPreview.completed'",
  "'template.match.realPreview.failed'",
  "'template.match.lowConfidence'",
  "'template.match.engine.warning'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 130. index.html loads the engine before the matching UI.
record(
  'index.html loads template-matching-engine.js',
  /src=['"]template-matching-engine\.js['"]/.test(htmlTxt3)
);
record(
  'index.html loads template-matching-engine.js BEFORE template-matching-ui.js',
  htmlTxt3.indexOf('template-matching-engine.js') !== -1 &&
  htmlTxt3.indexOf('template-matching-ui.js') !== -1 &&
  htmlTxt3.indexOf('template-matching-engine.js') < htmlTxt3.indexOf('template-matching-ui.js')
);

// 131. template-matching-ui.js wires the new mode controls + the
//     real-preview run path.
var tmUiStep29 = readText('src/template-matching-ui.js');
[
  'function renderTemplateMatchingControls',
  'function runTemplateMatchingDispatch',
  'function runTemplateMatchingRealPreview'
].forEach(function (needle) {
  record(
    'template-matching-ui.js declares ' + needle,
    tmUiStep29.indexOf(needle) !== -1
  );
});
record(
  'template-matching-ui.js wires the run dispatcher',
  tmUiStep29.indexOf('runTemplateMatchingDispatch') !== -1 &&
  tmUiStep29.indexOf("runTemplateMatch(preview.imageDataUrl") !== -1
);

// 132. renderer.js diagnostics card surfaces the new fields.
record(
  'renderer.js diagnostics shows Match mode / Threshold / Step / Engine available',
  rendTxt.indexOf("t('matchMode')") !== -1 &&
  rendTxt.indexOf("t('matchThreshold')") !== -1 &&
  rendTxt.indexOf("t('step')") !== -1 &&
  rendTxt.indexOf("t('engineAvailable')") !== -1
);
record(
  'renderer.js Copy diagnostics line surfaces engineAvailable / mode / threshold / step',
  // Order-agnostic check — all four substrings must appear somewhere
  // on the new Step-29 line.
  /Template matching:[\s\S]{0,1500}engineAvailable=/.test(rendTxt) &&
  /Template matching:[\s\S]{0,1500}\bmode=/.test(rendTxt) &&
  /Template matching:[\s\S]{0,1500}\bthreshold=/.test(rendTxt) &&
  /Template matching:[\s\S]{0,1500}\bstep=/.test(rendTxt)
);

// 133. README / PROJECT_CONTEXT mention step 29 / real preview matching.
record(
  'README or PROJECT_CONTEXT mentions step 29',
  /step\s*29|шаг\s*29|Step 29|Шаг 29/.test(readText('README.md')) ||
  /step\s*29|шаг\s*29|Step 29|Шаг 29/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions real preview matching / template matching engine',
  /real[\s-]preview[\s-]matching|template[\s-]matching\s*engine|Real Template Matching|Real preview/i.test(readText('README.md')) ||
  /real[\s-]preview[\s-]matching|template[\s-]matching\s*engine|Real Template Matching|Real preview/i.test(readText('PROJECT_CONTEXT.md'))
);

// 134. docs/TEMPLATE_MATCHING_ENGINE.md asserts simulation-only / no real clicks.
var tmDoc29 = readText('docs/TEMPLATE_MATCHING_ENGINE.md');
record(
  'docs/TEMPLATE_MATCHING_ENGINE.md asserts simulation-only',
  /simulation-only|simulation only/i.test(tmDoc29)
);
record(
  'docs/TEMPLATE_MATCHING_ENGINE.md asserts no real clicks / no OCR / no OpenCV at step 29',
  /(no real clicks|never\s+executes\s+a\s+real\s+click|never\s+moves\s+the\s+cursor|does\s+not\s+click)/i.test(tmDoc29) &&
  /(no\s+OCR|no ocr)/i.test(tmDoc29) &&
  /(no\s+OpenCV|no opencv)/i.test(tmDoc29)
);
record(
  'docs/TEMPLATE_MATCHING_ENGINE.md describes the algorithm + threshold + step + region',
  /algorithm/i.test(tmDoc29) && /threshold/i.test(tmDoc29) && /step/i.test(tmDoc29) && /region/i.test(tmDoc29)
);

// 135. SECURITY_CHECKLIST has a Real preview matching engine
//     (Step 29) section.
var tmSec29 = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has Real preview matching engine (Step 29) section',
  /real\s+preview\s+matching\s+engine\s*\(?step\s*29/i.test(tmSec29) ||
  /## Real preview matching engine/i.test(tmSec29)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts matching analyses preview only / no real click / no OCR at step 29',
  /preview\s+only/i.test(tmSec29) &&
  /no real clicks?/i.test(tmSec29) &&
  /no\s+OCR/i.test(tmSec29)
);

// 136. KNOWN_LIMITATIONS / SMOKE_TESTS reference step 29.
var klTxt29 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a Real preview matching (Step 29) section',
  /##\s*13\.\s*Real preview matching|real preview matching has plain-JS limits/i.test(klTxt29)
);
var stTxt29 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 29 real template matching engine block',
  /Step\s*29\s*[—-]\s*Real Template Matching Engine/i.test(stTxt29) ||
  /Step 29.*Real Template Matching Engine/i.test(stTxt29)
);

// 137. CHANGELOG mentions Step 29 / Real Template Matching Engine.
var chTxt29 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 29 — Real Template Matching Engine',
  /Step\s*29.*Real Template Matching Engine/i.test(chTxt29) ||
  /Шаг\s*29.*Real Template Matching/i.test(chTxt29) ||
  /Real Template Matching Engine Foundation/i.test(chTxt29)
);

// 138. package.json must STILL NOT pull in OCR / OpenCV / robotjs /
//     nut.js / image-recognition / sharp / jimp / pixelmatch /
//     looks-same / opencv.js / opencv-js at step 29.
if (pkg) {
  var allDeps29 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step29Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps29, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 29',
    step29Forbidden.length === 0,
    step29Forbidden.length ? step29Forbidden.join(', ') : ''
  );
}

// 139. Source files don't import OCR / OpenCV / image-recognition at step 29.
var step29SourceFiles = [
  'main.js', 'preload.js',
  'src/template-matching-engine.js',
  'src/template-matching-ui.js',
  'src/template-matching-mock.js'
];
var step29Imports = [
  'tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs',
  'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep29Imports = [];
step29SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step29Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep29Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 29 source files',
  foundStep29Imports.length === 0,
  foundStep29Imports.length ? foundStep29Imports.join(', ') : ''
);

// 140. main.js still does not flip the simulation-only safety flags at step 29.
record(
  'main.js still sets contextIsolation: true (re-checked at step 29)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 29)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 29 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
);

// 141. Step 29 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any template.match.engine.* IPC handler at step 29',
  !/ipcMain\.handle\(['"]template\.match\.engine/.test(mainTxt)
);
record(
  'preload.js does not expose any template.match.engine.* API at step 29',
  preloadTxt.indexOf("'template.match.engine.") === -1 &&
  preloadTxt.indexOf('"template.match.engine.') === -1
);

// --- Step 30: Image Click Scenario Type Foundation ---

// 142. New doc file exists.
record(
  'Step 30 doc exists: docs/IMAGE_CLICK_SCENARIO.md',
  fileExists('docs/IMAGE_CLICK_SCENARIO.md')
);

// 143. scenario-manager.js declares the Step 30 surface.
var smTxt30 = readText('src/scenario-manager.js');
[
  'function validateImageClickScenario',
  'function createImageClickScenario',
  'function updateImageClickScenario',
  'function getScenariosByType'
].forEach(function (needle) {
  record(
    'scenario-manager.js declares ' + needle,
    smTxt30.indexOf(needle) !== -1
  );
});
record(
  'scenario-manager.js createScenario dispatches on image_click',
  /createScenario[\s\S]{0,400}createImageClickScenario\(input\)/.test(smTxt30)
);
record(
  'scenario-manager.js updateScenario dispatches on image_click',
  /updateScenario[\s\S]{0,800}updateImageClickScenario\(id, updates\)/.test(smTxt30)
);

// 144. action-pipeline.js validates and routes image_click.
var apTxt30 = readText('src/action-pipeline.js');
record(
  'action-pipeline.js validateAction accepts image_click',
  /action\.type\s*===\s*['"]image_click['"]/.test(apTxt30) &&
  /image_click requires templateId/.test(apTxt30)
);
record(
  'action-pipeline.js executeAction routes image_click through the simulate path',
  /action\.type\s*===\s*['"]image_click['"][\s\S]{0,400}executeSimulatedAction/.test(apTxt30)
);
record(
  'action-pipeline.js blocks realClick=true on image_click via validateAction',
  /image_click realClick=true is blocked/.test(apTxt30)
);
record(
  'action-pipeline.js emits action.imageClick.simulated and action.imageClick.realBlocked',
  apTxt30.indexOf("'action.imageClick.simulated'") !== -1 &&
  apTxt30.indexOf("'action.imageClick.realBlocked'") !== -1
);

// 145. safety-gates.js mirrors the image_click validation.
var sgTxt30 = readText('src/safety-gates.js');
record(
  'safety-gates.js validateActionSafety accepts image_click and refuses realClick=true',
  /action\.type\s*===\s*['"]image_click['"]/.test(sgTxt30) &&
  /image_click never carries realClick=true/.test(sgTxt30)
);

// 146. click-engine.js gains the image_click branch.
var ceTxt30 = readText('src/click-engine.js');
record(
  'click-engine.js declares runImageClickScenario',
  ceTxt30.indexOf('function runImageClickScenario') !== -1
);
record(
  'click-engine.js runScenario dispatches on scenario.type === \'image_click\'',
  /scenario\.type\s*===\s*['"]image_click['"][\s\S]{0,200}runImageClickScenario/.test(ceTxt30)
);
record(
  'click-engine.js validateRunnableScenario delegates image_click validation',
  /image_click[\s\S]{0,800}validateImageClickScenario/.test(ceTxt30)
);

// 147. audit-events.js allowlist contains the nine new types.
[
  "'scenario.imageClick.started'",
  "'scenario.imageClick.stopped'",
  "'scenario.imageClick.match.started'",
  "'scenario.imageClick.match.completed'",
  "'scenario.imageClick.noMatch'",
  "'scenario.imageClick.simulated'",
  "'scenario.imageClick.failed'",
  "'action.imageClick.simulated'",
  "'action.imageClick.realBlocked'"
].forEach(function (needle) {
  record(
    'audit allowlist includes ' + needle.replace(/'/g, ''),
    auditTxt.indexOf(needle) !== -1
  );
});

// 148. index.html exposes the new form fields.
record(
  'index.html has Scenario type selector',
  /id=['"]input-scenario-type['"]/.test(htmlTxt3)
);
record(
  'index.html has image_click form section',
  /id=['"]form-section-image-click['"]/.test(htmlTxt3)
);
[
  'input-template-id',
  'input-image-threshold',
  'input-image-step',
  'input-image-timeout',
  'input-image-interval',
  'input-image-repeat',
  'btn-image-click-use-region',
  'btn-image-click-clear-region'
].forEach(function (idValue) {
  record(
    'index.html has ' + idValue,
    new RegExp("id=['\"]" + idValue + "['\"]").test(htmlTxt3)
  );
});

// 149. renderer.js diagnostics card + Copy diagnostics line +
//     formatLastAction for image_click.
record(
  'renderer.js has image_click scenario diagnostics card',
  rendTxt.indexOf("t('imageClickScenario')") !== -1
);
record(
  'renderer.js Copy diagnostics has Image click scenario line',
  /Image click scenario:[\s\S]{0,800}imageClickSimulationOnly=true/.test(rendTxt) &&
  /realImageClickEnabled=false/.test(rendTxt)
);
record(
  'renderer.js declares formatLastAction handling image_click',
  rendTxt.indexOf('function formatLastAction') !== -1 &&
  /formatLastAction[\s\S]{0,400}image_click/.test(rendTxt)
);

// 150. README / PROJECT_CONTEXT mention step 30 / image_click.
record(
  'README or PROJECT_CONTEXT mentions step 30',
  /step\s*30|шаг\s*30|Step 30|Шаг 30/.test(readText('README.md')) ||
  /step\s*30|шаг\s*30|Step 30|Шаг 30/.test(readText('PROJECT_CONTEXT.md'))
);
record(
  'README or PROJECT_CONTEXT mentions image_click / image click / Клик по изображению',
  /image[\s_-]?click|image\s+click|Клик по изображению|Image Click/i.test(readText('README.md')) ||
  /image[\s_-]?click|image\s+click|Клик по изображению|Image Click/i.test(readText('PROJECT_CONTEXT.md'))
);

// 151. docs/IMAGE_CLICK_SCENARIO.md asserts simulation-only and
//     no real click / no OCR / no OpenCV at step 30.
var icDoc = readText('docs/IMAGE_CLICK_SCENARIO.md');
record(
  'docs/IMAGE_CLICK_SCENARIO.md asserts simulation-only',
  /simulation-only|simulation only/i.test(icDoc)
);
record(
  'docs/IMAGE_CLICK_SCENARIO.md asserts no real clicks at step 30',
  /(does\s+not\s+click|never\s+performs\s+a\s+real\s+click|never\s+executes\s+a\s+real\s+click|no real clicks?|never\s+moves\s+the\s+cursor|never performs a real click)/i.test(icDoc)
);
record(
  'docs/IMAGE_CLICK_SCENARIO.md asserts no OCR at step 30',
  /no\s+OCR|No OCR/.test(icDoc)
);
record(
  'docs/IMAGE_CLICK_SCENARIO.md describes the scenario format',
  /image_click/i.test(icDoc) && /templateId/.test(icDoc) && /threshold/.test(icDoc) && /step/i.test(icDoc)
);

// 152. SECURITY_CHECKLIST has an image_click scenario (Step 30) section.
var icSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has image_click scenario (Step 30) section',
  /image_click\s+scenario\s*\(?step\s*30/i.test(icSec) ||
  /## image_click scenario/i.test(icSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts image_click simulation only / no real click',
  /no real clicks?/i.test(icSec) &&
  /(simulation\s+only|simulation-only)/i.test(icSec) &&
  /realClick:\s*false/i.test(icSec)
);

// 153. KNOWN_LIMITATIONS / SMOKE_TESTS reference step 30.
var klTxt30 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has an image_click section (Step 30)',
  /##\s*14\.\s*image_click does not perform a real click/i.test(klTxt30) ||
  /image_click does not perform a real click/i.test(klTxt30)
);
var stTxt30 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 30 image_click block',
  /Step\s*30\s*[—-]\s*Image Click Scenario/i.test(stTxt30) ||
  /Step 30.*Image Click Scenario/i.test(stTxt30)
);

// 154. CHANGELOG mentions Step 30.
var chTxt30 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 30 — Image Click Scenario Type Foundation',
  /Step\s*30.*Image Click Scenario Type Foundation/i.test(chTxt30) ||
  /Шаг\s*30.*Image Click Scenario/i.test(chTxt30) ||
  /Image Click Scenario Type Foundation/i.test(chTxt30)
);

// 155. package.json STILL declares no OCR / OpenCV / image-matching
//     / real-input modules at step 30.
if (pkg) {
  var allDeps30 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step30Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps30, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 30',
    step30Forbidden.length === 0,
    step30Forbidden.length ? step30Forbidden.join(', ') : ''
  );
}

// 156. Source files don't import OCR / OpenCV / image-recognition at step 30.
var step30SourceFiles = [
  'main.js', 'preload.js',
  'src/scenario-manager.js',
  'src/action-pipeline.js',
  'src/click-engine.js',
  'src/safety-gates.js'
];
var step30Imports = [
  'tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs',
  'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep30Imports = [];
step30SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step30Imports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep30Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 30 source files',
  foundStep30Imports.length === 0,
  foundStep30Imports.length ? foundStep30Imports.join(', ') : ''
);

// 157. Step 30 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any scenario.imageClick.* IPC handler at step 30',
  !/ipcMain\.handle\(['"]scenario\.imageClick/.test(mainTxt)
);
record(
  'preload.js does not expose any scenario.imageClick.* API at step 30',
  preloadTxt.indexOf("'scenario.imageClick.") === -1 &&
  preloadTxt.indexOf('"scenario.imageClick.') === -1
);

// 158. main.js still sets the simulation-only safety flags at step 30.
record(
  'main.js still sets contextIsolation: true (re-checked at step 30)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 30)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 30 (no unsafe-inline / unsafe-eval)',
  htmlTxt3.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt3.indexOf('unsafe-inline') === -1 &&
  htmlTxt3.indexOf('unsafe-eval') === -1
);


// =====================================================================
// Step 31 — Image Click Scenario UX Polish + Visual Test Tools
// =====================================================================

// 159. New source files exist.
record(
  'src/image-click-test-tools.js exists',
  fileExists('src/image-click-test-tools.js')
);
record(
  'src/image-click-test-ui.js exists',
  fileExists('src/image-click-test-ui.js')
);

// 160. New documentation exists.
record(
  'docs/IMAGE_CLICK_TEST_TOOLS.md exists',
  fileExists('docs/IMAGE_CLICK_TEST_TOOLS.md')
);

// 161. image-click-test-tools.js declares the documented function names.
var ictTools = readText('src/image-click-test-tools.js');
[
  'function buildImageClickTestInput',
  'function validateImageClickTestInput',
  'function runImageClickTest',
  'function createImageClickDebugResult',
  'function clearImageClickTestResult',
  'function getImageClickTestStatus'
].forEach(function (sig) {
  record(
    'image-click-test-tools.js declares ' + sig,
    ictTools.indexOf(sig) !== -1
  );
});

// 162. image-click-test-ui.js declares the documented function names.
var ictUi = readText('src/image-click-test-ui.js');
[
  'function initImageClickTestUi',
  'function renderImageClickTemplatePreview',
  'function renderImageClickScreenPreviewStatus',
  'function renderImageClickRegionSummary',
  'function runImageClickTestFromForm',
  'function renderImageClickTestResult',
  'function clearImageClickTestResultUi',
  'function renderImageClickDebugOverlay',
  'function renderImageClickActionPreview'
].forEach(function (sig) {
  record(
    'image-click-test-ui.js declares ' + sig,
    ictUi.indexOf(sig) !== -1
  );
});

// 163. Both Step-31 modules are pure-renderer code: no `require()`,
//      no electron / ipcRenderer / fs / localStorage usage.
//
// We strip comments before scanning so doc strings that LITERALLY
// describe the invariants (e.g. "this module never uses
// `ipcRenderer`") don't trigger false positives.
function _stripJsComments(src) {
  // Remove /* ... */ block comments, and // ... line comments.
  // Order matters: strip block first.
  var noBlock = src.replace(/\/\*[\s\S]*?\*\//g, '');
  return noBlock.replace(/(^|[^:])\/\/[^\n\r]*/g, '$1');
}
[
  ['src/image-click-test-tools.js', _stripJsComments(ictTools)],
  ['src/image-click-test-ui.js',    _stripJsComments(ictUi)]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  record(
    rel + ' does not require() anything',
    !/\brequire\s*\(/.test(txt)
  );
  record(
    rel + ' does not import electron',
    txt.indexOf("require('electron')") === -1 &&
    txt.indexOf('require("electron")') === -1 &&
    txt.indexOf("from 'electron'") === -1
  );
  record(
    rel + ' does not use ipcRenderer',
    txt.indexOf('ipcRenderer') === -1
  );
  record(
    rel + ' does not use fs',
    !/\brequire\s*\(\s*['"]fs['"]\s*\)/.test(txt)
  );
  record(
    rel + ' does not use localStorage',
    txt.indexOf('localStorage') === -1
  );
});

// 164. Both Step-31 modules contain no innerHTML on user data.
//      Allowed: ` = ''` and ` = "";` only (clearing a container).
[
  ['src/image-click-test-tools.js', ictTools],
  ['src/image-click-test-ui.js',    ictUi]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  // Find every "innerHTML" occurrence and ensure each is followed
  // by `= ''` or `= ""`.
  var lines = txt.split(/\r?\n/);
  var bad = [];
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (ln.indexOf('innerHTML') === -1) continue;
    // strip comments
    var cleaned = ln.replace(/\/\/.*$/, '');
    if (cleaned.indexOf('innerHTML') === -1) continue;
    // accept `<thing>.innerHTML = ''` or `= ""`
    if (/innerHTML\s*=\s*(''|"")\s*;?\s*$/.test(cleaned)) continue;
    bad.push((i + 1) + ': ' + ln.trim());
  }
  record(
    rel + ' uses innerHTML only as `= \'\'` (container clear)',
    bad.length === 0,
    bad.length ? bad.slice(0, 3).join(' | ') : ''
  );
});

// 165. Both Step-31 modules render image previews via <img>.src only
//      (no innerHTML for image data). They reference `<img>` and
//      `.src = ` for the preview.
record(
  'image-click-test-ui.js renders image previews via <img>.src only',
  ictUi.indexOf("createElement('img')") !== -1 &&
  /img\.src\s*=/.test(ictUi)
);

// 166. action preview is rendered via <pre>.textContent.
record(
  'image-click-test-ui.js renders action preview via <pre>.textContent',
  /createElement\(['"]pre['"]\)/.test(ictUi) &&
  /\.textContent\s*=\s*JSON\.stringify/.test(ictUi)
);

// 167. The Test Match flow does not call runScenario / runImageClickScenario / executeAction.
//      Use comment-stripped text so doc strings can explain the
//      invariants without tripping these scans.
var ictToolsClean = _stripJsComments(ictTools);
var ictUiClean    = _stripJsComments(ictUi);
record(
  'image-click-test-tools.js does not call runScenario',
  ictToolsClean.indexOf('runScenario(') === -1
);
record(
  'image-click-test-tools.js does not call runImageClickScenario',
  ictToolsClean.indexOf('runImageClickScenario(') === -1
);
record(
  'image-click-test-tools.js does not call executeAction with executionMode: "real"',
  !/executeAction\s*\([^)]*executionMode:\s*['"]real['"]/.test(ictToolsClean)
);
record(
  'image-click-test-ui.js does not call runScenario',
  ictUiClean.indexOf('runScenario(') === -1
);
record(
  'image-click-test-ui.js does not call runImageClickScenario',
  ictUiClean.indexOf('runImageClickScenario(') === -1
);

// 168. Both modules stamp realClick: false / realMatching: false.
record(
  'image-click-test-tools.js stamps realClick: false',
  /realClick:\s*false/.test(ictTools)
);
record(
  'image-click-test-tools.js stamps realMatching: false',
  /realMatching:\s*false/.test(ictTools)
);

// 169. Audit allowlist contains the 5 new types.
var auditTxt31 = readText('src/audit-events.js');
[
  'imageClick.test.started',
  'imageClick.test.completed',
  'imageClick.test.failed',
  'imageClick.test.lowConfidence',
  'imageClick.test.cleared'
].forEach(function (eventType) {
  record(
    'audit-events.js allowlists ' + eventType,
    auditTxt31.indexOf("'" + eventType + "'") !== -1
  );
});

// 170. i18n.js declares the new keys in BOTH locales.
var i18nTxt31 = readText('src/i18n.js');
var step31I18nKeys = [
  'testMatch',
  'runTestMatch',
  'testMatchResult',
  'imageClickTestTools',
  'templatePreview',
  'screenPreviewStatus',
  'regionSummary',
  'noTemplateSelected',
  'captureScreenPreviewFirst',
  'invalidRegion',
  'templateLargerThanSearchArea',
  'matchBelowThreshold',
  'matchingTookTooLong',
  'matchingEngineUnavailable',
  'openTemplates',
  'openScreenCapture',
  'openRegionSelector',
  'testMatched',
  'testNoMatch',
  'testFailed',
  'debugOverlay',
  'scenarioDraft',
  'testDoesNotClick',
  'imageClickTestStarted',
  'imageClickTestCompleted',
  'imageClickTestLowConfidence',
  'imageClickTestCleared'
];
step31I18nKeys.forEach(function (key) {
  // Each key must appear at least twice (once per locale block).
  var pattern = new RegExp('\\b' + key + '\\s*:', 'g');
  var matches = i18nTxt31.match(pattern) || [];
  record(
    'i18n.js defines key "' + key + '" in both RU and EN',
    matches.length >= 2,
    matches.length === 0 ? 'missing entirely' : 'only ' + matches.length + ' occurrence(s)'
  );
});

// 171. index.html loads the new scripts in the correct order:
//      template-matching-engine.js → image-click-test-tools.js →
//      image-click-test-ui.js → renderer.js
var htmlTxt31 = readText('src/index.html');
record(
  'index.html loads image-click-test-tools.js',
  /<script\s+src=["']image-click-test-tools\.js["']/.test(htmlTxt31)
);
record(
  'index.html loads image-click-test-ui.js',
  /<script\s+src=["']image-click-test-ui\.js["']/.test(htmlTxt31)
);
(function () {
  var enginePos = htmlTxt31.indexOf('template-matching-engine.js');
  var toolsPos  = htmlTxt31.indexOf('image-click-test-tools.js');
  var uiPos     = htmlTxt31.indexOf('image-click-test-ui.js');
  var rendererPos = htmlTxt31.indexOf('renderer.js');
  record(
    'index.html loads template-matching-engine.js before image-click-test-tools.js',
    enginePos !== -1 && toolsPos !== -1 && enginePos < toolsPos
  );
  record(
    'index.html loads image-click-test-tools.js before image-click-test-ui.js',
    toolsPos !== -1 && uiPos !== -1 && toolsPos < uiPos
  );
  record(
    'index.html loads image-click-test-ui.js before renderer.js',
    uiPos !== -1 && rendererPos !== -1 && uiPos < rendererPos
  );
})();

// 172. README and PROJECT_CONTEXT mention Step 31 / Test Match.
var readmeTxt31      = readText('README.md');
var contextTxt31     = readText('PROJECT_CONTEXT.md');
record(
  'README.md mentions Test Match or image click test',
  /Test Match|Image click test|image_click test|image click test tools/i.test(readmeTxt31)
);
record(
  'PROJECT_CONTEXT.md mentions Test Match or image click test',
  /Test Match|Image click test|image_click test|image click test tools/i.test(contextTxt31)
);
record(
  'README or PROJECT_CONTEXT mentions step 31',
  /шаг\s*31|step\s*31/i.test(readmeTxt31 + '\n' + contextTxt31)
);

// 173. docs/IMAGE_CLICK_TEST_TOOLS.md asserts simulation-only +
//      "does not click".
var ictDoc = readText('docs/IMAGE_CLICK_TEST_TOOLS.md');
record(
  'docs/IMAGE_CLICK_TEST_TOOLS.md asserts simulation-only',
  /simulation-only|simulation only/i.test(ictDoc)
);
record(
  'docs/IMAGE_CLICK_TEST_TOOLS.md asserts Test Match does not click',
  /(does\s+not\s+click|never\s+clicks|never moves the cursor|never executes the scenario)/i.test(ictDoc)
);
record(
  'docs/IMAGE_CLICK_TEST_TOOLS.md describes Test Match flow / debug result',
  /Test Match flow/i.test(ictDoc) && /debug result/i.test(ictDoc)
);
record(
  'docs/IMAGE_CLICK_TEST_TOOLS.md asserts no real click / no OCR',
  /no real clicks?|no OCR|never persists/i.test(ictDoc)
);

// 174. SECURITY_CHECKLIST has an "image_click test tools (Step 31)" section.
var ictSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has image_click test tools (Step 31) section',
  /image_click\s+test\s+tools\s*\(?step\s*31/i.test(ictSec) ||
  /## image_click test tools/i.test(ictSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts Test Match does not click / preview only',
  /Test Match does not click/i.test(ictSec) &&
  /preview only/i.test(ictSec)
);

// 175. SMOKE_TESTS doc has a Step 31 image_click test tools block.
var stTxt31 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 31 image_click UX / Test Match block',
  /Step\s*31\s*[—-]\s*Image Click Scenario UX/i.test(stTxt31) ||
  /Step 31.*Test Match/i.test(stTxt31)
);

// 176. CHANGELOG mentions Step 31.
var chTxt31 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 31 — Image Click Scenario UX Polish + Visual Test Tools',
  /Step\s*31.*Image Click Scenario UX Polish/i.test(chTxt31) ||
  /Шаг\s*31.*Image Click Scenario UX/i.test(chTxt31) ||
  /Image Click Scenario UX Polish/i.test(chTxt31)
);

// 177. package.json STILL declares no OCR / OpenCV / image-matching
//      / real-input modules at step 31.
if (pkg) {
  var allDeps31 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step31Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps31, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 31',
    step31Forbidden.length === 0,
    step31Forbidden.length ? step31Forbidden.join(', ') : ''
  );
}

// 178. Step-31 source files don't import OCR / OpenCV / real-input.
var step31SourceFiles = [
  'main.js', 'preload.js',
  'src/image-click-test-tools.js',
  'src/image-click-test-ui.js'
];
var step31ForbiddenImports = [
  'tesseract.js', 'tesseract', 'opencv4nodejs', '@u4/opencv4nodejs',
  'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep31Imports = [];
step31SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step31ForbiddenImports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep31Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 31 source files',
  foundStep31Imports.length === 0,
  foundStep31Imports.length ? foundStep31Imports.join(', ') : ''
);

// 179. Step 31 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any imageClick.test.* IPC handler at step 31',
  !/ipcMain\.handle\(['"]imageClick\.test/.test(mainTxt) &&
  !/ipcMain\.on\(['"]imageClick\.test/.test(mainTxt)
);
record(
  'preload.js does not expose any imageClick.test.* API at step 31',
  preloadTxt.indexOf("'imageClick.test.") === -1 &&
  preloadTxt.indexOf('"imageClick.test.') === -1 &&
  preloadTxt.indexOf('imageClickTest') === -1
);

// 180. main.js / index.html / preload still hold the safety flags.
record(
  'main.js still sets contextIsolation: true (re-checked at step 31)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 31)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 31 (no unsafe-inline / unsafe-eval)',
  htmlTxt31.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt31.indexOf('unsafe-inline') === -1 &&
  htmlTxt31.indexOf('unsafe-eval') === -1
);

// 181. renderer.js wires initImageClickTestUi() and the diagnostics line.
var rendererTxt31 = readText('src/renderer.js');
record(
  'renderer.js calls initImageClickTestUi()',
  rendererTxt31.indexOf('initImageClickTestUi(') !== -1
);
record(
  'renderer.js Copy diagnostics has an `Image click test:` line',
  /Image click test:/.test(rendererTxt31) &&
  /testDoesNotClick=true/.test(rendererTxt31) &&
  /realMatching=false/.test(rendererTxt31) &&
  /realClick=false/.test(rendererTxt31)
);
record(
  'renderer.js diagnostics card uses imageClickTestDiagnostics i18n key',
  rendererTxt31.indexOf("t('imageClickTestDiagnostics')") !== -1
);

// 182. The test panel HTML id is referenced by the UI module.
record(
  'image-click-test-ui.js references #form-section-image-click container',
  ictUi.indexOf("'form-section-image-click'") !== -1 ||
  ictUi.indexOf('"form-section-image-click"') !== -1
);
record(
  'image-click-test-ui.js builds the image-click-test-panel container',
  ictUi.indexOf("'image-click-test-panel'") !== -1 ||
  ictUi.indexOf('"image-click-test-panel"') !== -1
);
// =====================================================================
// Step 32 — OCR Foundation (mock only)
// =====================================================================

// 183. New source files exist.
record(
  'src/ocr-mock-engine.js exists',
  fileExists('src/ocr-mock-engine.js')
);
record(
  'src/ocr-ui.js exists',
  fileExists('src/ocr-ui.js')
);

// 184. New documentation exists.
record(
  'docs/OCR_FOUNDATION.md exists',
  fileExists('docs/OCR_FOUNDATION.md')
);

// 185. ocr-mock-engine.js declares the documented function names.
var ocrEngine = readText('src/ocr-mock-engine.js');
[
  'function createOcrInput',
  'function validateOcrInput',
  'function runMockOcr',
  'function createMockOcrBlocks',
  'function findTextInOcrBlocks',
  'function createOcrResult',
  'function createTextClickActionPreview',
  'function getOcrMockStatus',
  'function clearOcrMockResult'
].forEach(function (sig) {
  record(
    'ocr-mock-engine.js declares ' + sig,
    ocrEngine.indexOf(sig) !== -1
  );
});

// 186. ocr-ui.js declares the documented function names.
var ocrUiTxt = readText('src/ocr-ui.js');
[
  'function renderOcrTab',
  'function renderOcrScreenPreviewStatus',
  'function renderOcrSettings',
  'function renderOcrRegionSummary',
  'function runMockOcrFromUi',
  'function clearOcrResultUi',
  'function renderOcrResult',
  'function renderOcrBlocks',
  'function renderOcrOverlay',
  'function renderTextClickActionPreview',
  'function buildOcrInputFromState'
].forEach(function (sig) {
  record(
    'ocr-ui.js declares ' + sig,
    ocrUiTxt.indexOf(sig) !== -1
  );
});

// 187. Both Step-32 modules are pure-renderer code: no `require()`,
//      no electron / ipcRenderer / fs / localStorage usage.
//      We use `_stripJsComments` (defined in the Step 31 block
//      above) so doc strings that LITERALLY describe the
//      invariants don't trigger false positives.
[
  ['src/ocr-mock-engine.js', _stripJsComments(ocrEngine)],
  ['src/ocr-ui.js',          _stripJsComments(ocrUiTxt)]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  record(
    rel + ' does not require() anything',
    !/\brequire\s*\(/.test(txt)
  );
  record(
    rel + ' does not import electron',
    txt.indexOf("require('electron')") === -1 &&
    txt.indexOf('require("electron")') === -1 &&
    txt.indexOf("from 'electron'") === -1
  );
  record(
    rel + ' does not use ipcRenderer',
    txt.indexOf('ipcRenderer') === -1
  );
  record(
    rel + ' does not use fs',
    !/\brequire\s*\(\s*['"]fs['"]\s*\)/.test(txt)
  );
  record(
    rel + ' does not use localStorage',
    txt.indexOf('localStorage') === -1
  );
});

// 188. Both Step-32 modules contain no innerHTML on user data.
[
  ['src/ocr-mock-engine.js', ocrEngine],
  ['src/ocr-ui.js',          ocrUiTxt]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  var lines = txt.split(/\r?\n/);
  var bad = [];
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (ln.indexOf('innerHTML') === -1) continue;
    var cleaned = ln.replace(/\/\/.*$/, '');
    if (cleaned.indexOf('innerHTML') === -1) continue;
    if (/innerHTML\s*=\s*(''|"")\s*;?\s*$/.test(cleaned)) continue;
    bad.push((i + 1) + ': ' + ln.trim());
  }
  record(
    rel + ' uses innerHTML only as `= \'\'` (container clear)',
    bad.length === 0,
    bad.length ? bad.slice(0, 3).join(' | ') : ''
  );
});

// 189. The action preview is rendered through <pre>.textContent.
record(
  'ocr-ui.js renders text_click action preview via <pre>.textContent',
  /createElement\(['"]pre['"]\)/.test(ocrUiTxt) &&
  /\.textContent\s*=\s*JSON\.stringify/.test(ocrUiTxt)
);

// 190. The OCR mock does not call runScenario / runImageClickScenario / executeAction.
var ocrEngineClean = _stripJsComments(ocrEngine);
var ocrUiClean     = _stripJsComments(ocrUiTxt);
record(
  'ocr-mock-engine.js does not call runScenario',
  ocrEngineClean.indexOf('runScenario(') === -1
);
record(
  'ocr-mock-engine.js does not call runImageClickScenario',
  ocrEngineClean.indexOf('runImageClickScenario(') === -1
);
record(
  'ocr-mock-engine.js does not call executeAction with executionMode: "real"',
  !/executeAction\s*\([^)]*executionMode:\s*['"]real['"]/.test(ocrEngineClean)
);
record(
  'ocr-ui.js does not call runScenario',
  ocrUiClean.indexOf('runScenario(') === -1
);
record(
  'ocr-ui.js does not call runImageClickScenario',
  ocrUiClean.indexOf('runImageClickScenario(') === -1
);

// 191. Both modules stamp realClick: false / realOcr: false.
record(
  'ocr-mock-engine.js stamps realClick: false',
  /realClick:\s*false/.test(ocrEngine)
);
record(
  'ocr-mock-engine.js stamps realOcr: false',
  /realOcr:\s*false/.test(ocrEngine)
);

// 192. Audit allowlist contains the 5 new types.
var auditTxt32 = readText('src/audit-events.js');
[
  'ocr.mock.requested',
  'ocr.mock.completed',
  'ocr.mock.failed',
  'ocr.mock.cleared',
  'text.click.preview.created'
].forEach(function (eventType) {
  record(
    'audit-events.js allowlists ' + eventType,
    auditTxt32.indexOf("'" + eventType + "'") !== -1
  );
});

// 193. i18n.js declares the key set in BOTH locales.
var i18nTxt32 = readText('src/i18n.js');
var step32I18nKeys = [
  'ocr',
  'mockOcr',
  'runMockOcr',
  'clearOcrResult',
  'ocrResult',
  'realOcrNotConnected',
  'targetText',
  'targetTextPlaceholder',
  'ocrLanguage',
  'matchMode',
  'contains',
  'exact',
  'caseSensitive',
  'useSelectedRegion',
  'recognizedBlocks',
  'matchedText',
  'textClickPreview',
  'realOcrDisabled',
  'textRecognitionNotImplemented',
  'ocrMockNotice',
  'noOcrResult',
  'ocrMatched',
  'ocrNoMatch',
  'ocrConfidence',
  'ocrBlocks',
  'ocrDiagnostics',
  'realOcrAvailable',
  'ocrMockAvailable',
  'targetTextRequired'
];
step32I18nKeys.forEach(function (key) {
  var pattern = new RegExp('\\b' + key + '\\s*:', 'g');
  var matches = i18nTxt32.match(pattern) || [];
  record(
    'i18n.js defines key "' + key + '" in both RU and EN',
    matches.length >= 2,
    matches.length === 0 ? 'missing entirely' : 'only ' + matches.length + ' occurrence(s)'
  );
});

// 194. index.html loads the new scripts AFTER ocr-mock-engine.js
//      and BEFORE renderer.js, and registers the new tab.
var htmlTxt32 = readText('src/index.html');
record(
  'index.html loads ocr-mock-engine.js',
  /<script\s+src=["']ocr-mock-engine\.js["']/.test(htmlTxt32)
);
record(
  'index.html loads ocr-ui.js',
  /<script\s+src=["']ocr-ui\.js["']/.test(htmlTxt32)
);
(function () {
  var enginePos   = htmlTxt32.indexOf('ocr-mock-engine.js');
  var uiPos       = htmlTxt32.indexOf('ocr-ui.js');
  var rendererPos = htmlTxt32.indexOf('renderer.js');
  record(
    'index.html loads ocr-mock-engine.js before ocr-ui.js',
    enginePos !== -1 && uiPos !== -1 && enginePos < uiPos
  );
  record(
    'index.html loads ocr-ui.js before renderer.js',
    uiPos !== -1 && rendererPos !== -1 && uiPos < rendererPos
  );
})();
record(
  'index.html has an OCR advanced tab button',
  /data-advanced-tab=['"]ocr['"]/.test(htmlTxt32)
);
record(
  'index.html has the OCR advanced section',
  htmlTxt32.indexOf('id="advanced-tab-ocr"') !== -1
);

// 195. README and PROJECT_CONTEXT mention OCR Foundation / mock OCR.
var readmeTxt32  = readText('README.md');
var contextTxt32 = readText('PROJECT_CONTEXT.md');
record(
  'README.md mentions OCR Foundation or mock OCR',
  /OCR Foundation|mock OCR|Mock OCR|OCR mock/i.test(readmeTxt32)
);
record(
  'PROJECT_CONTEXT.md mentions OCR Foundation or mock OCR',
  /OCR Foundation|mock OCR|Mock OCR|OCR mock/i.test(contextTxt32)
);
record(
  'README or PROJECT_CONTEXT mentions step 32',
  /шаг\s*32|step\s*32/i.test(readmeTxt32 + '\n' + contextTxt32)
);

// 196. docs/OCR_FOUNDATION.md asserts mock-only / no Tesseract /
//      no real click.
var ocrDoc = readText('docs/OCR_FOUNDATION.md');
record(
  'docs/OCR_FOUNDATION.md asserts mock only / simulation-only',
  /mock only|mock-only|simulation-only/i.test(ocrDoc)
);
record(
  'docs/OCR_FOUNDATION.md asserts no Tesseract',
  /no Tesseract|Tesseract.*not connected|tesseract\.js/i.test(ocrDoc)
);
record(
  'docs/OCR_FOUNDATION.md asserts no real click',
  /(does\s+not\s+click|never\s+clicks|never moves the cursor|no real click)/i.test(ocrDoc)
);
record(
  'docs/OCR_FOUNDATION.md describes Mock OCR flow / result format',
  /Mock OCR flow/i.test(ocrDoc) && /Result format/i.test(ocrDoc)
);

// 197. SECURITY_CHECKLIST has an "OCR Foundation (Step 32)" section.
var ocrSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has OCR Foundation (Step 32) section',
  /OCR\s+Foundation\s*\(?step\s*32/i.test(ocrSec) ||
  /## OCR Foundation/i.test(ocrSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts OCR mock only / no Tesseract',
  /OCR mock only/i.test(ocrSec) &&
  /No Tesseract/i.test(ocrSec)
);

// 198. SMOKE_TESTS doc has a Step 32 OCR Foundation block.
var stTxt32 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 32 OCR Foundation block',
  /Step\s*32\s*[—-]\s*OCR Foundation/i.test(stTxt32) ||
  /Step 32.*OCR Foundation/i.test(stTxt32)
);

// 199. KNOWN_LIMITATIONS has an OCR section (Step 32).
var klTxt32 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has an OCR section (Step 32)',
  /OCR is mock only|##\s*15\.\s*OCR is mock only/i.test(klTxt32)
);

// 200. CHANGELOG mentions Step 32.
var chTxt32 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 32 — OCR Foundation',
  /Step\s*32.*OCR Foundation/i.test(chTxt32) ||
  /Шаг\s*32.*OCR Foundation/i.test(chTxt32) ||
  /OCR Foundation/i.test(chTxt32)
);

// 201. package.json STILL declares no OCR / OpenCV / image-matching
//      / real-input modules at step 32.
if (pkg) {
  var allDeps32 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step32Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps32, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 32',
    step32Forbidden.length === 0,
    step32Forbidden.length ? step32Forbidden.join(', ') : ''
  );
}

// 202. Step-32 source files don't import OCR / OpenCV / real-input.
var step32SourceFiles = [
  'main.js', 'preload.js',
  'src/ocr-mock-engine.js',
  'src/ocr-ui.js'
];
var step32ForbiddenImports = [
  'tesseract.js', 'tesseract', 'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep32Imports = [];
step32SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step32ForbiddenImports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep32Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 32 source files',
  foundStep32Imports.length === 0,
  foundStep32Imports.length ? foundStep32Imports.join(', ') : ''
);

// 203. Step 32 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any ocr.* IPC handler at step 32',
  !/ipcMain\.handle\(['"]ocr\./.test(mainTxt) &&
  !/ipcMain\.on\(['"]ocr\./.test(mainTxt)
);
record(
  'preload.js does not expose any ocr.* API at step 32',
  preloadTxt.indexOf("'ocr.") === -1 &&
  preloadTxt.indexOf('"ocr.') === -1 &&
  preloadTxt.indexOf('ocrMock') === -1 &&
  preloadTxt.indexOf('runOcr') === -1
);

// 204. The OCR mock does NOT register a text_click action with
//      the click engine / action pipeline / safety gates.
//      Step 33 update: text_click is NOW an accepted scenario /
//      action type — but ONLY through the simulate path. The
//      Step 32 invariant ("never accepted") evolves into the
//      stronger Step 33 invariant: "accepted and simulation-only
//      AND realClick: true is rejected".
//      Step 41 update: `realOcr: true` is no longer rejected on
//      text_click — it is a SOURCE marker (the match came from
//      a real OCR engine). The simulate path still emits
//      `realClick: false`. The hard-stop on `realClick: true`
//      stays unchanged.
var apTxt32 = readText('src/action-pipeline.js');
record(
  'action-pipeline.js accepts "text_click" as a simulation-only action type at step 33',
  /action\.type\s*===\s*['"]text_click['"]/.test(apTxt32) &&
  /text_click\s+realClick=true\s+is\s+blocked/.test(apTxt32)
);
var smTxt32 = readText('src/scenario-manager.js');
record(
  'scenario-manager.js accepts "text_click" as a scenario type at step 33',
  smTxt32.indexOf('createTextClickScenario') !== -1 &&
  smTxt32.indexOf('validateTextClickScenario') !== -1
);
var ceTxt32 = readText('src/click-engine.js');
record(
  'click-engine.js dispatches text_click scenarios at step 33 (simulation-only)',
  ceTxt32.indexOf('runTextClickScenario') !== -1 &&
  /scenario\.type\s*===\s*['"]text_click['"]/.test(ceTxt32)
);

// 205. main.js / index.html still hold the safety flags.
record(
  'main.js still sets contextIsolation: true (re-checked at step 32)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 32)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 32 (no unsafe-inline / unsafe-eval)',
  htmlTxt32.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt32.indexOf('unsafe-inline') === -1 &&
  htmlTxt32.indexOf('unsafe-eval') === -1
);

// 206. renderer.js wires renderOcrTab() and the diagnostics line.
var rendererTxt32 = readText('src/renderer.js');
record(
  'renderer.js dispatches the ocr advanced tab to renderOcrTab()',
  rendererTxt32.indexOf('renderOcrTab') !== -1
);
record(
  'renderer.js Copy diagnostics has an `OCR:` line',
  /OCR:\s*ocrMockAvailable=/.test(rendererTxt32) &&
  /tesseractAvailable=false/.test(rendererTxt32) &&
  /ocrEngineImplemented=false/.test(rendererTxt32) &&
  /realOcr=false/.test(rendererTxt32) &&
  /realClick=false/.test(rendererTxt32)
);
record(
  'renderer.js diagnostics card uses ocrDiagnostics i18n key',
  rendererTxt32.indexOf("t('ocrDiagnostics')") !== -1
);

// 207. app-state.js exposes the OCR slice and setters.
var stateTxt32 = readText('src/app-state.js');
[
  'function setOcrTargetText',
  'function setOcrLanguage',
  'function setOcrMatchMode',
  'function setOcrCaseSensitive',
  'function setOcrUseSelectedRegion',
  'function setOcrRunning',
  'function setOcrResult',
  'function setOcrError',
  'function clearOcrResult',
  'function resetOcrState'
].forEach(function (sig) {
  record(
    'app-state.js declares ' + sig,
    stateTxt32.indexOf(sig) !== -1
  );
});
record(
  'app-state.js exposes the ocr slice via getState()',
  /ocr:\s*\{/.test(stateTxt32) &&
  /targetText:/.test(stateTxt32) &&
  /useSelectedRegion:/.test(stateTxt32)
);

// =====================================================================
// Step 33 — Text Click Scenario Type Foundation
// =====================================================================

// 208. New documentation exists.
record(
  'docs/TEXT_CLICK_SCENARIO.md exists',
  fileExists('docs/TEXT_CLICK_SCENARIO.md')
);

// 209. scenario-manager.js declares the documented function names.
var smTxt33 = readText('src/scenario-manager.js');
[
  'function validateTextClickScenario',
  'function createTextClickScenario',
  'function updateTextClickScenario',
  'function getTextClickScenarios'
].forEach(function (sig) {
  record(
    'scenario-manager.js declares ' + sig,
    smTxt33.indexOf(sig) !== -1
  );
});

// 210. createScenario / updateScenario dispatch on text_click.
record(
  'scenario-manager.js createScenario dispatches on text_click',
  /if\s*\(\s*t\s*===\s*['"]text_click['"]\s*\)/.test(smTxt33) ||
  /createTextClickScenario\(/.test(smTxt33)
);
record(
  'scenario-manager.js updateScenario dispatches on text_click',
  smTxt33.indexOf('updateTextClickScenario') !== -1
);

// 211. click-engine.js has runTextClickScenario.
var ceTxt33 = readText('src/click-engine.js');
record(
  'click-engine.js declares function runTextClickScenario',
  ceTxt33.indexOf('function runTextClickScenario') !== -1
);
record(
  'click-engine.js runScenario dispatches text_click to runTextClickScenario',
  /scenario\.type\s*===\s*['"]text_click['"]/.test(ceTxt33) &&
  ceTxt33.indexOf('runTextClickScenario(scenario') !== -1
);
record(
  'click-engine.js validateRunnableScenario knows the text_click branch',
  /text_click/.test(ceTxt33) &&
  ceTxt33.indexOf('validateTextClickScenario') !== -1
);

// 212. action-pipeline.js validates text_click and rejects realClick=true / realOcr=true.
var apTxt33 = readText('src/action-pipeline.js');
record(
  'action-pipeline.js validates text_click as a real action type',
  /action\.type\s*===\s*['"]text_click['"]/.test(apTxt33)
);
record(
  'action-pipeline.js rejects text_click realClick=true',
  /text_click\s+realClick=true\s+is\s+blocked/.test(apTxt33)
);
// Step 41 — `realOcr: true` is now ALLOWED on text_click as a
// source marker. The Step-33 rejection invariant has been
// retired. The hard-stop on `realClick: true` remains.
record(
  'action-pipeline.js comments document Step-41 realOcr source marker',
  /Step 41[\s\S]*?realOcr:\s*true|source marker/i.test(apTxt33)
);
record(
  'action-pipeline.js requires non-empty text on text_click actions',
  /text_click\s+requires\s+text/.test(apTxt33)
);
record(
  'action-pipeline.js requires targetPoint on text_click actions',
  /text_click\s+requires\s+targetPoint/.test(apTxt33)
);

// 213. action-pipeline.js routes text_click to the simulate path
//      (mock adapter is bypassed) AND records action.textClick.simulated.
record(
  'action-pipeline.js routes text_click through the simulate path (no adapter)',
  /action\.type\s*===\s*['"]text_click['"]\s*\)\s*\{[^}]*executeSimulatedAction/.test(apTxt33) ||
  /action\.type\s*===\s*['"]text_click['"][\s\S]{0,400}executeSimulatedAction/.test(apTxt33)
);
record(
  'action-pipeline.js records action.textClick.simulated',
  apTxt33.indexOf("'action.textClick.simulated'") !== -1
);
record(
  'action-pipeline.js records action.textClick.realBlocked',
  apTxt33.indexOf("'action.textClick.realBlocked'") !== -1
);

// 214. safety-gates.js validates text_click (mirrors action-pipeline).
var sgTxt33 = readText('src/safety-gates.js');
record(
  'safety-gates.js validates text_click action',
  /action\.type\s*===\s*['"]text_click['"]/.test(sgTxt33)
);
record(
  'safety-gates.js rejects text_click realClick=true',
  /text_click\s+never\s+carries\s+realClick=true/.test(sgTxt33)
);
record(
  'safety-gates.js rejects text_click realOcr=true',
  /text_click\s+never\s+carries\s+realOcr=true/.test(sgTxt33)
);

// 215. Audit allowlist contains the 9 new types.
var auditTxt33 = readText('src/audit-events.js');
[
  'scenario.textClick.started',
  'scenario.textClick.ocr.started',
  'scenario.textClick.ocr.completed',
  'scenario.textClick.textFound',
  'scenario.textClick.noTextFound',
  'scenario.textClick.simulated',
  'scenario.textClick.failed',
  'action.textClick.simulated',
  'action.textClick.realBlocked'
].forEach(function (eventType) {
  record(
    'audit-events.js allowlists ' + eventType,
    auditTxt33.indexOf("'" + eventType + "'") !== -1
  );
});

// 216. i18n.js declares the new keys in BOTH locales.
var i18nTxt33 = readText('src/i18n.js');
var step33I18nKeys = [
  'textClick',
  'textClickScenario',
  'createTextClickScenario',
  'editTextClickScenario',
  'textClickSettings',
  'clearScenarioRegion',
  'mockOcrOnlyNotice',
  'textClickSimulated',
  'textClickNoMatch',
  'textClickMissingPreview',
  'textClickMissingTargetText',
  'textClickTarget',
  'realTextClickDisabled',
  'lastTextClickResult',
  'textClickScenariosCount',
  'textClickSimulationOnly'
];
step33I18nKeys.forEach(function (key) {
  var pattern = new RegExp('\\b' + key + '\\s*:', 'g');
  var matches = i18nTxt33.match(pattern) || [];
  record(
    'i18n.js defines key "' + key + '" in both RU and EN',
    matches.length >= 2,
    matches.length === 0 ? 'missing entirely' : 'only ' + matches.length + ' occurrence(s)'
  );
});

// 217. index.html has the new option + form section.
var htmlTxt33 = readText('src/index.html');
record(
  'index.html has a text_click option in the scenario type select',
  /<option[^>]*value=['"]text_click['"]/.test(htmlTxt33)
);
record(
  'index.html has a form-section-text-click section',
  htmlTxt33.indexOf('id="form-section-text-click"') !== -1
);
record(
  'index.html has a target-text input',
  htmlTxt33.indexOf('id="input-text-target"') !== -1
);
record(
  'index.html has the mock-OCR notice inside the text_click form',
  /text-click-mock-ocr-notice/.test(htmlTxt33)
);

// 218. README and PROJECT_CONTEXT mention text_click.
var readmeTxt33  = readText('README.md');
var contextTxt33 = readText('PROJECT_CONTEXT.md');
record(
  'README.md mentions text_click or text click',
  /text_click|text click|Клик по тексту/i.test(readmeTxt33)
);
record(
  'PROJECT_CONTEXT.md mentions text_click or text click',
  /text_click|text click|Клик по тексту/i.test(contextTxt33)
);
record(
  'README or PROJECT_CONTEXT mentions step 33',
  /шаг\s*33|step\s*33/i.test(readmeTxt33 + '\n' + contextTxt33)
);

// 219. docs/TEXT_CLICK_SCENARIO.md asserts simulation-only,
//      no Tesseract, no real click, no real OCR.
var tcDoc = readText('docs/TEXT_CLICK_SCENARIO.md');
record(
  'docs/TEXT_CLICK_SCENARIO.md asserts simulation-only',
  /simulation-only|simulation only/i.test(tcDoc)
);
record(
  'docs/TEXT_CLICK_SCENARIO.md asserts no real click',
  /(does\s+not\s+click|never\s+clicks?|never moves the cursor|no real click)/i.test(tcDoc)
);
record(
  'docs/TEXT_CLICK_SCENARIO.md asserts mock OCR / no Tesseract',
  /(mock OCR|no Tesseract|tesseract is not connected|tesseract is not added)/i.test(tcDoc)
);
record(
  'docs/TEXT_CLICK_SCENARIO.md describes scenario format / execution flow',
  /Scenario format/i.test(tcDoc) && /Execution flow/i.test(tcDoc)
);

// 220. SECURITY_CHECKLIST has a "text_click scenario (Step 33)" section.
var tcSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has text_click scenario (Step 33) section',
  /text_click\s+scenario\s*\(?step\s*33/i.test(tcSec) ||
  /## text_click scenario/i.test(tcSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts text_click simulation only / OCR mock only',
  /text_click simulation only/i.test(tcSec) &&
  /OCR mock only/i.test(tcSec)
);

// 221. SMOKE_TESTS doc has a Step 33 text_click block.
var stTxt33 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 33 Text Click Scenario block',
  /Step\s*33\s*[—-]\s*Text Click Scenario/i.test(stTxt33) ||
  /Step 33.*Text Click Scenario/i.test(stTxt33)
);

// 222. KNOWN_LIMITATIONS has a text_click section (Step 33).
var klTxt33 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has a text_click section (Step 33)',
  /text_click uses mock OCR only|##\s*16\.\s*text_click uses mock OCR only/i.test(klTxt33)
);

// 223. CHANGELOG mentions Step 33.
var chTxt33 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 33 — Text Click Scenario Type Foundation',
  /Step\s*33.*Text Click Scenario Type Foundation/i.test(chTxt33) ||
  /Шаг\s*33.*Text Click Scenario/i.test(chTxt33) ||
  /Text Click Scenario Type Foundation/i.test(chTxt33)
);

// 224. package.json STILL declares no OCR / OpenCV / image-matching
//      / real-input modules at step 33.
if (pkg) {
  var allDeps33 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step33Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps33, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 33',
    step33Forbidden.length === 0,
    step33Forbidden.length ? step33Forbidden.join(', ') : ''
  );
}

// 225. Step-33 source files don't import OCR / OpenCV / real-input.
var step33SourceFiles = [
  'main.js', 'preload.js',
  'src/scenario-manager.js',
  'src/click-engine.js',
  'src/action-pipeline.js',
  'src/safety-gates.js'
];
var step33ForbiddenImports = [
  'tesseract.js', 'tesseract', 'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep33Imports = [];
step33SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step33ForbiddenImports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep33Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 33 source files',
  foundStep33Imports.length === 0,
  foundStep33Imports.length ? foundStep33Imports.join(', ') : ''
);

// 226. Step 33 introduces no new IPC channel (renderer-only).
record(
  'main.js does not register any scenario.textClick.* IPC handler at step 33',
  !/ipcMain\.handle\(['"]scenario\.textClick/.test(mainTxt) &&
  !/ipcMain\.on\(['"]scenario\.textClick/.test(mainTxt)
);
record(
  'main.js does not register any action.textClick.* IPC handler at step 33',
  !/ipcMain\.handle\(['"]action\.textClick/.test(mainTxt) &&
  !/ipcMain\.on\(['"]action\.textClick/.test(mainTxt)
);
record(
  'preload.js does not expose any textClick.* API at step 33',
  preloadTxt.indexOf("'scenario.textClick.") === -1 &&
  preloadTxt.indexOf('"scenario.textClick.') === -1 &&
  preloadTxt.indexOf("'action.textClick.") === -1 &&
  preloadTxt.indexOf('"action.textClick.') === -1
);

// 227. main.js / index.html still hold the safety flags at step 33.
record(
  'main.js still sets contextIsolation: true (re-checked at step 33)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 33)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 33 (no unsafe-inline / unsafe-eval)',
  htmlTxt33.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt33.indexOf('unsafe-inline') === -1 &&
  htmlTxt33.indexOf('unsafe-eval') === -1
);

// 228. renderer.js wires the new diagnostics card and Copy diagnostics line.
var rendererTxt33 = readText('src/renderer.js');
record(
  'renderer.js Copy diagnostics has a `Text click scenario:` line',
  /Text click scenario:/.test(rendererTxt33) &&
  /textClickSimulationOnly=true/.test(rendererTxt33) &&
  /realTextClickEnabled=false/.test(rendererTxt33) &&
  /realOcrEnabled=false/.test(rendererTxt33) &&
  /tesseractAvailable=false/.test(rendererTxt33) &&
  /ocrEngineImplemented=false/.test(rendererTxt33)
);
record(
  'renderer.js diagnostics card uses textClickScenario i18n key',
  rendererTxt33.indexOf("t('textClickScenario')") !== -1
);
record(
  'renderer.js form helpers handle text_click branch',
  rendererTxt33.indexOf('formSectionText') !== -1 &&
  rendererTxt33.indexOf('input-text-target') !== -1 &&
  rendererTxt33.indexOf('runTextClickScenario') === -1 // it's the click-engine that calls it; renderer just calls runScenario
);
record(
  'renderer.js form helpers wire the text_click region buttons',
  rendererTxt33.indexOf('applySelectedRegionToTextClickForm') !== -1 &&
  rendererTxt33.indexOf('clearTextClickFormRegion') !== -1
);

// =====================================================================
// Step 34 — Text Click Test Tools + OCR UX Polish
// =====================================================================

// 229. New source files exist.
record(
  'src/text-click-test-tools.js exists',
  fileExists('src/text-click-test-tools.js')
);
record(
  'src/text-click-test-ui.js exists',
  fileExists('src/text-click-test-ui.js')
);

// 230. New documentation exists.
record(
  'docs/TEXT_CLICK_TEST_TOOLS.md exists',
  fileExists('docs/TEXT_CLICK_TEST_TOOLS.md')
);

// 231. text-click-test-tools.js declares the documented function names.
var tctTools = readText('src/text-click-test-tools.js');
[
  'function buildTextClickTestInput',
  'function validateTextClickTestInput',
  'function runTextClickTest',
  'function createTextClickDebugResult',
  'function clearTextClickTestResult',
  'function getTextClickTestStatus'
].forEach(function (sig) {
  record(
    'text-click-test-tools.js declares ' + sig,
    tctTools.indexOf(sig) !== -1
  );
});

// 232. text-click-test-ui.js declares the documented function names.
var tctUi = readText('src/text-click-test-ui.js');
[
  'function initTextClickTestUi',
  'function renderTextClickScreenPreviewStatus',
  'function renderTextClickRegionSummary',
  'function runTextClickTestFromForm',
  'function clearTextClickTestResultUi',
  'function renderTextClickTestResult',
  'function renderTextClickOcrOverlay',
  'function renderTextClickActionPreview',
  'function renderTextClickBlocksList'
].forEach(function (sig) {
  record(
    'text-click-test-ui.js declares ' + sig,
    tctUi.indexOf(sig) !== -1
  );
});

// 233. Both Step-34 modules are pure-renderer code: no `require()`,
//      no electron / ipcRenderer / fs / localStorage usage.
//      Doc-strings are stripped first via the Step 31 helper.
[
  ['src/text-click-test-tools.js', _stripJsComments(tctTools)],
  ['src/text-click-test-ui.js',    _stripJsComments(tctUi)]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  record(
    rel + ' does not require() anything',
    !/\brequire\s*\(/.test(txt)
  );
  record(
    rel + ' does not import electron',
    txt.indexOf("require('electron')") === -1 &&
    txt.indexOf('require("electron")') === -1 &&
    txt.indexOf("from 'electron'") === -1
  );
  record(
    rel + ' does not use ipcRenderer',
    txt.indexOf('ipcRenderer') === -1
  );
  record(
    rel + ' does not use fs',
    !/\brequire\s*\(\s*['"]fs['"]\s*\)/.test(txt)
  );
  record(
    rel + ' does not use localStorage',
    txt.indexOf('localStorage') === -1
  );
});

// 234. Both Step-34 modules contain no innerHTML on user data.
[
  ['src/text-click-test-tools.js', tctTools],
  ['src/text-click-test-ui.js',    tctUi]
].forEach(function (pair) {
  var rel = pair[0]; var txt = pair[1];
  var lines = txt.split(/\r?\n/);
  var bad = [];
  for (var i = 0; i < lines.length; i++) {
    var ln = lines[i];
    if (ln.indexOf('innerHTML') === -1) continue;
    var cleaned = ln.replace(/\/\/.*$/, '');
    if (cleaned.indexOf('innerHTML') === -1) continue;
    if (/innerHTML\s*=\s*(''|"")\s*;?\s*$/.test(cleaned)) continue;
    bad.push((i + 1) + ': ' + ln.trim());
  }
  record(
    rel + ' uses innerHTML only as `= \'\'` (container clear)',
    bad.length === 0,
    bad.length ? bad.slice(0, 3).join(' | ') : ''
  );
});

// 235. text-click-test-ui.js renders the action preview via
//      <pre>.textContent (no HTML interpolation on user data).
record(
  'text-click-test-ui.js renders text_click action preview via <pre>.textContent',
  /createElement\(['"]pre['"]\)/.test(tctUi) &&
  /\.textContent\s*=\s*JSON\.stringify/.test(tctUi)
);

// 236. The Test OCR flow does NOT call runScenario / runTextClickScenario
//      / executeAction with executionMode: 'real'.
var tctToolsClean = _stripJsComments(tctTools);
var tctUiClean    = _stripJsComments(tctUi);
record(
  'text-click-test-tools.js does not call runScenario',
  tctToolsClean.indexOf('runScenario(') === -1
);
record(
  'text-click-test-tools.js does not call runTextClickScenario',
  tctToolsClean.indexOf('runTextClickScenario(') === -1
);
record(
  'text-click-test-tools.js does not call executeAction with executionMode: "real"',
  !/executeAction\s*\([^)]*executionMode:\s*['"]real['"]/.test(tctToolsClean)
);
record(
  'text-click-test-ui.js does not call runScenario',
  tctUiClean.indexOf('runScenario(') === -1
);
record(
  'text-click-test-ui.js does not call runTextClickScenario',
  tctUiClean.indexOf('runTextClickScenario(') === -1
);

// 237. Both modules stamp realClick: false / realOcr: false.
record(
  'text-click-test-tools.js stamps realClick: false',
  /realClick:\s*false/.test(tctTools)
);
record(
  'text-click-test-tools.js stamps realOcr: false',
  /realOcr:\s*false/.test(tctTools)
);

// 238. text-click-test-tools.js does NOT reach for any real OCR
//      backend via `require()`. It MAY reference `tesseract` only
//      indirectly through the renderer global
//      `recognizeTextWithTesseract` (Step 41 dispatcher). The
//      strict invariant is therefore: no `require('tesseract*')`
//      and no `require('opencv*')`.
record(
  'text-click-test-tools.js never imports tesseract / opencv',
  !/require\(['"]tesseract/i.test(tctToolsClean) &&
  !/require\(['"]opencv/i.test(tctToolsClean) &&
  !/import\s+.*['"]tesseract/i.test(tctToolsClean) &&
  !/import\s+.*['"]opencv/i.test(tctToolsClean)
);
record(
  'text-click-test-tools.js delegates to the Step-32 mock engine',
  tctToolsClean.indexOf('runMockOcr') !== -1 &&
  tctToolsClean.indexOf('createOcrInput') !== -1
);

// 239. Audit allowlist contains the 6 new types.
var auditTxt34 = readText('src/audit-events.js');
[
  'textClick.test.started',
  'textClick.test.completed',
  'textClick.test.failed',
  'textClick.test.noMatch',
  'textClick.test.cleared',
  'textClick.test.actionPreview.created'
].forEach(function (eventType) {
  record(
    'audit-events.js allowlists ' + eventType,
    auditTxt34.indexOf("'" + eventType + "'") !== -1
  );
});

// 240. i18n.js declares the new keys in BOTH locales.
var i18nTxt34 = readText('src/i18n.js');
var step34I18nKeys = [
  'testOcr',
  'testTextMatch',
  'runTextClickTest',
  'textClickTestTools',
  'textClickTestResult',
  'textClickBlocks',
  'ocrBlocksOverlay',
  'matchedBlock',
  'targetTextWasNotFound',
  'mockOcrEngineUnavailable',
  'openOcr',
  'textClickTestStarted',
  'textClickTestCompleted',
  'textClickTestFailed',
  'textClickTestNoMatch',
  'textClickTestCleared',
  'ocrMockOnly',
  'testDoesNotUseRealOcr',
  'textClickDebugPanel',
  'matchedTextBlock',
  'noTextClickTestResult'
];
step34I18nKeys.forEach(function (key) {
  var pattern = new RegExp('\\b' + key + '\\s*:', 'g');
  var matches = i18nTxt34.match(pattern) || [];
  record(
    'i18n.js defines key "' + key + '" in both RU and EN',
    matches.length >= 2,
    matches.length === 0 ? 'missing entirely' : 'only ' + matches.length + ' occurrence(s)'
  );
});

// 241. index.html loads the new scripts in the correct order:
//      ocr-mock-engine.js → text-click-test-tools.js →
//      text-click-test-ui.js → renderer.js
var htmlTxt34 = readText('src/index.html');
record(
  'index.html loads text-click-test-tools.js',
  /<script\s+src=["']text-click-test-tools\.js["']/.test(htmlTxt34)
);
record(
  'index.html loads text-click-test-ui.js',
  /<script\s+src=["']text-click-test-ui\.js["']/.test(htmlTxt34)
);
(function () {
  var enginePos   = htmlTxt34.indexOf('ocr-mock-engine.js');
  var toolsPos    = htmlTxt34.indexOf('text-click-test-tools.js');
  var uiPos       = htmlTxt34.indexOf('text-click-test-ui.js');
  var rendererPos = htmlTxt34.indexOf('renderer.js');
  record(
    'index.html loads ocr-mock-engine.js before text-click-test-tools.js',
    enginePos !== -1 && toolsPos !== -1 && enginePos < toolsPos
  );
  record(
    'index.html loads text-click-test-tools.js before text-click-test-ui.js',
    toolsPos !== -1 && uiPos !== -1 && toolsPos < uiPos
  );
  record(
    'index.html loads text-click-test-ui.js before renderer.js',
    uiPos !== -1 && rendererPos !== -1 && uiPos < rendererPos
  );
})();

// 242. README and PROJECT_CONTEXT mention Text Click Test Tools / Test OCR.
var readmeTxt34  = readText('README.md');
var contextTxt34 = readText('PROJECT_CONTEXT.md');
record(
  'README.md mentions Text Click Test Tools or Test OCR',
  /Text Click Test Tools|text click test tools|Test OCR|text_click test/i.test(readmeTxt34)
);
record(
  'PROJECT_CONTEXT.md mentions Text Click Test Tools or Test OCR',
  /Text Click Test Tools|text click test tools|Test OCR|text_click test/i.test(contextTxt34)
);
record(
  'README or PROJECT_CONTEXT mentions step 34',
  /шаг\s*34|step\s*34/i.test(readmeTxt34 + '\n' + contextTxt34)
);

// 243. docs/TEXT_CLICK_TEST_TOOLS.md asserts simulation-only,
//      mock-only OCR, no real click.
var tctDoc = readText('docs/TEXT_CLICK_TEST_TOOLS.md');
record(
  'docs/TEXT_CLICK_TEST_TOOLS.md asserts simulation-only',
  /simulation-only|simulation only/i.test(tctDoc)
);
record(
  'docs/TEXT_CLICK_TEST_TOOLS.md asserts Test OCR does not click',
  /(does\s+not\s+click|never\s+clicks|never moves the cursor|never executes the scenario|test ocr does not click)/i.test(tctDoc)
);
record(
  'docs/TEXT_CLICK_TEST_TOOLS.md asserts mock OCR / no Tesseract',
  /(mock OCR|no Tesseract|tesseract is not connected|test ocr does not use real ocr|mock-only)/i.test(tctDoc)
);
record(
  'docs/TEXT_CLICK_TEST_TOOLS.md describes Test OCR flow / debug result',
  /Test OCR flow/i.test(tctDoc) && /(debug result|Required data|OCR blocks overlay)/i.test(tctDoc)
);

// 244. SECURITY_CHECKLIST has a Step 34 / Test OCR section.
var tctSec = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has a Step 34 / Test OCR section',
  /text_click\s+test\s+tools\s*\(?step\s*34/i.test(tctSec) ||
  /## text_click test tools/i.test(tctSec) ||
  /Test OCR does not use real OCR/i.test(tctSec)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts Test OCR does not click / does not use real OCR',
  /Test OCR does not click/i.test(tctSec) &&
  /Test OCR does not use real OCR/i.test(tctSec)
);

// 245. SMOKE_TESTS doc has a Step 34 Test OCR block.
var stTxt34 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 34 Text Click Test Tools / Test OCR block',
  /Step\s*34\s*[—-]\s*Text Click Test Tools/i.test(stTxt34) ||
  /Step 34.*Test OCR/i.test(stTxt34)
);

// 246. CHANGELOG mentions Step 34.
var chTxt34 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 34 — Text Click Test Tools',
  /Step\s*34.*Text Click Test Tools/i.test(chTxt34) ||
  /Шаг\s*34.*Text Click Test Tools/i.test(chTxt34) ||
  /Text Click Test Tools/i.test(chTxt34)
);

// 247. package.json STILL declares no OCR / OpenCV / image-matching
//      / real-input modules at step 34.
if (pkg) {
  var allDeps34 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var step34Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender',
    'sharp', 'jimp', 'pixelmatch', 'looks-same'
  ].filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps34, m);
  });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 34',
    step34Forbidden.length === 0,
    step34Forbidden.length ? step34Forbidden.join(', ') : ''
  );
}

// 248. Step-34 source files don't import OCR / OpenCV / real-input.
var step34SourceFiles = [
  'main.js', 'preload.js',
  'src/text-click-test-tools.js',
  'src/text-click-test-ui.js'
];
var step34ForbiddenImports = [
  'tesseract.js', 'tesseract', 'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi'
];
var foundStep34Imports = [];
step34SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step34ForbiddenImports.forEach(function (mod) {
    if (txt.indexOf("require('" + mod + "')") !== -1 ||
        txt.indexOf('require("' + mod + '")') !== -1) {
      foundStep34Imports.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 34 source files',
  foundStep34Imports.length === 0,
  foundStep34Imports.length ? foundStep34Imports.join(', ') : ''
);

// 249. Step 34 introduces no new IPC channel.
record(
  'main.js does not register any textClick.test.* IPC handler at step 34',
  !/ipcMain\.handle\(['"]textClick\.test/.test(mainTxt) &&
  !/ipcMain\.on\(['"]textClick\.test/.test(mainTxt)
);
record(
  'preload.js does not expose any textClick.test.* API at step 34',
  preloadTxt.indexOf("'textClick.test.") === -1 &&
  preloadTxt.indexOf('"textClick.test.') === -1 &&
  preloadTxt.indexOf('textClickTest') === -1
);

// 250. main.js / index.html still hold the safety flags at step 34.
record(
  'main.js still sets contextIsolation: true (re-checked at step 34)',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 34)',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'src/index.html CSP unchanged at step 34 (no unsafe-inline / unsafe-eval)',
  htmlTxt34.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt34.indexOf('unsafe-inline') === -1 &&
  htmlTxt34.indexOf('unsafe-eval') === -1
);

// 251. renderer.js wires initTextClickTestUi() and the diagnostics
//      card / Copy diagnostics line.
var rendererTxt34 = readText('src/renderer.js');
record(
  'renderer.js calls initTextClickTestUi()',
  rendererTxt34.indexOf('initTextClickTestUi(') !== -1
);
record(
  'renderer.js Copy diagnostics has a `Text click test:` line',
  /Text click test:/.test(rendererTxt34) &&
  /testDoesNotClick=true/.test(rendererTxt34) &&
  /ocrMockOnly=true/.test(rendererTxt34) &&
  /realOcrEnabled=false/.test(rendererTxt34) &&
  /realTextClickEnabled=false/.test(rendererTxt34)
);
record(
  'renderer.js diagnostics card uses textClickTestDiagnostics i18n key',
  rendererTxt34.indexOf("t('textClickTestDiagnostics')") !== -1
);

// 252. text-click-test-ui.js targets the text_click form section
//      and builds the test panel container.
record(
  'text-click-test-ui.js references #form-section-text-click container',
  tctUi.indexOf("'form-section-text-click'") !== -1 ||
  tctUi.indexOf('"form-section-text-click"') !== -1
);
record(
  'text-click-test-ui.js builds the text-click-test-panel container',
  tctUi.indexOf("'text-click-test-panel'") !== -1 ||
  tctUi.indexOf('"text-click-test-panel"') !== -1
);

// =====================================================================
// Step 36 — Visual Builder UX Polish + Scenario Presets
// =====================================================================

// 253. New Step 36 modules exist on disk.
[
  'src/scenario-presets.js',
  'src/visual-builder.js',
  'src/visual-builder-ui.js'
].forEach(function (rel) {
  record('Step 36 file exists: ' + rel, fileExists(rel));
});

// 254. index.html loads the three new <script src="…"> tags.
var htmlTxt36 = readText('src/index.html');
record(
  'index.html loads scenario-presets.js',
  htmlTxt36.indexOf('scenario-presets.js') !== -1
);
record(
  'index.html loads visual-builder.js',
  htmlTxt36.indexOf('visual-builder.js') !== -1 &&
  htmlTxt36.indexOf('visual-builder-ui.js') !== -1
);

// 255. index.html exposes the Visual Builder tab + section.
record(
  'index.html declares the Visual Builder tab button',
  htmlTxt36.indexOf('data-advanced-tab="visualBuilder"') !== -1
);
record(
  'index.html declares the Visual Builder section',
  htmlTxt36.indexOf('id="advanced-tab-visualBuilder"') !== -1
);

// 256. scenario-presets.js declares the three frozen presets and
//      the public surface.
var presetsTxt = readText('src/scenario-presets.js');
record(
  'scenario-presets.js declares preset-coordinate-basic',
  presetsTxt.indexOf("id: 'preset-coordinate-basic'") !== -1
);
record(
  'scenario-presets.js declares preset-image-click-basic',
  presetsTxt.indexOf("id: 'preset-image-click-basic'") !== -1
);
record(
  'scenario-presets.js declares preset-text-click-basic',
  presetsTxt.indexOf("id: 'preset-text-click-basic'") !== -1
);
record(
  'scenario-presets.js exports getScenarioPresets',
  /function\s+getScenarioPresets\s*\(/.test(presetsTxt)
);
record(
  'scenario-presets.js exports getScenarioPresetById',
  /function\s+getScenarioPresetById\s*\(/.test(presetsTxt)
);
record(
  'scenario-presets.js exports createScenarioDraftFromPreset',
  /function\s+createScenarioDraftFromPreset\s*\(/.test(presetsTxt)
);
record(
  'scenario-presets.js exports applyVisualContextToPreset',
  /function\s+applyVisualContextToPreset\s*\(/.test(presetsTxt)
);
record(
  'scenario-presets.js exports validateScenarioPreset',
  /function\s+validateScenarioPreset\s*\(/.test(presetsTxt)
);
record(
  'scenario-presets.js stamps realClick: false on every draft',
  presetsTxt.indexOf('realClick: false') !== -1
);

// 257. visual-builder.js declares the overlay state shape and the
//      key public functions.
var vbTxt = readText('src/visual-builder.js');
[
  'showRegion',
  'showTemplateMatch',
  'showTemplateTarget',
  'showOcrBlocks',
  'showOcrTarget',
  'showActionTarget'
].forEach(function (k) {
  record(
    'visual-builder.js declares overlay key ' + k,
    vbTxt.indexOf(k + ':') !== -1
  );
});
[
  'getVisualBuilderState',
  'setOverlaySetting',
  'showAllOverlays',
  'hideAllOverlays',
  'clearOverlays',
  'setSelectedActionType',
  'buildVisualContextFromState',
  'buildDraftPreviewFromState',
  'getMissingRequirements',
  'getOverlayLayers',
  'getVisualBuilderDiagnostics'
].forEach(function (fn) {
  record(
    'visual-builder.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(vbTxt)
  );
});
record(
  'visual-builder.js diagnostics carry autoSavesScenarios: false',
  /autoSavesScenarios:\s*false/.test(vbTxt)
);
record(
  'visual-builder.js diagnostics carry autoRunsScenarios: false',
  /autoRunsScenarios:\s*false/.test(vbTxt)
);
record(
  'visual-builder.js diagnostics carry realClick: false',
  /realClick:\s*false/.test(vbTxt)
);

// 258. visual-builder-ui.js renders the tab and uses textContent.
var vbUiTxt = readText('src/visual-builder-ui.js');
record(
  'visual-builder-ui.js exports renderVisualBuilderTab',
  /function\s+renderVisualBuilderTab\s*\(/.test(vbUiTxt)
);
record(
  'visual-builder-ui.js targets the #advanced-tab-visualBuilder container',
  vbUiTxt.indexOf("'advanced-tab-visualBuilder'") !== -1 ||
  vbUiTxt.indexOf('"advanced-tab-visualBuilder"') !== -1
);
// User data must never be set via innerHTML on a non-empty value.
// We allow `innerHTML = ''` for clearing only; nothing else.
var vbBadInnerHtml = /\.innerHTML\s*=\s*(?!''|""|``)/.test(vbUiTxt);
record(
  'visual-builder-ui.js never assigns innerHTML to user data',
  !vbBadInnerHtml
);

// 259. Step 36 modules do not import any forbidden module.
var step36SourceFiles = [
  'src/scenario-presets.js',
  'src/visual-builder.js',
  'src/visual-builder-ui.js'
];
var step36ForbiddenModules = [
  'tesseract', 'tesseract.js', 'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi', 'node-key-sender'
];
var step36ForbiddenFound = [];
step36SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step36ForbiddenModules.forEach(function (mod) {
    var n1 = "require('" + mod + "')";
    var n2 = 'require("' + mod + '")';
    if (txt.indexOf(n1) !== -1 || txt.indexOf(n2) !== -1) {
      step36ForbiddenFound.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 36 source files',
  step36ForbiddenFound.length === 0,
  step36ForbiddenFound.join(', ')
);

// 260. package.json still declares zero of the prohibited modules
//      (re-checked at step 36 — adding Visual Builder must NOT
//      pull in any new dependency).
//      Step 39 update: `tesseract.js` / `tesseract` are now
//      legitimately declared in package.json (Real OCR Phase 1
//      dependency). Source-file imports of tesseract.js still
//      stay banned in Visual Builder modules — see check #259.
if (pkg) {
  var allDeps36 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var pkgForbidden36 = step36ForbiddenModules
    .filter(function (m) { return m !== 'tesseract.js' && m !== 'tesseract' && m !== 'tesseract-ocr' && m !== 'node-tesseract-ocr'; })
    .filter(function (m) {
      return Object.prototype.hasOwnProperty.call(allDeps36, m);
    });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 36',
    pkgForbidden36.length === 0,
    pkgForbidden36.join(', ')
  );
}

// 261. main.js does not register any visualBuilder.* / scenarioPreset.*
//      IPC handler. preload.js does not expose any such API.
var mainTxt36 = readText('main.js');
record(
  'main.js does not register any visualBuilder.* IPC handler at step 36',
  !/'visualBuilder\./.test(mainTxt36) && !/"visualBuilder\./.test(mainTxt36)
);
record(
  'main.js does not register any scenarioPreset.* IPC handler at step 36',
  !/'scenarioPreset\./.test(mainTxt36) && !/"scenarioPreset\./.test(mainTxt36)
);
var preloadTxt36 = readText('preload.js');
record(
  'preload.js does not expose any visualBuilder.* API at step 36',
  preloadTxt36.indexOf('visualBuilder') === -1 ||
  // Allow the word as a substring of an existing benign identifier;
  // the strict check is on the IPC channel form.
  (!/'visualBuilder/.test(preloadTxt36) && !/"visualBuilder/.test(preloadTxt36))
);
record(
  'preload.js does not expose any scenarioPreset.* API at step 36',
  !/'scenarioPreset/.test(preloadTxt36) && !/"scenarioPreset/.test(preloadTxt36)
);

// 262. Electron security flags re-checked at step 36.
record(
  'main.js still sets contextIsolation: true (re-checked at step 36)',
  /contextIsolation\s*:\s*true/.test(mainTxt36)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 36)',
  /nodeIntegration\s*:\s*false/.test(mainTxt36)
);
var htmlTxt36b = readText('src/index.html');
record(
  'src/index.html CSP unchanged at step 36 (no unsafe-inline / unsafe-eval)',
  htmlTxt36b.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt36b.indexOf('unsafe-inline') === -1 &&
  htmlTxt36b.indexOf('unsafe-eval') === -1
);

// 263. Audit allowlist contains the 6 new Step 36 types.
var auditTxt36 = readText('src/audit-events.js');
[
  'scenarioPreset.selected',
  'scenarioPreset.draft.created',
  'scenarioPreset.form.opened',
  'visualBuilder.overlay.changed',
  'visualBuilder.requirement.missing',
  'visualBuilder.draft.preview.created'
].forEach(function (eventType) {
  record(
    'audit allowlist includes ' + eventType,
    auditTxt36.indexOf("'" + eventType + "'") !== -1
  );
});

// 264. renderer.js wires the Visual Builder dispatch and the
//      Visual Builder diagnostics line.
var rendererTxt36 = readText('src/renderer.js');
record(
  "renderer.js dispatches the Visual Builder tab to renderVisualBuilderTab",
  rendererTxt36.indexOf("case 'visualBuilder'") !== -1 &&
  rendererTxt36.indexOf('renderVisualBuilderTab') !== -1
);
record(
  'renderer.js Copy diagnostics has a `Visual Builder:` line',
  rendererTxt36.indexOf('Visual Builder:') !== -1 &&
  rendererTxt36.indexOf('autoSavesScenarios=false') !== -1 &&
  rendererTxt36.indexOf('autoRunsScenarios=false') !== -1
);

// 265. i18n parity is preserved AND the new Step 36 keys exist.
var i18nTxt36 = readText('src/i18n.js');
[
  'visualBuilder',
  'visualBuilderSubtitle',
  'visualBuilderSimulationOnlyNotice',
  'scenarioPresets',
  'presetCoordinateBasic',
  'presetCoordinateBasicDesc',
  'presetImageClickBasic',
  'presetImageClickBasicDesc',
  'presetTextClickBasic',
  'presetTextClickBasicDesc',
  'usePreset',
  'useWithCurrentVisualContext',
  'draftPreview',
  'openDraftInForm',
  'missingVisualRequirement',
  'screenPreviewMissingHint',
  'templateMissingHint',
  'regionOptionalHint',
  'ocrResultMissingHint',
  'showRegionOverlay',
  'showTemplateMatchOverlay',
  'showTemplateTargetOverlay',
  'showOcrBlocksOverlay',
  'showOcrTargetOverlay',
  'showActionTargetOverlay',
  'showAllOverlays',
  'hideAllOverlays',
  'overlaySettings',
  'presetSelected',
  'scenarioDraftOpened'
].forEach(function (key) {
  record(
    'i18n declares Step 36 key ' + key,
    new RegExp('\\b' + key + ':\\s*"').test(i18nTxt36)
  );
});

// 266. README / PROJECT_CONTEXT mention Step 36 / Step 37 / Visual
//      Builder / Scenario Presets / Smart Features.
var readme36 = readText('README.md');
var ctx36 = readText('PROJECT_CONTEXT.md');
record(
  'README or PROJECT_CONTEXT mentions step 36',
  /step\s*36|шаг\s*36|Step 36|Шаг 36/.test(readme36) ||
  /step\s*36|шаг\s*36|Step 36|Шаг 36/.test(ctx36)
);
record(
  'README or PROJECT_CONTEXT mentions step 37',
  /step\s*37|шаг\s*37|Step 37|Шаг 37/.test(readme36) ||
  /step\s*37|шаг\s*37|Step 37|Шаг 37/.test(ctx36)
);
record(
  'README or PROJECT_CONTEXT mentions Visual Builder',
  /Visual Builder|Визуальный конструктор|визуальный конструктор/i.test(readme36) ||
  /Visual Builder|Визуальный конструктор|визуальный конструктор/i.test(ctx36)
);
record(
  'README or PROJECT_CONTEXT mentions Scenario Presets',
  /Scenario Presets|Пресеты сценариев/i.test(readme36) ||
  /Scenario Presets|Пресеты сценариев/i.test(ctx36)
);
record(
  'CHANGELOG.md mentions Step 36 — Visual Builder UX Polish + Scenario Presets',
  readText('CHANGELOG.md').indexOf('Step 36 — Visual Builder UX Polish + Scenario Presets') !== -1
);

// =====================================================================
// Step 37 — Smart Features QA + Next Branch Preparation
// =====================================================================

// 267. New Step 37 docs exist on disk.
[
  'docs/SMART_FEATURES_QA.md',
  'docs/NEXT_BRANCH_PLAN.md',
  'docs/SMART_FEATURES_LIMITATIONS.md'
].forEach(function (rel) {
  record('Step 37 doc exists: ' + rel, fileExists(rel));
});

// 268. SMART_FEATURES_QA.md content sanity.
var qaTxt = readText('docs/SMART_FEATURES_QA.md');
record(
  'docs/SMART_FEATURES_QA.md asserts simulation-only',
  /simulation-only|simulation only/i.test(qaTxt)
);
record(
  'docs/SMART_FEATURES_QA.md covers Visual Builder QA',
  /Visual Builder QA/i.test(qaTxt)
);
record(
  'docs/SMART_FEATURES_QA.md covers Scenario Presets QA',
  /Scenario Presets QA/i.test(qaTxt)
);
record(
  'docs/SMART_FEATURES_QA.md uses Status: Not tested format',
  /Status:\*?\*?\s*Not tested/.test(qaTxt) ||
  /\*\*Status:\*\*\s*Not tested/.test(qaTxt)
);
record(
  'docs/SMART_FEATURES_QA.md mentions Release recommendation',
  /Release recommendation/i.test(qaTxt)
);

// 269. NEXT_BRANCH_PLAN.md content sanity.
var nbpTxt = readText('docs/NEXT_BRANCH_PLAN.md');
record(
  'docs/NEXT_BRANCH_PLAN.md describes Branch A — Real OCR Integration',
  /Branch A.*Real OCR/i.test(nbpTxt)
);
record(
  'docs/NEXT_BRANCH_PLAN.md describes Branch B — Real Desktop Adapter',
  /Branch B.*Real Desktop Adapter/i.test(nbpTxt)
);
record(
  'docs/NEXT_BRANCH_PLAN.md describes Branch C — Android Research',
  /Branch C.*Android/i.test(nbpTxt)
);
record(
  'docs/NEXT_BRANCH_PLAN.md recommends Branch A first',
  /Start with Branch A|Branch A.*first|сначала Branch A|сначала.*real OCR/i.test(nbpTxt)
);

// 270. SMART_FEATURES_LIMITATIONS.md content sanity.
var limTxt = readText('docs/SMART_FEATURES_LIMITATIONS.md');
record(
  'docs/SMART_FEATURES_LIMITATIONS.md mentions OCR mock only',
  /mock-only|mock only|OCR is mock|mock OCR/i.test(limTxt)
);
record(
  'docs/SMART_FEATURES_LIMITATIONS.md mentions no real click',
  /no real click|never click|never moves the cursor/i.test(limTxt)
);
record(
  'docs/SMART_FEATURES_LIMITATIONS.md mentions Visual Builder is foundation',
  /foundation/i.test(limTxt) && /Visual Builder/i.test(limTxt)
);

// 271. CHANGELOG mentions Step 37.
record(
  'CHANGELOG.md mentions Step 37 — Smart Features QA + Next Branch Preparation',
  readText('CHANGELOG.md').indexOf('Step 37 — Smart Features QA + Next Branch Preparation') !== -1
);

// 272. SMOKE_TESTS.md has Step 36 + Step 37 sections.
var smokeTxt = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Step 36 — Visual Builder block',
  /Step 36.*Visual Builder/i.test(smokeTxt)
);
record(
  'docs/SMOKE_TESTS.md has a Step 37 — Smart Features QA block',
  /Step 37.*Smart Features QA/i.test(smokeTxt)
);

// 273. SECURITY_CHECKLIST.md has the Step 36 Visual Builder section.
var secTxt37 = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has a Visual Builder + Scenario Presets section',
  /Visual Builder.*Scenario Presets|Step 36/i.test(secTxt37)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts Visual Builder creates drafts only',
  /drafts only|never auto-save|Visual Builder creates drafts only/i.test(secTxt37)
);
record(
  'docs/SECURITY_CHECKLIST.md asserts presets do not execute automatically',
  /Presets do not execute|presets do not execute|never auto-runs/i.test(secTxt37)
);

// 274. KNOWN_LIMITATIONS.md mentions Visual Builder foundation only.
var klTxt37 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md mentions Visual Builder + Scenario Presets are foundation-only',
  /Visual Builder.*foundation|foundation-only|Visual Builder.*Scenario Presets/i.test(klTxt37)
);
record(
  'docs/KNOWN_LIMITATIONS.md mentions scenario drafts require manual save',
  /manual save|require.*manual|drafts.*manual/i.test(klTxt37)
);

// 275. Hard guarantees: smoke-check itself never starts Electron,
//      never runs OCR, never runs matching, never executes system
//      actions — by construction this script only uses fs / path
//      and never spawns a child process. We verify there is no
//      actual `require()` of those modules outside of this very
//      check (the check itself contains the string as a literal,
//      so we match against the parser-friendly form
//      `\nrequire(` at column 0 only).
var smokeCheckSelf = readText('scripts/smoke-check.js');
// Strip the parts of the file that build these literal needles
// to avoid a self-reference false positive.
var smokeCheckSelfStripped = smokeCheckSelf
  .replace(/\/\/[^\n]*$/gm, '')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/'require\([^']*\)'/g, '""')
  .replace(/"require\([^"]*\)"/g, '""');
record(
  'smoke-check.js does not import child_process',
  !/\brequire\s*\(\s*['"]child_process['"]\s*\)/.test(smokeCheckSelfStripped)
);
record(
  'smoke-check.js does not import electron',
  !/\brequire\s*\(\s*['"]electron['"]\s*\)/.test(smokeCheckSelfStripped)
);

// =====================================================================
// Step 38 — Real OCR Research + Safe Integration Plan
// =====================================================================

// 276. New Step 38 modules exist on disk.
[
  'src/ocr-provider-interface.js',
  'src/ocr-provider-registry.js'
].forEach(function (rel) {
  record('Step 38 file exists: ' + rel, fileExists(rel));
});

// 277. New Step 38 docs exist on disk.
[
  'docs/REAL_OCR_INTEGRATION_PLAN.md',
  'docs/OCR_PROVIDER_INTERFACE.md'
].forEach(function (rel) {
  record('Step 38 doc exists: ' + rel, fileExists(rel));
});

// 278. index.html loads the two new <script src="…"> tags.
var htmlTxt38 = readText('src/index.html');
record(
  'index.html loads ocr-provider-interface.js',
  htmlTxt38.indexOf('ocr-provider-interface.js') !== -1
);
record(
  'index.html loads ocr-provider-registry.js',
  htmlTxt38.indexOf('ocr-provider-registry.js') !== -1
);
// And the order matters: interface must load before registry, both
// before ocr-ui so the readiness card can use them.
var idxInterface = htmlTxt38.indexOf('ocr-provider-interface.js');
var idxRegistry  = htmlTxt38.indexOf('ocr-provider-registry.js');
var idxOcrUi     = htmlTxt38.indexOf('ocr-ui.js');
record(
  'index.html loads ocr-provider-interface.js before ocr-provider-registry.js',
  idxInterface !== -1 && idxRegistry !== -1 && idxInterface < idxRegistry
);
record(
  'index.html loads ocr-provider-registry.js before ocr-ui.js',
  idxRegistry !== -1 && idxOcrUi !== -1 && idxRegistry < idxOcrUi
);

// 279. ocr-provider-interface.js declares the public surface.
var ifaceTxt = readText('src/ocr-provider-interface.js');
[
  'createOcrProviderResult',
  'validateOcrProviderInput',
  'normalizeOcrProviderOptions',
  'getOcrProviderContract',
  'getSupportedOcrLanguages',
  'isRealOcrAllowed',
  'createOcrProviderStatus'
].forEach(function (fn) {
  record(
    'ocr-provider-interface.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(ifaceTxt)
  );
});
// Step 38 hard-stop: `isRealOcrAllowed` returned `false`
// unconditionally. Step 42 retires the hard-stop — the function
// now reflects the merged base + runtime feature-flag snapshot.
// The new invariant is: under the production safe defaults
// (simulationOnly === true) the function still evaluates to
// `false`. We assert that the production code keeps the
// `simulationOnly` short-circuit and that the runtime overlay does
// NOT include `simulationOnly` in its whitelist.
record(
  'ocr-provider-interface.js isRealOcrAllowed short-circuits on simulationOnly',
  /if\s*\(\s*flags\.simulationOnly\s*===\s*true\s*\)\s*return\s+false/.test(ifaceTxt)
);
record(
  'ocr-provider-interface.js isRealOcrAllowed checks the tesseractProvider gate',
  /if\s*\(\s*flags\.tesseractProvider\s*!==\s*true\s*\)\s*return\s+false/.test(ifaceTxt)
);
// Contract default must report realOcrAvailable: false and
// supportedProviders that includes 'mock'.
record(
  'ocr-provider-interface.js contract has realOcrAvailable: false',
  /realOcrAvailable:\s*false/.test(ifaceTxt)
);
record(
  'ocr-provider-interface.js contract has mockOcrAvailable: true',
  /mockOcrAvailable:\s*true/.test(ifaceTxt)
);
record(
  'ocr-provider-interface.js contract has storesImages: false',
  /storesImages:\s*false/.test(ifaceTxt)
);

// 280. ocr-provider-registry.js declares the public surface.
var regTxt = readText('src/ocr-provider-registry.js');
[
  'getOcrProviders',
  'getOcrProviderById',
  'getActiveOcrProvider',
  'setActiveOcrProvider',
  'getOcrProviderRegistryStatus',
  'isRealOcrProviderRegistered',
  'runOcrProviderSelfTest',
  'runActiveOcrProvider'
].forEach(function (fn) {
  record(
    'ocr-provider-registry.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(regTxt)
  );
});
// Mock provider entry: id, type, available, realOcr.
record(
  "ocr-provider-registry.js declares the 'mock' provider",
  regTxt.indexOf("id: 'mock'") !== -1
);
record(
  "ocr-provider-registry.js declares the 'tesseract' provider with realOcr: true",
  regTxt.indexOf("id: 'tesseract'") !== -1 &&
  /id:\s*'tesseract'[\s\S]*?realOcr:\s*true/.test(regTxt)
);
record(
  'ocr-provider-registry.js setActiveOcrProvider blocks real providers with realOcrBlocked',
  regTxt.indexOf("'realOcrBlocked'") !== -1 &&
  /realOcr\s*\|\|\s*[^.]*\.type\s*===\s*'real'/.test(regTxt)
);
record(
  'ocr-provider-registry.js self-test uses synthetic preview metadata only',
  regTxt.indexOf("'self-test'") !== -1 &&
  regTxt.indexOf("width: 1280") !== -1 &&
  regTxt.indexOf("height: 720") !== -1
);

// 281. Step 38 modules do not import any forbidden module.
var step38SourceFiles = [
  'src/ocr-provider-interface.js',
  'src/ocr-provider-registry.js'
];
var step38ForbiddenModules = [
  'tesseract', 'tesseract.js', 'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi', 'node-key-sender'
];
var step38ForbiddenFound = [];
step38SourceFiles.forEach(function (rel) {
  var txt = readText(rel);
  step38ForbiddenModules.forEach(function (mod) {
    var n1 = "require('" + mod + "')";
    var n2 = 'require("' + mod + '")';
    if (txt.indexOf(n1) !== -1 || txt.indexOf(n2) !== -1) {
      step38ForbiddenFound.push(mod + ' in ' + rel);
    }
  });
});
record(
  'no OCR / OpenCV / image-matching / real-input modules required in step 38 source files',
  step38ForbiddenFound.length === 0,
  step38ForbiddenFound.join(', ')
);

// 282. package.json still declares zero of the prohibited modules
//      (re-checked at step 38 — adding the OCR provider registry
//      must NOT pull in any new dependency, in particular
//      tesseract / tesseract.js / opencv*).
//      Step 39 update: `tesseract.js` / `tesseract` are now
//      legitimately declared in package.json (Real OCR Phase 1
//      dependency). Source-file imports of tesseract.js still
//      stay banned in Step-38 modules — see check #281.
if (pkg) {
  var allDeps38 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var pkgForbidden38 = step38ForbiddenModules
    .filter(function (m) { return m !== 'tesseract.js' && m !== 'tesseract' && m !== 'tesseract-ocr' && m !== 'node-tesseract-ocr'; })
    .filter(function (m) {
      return Object.prototype.hasOwnProperty.call(allDeps38, m);
    });
  record(
    'package.json declares no OCR / OpenCV / image-matching / real-input modules at step 38',
    pkgForbidden38.length === 0,
    pkgForbidden38.join(', ')
  );
}

// 283. main.js / preload.js do not expose any ocr.provider.* IPC
//      handler / API at step 38.
var mainTxt38 = readText('main.js');
record(
  'main.js does not register any ocr.provider.* IPC handler at step 38',
  !/'ocr\.provider\./.test(mainTxt38) && !/"ocr\.provider\./.test(mainTxt38)
);
var preloadTxt38 = readText('preload.js');
record(
  'preload.js does not expose any ocrProvider* API at step 38',
  !/ocrProvider[A-Z]/.test(preloadTxt38)
);

// 284. Electron security flags re-checked at step 38.
record(
  'main.js still sets contextIsolation: true (re-checked at step 38)',
  /contextIsolation\s*:\s*true/.test(mainTxt38)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 38)',
  /nodeIntegration\s*:\s*false/.test(mainTxt38)
);
record(
  'src/index.html CSP unchanged at step 38 (no unsafe-inline / unsafe-eval)',
  htmlTxt38.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt38.indexOf('unsafe-inline') === -1 &&
  htmlTxt38.indexOf('unsafe-eval') === -1
);

// 285. Audit allowlist contains the 6 new Step 38 types.
var auditTxt38 = readText('src/audit-events.js');
[
  'ocr.provider.selftest.started',
  'ocr.provider.selftest.completed',
  'ocr.provider.selftest.failed',
  'ocr.provider.selection.blocked',
  'ocr.provider.mock.active',
  'ocr.provider.real.unavailable'
].forEach(function (eventType) {
  record(
    'audit allowlist includes ' + eventType,
    auditTxt38.indexOf("'" + eventType + "'") !== -1
  );
});

// 286. feature-flags.js declares the four new Step 38 flags with
//      safe defaults.
var ffTxt38 = readText('src/feature-flags.js');
record(
  'feature-flags.js declares realOcr: false',
  /realOcr:\s*false/.test(ffTxt38)
);
record(
  'feature-flags.js declares ocrProviderRegistry: true',
  /ocrProviderRegistry:\s*true/.test(ffTxt38)
);
record(
  'feature-flags.js declares ocrMockProvider: true',
  /ocrMockProvider:\s*true/.test(ffTxt38)
);
record(
  'feature-flags.js declares tesseractProvider: false',
  /tesseractProvider:\s*false/.test(ffTxt38)
);

// 287. renderer.js wires the OCR provider diagnostics line.
var rendererTxt38 = readText('src/renderer.js');
record(
  'renderer.js Copy diagnostics has an `OCR provider:` line',
  rendererTxt38.indexOf('OCR provider:') !== -1 &&
  rendererTxt38.indexOf('activeProviderId=') !== -1 &&
  rendererTxt38.indexOf('mockProviderAvailable=') !== -1 &&
  rendererTxt38.indexOf('tesseractProviderAvailable=') !== -1 &&
  rendererTxt38.indexOf('realOcrEnabled=') !== -1
);

// 288. ocr-ui.js renders the readiness card and exposes the
//      self-test button handler.
var ocrUiTxt38 = readText('src/ocr-ui.js');
record(
  'ocr-ui.js renders the OCR readiness card',
  ocrUiTxt38.indexOf('renderOcrProviderReadiness') !== -1 &&
  ocrUiTxt38.indexOf('ocr-readiness-card') !== -1
);
record(
  'ocr-ui.js wires the self-test button to runOcrProviderSelfTestFromUi',
  ocrUiTxt38.indexOf('runOcrProviderSelfTestFromUi') !== -1 &&
  ocrUiTxt38.indexOf('runOcrProviderSelfTest') !== -1
);

// 289. i18n parity is preserved AND the new Step 38 keys exist.
var i18nTxt38 = readText('src/i18n.js');
[
  'ocrProvider',
  'ocrProviders',
  'activeOcrProvider',
  'mockOcrProvider',
  'tesseractOcrProvider',
  'realOcrProvider',
  'realOcrUnavailable',
  'realOcrPlanned',
  'ocrReadiness',
  'providerSelfTest',
  'runProviderSelfTest',
  'providerSelfTestPassed',
  'providerSelfTestFailed',
  'ocrProviderRegistry',
  'mockProviderAvailable',
  'tesseractProviderAvailable',
  'realOcrEnabled',
  'realOcrAllowed',
  'supportedOcrLanguages',
  'realOcrNotConnectedYet',
  'mockProviderCurrentlyUsed',
  'ocrImagesNotStored',
  'ocrRequiresUserAction'
].forEach(function (key) {
  record(
    'i18n declares Step 38 key ' + key,
    new RegExp('\\b' + key + ':\\s*"').test(i18nTxt38)
  );
});

// 290. README / PROJECT_CONTEXT mention Step 38, OCR provider, and
//      that Real OCR is not connected.
var readme38 = readText('README.md');
var ctx38 = readText('PROJECT_CONTEXT.md');
record(
  'README or PROJECT_CONTEXT mentions step 38',
  /step\s*38|шаг\s*38|Step 38|Шаг 38/.test(readme38) ||
  /step\s*38|шаг\s*38|Step 38|Шаг 38/.test(ctx38)
);
record(
  'README or PROJECT_CONTEXT mentions OCR provider',
  /OCR provider|OCR-провайдер|OCR provider registry|OCR provider architecture/i.test(readme38) ||
  /OCR provider|OCR-провайдер|OCR provider registry|OCR provider architecture/i.test(ctx38)
);
record(
  'README or PROJECT_CONTEXT asserts real OCR is not connected at step 38',
  /real OCR.*not connected|real OCR.*not implemented|real OCR.*disabled|настоящий OCR.*не подключ|реальный OCR.*не подключ|Real OCR is not connected/i.test(readme38) ||
  /real OCR.*not connected|real OCR.*not implemented|real OCR.*disabled|настоящий OCR.*не подключ|реальный OCR.*не подключ|Real OCR is not connected/i.test(ctx38)
);

// 291. Step 38 docs sanity.
var planTxt = readText('docs/REAL_OCR_INTEGRATION_PLAN.md');
record(
  'docs/REAL_OCR_INTEGRATION_PLAN.md asserts real OCR not connected at step 38',
  /not connected|not done|not run|architecture only/i.test(planTxt)
);
record(
  'docs/REAL_OCR_INTEGRATION_PLAN.md describes the planned Tesseract provider',
  /Tesseract|tesseract\.js/.test(planTxt)
);
record(
  'docs/REAL_OCR_INTEGRATION_PLAN.md preserves no-real-click invariant',
  /no real click|no real cursor|simulation-only/i.test(planTxt)
);
var ifaceDoc = readText('docs/OCR_PROVIDER_INTERFACE.md');
record(
  'docs/OCR_PROVIDER_INTERFACE.md describes the provider contract',
  /Provider contract|provider contract/.test(ifaceDoc) &&
  /supportedProviders/.test(ifaceDoc) &&
  /storesImages/.test(ifaceDoc)
);
record(
  'docs/OCR_PROVIDER_INTERFACE.md lists the stable error IDs',
  /pixelDataNotAllowed|targetTextMissing|languageInvalid/.test(ifaceDoc)
);

// 292. SECURITY_CHECKLIST + KNOWN_LIMITATIONS reference Step 38.
var secTxt38 = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has an OCR Provider Registry section (Step 38)',
  /OCR Provider Registry|Step 38/.test(secTxt38) &&
  /realOcrBlocked|setActiveOcrProvider|tesseract/i.test(secTxt38)
);
var klTxt38 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md adds Step 38 — Real OCR planned, not connected',
  /Real OCR is planned, not connected|Step 38/i.test(klTxt38)
);

// 293. CHANGELOG mentions Step 38.
record(
  'CHANGELOG.md mentions Step 38 — Real OCR Research + Safe Integration Plan',
  readText('CHANGELOG.md').indexOf('Step 38 — Real OCR Research + Safe Integration Plan') !== -1
);

// 294. NEXT_BRANCH_PLAN.md mentions the Step-38 progress note.
var nbpTxt38 = readText('docs/NEXT_BRANCH_PLAN.md');
record(
  'docs/NEXT_BRANCH_PLAN.md notes Branch A progress at Step 38',
  /Step 38|Branch A.*progress/i.test(nbpTxt38)
);

// =====================================================================
// Step 39 — Real OCR Provider Integration Phase 1
// =====================================================================

// 295. New Step 39 module exists on disk.
record('Step 39 file exists: src/tesseract-ocr-provider.js',
  fileExists('src/tesseract-ocr-provider.js'));

// 296. New Step 39 doc exists on disk.
record('Step 39 doc exists: docs/TESSERACT_PROVIDER.md',
  fileExists('docs/TESSERACT_PROVIDER.md'));

// 297. index.html loads the new <script src="…"> tag, between the
//      OCR provider interface and the OCR provider registry, so the
//      registry can call into the Tesseract shell.
var htmlTxt39 = readText('src/index.html');
var idx39Iface  = htmlTxt39.indexOf('ocr-provider-interface.js');
var idx39Tess   = htmlTxt39.indexOf('tesseract-ocr-provider.js');
var idx39Reg    = htmlTxt39.indexOf('ocr-provider-registry.js');
var idx39OcrUi  = htmlTxt39.indexOf('ocr-ui.js');
record('index.html loads tesseract-ocr-provider.js', idx39Tess !== -1);
record(
  'index.html loads tesseract-ocr-provider.js between the interface and the registry',
  idx39Iface !== -1 && idx39Tess !== -1 && idx39Reg !== -1 &&
  idx39Iface < idx39Tess && idx39Tess < idx39Reg
);
record(
  'index.html loads tesseract-ocr-provider.js before ocr-ui.js',
  idx39Tess !== -1 && idx39OcrUi !== -1 && idx39Tess < idx39OcrUi
);

// 298. tesseract-ocr-provider.js declares the public surface.
var tessTxt = readText('src/tesseract-ocr-provider.js');
[
  'getTesseractProviderInfo',
  'isTesseractProviderAvailable',
  'checkTesseractProviderReadiness',
  'runTesseractSelfTest',
  'recognizeTextWithTesseract',
  'normalizeTesseractResult',
  'mapTesseractBlocks',
  'terminateTesseractWorker',
  'getTesseractProviderDiagnostics'
].forEach(function (fn) {
  record(
    'tesseract-ocr-provider.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(tessTxt)
  );
});
record(
  "tesseract-ocr-provider.js refuses recognise when realOcr/tesseractProvider are off",
  /Real OCR provider is disabled by feature flag/.test(tessTxt) &&
  /blocked:\s*true/.test(tessTxt)
);
record(
  "tesseract-ocr-provider.js never returns realOcr: true unless OCR actually ran",
  /realOcr:\s*false/.test(tessTxt)
);

// 299. The Step-39 provider module never imports any prohibited
//      package directly. It MAY reference `tesseract.js` only via
//      a defensive `require('tesseract.js')` wrapped in try/catch.
//      All other prohibited modules are forbidden.
var step39ForbiddenImports = [
  'tesseract-ocr', 'node-tesseract-ocr',
  'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
  'sharp', 'jimp', 'pixelmatch', 'looks-same',
  'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
  'iohook', 'uiohook-napi', 'node-key-sender'
];
var step39Found = [];
step39ForbiddenImports.forEach(function (mod) {
  var n1 = "require('" + mod + "')";
  var n2 = 'require("' + mod + '")';
  if (tessTxt.indexOf(n1) !== -1 || tessTxt.indexOf(n2) !== -1) step39Found.push(mod);
});
record(
  'tesseract-ocr-provider.js does not require any forbidden module',
  step39Found.length === 0,
  step39Found.join(', ')
);

// 300. package.json declares tesseract.js (the only newly allowed
//      dependency at Step 39) and still declares zero of the
//      forbidden modules.
if (pkg) {
  var allDeps39 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  record(
    'package.json declares tesseract.js as a dependency at Step 39',
    Object.prototype.hasOwnProperty.call(allDeps39, 'tesseract.js')
  );
  var step39Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'sharp', 'jimp', 'pixelmatch', 'looks-same',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender'
  ];
  var pkgForbidden39 = step39Forbidden.filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps39, m);
  });
  record(
    'package.json declares no OCR-engine / OpenCV / image-matching / real-input modules at step 39',
    pkgForbidden39.length === 0,
    pkgForbidden39.join(', ')
  );
}

// 301. main.js / preload.js do not expose any ocr.tesseract.* IPC
//      handler / API at step 39.
var mainTxt39 = readText('main.js');
record(
  'main.js does not register any ocr.tesseract.* IPC handler at step 39',
  !/'ocr\.tesseract\./.test(mainTxt39) && !/"ocr\.tesseract\./.test(mainTxt39)
);
record(
  'main.js does not register any ocr.provider.* IPC handler at step 39',
  !/'ocr\.provider\./.test(mainTxt39) && !/"ocr\.provider\./.test(mainTxt39)
);
var preloadTxt39 = readText('preload.js');
record(
  'preload.js does not expose any ocrTesseract* / tesseractProvider* API at step 39',
  !/ocrTesseract[A-Z]/.test(preloadTxt39) && !/tesseractProvider[A-Z]/.test(preloadTxt39)
);

// 302. Electron security flags re-checked at step 39.
record(
  'main.js still sets contextIsolation: true (re-checked at step 39)',
  /contextIsolation\s*:\s*true/.test(mainTxt39)
);
record(
  'main.js still sets nodeIntegration: false (re-checked at step 39)',
  /nodeIntegration\s*:\s*false/.test(mainTxt39)
);
record(
  'src/index.html CSP unchanged at step 39 (no unsafe-inline / unsafe-eval)',
  htmlTxt39.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt39.indexOf('unsafe-inline') === -1 &&
  htmlTxt39.indexOf('unsafe-eval') === -1
);

// 303. Audit allowlist contains the 6 new Step 39 types.
var auditTxt39 = readText('src/audit-events.js');
[
  'ocr.tesseract.readiness.requested',
  'ocr.tesseract.readiness.completed',
  'ocr.tesseract.readiness.failed',
  'ocr.tesseract.blockedByFeatureFlag',
  'ocr.provider.tesseract.detected',
  'ocr.provider.tesseract.unavailable'
].forEach(function (eventType) {
  record(
    'audit allowlist includes ' + eventType,
    auditTxt39.indexOf("'" + eventType + "'") !== -1
  );
});

// 304. feature-flags.js keeps Step 39 safe defaults.
var ffTxt39 = readText('src/feature-flags.js');
record(
  'feature-flags.js still declares realOcr: false at Step 39',
  /realOcr:\s*false/.test(ffTxt39)
);
record(
  'feature-flags.js still declares tesseractProvider: false at Step 39',
  /tesseractProvider:\s*false/.test(ffTxt39)
);
record(
  'feature-flags.js still declares ocrMockProvider: true at Step 39',
  /ocrMockProvider:\s*true/.test(ffTxt39)
);
record(
  'feature-flags.js still declares simulationOnly: true at Step 39',
  /simulationOnly:\s*true/.test(ffTxt39)
);
record(
  'feature-flags.js exports getOcrFeatureStatus',
  /function\s+getOcrFeatureStatus\s*\(/.test(ffTxt39)
);

// 305. Registry honours Step 39 selection rule.
record(
  "ocr-provider-registry.js gates tesseract selection by both flags",
  /_evaluateTesseractSelectability/.test(regTxt) &&
  /flagsAllow/.test(regTxt) &&
  /engineLoadable/.test(regTxt)
);
record(
  "ocr-provider-registry.js exports getTesseractProviderStatus",
  /function\s+getTesseractProviderStatus\s*\(/.test(regTxt)
);

// 306. ocr-ui.js renders the Step 39 provider status card and the
//      Check Tesseract readiness button.
var ocrUiTxt39 = readText('src/ocr-ui.js');
record(
  'ocr-ui.js renders the OCR provider status card',
  ocrUiTxt39.indexOf('renderOcrProviderStatusCard') !== -1 &&
  ocrUiTxt39.indexOf('ocr-provider-status-card') !== -1
);
record(
  'ocr-ui.js wires Check Tesseract readiness to runTesseractReadinessCheckFromUi',
  ocrUiTxt39.indexOf('runTesseractReadinessCheckFromUi') !== -1 &&
  ocrUiTxt39.indexOf("checkTesseractProviderReadiness") !== -1
);
record(
  'ocr-ui.js does NOT add an Enable real OCR toggle at step 39',
  ocrUiTxt39.indexOf('enableRealOcr') === -1 &&
  ocrUiTxt39.indexOf('Enable real OCR') === -1 &&
  ocrUiTxt39.indexOf('Включить реальный OCR') === -1
);

// 307. renderer.js wires the Real OCR diagnostics line.
var rendererTxt39 = readText('src/renderer.js');
record(
  'renderer.js Copy diagnostics has a `Real OCR:` line',
  rendererTxt39.indexOf('Real OCR:') !== -1 &&
  rendererTxt39.indexOf('tesseractDependencyPresent=') !== -1 &&
  rendererTxt39.indexOf('tesseractProviderEnabled=') !== -1 &&
  rendererTxt39.indexOf('realOcrAutoRun=false') !== -1
);

// 308. i18n parity is preserved AND the new Step 39 keys exist.
var i18nTxt39 = readText('src/i18n.js');
[
  'tesseractProvider',
  'tesseractInstalled',
  'tesseractEnabled',
  'checkTesseractReadiness',
  'tesseractReadiness',
  'tesseractReady',
  'tesseractUnavailable',
  'tesseractBlockedByFeatureFlag',
  'realOcrFeatureFlag',
  'realOcrAutoRunDisabled',
  'realOcrProviderDisabled',
  'realOcrWillBeEnabledLater',
  'activeProviderMock',
  'activeProviderTesseract',
  'ocrProviderStatus',
  'tesseractDependencyPresent',
  'tesseractReadinessCheckCompleted',
  'tesseractReadinessCheckFailed'
].forEach(function (key) {
  record(
    'i18n declares Step 39 key ' + key,
    new RegExp('\\b' + key + ':\\s*"').test(i18nTxt39)
  );
});

// 309. README / PROJECT_CONTEXT mention Step 39, Tesseract provider,
//      and that real OCR is disabled by default.
var readme39 = readText('README.md');
var ctx39 = readText('PROJECT_CONTEXT.md');
record(
  'README or PROJECT_CONTEXT mentions step 39',
  /step\s*39|шаг\s*39|Step 39|Шаг 39/.test(readme39) ||
  /step\s*39|шаг\s*39|Step 39|Шаг 39/.test(ctx39)
);
record(
  'README or PROJECT_CONTEXT mentions Tesseract provider',
  /Tesseract\s+provider|Tesseract\s+OCR\s+provider|Tesseract\-провайдер|Tesseract OCR\-провайдер/i.test(readme39) ||
  /Tesseract\s+provider|Tesseract\s+OCR\s+provider|Tesseract\-провайдер|Tesseract OCR\-провайдер/i.test(ctx39)
);
record(
  'README or PROJECT_CONTEXT asserts real OCR is disabled by default',
  /real OCR.*disabled|real OCR.*off by default|real OCR.*not enabled|real OCR.*по умолчанию.*выключ|real OCR.*disabled by default|настоящий OCR.*выключен|реальный OCR.*выключен|tesseractProvider:\s*false|tesseractProvider=false|disabled by feature flag/i.test(readme39) ||
  /real OCR.*disabled|real OCR.*off by default|real OCR.*not enabled|настоящий OCR.*выключен|реальный OCR.*выключен|tesseractProvider:\s*false|tesseractProvider=false|disabled by feature flag/i.test(ctx39)
);

// 310. Step 39 docs sanity.
var tessDocTxt = readText('docs/TESSERACT_PROVIDER.md');
record(
  'docs/TESSERACT_PROVIDER.md asserts the provider is disabled by default',
  /disabled by default|disabled by feature flag|off by default/i.test(tessDocTxt)
);
record(
  'docs/TESSERACT_PROVIDER.md describes the dependency and feature flag',
  /tesseract\.js/i.test(tessDocTxt) &&
  /feature flag|feature\-флаг/i.test(tessDocTxt)
);
record(
  'docs/TESSERACT_PROVIDER.md preserves the no-real-click invariant',
  /no real click|never click|simulation\-only/i.test(tessDocTxt)
);

// 311. CHANGELOG mentions Step 39.
record(
  'CHANGELOG.md mentions Step 39 — Real OCR Provider Integration Phase 1',
  readText('CHANGELOG.md').indexOf('Step 39 — Real OCR Provider Integration Phase 1') !== -1
);

// 312. SECURITY_CHECKLIST + KNOWN_LIMITATIONS reference Step 39.
var secTxt39 = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md adds a Step 39 / Tesseract provider section',
  /Step 39|Tesseract provider|Tesseract OCR provider/i.test(secTxt39) &&
  /disabled by default|disabled by feature flag|off by default/i.test(secTxt39)
);
var klTxt39 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md adds the Step 39 Tesseract limitation',
  /Step 39|Tesseract provider/i.test(klTxt39) &&
  /disabled by feature flag|disabled by default/i.test(klTxt39)
);

// 313. REAL_OCR_INTEGRATION_PLAN mentions Step 39 phase 1.
var planTxt39 = readText('docs/REAL_OCR_INTEGRATION_PLAN.md');
record(
  'docs/REAL_OCR_INTEGRATION_PLAN.md mentions Step 39 phase 1',
  /Step 39|Phase 1|phase 1/.test(planTxt39)
);

// =====================================================================
// Steps 40-41 — Real OCR UI Activation + text_click / Visual Builder
// =====================================================================

// 314. tesseract.js stays declared in package.json (Step 39
//      invariant carried forward to Step 41).
if (pkg) {
  var allDeps41 = Object.assign({},
    pkg.dependencies || {}, pkg.devDependencies || {}, pkg.optionalDependencies || {});
  record(
    'package.json declares tesseract.js as a dependency at Step 41',
    Object.prototype.hasOwnProperty.call(allDeps41, 'tesseract.js')
  );
  // Step 41 forbidden modules — same shape as Step 39, plus we
  // explicitly forbid every native/real-input package.
  var step41Forbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'sharp', 'jimp', 'pixelmatch', 'looks-same',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender'
  ];
  var pkgForbidden41 = step41Forbidden.filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDeps41, m);
  });
  record(
    'package.json declares no OCR-engine / OpenCV / image-matching / real-input modules at step 41',
    pkgForbidden41.length === 0,
    pkgForbidden41.join(', ')
  );
}

// 315. feature-flags.js exposes the runtime overlay surface.
var ffTxt41 = readText('src/feature-flags.js');
[
  'setRuntimeFeatureFlag',
  'getRuntimeFeatureFlags',
  'resetRuntimeFeatureFlags'
].forEach(function (fn) {
  record(
    'feature-flags.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(ffTxt41)
  );
});
// Safe defaults must remain false in the frozen base map.
record(
  'feature-flags.js base defaults still pin realOcr: false at Step 41',
  /FEATURE_FLAGS\s*=\s*Object\.freeze\(\{[\s\S]*?realOcr:\s*false/.test(ffTxt41)
);
record(
  'feature-flags.js base defaults still pin tesseractProvider: false at Step 41',
  /FEATURE_FLAGS\s*=\s*Object\.freeze\(\{[\s\S]*?tesseractProvider:\s*false/.test(ffTxt41)
);
record(
  'feature-flags.js base defaults still pin simulationOnly: true at Step 41',
  /FEATURE_FLAGS\s*=\s*Object\.freeze\(\{[\s\S]*?simulationOnly:\s*true/.test(ffTxt41)
);
record(
  'feature-flags.js runtime overlay can only flip realOcr / tesseractProvider',
  (function () {
    var m = ffTxt41.match(/_RUNTIME_TOGGLABLE_FLAGS\s*=\s*\[([^\]]*)\]/);
    var arr = m ? m[1] : '';
    // Step 47 expanded the whitelist to also allow the session-only
    // real coordinate-click gate. image/text/keyboard real flags must
    // still NOT be runtime-togglable.
    return arr.indexOf('realOcr') !== -1 &&
           arr.indexOf('tesseractProvider') !== -1 &&
           arr.indexOf('realImageClick') === -1 &&
           arr.indexOf('realTextClick') === -1;
  })()
);
record(
  'feature-flags.js getOcrFeatureStatus exposes realOcrEnabledForSession',
  /realOcrEnabledForSession/.test(ffTxt41)
);

// 316. Tesseract provider implements an async recognise call.
var tessTxt41 = readText('src/tesseract-ocr-provider.js');
record(
  'tesseract-ocr-provider.js declares recognizeTextWithTesseract as async',
  /async\s+function\s+recognizeTextWithTesseract\s*\(/.test(tessTxt41)
);
record(
  'tesseract-ocr-provider.js still refuses recognise when realOcr/tesseractProvider are off',
  /Real OCR provider is disabled by feature flag/.test(tessTxt41) &&
  /blocked:\s*true/.test(tessTxt41)
);
record(
  'tesseract-ocr-provider.js dispatches to engine.recognize',
  /engine\.recognize\s*\(/.test(tessTxt41)
);
var tessTxt41Code = tessTxt41
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/\/\/[^\n]*$/gm, '');
record(
  'tesseract-ocr-provider.js never sets realClick to true',
  !/realClick:\s*true/.test(tessTxt41Code)
);
record(
  'tesseract-ocr-provider.js exports cancelCurrentTesseractRecognition',
  /function\s+cancelCurrentTesseractRecognition\s*\(/.test(tessTxt41)
);
record(
  'tesseract-ocr-provider.js result envelope carries mode: real-ocr',
  /mode:\s*['"]real-ocr['"]/.test(tessTxt41)
);
record(
  'tesseract-ocr-provider.js never imports any forbidden module via require',
  !/require\(['"]tesseract-ocr['"]\)/.test(tessTxt41) &&
  !/require\(['"]opencv/i.test(tessTxt41) &&
  !/require\(['"]robotjs['"]\)/.test(tessTxt41) &&
  !/require\(['"]iohook['"]\)/.test(tessTxt41)
);

// 317. action-pipeline accepts text_click with realOcr: true as a
//      source marker (Step 41) but still rejects realClick: true.
var apTxt41 = readText('src/action-pipeline.js');
record(
  'action-pipeline.js accepts text_click realOcr=true as a source marker (Step 41)',
  !/text_click\s+realOcr=true\s+is\s+blocked/.test(apTxt41) &&
  /text_click\s+realClick=true\s+is\s+blocked/.test(apTxt41)
);
record(
  'action-pipeline.js audit payload propagates realOcr / ocrProvider',
  /realOcr:\s*action\.realOcr === true/.test(apTxt41) &&
  /ocrProvider:\s*typeof action\.ocrProvider/.test(apTxt41)
);

// 318. scenario-manager validates ocrProvider on text_click scenarios.
var smTxt41 = readText('src/scenario-manager.js');
record(
  'scenario-manager.js validates ocrProvider for text_click scenarios',
  /TEXT_CLICK_ALLOWED_OCR_PROVIDERS\s*=\s*\[\s*['"]mock['"],\s*['"]tesseract['"]\s*\]/.test(smTxt41) &&
  /OCR provider must be mock or tesseract/.test(smTxt41)
);
record(
  'scenario-manager.js persists ocrProvider in text_click settings',
  /ocrProvider:\s*\(typeof input\.ocrProvider === 'string'/.test(smTxt41)
);

// 319. click-engine branches on settings.ocrProvider for text_click.
var ceTxt41 = readText('src/click-engine.js');
record(
  'click-engine.js branches text_click on desiredOcrProvider',
  /desiredOcrProvider/.test(ceTxt41) &&
  /sSettings\.ocrProvider === 'tesseract'/.test(ceTxt41)
);
record(
  'click-engine.js refuses tesseract path without runtime opt-in',
  /tesseract-disabled-by-flag/.test(ceTxt41) &&
  /Tesseract OCR is disabled/.test(ceTxt41)
);
record(
  'click-engine.js text_click action stays simulation-only (realClick: false)',
  /realClick:\s*false[\s\S]*?type:\s*'text_click'/.test(ceTxt41) ||
  /type:\s*'text_click'[\s\S]*?realClick:\s*false/.test(ceTxt41)
);

// 320. text-click-test-tools.js becomes async + provider-aware.
var tctToolsTxt = readText('src/text-click-test-tools.js');
record(
  'text-click-test-tools.js declares runTextClickTest as async',
  /async\s+function\s+runTextClickTest\s*\(/.test(tctToolsTxt)
);
record(
  'text-click-test-tools.js dispatches to recognizeTextWithTesseract for the tesseract path',
  /recognizeTextWithTesseract/.test(tctToolsTxt) &&
  /desiredProvider === 'tesseract'/.test(tctToolsTxt)
);
record(
  'text-click-test-tools.js refuses tesseract test without session opt-in',
  /tesseractDisabledByFeatureFlag/.test(tctToolsTxt)
);

// 321. text-click-test-ui.js awaits the async run helper.
var tctUiTxt41 = readText('src/text-click-test-ui.js');
record(
  'text-click-test-ui.js awaits runTextClickTest',
  /await\s+runTextClickTest\s*\(/.test(tctUiTxt41)
);

// 322. ocr-ui.js renders the four provider control buttons + the
//      Run-Real-OCR button + the progress card.
var ocrUiTxt41 = readText('src/ocr-ui.js');
[
  'ocr-provider-controls',
  'ocr-provider-use-mock-btn',
  'ocr-provider-enable-tesseract-btn',
  'ocr-provider-use-tesseract-btn',
  'ocr-provider-disable-btn',
  'ocr-run-real-button',
  'ocr-progress-card'
].forEach(function (cls) {
  record(
    'ocr-ui.js declares ' + cls,
    ocrUiTxt41.indexOf(cls) !== -1
  );
});
record(
  'ocr-ui.js wires the Enable-Tesseract button to setRuntimeFeatureFlag',
  /_ocrEnableTesseractForSessionFromUi/.test(ocrUiTxt41) &&
  /setRuntimeFeatureFlag\s*\(\s*['"]realOcr['"]\s*,\s*true\s*\)/.test(ocrUiTxt41) &&
  /setRuntimeFeatureFlag\s*\(\s*['"]tesseractProvider['"]\s*,\s*true\s*\)/.test(ocrUiTxt41)
);
record(
  'ocr-ui.js wires the Disable-Real-OCR button to resetRuntimeFeatureFlags',
  /resetRuntimeFeatureFlags\s*\(/.test(ocrUiTxt41)
);
record(
  'ocr-ui.js renders the OCR progress card',
  /renderOcrProgressCard/.test(ocrUiTxt41) &&
  /ocr-progress-bar/.test(ocrUiTxt41)
);
record(
  'ocr-ui.js Run-Real-OCR button stays disabled without session opt-in',
  /realOcrEnabledForSession/.test(ocrUiTxt41) &&
  /realBtn\.disabled\s*=\s*true/.test(ocrUiTxt41)
);

// 323. Audit allowlist contains the 8 new Step-40 types.
var auditTxt41 = readText('src/audit-events.js');
[
  'ocr.real.enabledForSession',
  'ocr.real.disabled',
  'ocr.real.started',
  'ocr.real.progress',
  'ocr.real.completed',
  'ocr.real.failed',
  'ocr.real.blocked',
  'ocr.provider.switched'
].forEach(function (eventType) {
  record(
    'audit allowlist includes ' + eventType,
    auditTxt41.indexOf("'" + eventType + "'") !== -1
  );
});

// 324. text_click form has the OCR provider select.
var htmlTxt41 = readText('src/index.html');
record(
  'index.html text_click form has the OCR provider select',
  htmlTxt41.indexOf('input-text-ocr-provider') !== -1 &&
  htmlTxt41.indexOf('text-click-ocr-provider-hint') !== -1
);
record(
  'index.html best-effort loads tesseract.min.js from node_modules',
  htmlTxt41.indexOf('node_modules/tesseract.js/dist/tesseract.min.js') !== -1
);

// 325. Visual Builder draft includes ocrProvider and exposes it.
var vbTxt41 = readText('src/visual-builder.js');
record(
  'visual-builder.js text_click draft persists ocrProvider',
  /ocrProvider:\s+draftProvider/.test(vbTxt41) &&
  /getActiveOcrProvider/.test(vbTxt41)
);
var vbUiTxt41 = readText('src/visual-builder-ui.js');
record(
  'visual-builder-ui.js draft preview surfaces ocrProviderUsed',
  /ocrProviderUsed/.test(vbUiTxt41)
);
record(
  'visual-builder-ui.js draft fill propagates input-text-ocr-provider',
  /input-text-ocr-provider/.test(vbUiTxt41)
);

// 326. i18n parity is preserved AND the new Step 40-41 keys exist.
var i18nTxt41 = readText('src/i18n.js');
[
  'enableTesseractForSession',
  'disableRealOcr',
  'useMockOcr',
  'useTesseractOcr',
  'runRealOcr',
  'realOcrProgress',
  'ocrStage',
  'loadingOcrLanguage',
  'recognizingText',
  'realOcrCompleted',
  'realOcrFailed',
  'realOcrBlocked',
  'tesseractMustBeEnabled',
  'ocrProviderSelect',
  'realOcrMayBeSlower',
  'noClicksWillBePerformed',
  'ocrCancellationPlanned',
  'languageDataFailed',
  'targetTextNotFound',
  'ocrProviderUsed'
].forEach(function (key) {
  record(
    'i18n declares Step 40-41 key ' + key,
    new RegExp('\\b' + key + ':\\s*"').test(i18nTxt41)
  );
});

// 327. README / PROJECT_CONTEXT mention Steps 40-41.
var readme41 = readText('README.md');
var ctx41 = readText('PROJECT_CONTEXT.md');
record(
  'README or PROJECT_CONTEXT mentions step 40',
  /step\s*40|шаг\s*40|Step 40|Шаг 40/.test(readme41) ||
  /step\s*40|шаг\s*40|Step 40|Шаг 40/.test(ctx41)
);
record(
  'README or PROJECT_CONTEXT mentions step 41',
  /step\s*41|шаг\s*41|Step 41|Шаг 41/.test(readme41) ||
  /step\s*41|шаг\s*41|Step 41|Шаг 41/.test(ctx41)
);
record(
  'README or PROJECT_CONTEXT mentions Tesseract / session',
  /(Tesseract|tesseract)\s+(provider|OCR)|сессии|session/i.test(readme41) ||
  /(Tesseract|tesseract)\s+(provider|OCR)|сессии|session/i.test(ctx41)
);

// 328. Step 40 doc is present.
record(
  'docs/REAL_OCR_USAGE.md exists',
  fileExists('docs/REAL_OCR_USAGE.md')
);
var realOcrUsage = readText('docs/REAL_OCR_USAGE.md');
record(
  'docs/REAL_OCR_USAGE.md describes Enable Tesseract for session',
  /Enable Tesseract for this session|Enable Tesseract for the session|Включить Tesseract/i.test(realOcrUsage)
);
record(
  'docs/REAL_OCR_USAGE.md preserves the no-real-click invariant',
  /no real click|never click|simulation\-only/i.test(realOcrUsage)
);

// 329. CHANGELOG mentions Steps 40 and 41.
var clog41 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 40 — Real OCR UI Activation',
  clog41.indexOf('Step 40 — Real OCR UI Activation') !== -1
);
record(
  'CHANGELOG.md mentions Step 41 — Real OCR for text_click and Visual Builder',
  clog41.indexOf('Step 41 — Real OCR for text_click and Visual Builder') !== -1
);

// =====================================================================
// Steps 42-43 — Smart OCR/Image QA + Bugfix Pass + Packaging/Release
// =====================================================================

// 330. Step-42 bugfixes — scenario-presets carries ocrProvider on
//      the text_click preset and the clone whitelist preserves it.
var presetsTxt42 = readText('src/scenario-presets.js');
record(
  "scenario-presets.js text_click preset declares ocrProvider: 'mock'",
  /id:\s*'preset-text-click-basic'[\s\S]*?ocrProvider:\s*'mock'/.test(presetsTxt42)
);
record(
  'scenario-presets.js clone whitelist includes ocrProvider',
  /'targetText',\s*'language',\s*'matchMode',\s*'caseSensitive',\s*'ocrProvider'/.test(presetsTxt42)
);
record(
  'scenario-presets.js validateScenarioPreset checks ocrProvider for text_click',
  /presetOcrProviderInvalid/.test(presetsTxt42)
);
record(
  'scenario-presets.js _sanitizeVisualContext preserves ocrProvider',
  /ctx\.ocrProvider === 'mock'\s*\|\|\s*ctx\.ocrProvider === 'tesseract'/.test(presetsTxt42)
);

// 331. Step-42 bugfix — buildVisualContextFromState consults the
//      active OCR provider.
var vbTxt42 = readText('src/visual-builder.js');
record(
  'visual-builder.js buildVisualContextFromState consults getActiveOcrProvider',
  /buildVisualContextFromState[\s\S]*?getActiveOcrProvider/.test(vbTxt42) ||
  (vbTxt42.indexOf('buildVisualContextFromState') !== -1 &&
   /getActiveOcrProvider[\s\S]*?ctx\.ocrProvider/.test(vbTxt42))
);

// 332. Step-42 bugfix — isRealOcrAllowed reflects the merged
//      flags. The Step-38 invariant "never returns true" is
//      replaced by two more specific invariants.
//      (Already added above as #279 update; re-checked here for
//      clarity.)
var ifaceTxt42 = readText('src/ocr-provider-interface.js');
record(
  'ocr-provider-interface.js isRealOcrAllowed retires the Step-38 hard-stop',
  !/Step 38 hard-stop:\s*even if every flag/.test(ifaceTxt42)
);

// 333. Step-42 bugfix — getOcrProviderRegistryStatus reads
//      realOcrEnabledForSession.
var regTxt42 = readText('src/ocr-provider-registry.js');
record(
  'ocr-provider-registry.js getOcrProviderRegistryStatus reads realOcrEnabledForSession',
  /realOcrEnabledForSession/.test(regTxt42)
);

// 334. Smart-beta health module exists and exports the public
//      surface.
record(
  'src/smart-beta-health.js exists',
  fileExists('src/smart-beta-health.js')
);
var sbhTxt = readText('src/smart-beta-health.js');
['getSmartBetaHealth', 'getSmartBetaHealthDiagnostics', 'countSmartBetaReleaseBlockers'].forEach(function (fn) {
  record(
    'smart-beta-health.js exports ' + fn,
    new RegExp('function\\s+' + fn + '\\s*\\(').test(sbhTxt)
  );
});
record(
  'smart-beta-health.js never sets realClicksEnabled to true',
  !/realClicksEnabled:\s*true/.test(sbhTxt)
);
record(
  'smart-beta-health.js never imports any forbidden module',
  !/require\(['"](tesseract-ocr|node-tesseract-ocr|opencv|sharp|jimp|pixelmatch|looks-same|robotjs|nut-js|nutjs|@nut-tree|iohook|uiohook-napi|node-key-sender)/i.test(sbhTxt)
);

// 335. index.html loads smart-beta-health.js.
var htmlTxt42 = readText('src/index.html');
record(
  'index.html loads smart-beta-health.js',
  htmlTxt42.indexOf('smart-beta-health.js') !== -1
);
record(
  'index.html loads smart-beta-health.js before renderer.js',
  htmlTxt42.indexOf('smart-beta-health.js') < htmlTxt42.indexOf('renderer.js')
);

// 336. renderer.js Copy diagnostics has the Smart beta line.
var rendererTxt42 = readText('src/renderer.js');
record(
  'renderer.js Copy diagnostics has a `Smart beta:` line',
  /Smart beta:[\s\S]*?screenCaptureReady=[\s\S]*?releaseBlockersCount=/.test(rendererTxt42) &&
  rendererTxt42.indexOf('realClicksEnabled=false') !== -1
);

// 337. Audit allowlist includes the 5 new Step-42 types.
var auditTxt42 = readText('src/audit-events.js');
[
  'smartBeta.qa.started',
  'smartBeta.qa.completed',
  'smartBeta.blocker.found',
  'smartBeta.blocker.fixed',
  'smartBeta.releaseCandidate.checked'
].forEach(function (eventType) {
  record(
    'audit allowlist includes ' + eventType,
    auditTxt42.indexOf("'" + eventType + "'") !== -1
  );
});

// 338. i18n parity is preserved AND the new Step-42 keys exist.
var i18nTxt42 = readText('src/i18n.js');
[
  'smartBetaStatus',
  'smartBetaQa',
  'screenCaptureReady',
  'regionSelectorReady',
  'templatesReady',
  'templateMatchingReady',
  'imageClickReady',
  'ocrMockReady',
  'tesseractProviderReady',
  'textClickReady',
  'visualBuilderReady',
  'presetsReady',
  'releaseBlockersCount',
  'readyAfterManualQa',
  'manualOcrTestingRequired',
  'smartBetaManualTests',
  'smartBetaQaReport'
].forEach(function (key) {
  record(
    'i18n declares Step-42 key ' + key,
    new RegExp('\\b' + key + ':\\s*"').test(i18nTxt42)
  );
});

// 339. Step-42 docs exist and assert simulation-only.
[
  'docs/SMART_BETA_QA_REPORT.md',
  'docs/SMART_BETA_MANUAL_TESTS.md'
].forEach(function (rel) {
  record('Step-42 doc exists: ' + rel, fileExists(rel));
});
var qaReport = readText('docs/SMART_BETA_QA_REPORT.md');
record(
  'docs/SMART_BETA_QA_REPORT.md asserts simulation-only',
  /simulation-only|simulation only/i.test(qaReport)
);
record(
  'docs/SMART_BETA_QA_REPORT.md mentions ready after manual QA',
  /Ready after manual packaged-app QA|ready after manual/i.test(qaReport)
);
record(
  'docs/SMART_BETA_QA_REPORT.md mentions manual OCR testing required',
  /Manual OCR testing is required|manual.*OCR.*required/i.test(qaReport)
);
var manualTests = readText('docs/SMART_BETA_MANUAL_TESTS.md');
record(
  'docs/SMART_BETA_MANUAL_TESTS.md uses Status: Not tested format',
  /Status:\*?\*?\s*Not tested/.test(manualTests)
);
record(
  'docs/SMART_BETA_MANUAL_TESTS.md covers Real OCR session',
  /Real OCR session|Real OCR/i.test(manualTests)
);
record(
  'docs/SMART_BETA_MANUAL_TESTS.md preserves no-real-click invariant',
  /no real click|never click|simulation-only/i.test(manualTests)
);

// 340. README/PROJECT_CONTEXT mention Steps 42-43 and smart beta.
var readme42 = readText('README.md');
var ctx42 = readText('PROJECT_CONTEXT.md');
record(
  'README or PROJECT_CONTEXT mentions step 42',
  /step\s*42|шаг\s*42|Step 42|Шаг 42/.test(readme42) ||
  /step\s*42|шаг\s*42|Step 42|Шаг 42/.test(ctx42)
);
record(
  'README or PROJECT_CONTEXT mentions step 43',
  /step\s*43|шаг\s*43|Step 43|Шаг 43/.test(readme42) ||
  /step\s*43|шаг\s*43|Step 43|Шаг 43/.test(ctx42)
);
record(
  'README or PROJECT_CONTEXT mentions smart beta',
  /smart\s+beta|Smart Beta|smart desktop beta/i.test(readme42) ||
  /smart\s+beta|Smart Beta|smart desktop beta/i.test(ctx42)
);

// 341. CHANGELOG mentions Step 42 + Step 43.
var changelogTxt42 = readText('CHANGELOG.md');
record(
  'CHANGELOG.md mentions Step 42 — Smart OCR/Image QA + Bugfix Pass',
  /Step 42 — Smart OCR\/Image QA \+ Bugfix Pass/.test(changelogTxt42)
);
record(
  'CHANGELOG.md mentions Step 43 — Smart Beta Packaging\/Release Pass',
  /Step 43 — Smart Beta Packaging\/Release Pass/.test(changelogTxt42)
);

// 342. SMOKE_TESTS / SECURITY_CHECKLIST / KNOWN_LIMITATIONS get
//      smart-beta sections.
var smoke42 = readText('docs/SMOKE_TESTS.md');
record(
  'docs/SMOKE_TESTS.md has a Smart Beta smoke sequence',
  /Smart Beta smoke sequence|Step 42/i.test(smoke42)
);
var sec42 = readText('docs/SECURITY_CHECKLIST.md');
record(
  'docs/SECURITY_CHECKLIST.md has a smart beta safety section',
  /Smart beta safety|smart-beta safety|Step 42/i.test(sec42) &&
  /realDesktopActions|action-pipeline|realClick/i.test(sec42)
);
var kl42 = readText('docs/KNOWN_LIMITATIONS.md');
record(
  'docs/KNOWN_LIMITATIONS.md has Step 42 limitations section',
  /Step 42|Smart Beta/i.test(kl42) &&
  /Tesseract|language data|simulation-only/i.test(kl42)
);

// 343. Step-43 release docs exist.
[
  'docs/SMART_BETA_RELEASE_NOTES.md',
  'docs/SMART_BETA_RELEASE_CHECKLIST.md',
  'docs/SMART_BETA_RELEASE_DRAFT.md'
].forEach(function (rel) {
  record('Step-43 doc exists: ' + rel, fileExists(rel));
});

// 344. package.json declares the smart-beta version.
if (pkg) {
  record(
    'package.json version is 0.2.0-beta',
    pkg.version === '0.2.0-beta'
  );
  record(
    'package.json description mentions smart desktop beta',
    typeof pkg.description === 'string' &&
    /smart desktop beta/i.test(pkg.description)
  );
}

// 345. package.json build.files excludes private / temp folders.
if (pkg && pkg.build && Array.isArray(pkg.build.files)) {
  var filesArr = pkg.build.files.join('\n');
  [
    '!**/userData/**',
    '!**/.env',
    '!**/screenshots/**',
    '!dist/**',
    '!coverage/**'
  ].forEach(function (pattern) {
    record(
      'package.json build.files excludes ' + pattern,
      filesArr.indexOf(pattern) !== -1
    );
  });
  record(
    'package.json build.files includes tesseract.js node_modules path',
    filesArr.indexOf('node_modules/tesseract.js/**/*') !== -1
  );
}

// 346. Step-43 docs preserve simulation-only stance.
var notes43 = readText('docs/SMART_BETA_RELEASE_NOTES.md');
record(
  'docs/SMART_BETA_RELEASE_NOTES.md asserts simulation-only',
  /simulation-only|simulation only/i.test(notes43) &&
  /no real click|realClick: true|never click/i.test(notes43)
);
var checklist43 = readText('docs/SMART_BETA_RELEASE_CHECKLIST.md');
record(
  'docs/SMART_BETA_RELEASE_CHECKLIST.md mentions v0.2.0-smart-beta',
  /v0\.2\.0-smart-beta/.test(checklist43)
);
record(
  'docs/SMART_BETA_RELEASE_CHECKLIST.md preserves no-real-click invariant',
  /no real click|simulation-only|realClick: true/i.test(checklist43)
);
var draft43 = readText('docs/SMART_BETA_RELEASE_DRAFT.md');
record(
  'docs/SMART_BETA_RELEASE_DRAFT.md ready for GitHub release editor',
  /ClickFlow Smart Desktop Beta/.test(draft43) &&
  /v0\.2\.0-smart-beta/.test(draft43)
);

// 347. RELEASE_NOTES + TAG_AND_RELEASE_GUIDE link to smart beta.
var rn = readText('RELEASE_NOTES.md');
record(
  'RELEASE_NOTES.md mentions Smart Desktop Beta target',
  /Smart Desktop Beta|v0\.2\.0-smart-beta/.test(rn)
);
var tagGuide = readText('docs/TAG_AND_RELEASE_GUIDE.md');
record(
  'docs/TAG_AND_RELEASE_GUIDE.md has a smart-beta tag plan',
  /Smart Desktop Beta tag plan|v0\.2\.0-smart-beta/.test(tagGuide)
);

// 348. Smart Beta safety re-check — package.json still declares
//      zero of the forbidden modules.
if (pkg) {
  var allDepsSb = Object.assign({},
    pkg.dependencies || {}, pkg.devDependencies || {}, pkg.optionalDependencies || {});
  var smartBetaForbidden = [
    'tesseract-ocr', 'node-tesseract-ocr',
    'opencv4nodejs', '@u4/opencv4nodejs', 'opencv.js', 'opencv-js',
    'sharp', 'jimp', 'pixelmatch', 'looks-same',
    'robotjs', 'nut-js', 'nutjs', '@nut-tree/nut-js',
    'iohook', 'uiohook-napi', 'node-key-sender'
  ];
  var pkgForbiddenSb = smartBetaForbidden.filter(function (m) {
    return Object.prototype.hasOwnProperty.call(allDepsSb, m);
  });
  record(
    'Smart Beta — package.json declares no forbidden modules at Step 43',
    pkgForbiddenSb.length === 0,
    pkgForbiddenSb.join(', ')
  );
  record(
    'Smart Beta — package.json declares tesseract.js (Phase-1+ dependency)',
    Object.prototype.hasOwnProperty.call(allDepsSb, 'tesseract.js')
  );
}

// 349. Step-42 / Step-43 bugfixes do not regress the runtime
//      overlay safety stance.
var ffSb = readText('src/feature-flags.js');
record(
  'Smart Beta — feature-flags.js still pins realDesktopActions: false',
  /FEATURE_FLAGS\s*=\s*Object\.freeze\(\{[\s\S]*?realDesktopActions:\s*false/.test(ffSb)
);
record(
  'Smart Beta — feature-flags.js still pins simulationOnly: true',
  /FEATURE_FLAGS\s*=\s*Object\.freeze\(\{[\s\S]*?simulationOnly:\s*true/.test(ffSb)
);
record(
  'Smart Beta — runtime overlay still whitelist-only',
  (function () {
    var m = ffSb.match(/_RUNTIME_TOGGLABLE_FLAGS\s*=\s*\[([^\]]*)\]/);
    var arr = m ? m[1] : '';
    // Expected whitelist (Step 47): realOcr, tesseractProvider,
    // realDesktopActions, realCoordinateClick. image/text/keyboard
    // real flags must NEVER be runtime-togglable.
    return arr.indexOf('realOcr') !== -1 &&
           arr.indexOf('tesseractProvider') !== -1 &&
           arr.indexOf('realDesktopActions') !== -1 &&
           arr.indexOf('realCoordinateClick') !== -1 &&
           arr.indexOf('realImageClick') === -1 &&
           arr.indexOf('realTextClick') === -1 &&
           arr.indexOf('keyPress') === -1 &&
           arr.indexOf('hotkey') === -1;
  })()
);

// --- Step 45: post-release cleanup + feedback tracking ---

// 350. The four new post-release docs exist.
[
  'docs/POST_RELEASE_CHECKLIST.md',
  'docs/FEEDBACK_TRIAGE.md',
  'docs/V0_2_1_PATCH_PLAN.md',
  'docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md'
].forEach(function (rel) {
  record('Step 45 doc exists: ' + rel, fileExists(rel));
});

// 351. README / PROJECT_CONTEXT / CHANGELOG mention Step 45.
var readmeTxt45 = readText('README.md');
var pcTxt45 = readText('PROJECT_CONTEXT.md');
var chTxt45 = readText('CHANGELOG.md');
record(
  'README.md mentions Step 45 / шаг 45',
  /step\s*45|шаг\s*45/i.test(readmeTxt45)
);
record(
  'PROJECT_CONTEXT.md mentions Step 45 / шаг 45',
  /step\s*45|шаг\s*45/i.test(pcTxt45)
);
record(
  'CHANGELOG.md mentions Step 45 / шаг 45',
  /step\s*45|шаг\s*45/i.test(chTxt45)
);

// 352. README or PROJECT_CONTEXT explains Step 44 was a
//      release/testing milestone (not a standalone runtime feature).
function explainsStep44Milestone(txt) {
  var m = txt.match(/Step\s*44[\s\S]{0,400}/i);
  if (!m) return false;
  var win = m[0];
  return /milestone/i.test(win) &&
         /(release|релиз)/i.test(win) &&
         /(test|тест|проверк)/i.test(win);
}
record(
  'README or PROJECT_CONTEXT explains Step 44 was a release/testing milestone',
  explainsStep44Milestone(readmeTxt45) ||
  explainsStep44Milestone(pcTxt45)
);

// 353. The new docs assert the simulation-only / planning-only stance.
var prcl45 = readText('docs/POST_RELEASE_CHECKLIST.md').toLowerCase();
record(
  'docs/POST_RELEASE_CHECKLIST.md asserts simulation-only / no real clicks',
  prcl45.indexOf('simulation-only') !== -1 ||
  prcl45.indexOf('no real') !== -1
);
var raPlan45 = readText('docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md');
record(
  'docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md states real actions stay disabled until safety review',
  /disabled\s+until[\s\S]{0,60}safety[\s\S]{0,20}review/i.test(raPlan45)
);
record(
  'docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md bans captcha / anti-bot / ad-click / banking automation',
  /captcha/i.test(raPlan45) &&
  /anti-?bot/i.test(raPlan45) &&
  /ad-?click/i.test(raPlan45) &&
  /banking/i.test(raPlan45)
);
record(
  'docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md keeps the real adapter behind a feature flag + pipeline blocks by default',
  /feature\s+flag/i.test(raPlan45) &&
  /block[\s\S]{0,40}default/i.test(raPlan45)
);
var patch45 = readText('docs/V0_2_1_PATCH_PLAN.md');
record(
  'docs/V0_2_1_PATCH_PLAN.md forbids real desktop clicks in the patch line',
  /no real desktop clicks|real desktop clicks/i.test(patch45) &&
  /not allowed|disallow|forbidden/i.test(patch45)
);

// 354. package.json declares none of the forbidden real-input /
//      OpenCV modules at Step 45.
if (pkg) {
  var allDeps45 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var forbidden45 = Object.keys(allDeps45).filter(function (name) {
    var n = name.toLowerCase();
    return n.indexOf('robotjs') !== -1 ||
           n.indexOf('nut.js') !== -1 ||
           n.indexOf('nut-js') !== -1 ||
           n.indexOf('nutjs') !== -1 ||
           n.indexOf('@nut-tree') !== -1 ||
           n.indexOf('iohook') !== -1 ||
           n.indexOf('uiohook') !== -1 ||
           n.indexOf('opencv') !== -1;
  });
  record(
    'Step 45 — package.json declares no robotjs/nut.js/iohook/uiohook-napi/opencv',
    forbidden45.length === 0,
    forbidden45.join(', ')
  );
}

// 355. feature flags still default realDesktopActions to false at Step 45.
var ff45 = readText('src/feature-flags.js');
record(
  'Step 45 — feature-flags.js still pins realDesktopActions: false',
  /realDesktopActions\s*:\s*false/.test(ff45)
);
record(
  'Step 45 — feature-flags.js still pins simulationOnly: true',
  /simulationOnly\s*:\s*true/.test(ff45)
);

// --- Step 46: Desktop v1 architecture + safety foundation ---

// 356. Step 46 docs exist.
[
  'docs/V1_DESKTOP_PRODUCT_PLAN.md',
  'docs/V1_IMPLEMENTATION_CHECKLIST.md',
  'docs/FULL_PRODUCT_BRANCH_PLAN.md',
  'docs/V1_SAFETY_MODEL.md',
  'docs/V1_ACTION_PIPELINE.md',
  'docs/V1_REAL_ADAPTER_REQUIREMENTS.md',
  'docs/V1_AUDIT_LOGS.md',
  'docs/V1_PERMISSION_MODEL.md',
  'docs/V1_RELEASE_CRITERIA.md',
  'docs/NUTJS_INTEGRATION_PLAN.md'
].forEach(function (rel) {
  record('Step 46 doc exists: ' + rel, fileExists(rel));
});

// 357. Step 46 source modules exist.
[
  'src/audit-log-manager.js',
  'src/permission-manager.js',
  'src/real-desktop-adapter-interface.js',
  'src/safety-center-ui.js'
].forEach(function (rel) {
  record('Step 46 file exists: ' + rel, fileExists(rel));
});

// 358. README / PROJECT_CONTEXT mention Desktop v1 / v1 and Step 46.
var readmeTxt46 = readText('README.md');
var pcTxt46 = readText('PROJECT_CONTEXT.md');
var chTxt46 = readText('CHANGELOG.md');
record(
  'README or PROJECT_CONTEXT mentions Desktop v1 / v1',
  /Desktop v1|\bv1\b/i.test(readmeTxt46) || /Desktop v1|\bv1\b/i.test(pcTxt46)
);
record(
  'README mentions Step 46 / шаг 46',
  /step\s*46|шаг\s*46/i.test(readmeTxt46)
);
record(
  'PROJECT_CONTEXT mentions Step 46 / шаг 46',
  /step\s*46|шаг\s*46/i.test(pcTxt46)
);
record(
  'CHANGELOG mentions Step 46 / шаг 46',
  /step\s*46|шаг\s*46/i.test(chTxt46)
);

// 359. package.json declares none of robotjs / iohook / uiohook-napi / opencv.
if (pkg) {
  var allDeps46 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var forbidden46 = Object.keys(allDeps46).filter(function (name) {
    var n = name.toLowerCase();
    return n.indexOf('robotjs') !== -1 ||
           n.indexOf('nut.js') !== -1 ||
           n.indexOf('nut-js') !== -1 ||
           n.indexOf('@nut-tree') !== -1 ||
           n.indexOf('iohook') !== -1 ||
           n.indexOf('uiohook') !== -1 ||
           n.indexOf('opencv') !== -1;
  });
  record(
    'Step 46 — package.json declares no robotjs/iohook/uiohook-napi/opencv',
    forbidden46.length === 0,
    forbidden46.join(', ')
  );
}

// 360. feature flags still default realDesktopActions false.
var ff46 = readText('src/feature-flags.js');
record(
  'Step 46 — feature-flags.js still pins realDesktopActions: false',
  /realDesktopActions\s*:\s*false/.test(ff46)
);

// 361. Real desktop adapter interface blocks every real execution.
var raTxt = readText('src/real-desktop-adapter-interface.js');
record(
  'real-desktop-adapter-interface.js: checkRealAdapterAvailability returns available:false',
  /function checkRealAdapterAvailability[\s\S]{0,400}available:\s*false/.test(raTxt)
);
[
  'function executeRealClick',
  'function executeRealImageClick',
  'function executeRealTextClick',
  'function blockRealAction'
].forEach(function (needle) {
  record('real-desktop-adapter-interface.js declares ' + needle, raTxt.indexOf(needle) !== -1);
});
record(
  'real-desktop-adapter-interface.js: executeReal* all funnel through blockRealAction',
  /function executeRealClick[\s\S]{0,160}blockRealAction/.test(raTxt) &&
  /function executeRealImageClick[\s\S]{0,160}blockRealAction/.test(raTxt) &&
  /function executeRealTextClick[\s\S]{0,160}blockRealAction/.test(raTxt)
);
record(
  'real-desktop-adapter-interface.js does not import electron / ipcRenderer / native input',
  raTxt.indexOf("require('electron')") === -1 &&
  raTxt.indexOf('ipcRenderer.invoke') === -1 &&
  raTxt.indexOf('ipcRenderer.on') === -1 &&
  raTxt.indexOf("require('robotjs')") === -1 &&
  raTxt.indexOf("require('nut") === -1
);

// 362. Permission manager exposes the documented API and never enables real mode.
var pmTxt = readText('src/permission-manager.js');
[
  'function getPermissionStatus',
  'function getPermissionChecklist',
  'function getMissingPermissions',
  'function refreshPermissions',
  'function getPermissionManagerStatus'
].forEach(function (needle) {
  record('permission-manager.js declares ' + needle, pmTxt.indexOf(needle) !== -1);
});
record(
  'permission-manager.js keeps realModeEnabled: false',
  /realModeEnabled:\s*false/.test(pmTxt)
);
record(
  'permission-manager.js does not import electron / ipcRenderer',
  pmTxt.indexOf("require('electron')") === -1 && pmTxt.indexOf('ipcRenderer.invoke') === -1 && pmTxt.indexOf('ipcRenderer.on') === -1
);

// 363. Audit log manager: documented API + redaction (no pixel data persisted).
var almTxt = readText('src/audit-log-manager.js');
[
  'function createAuditLogEvent',
  'function addAuditLogEvent',
  'function getAuditLogEvents',
  'function clearAuditLogEvents',
  'function getAuditLogSummary',
  'function exportAuditLog'
].forEach(function (needle) {
  record('audit-log-manager.js declares ' + needle, almTxt.indexOf(needle) !== -1);
});
record(
  'audit-log-manager.js denylists imageDataUrl / screenshot / base64 / paths',
  /AUDIT_LOG_METADATA_DENYLIST/.test(almTxt) &&
  almTxt.indexOf("'imageDataUrl'") !== -1 &&
  almTxt.indexOf("'screenshot'") !== -1 &&
  almTxt.indexOf("'base64'") !== -1
);
record(
  'audit-log-manager.js forces realAction:false on every event',
  /realAction:\s*false/.test(almTxt)
);
record(
  'audit-log-manager.js does not import electron / ipcRenderer / fs',
  almTxt.indexOf("require('electron')") === -1 &&
  almTxt.indexOf('ipcRenderer.invoke') === -1 &&
  almTxt.indexOf('ipcRenderer.on') === -1 &&
  almTxt.indexOf("require('fs')") === -1
);

// 364. Action pipeline v1-ready: action-type taxonomy + uniform result
//      + real-mode readiness gate + wait support, real mode still blocked.
var apTxt = readText('src/action-pipeline.js');
[
  'function getActionTypeInfo',
  'function normalizeActionResult',
  'function evaluateRealModeReadiness'
].forEach(function (needle) {
  record('action-pipeline.js declares ' + needle, apTxt.indexOf(needle) !== -1);
});
record(
  'action-pipeline.js taxonomy lists planned types (move_mouse/scroll/key_press/hotkey)',
  apTxt.indexOf("'move_mouse'") !== -1 && apTxt.indexOf("'scroll'") !== -1 &&
  apTxt.indexOf("'key_press'") !== -1 && apTxt.indexOf("'hotkey'") !== -1
);
record(
  'action-pipeline.js recognizes the wait action type',
  /action\.type === 'wait'/.test(apTxt)
);
record(
  'action-pipeline.js normalizeActionResult forces realAction:false',
  /function normalizeActionResult[\s\S]{0,600}realAction:\s*false/.test(apTxt)
);
record(
  'action-pipeline.js canExecuteRealAction cannot return true (safetyReviewPassed always unmet)',
  /unmet\.push\('safetyReviewPassed'\)/.test(apTxt)
);

// 365. Scenario v1 migration helpers present and additive.
var smTxt = readText('src/scenario-manager.js');
record('scenario-manager.js declares migrateScenarioToV1', smTxt.indexOf('function migrateScenarioToV1') !== -1);
record('scenario-manager.js declares migrateScenariosToV1', smTxt.indexOf('function migrateScenariosToV1') !== -1);
record(
  'scenario-manager.js migration sets version: 1 and safetyReviewed default',
  /version:\s*\(typeof meta\.version/.test(smTxt) && /safetyReviewed:/.test(smTxt)
);
record(
  'scenario-manager.js initScenarios applies the v1 migration',
  /scenarios\s*=\s*migrateScenariosToV1\(scenarios\)/.test(smTxt)
);

// 366. App-state run summaries slice + mutators.
var asTxt46 = readText('src/app-state.js');
record('app-state.js declares runSummaries slice', /runSummaries:\s*\{/.test(asTxt46));
[
  'function addRunSummary',
  'function getLastRunSummary',
  'function getRunSummaries'
].forEach(function (needle) {
  record('app-state.js declares ' + needle, asTxt46.indexOf(needle) !== -1);
});
record(
  'app-state.js run summary forces realActionsPerformed:false',
  /realActionsPerformed:\s*false/.test(asTxt46)
);

// 367. audit-events.js allowlist includes the Step 46 types.
[
  "'real.adapter.blocked'",
  "'permission.refreshed'",
  "'safetyCenter.check.run'",
  "'scenario.runSummary.recorded'"
].forEach(function (needle) {
  record('audit allowlist includes ' + needle.replace(/'/g, ''), auditTxt.indexOf(needle) !== -1);
});

// 368. index.html wires the Safety Center tab + section + scripts in order.
var htmlTxt46 = readText('src/index.html');
record(
  'index.html has Safety Center tab button',
  /data-advanced-tab=['"]safetyCenter['"]/.test(htmlTxt46)
);
record(
  'index.html has Safety Center section',
  /id=['"]advanced-tab-safetyCenter['"]/.test(htmlTxt46)
);
[
  'audit-log-manager.js',
  'permission-manager.js',
  'real-desktop-adapter-interface.js',
  'safety-center-ui.js'
].forEach(function (script) {
  record('index.html loads ' + script, htmlTxt46.indexOf('src="' + script + '"') !== -1);
});
record(
  'index.html loads safety-center-ui.js BEFORE renderer.js',
  htmlTxt46.indexOf('src="safety-center-ui.js"') !== -1 &&
  htmlTxt46.indexOf('src="renderer.js"') !== -1 &&
  htmlTxt46.indexOf('src="safety-center-ui.js"') < htmlTxt46.indexOf('src="renderer.js"')
);
record(
  'index.html loads audit-log-manager.js BEFORE safety-center-ui.js',
  htmlTxt46.indexOf('src="audit-log-manager.js"') !== -1 &&
  htmlTxt46.indexOf('src="audit-log-manager.js"') < htmlTxt46.indexOf('src="safety-center-ui.js"')
);

// 369. safety-center-ui.js is DOM-safe (innerHTML only used to clear).
var scuiTxt = readText('src/safety-center-ui.js');
record(
  'safety-center-ui.js declares renderSafetyCenter',
  scuiTxt.indexOf('function renderSafetyCenter') !== -1
);
record(
  'safety-center-ui.js never assigns innerHTML to user data',
  (function () {
    var lines = scuiTxt.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);
record(
  'safety-center-ui.js has no "Enable Real Clicks" control',
  scuiTxt.toLowerCase().indexOf('enable real click') === -1
);

// 370. i18n has the Safety Center key in both languages.
var i18nTxt46 = readText('src/i18n.js');
record(
  'i18n.js declares safetyCenter in RU and EN',
  (i18nTxt46.match(/safetyCenter:/g) || []).length >= 2
);
record(
  'i18n.js declares v1Readiness key',
  i18nTxt46.indexOf('v1Readiness:') !== -1
);

// 371. Electron security invariants still hold at Step 46.
record(
  'Step 46 — main.js still sets contextIsolation: true',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'Step 46 — main.js still sets nodeIntegration: false',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'Step 46 — index.html CSP not relaxed (no unsafe-inline / unsafe-eval)',
  htmlTxt46.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt46.indexOf('unsafe-inline') === -1 &&
  htmlTxt46.indexOf('unsafe-eval') === -1
);

// --- Step 47: Real desktop adapter prototype (behind hard gate) ---

// 372. New files exist.
record('Step 47 file exists: main/real-desktop-adapter.js', fileExists('main/real-desktop-adapter.js'));
record('Step 47 doc exists: docs/REAL_ADAPTER_PROTOTYPE.md', fileExists('docs/REAL_ADAPTER_PROTOTYPE.md'));
record('Step 47 doc exists: docs/REAL_CLICK_TESTING_GUIDE.md', fileExists('docs/REAL_CLICK_TESTING_GUIDE.md'));

// 373. README / PROJECT_CONTEXT mention Step 47 + session-only / disabled by default.
var readmeTxt47 = readText('README.md');
var pcTxt47 = readText('PROJECT_CONTEXT.md');
var chTxt47 = readText('CHANGELOG.md');
record(
  'README or PROJECT_CONTEXT mentions Step 47 / шаг 47',
  /step\s*47|шаг\s*47/i.test(readmeTxt47) || /step\s*47|шаг\s*47/i.test(pcTxt47)
);
record(
  'CHANGELOG mentions Step 47 / шаг 47',
  /step\s*47|шаг\s*47/i.test(chTxt47)
);
record(
  'README or PROJECT_CONTEXT states session-only / disabled by default',
  /session-only|session only|session-?only|disabled by default|выключен по умолчанию|session-only|только для (текущей )?сесси/i.test(readmeTxt47) ||
  /session-only|disabled by default|выключен[ы]? по умолчанию|session-only|только для (текущей )?сесси/i.test(pcTxt47)
);

// 374. package.json declares no robotjs / iohook / uiohook-napi / opencv.
if (pkg) {
  var allDeps47 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var forbidden47 = Object.keys(allDeps47).filter(function (name) {
    var n = name.toLowerCase();
    return n.indexOf('robotjs') !== -1 ||
           n.indexOf('iohook') !== -1 ||
           n.indexOf('uiohook') !== -1 ||
           n.indexOf('opencv') !== -1;
  });
  record(
    'Step 47 — package.json declares no robotjs/iohook/uiohook-napi/opencv',
    forbidden47.length === 0,
    forbidden47.join(', ')
  );
}

// 375. feature-flags defaults: real flags all false in the frozen block.
var ff47 = readText('src/feature-flags.js');
var frozenBlock = (ff47.match(/FEATURE_FLAGS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/) || [])[1] || '';
record(
  'feature-flags default realDesktopActions: false',
  /realDesktopActions:\s*false/.test(frozenBlock)
);
record(
  'feature-flags default realCoordinateClick: false',
  /realCoordinateClick:\s*false/.test(frozenBlock)
);
record(
  'feature-flags default realImageClick: false',
  /realImageClick:\s*false/.test(frozenBlock)
);
record(
  'feature-flags default realTextClick: false',
  /realTextClick:\s*false/.test(frozenBlock)
);
record(
  'feature-flags default simulationOnly: true',
  /simulationOnly:\s*true/.test(frozenBlock)
);

// 376. main/real-desktop-adapter.js: coordinate-click only, blocks by default,
//      no prohibited native module, defensive backend load.
var rdaTxt = readText('main/real-desktop-adapter.js');
[
  'function getRealDesktopAdapterInfo',
  'function checkRealDesktopAdapterAvailability',
  'function validateRealClickAction',
  'function executeRealCoordinateClick',
  'function blockRealDesktopAction',
  'function getRealDesktopAdapterStatus',
  'function registerRealDesktopAdapterIpc'
].forEach(function (needle) {
  record('real-desktop-adapter.js declares ' + needle, rdaTxt.indexOf(needle) !== -1);
});
record(
  'real-desktop-adapter.js requires the backend inside try/catch (no hard dependency)',
  /try\s*\{[\s\S]{0,200}require\(/.test(rdaTxt)
);
record(
  'real-desktop-adapter.js does not require robotjs/iohook/uiohook-napi/opencv',
  rdaTxt.indexOf("require('robotjs')") === -1 &&
  rdaTxt.indexOf("require('iohook')") === -1 &&
  rdaTxt.indexOf("require('uiohook-napi')") === -1 &&
  rdaTxt.indexOf('opencv') === -1
);
record(
  'real-desktop-adapter.js blocks non-coordinate-click action types',
  /image_click/.test(rdaTxt) && /text_click/.test(rdaTxt) &&
  /Real adapter supports coordinate click only/.test(rdaTxt)
);
record(
  'real-desktop-adapter.js requires the full hard context before a click',
  /sessionRealModeEnabled/.test(rdaTxt) && /userConfirmed/.test(rdaTxt) &&
  /safetyCheckPassed/.test(rdaTxt) && /emergencyStopReady/.test(rdaTxt) &&
  /auditLogsEnabled/.test(rdaTxt)
);

// 377. main.js wires the real-adapter IPC, preload exposes the narrow API.
record(
  "main.js registers real-adapter IPC via registerRealDesktopAdapterIpc",
  mainTxt.indexOf('registerRealDesktopAdapterIpc') !== -1
);
record(
  'preload.js exposes realAdapter API (status/availability/executeCoordinateClick)',
  /realAdapter\s*:\s*\{[\s\S]{0,400}executeCoordinateClick/.test(preloadTxt) &&
  preloadTxt.indexOf("'real-adapter:get-status'") !== -1 &&
  preloadTxt.indexOf("'real-adapter:execute-coordinate-click'") !== -1
);

// 378. action-pipeline real-mode helpers exist and block by default.
var apTxt47 = readText('src/action-pipeline.js');
[
  'function canExecuteRealDesktopAction',
  'function executeRealDesktopAction',
  'function createRealActionBlockedResult'
].forEach(function (needle) {
  record('action-pipeline.js declares ' + needle, apTxt47.indexOf(needle) !== -1);
});
record(
  'action-pipeline.js real mode is coordinate-click only (blocks other types)',
  /action\.type !== 'click'/.test(apTxt47)
);

// 379. safety-gates strict real gate exists, default-deny.
var sgTxt47 = readText('src/safety-gates.js');
record(
  'safety-gates.js declares getRealDesktopActionGateStatus',
  sgTxt47.indexOf('function getRealDesktopActionGateStatus') !== -1
);
record(
  'safety-gates.js real gate is default-deny (allowed only when no reasons)',
  /allowed\s*=\s*reasons\.length === 0/.test(sgTxt47)
);

// 380. Safety Center UI exposes the prototype controls but NO image/text real enable.
var scuiTxt47 = readText('src/safety-center-ui.js');
record(
  'safety-center-ui.js declares renderRealAdapterCard',
  scuiTxt47.indexOf('function renderRealAdapterCard') !== -1
);
record(
  'safety-center-ui.js has enable/disable session + dry-run + test real click',
  scuiTxt47.indexOf('function enableRealCoordinateClickSession') !== -1 &&
  scuiTxt47.indexOf('function disableRealCoordinateClickSession') !== -1 &&
  scuiTxt47.indexOf('function testDryRunCoordinateClick') !== -1 &&
  scuiTxt47.indexOf('function testRealCoordinateClick') !== -1
);
record(
  'safety-center-ui.js never assigns innerHTML to user data (Step 47)',
  (function () {
    var lines = scuiTxt47.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);

// 381. audit allowlist includes the Step 47 real-adapter events.
[
  "'realAdapter.session.enabled'",
  "'realAction.coordinate.requested'",
  "'realAction.coordinate.executed'",
  "'realAction.coordinate.blocked'",
  "'realAction.safetyGate.failed'"
].forEach(function (needle) {
  record('audit allowlist includes ' + needle.replace(/'/g, ''), auditTxt.indexOf(needle) !== -1);
});

// 382. Electron security invariants still hold at Step 47.
record(
  'Step 47 — main.js still sets contextIsolation: true',
  /contextIsolation\s*:\s*true/.test(mainTxt)
);
record(
  'Step 47 — main.js still sets nodeIntegration: false',
  /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'Step 47 — index.html CSP not relaxed',
  htmlTxt46.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt46.indexOf('unsafe-inline') === -1 &&
  htmlTxt46.indexOf('unsafe-eval') === -1
);
record(
  'Step 47 — i18n declares experimentalRealCoordinateClick in RU and EN',
  (i18nTxt46.match(/experimentalRealCoordinateClick:/g) || []).length >= 2
);

// --- Step 48: Real coordinate click stabilization + safety QA ---

// 383. New docs exist.
record('Step 48 doc exists: docs/REAL_COORDINATE_CLICK_STABILIZATION.md', fileExists('docs/REAL_COORDINATE_CLICK_STABILIZATION.md'));
record('Step 48 doc exists: docs/REAL_COORDINATE_CLICK_QA.md', fileExists('docs/REAL_COORDINATE_CLICK_QA.md'));

// 384. README / PROJECT_CONTEXT mention Step 48 + one click / fresh confirmation.
var readmeTxt48 = readText('README.md');
var pcTxt48 = readText('PROJECT_CONTEXT.md');
var chTxt48 = readText('CHANGELOG.md');
record(
  'README or PROJECT_CONTEXT mentions Step 48 / шаг 48',
  /step\s*48|шаг\s*48/i.test(readmeTxt48) || /step\s*48|шаг\s*48/i.test(pcTxt48)
);
record(
  'CHANGELOG mentions Step 48 / шаг 48',
  /step\s*48|шаг\s*48/i.test(chTxt48)
);
record(
  'README or PROJECT_CONTEXT states one click per confirmation / fresh confirmation',
  /one click per confirmation|fresh confirmation|один клик на одно подтверждение|нов(ого|ое) подтвержд/i.test(readmeTxt48) ||
  /one click per confirmation|fresh confirmation|один клик на одно подтверждение|нов(ого|ое) подтвержд/i.test(pcTxt48)
);

// 385. package.json declares no robotjs / iohook / uiohook-napi / opencv.
if (pkg) {
  var allDeps48 = Object.assign(
    {},
    pkg.dependencies || {},
    pkg.devDependencies || {},
    pkg.optionalDependencies || {}
  );
  var forbidden48 = Object.keys(allDeps48).filter(function (name) {
    var n = name.toLowerCase();
    return n.indexOf('robotjs') !== -1 ||
           n.indexOf('iohook') !== -1 ||
           n.indexOf('uiohook') !== -1 ||
           n.indexOf('opencv') !== -1;
  });
  record(
    'Step 48 — package.json declares no robotjs/iohook/uiohook-napi/opencv',
    forbidden48.length === 0,
    forbidden48.join(', ')
  );
}

// 386. feature-flags defaults in the frozen block.
var ff48 = readText('src/feature-flags.js');
var frozen48 = (ff48.match(/FEATURE_FLAGS\s*=\s*Object\.freeze\(\{([\s\S]*?)\}\);/) || [])[1] || '';
record('Step 48 — feature-flags default realDesktopActions: false', /realDesktopActions:\s*false/.test(frozen48));
record('Step 48 — feature-flags default realCoordinateClick: false', /realCoordinateClick:\s*false/.test(frozen48));
record('Step 48 — feature-flags default realImageClick: false', /realImageClick:\s*false/.test(frozen48));
record('Step 48 — feature-flags default realTextClick: false', /realTextClick:\s*false/.test(frozen48));
record('Step 48 — feature-flags default keyboardAutomation: false', /keyboardAutomation:\s*false/.test(frozen48));
record(
  'Step 48 — feature-flags declares isRealCoordinateClickSessionEnabled',
  ff48.indexOf('function isRealCoordinateClickSessionEnabled') !== -1
);

// 387. action-pipeline blocks image_click / text_click real mode and has the
//      explicit blocked-reason helper + one-click context requirement.
var apTxt48 = readText('src/action-pipeline.js');
record(
  'action-pipeline.js blocks image_click real mode',
  /action\.type === 'image_click'[\s\S]{0,80}imageClickRealBlocked/.test(apTxt48) ||
  apTxt48.indexOf('imageClickRealBlocked') !== -1
);
record(
  'action-pipeline.js blocks text_click real mode',
  apTxt48.indexOf('textClickRealBlocked') !== -1
);
record(
  'action-pipeline.js declares getRealDesktopActionBlockReason',
  apTxt48.indexOf('function getRealDesktopActionBlockReason') !== -1
);
record(
  'action-pipeline.js real pre-flight requires oneClickOnly',
  /oneClickOnly/.test(apTxt48) && /oneClickOnlyRequired/.test(apTxt48)
);
record(
  'action-pipeline.js blocks repeat/batch real clicks',
  /repeatRealClicksBlocked/.test(apTxt48) && /batchRealClicksBlocked/.test(apTxt48)
);

// 388. safety-gates stabilized gate exists.
var sgTxt48 = readText('src/safety-gates.js');
record(
  'safety-gates.js declares getRealCoordinateClickGateStatus',
  sgTxt48.indexOf('function getRealCoordinateClickGateStatus') !== -1
);
record(
  'safety-gates.js stabilized gate is default-deny',
  /getRealCoordinateClickGateStatus[\s\S]{0,2000}allowed\s*=\s*reasons\.length === 0/.test(sgTxt48)
);

// 389. main adapter requires oneClickOnly + sessionRealCoordinateClickEnabled,
//      refuses repeat/batch, and carries a reason field.
var rdaTxt48 = readText('main/real-desktop-adapter.js');
record(
  'real-desktop-adapter.js hard context requires oneClickOnly',
  /oneClickOnly/.test(rdaTxt48)
);
record(
  'real-desktop-adapter.js hard context requires sessionRealCoordinateClickEnabled',
  /sessionRealCoordinateClickEnabled/.test(rdaTxt48)
);
record(
  'real-desktop-adapter.js refuses repeat/batch real clicks',
  /Repeat real clicks are blocked/.test(rdaTxt48) && /Batch real clicks are blocked/.test(rdaTxt48)
);
record(
  'real-desktop-adapter.js blocked result carries a reason field',
  /reason:\s*msg/.test(rdaTxt48)
);

// 390. audit allowlist includes the Step 48 events.
[
  "'realCoordinate.click.executed'",
  "'realCoordinate.click.blocked'",
  "'realCoordinate.safetyCheck.failed'",
  "'emergencyStop.notReadyBlockedRealAction'",
  "'feature.flag.toggle.rejected'"
].forEach(function (needle) {
  record('audit allowlist includes ' + needle.replace(/'/g, ''), auditTxt.indexOf(needle) !== -1);
});

// 391. Safety Center diagnostics + i18n + DOM-safety (Step 48).
var scuiTxt48 = readText('src/safety-center-ui.js');
record(
  'safety-center-ui.js declares getRealCoordinateClickDiagnostics',
  scuiTxt48.indexOf('function getRealCoordinateClickDiagnostics') !== -1
);
record(
  'safety-center-ui.js per-click confirmation requires a checkbox',
  /confirmSingleCoordinateClick/.test(scuiTxt48) && /requireCheckbox:\s*true/.test(scuiTxt48)
);
record(
  'safety-center-ui.js never assigns innerHTML to user data (Step 48)',
  (function () {
    var lines = scuiTxt48.split('\n');
    for (var i = 0; i < lines.length; i++) {
      var code = lines[i].replace(/\/\/.*$/, '').trim();
      if (code.indexOf('innerHTML') === -1) continue;
      if (!/innerHTML\s*=\s*(['"])\s*\1\s*;?\s*$/.test(code)) return false;
    }
    return true;
  })()
);
var i18nTxt48 = readText('src/i18n.js');
record(
  'i18n declares confirmSingleCoordinateClick in RU and EN',
  (i18nTxt48.match(/confirmSingleCoordinateClick:/g) || []).length >= 2
);

// 392. Electron security invariants still hold at Step 48.
record(
  'Step 48 — main.js still sets contextIsolation: true / nodeIntegration: false',
  /contextIsolation\s*:\s*true/.test(mainTxt) && /nodeIntegration\s*:\s*false/.test(mainTxt)
);
record(
  'Step 48 — index.html CSP not relaxed',
  htmlTxt46.indexOf('Content-Security-Policy') !== -1 &&
  htmlTxt46.indexOf('unsafe-inline') === -1 &&
  htmlTxt46.indexOf('unsafe-eval') === -1
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


