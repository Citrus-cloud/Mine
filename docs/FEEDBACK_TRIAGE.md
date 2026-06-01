# ClickFlow — Feedback Triage Guide

> **Status:** Step 45 — Post-release cleanup and feedback tracking.
>
> This guide describes how incoming feedback for the Smart Desktop
> Beta (`v0.2.0-smart-beta`) is labelled, classified, and routed.
> It applies to bugs, feature requests, and safety reports filed
> through the GitHub issue templates.
>
> ClickFlow remains **simulation-only**. Triage never schedules
> work that would add real desktop clicks, OCR-driven clicks, or
> any permanently out-of-scope capability. Those requests are
> closed with a pointer to `docs/KNOWN_LIMITATIONS.md`.

---

## Purpose

- Give every incoming issue a consistent, predictable path.
- Make it obvious which issues block a patch and which can wait.
- Keep the simulation-only safety model intact while we respond
  to feedback.
- Separate "fix now in `v0.2.1`" from "research later in `v0.3.0`".

## Issue labels

Applied on top of the labels the issue templates already set
(`bug`, `enhancement`, `safety`, `needs-review`).

- `bug` — something is broken or behaves unexpectedly.
- `enhancement` — feature request / improvement.
- `safety` — safety or privacy concern, or a proposal that would
  change the safety model. Always pairs with `needs-review`.
- `needs-review` — requires a maintainer safety review before any
  code is written.
- `packaging` — installer / build / artifact issue.
- `i18n` — missing or wrong RU/EN translation.
- `docs` — documentation correction.
- `triaged` — severity + priority assigned.
- `blocked` — waiting on external input or reproduction.
- `wontfix` — out of scope (e.g. real input, captcha bypass).
- `duplicate` — already tracked elsewhere.

## Severity levels

Severity describes **impact**. It is assigned during triage.

- **S0 — security / safety.** A safety regression (real input
  fired, CSP weakened, `nodeIntegration` enabled, private paths
  leaking in diagnostics) or a privacy issue. Highest urgency.
- **S1 — app cannot launch.** The packaged or dev app fails to
  start on a supported OS.
- **S2 — core flow broken.** A primary flow is unusable
  (scenario create/run/stop, settings, import/export, emergency
  stop).
- **S3 — feature bug.** A non-core feature misbehaves
  (a smart-features tab, a diagnostics row, an overlay).
- **S4 — polish / docs.** Cosmetic, wording, minor UX, or
  documentation issues.

## Priority levels

Priority describes **when** we act. It is assigned during triage.

- **P0 — immediate.** Drop other work. Always paired with S0, and
  usually with S1.
- **P1 — next patch.** Fix in the next `v0.2.1` patch.
- **P2 — planned.** Scheduled for a later release line.
- **P3 — backlog.** Tracked, no committed date.

A typical mapping (guidance, not a rule): S0 → P0; S1 → P0/P1;
S2 → P1; S3 → P1/P2; S4 → P2/P3.

## Bug triage process

1. Confirm the report uses the bug template and includes app
   version, OS, packaged/dev mode, and reproduction steps.
2. Reproduce on a supported OS if possible. If it cannot be
   reproduced, label `blocked` and request more detail.
3. Assign **severity** (S0–S4) and **priority** (P0–P3), then add
   `triaged`.
4. If it is a safety regression, escalate immediately to the
   safety report process (treat as S0/P0).
5. Route: P0/P1 bugs go to the `v0.2.1` candidate list
   (`docs/V0_2_1_PATCH_PLAN.md`); P2/P3 go to the backlog.

## Feature request process

1. Confirm the request is in scope. Real input, OCR-driven
   clicks, captcha/antibot bypass, ad-click automation, banking /
   payment / protected-app automation, and mobile control are
   **out of scope** — close with `wontfix` and link
   `docs/KNOWN_LIMITATIONS.md`.
2. If the request would change the safety posture (real input,
   real OCR clicks, network beyond localhost), redirect to the
   safety report process and label `needs-review`.
3. In-scope, simulation-only requests get `enhancement` + a
   priority. Most land in P2/P3 and are considered for the
   `v0.3.0` line or later. `v0.2.1` is bugfix-only.

## Safety report process

1. Label `safety` + `needs-review`. Do not begin implementation.
2. A maintainer reviews against `docs/SECURITY_CHECKLIST.md` and
   `docs/REAL_ACTIONS_GO_NO_GO.md`.
3. If it is a **regression** (the build is doing something unsafe
   now), treat as **S0 / P0** and fix in the next patch.
4. If it is a **proposal** to change the safety model, it does not
   ship without a written safety review. Real desktop actions stay
   disabled until that review passes (tracked under the `v0.3.0`
   research branch plan).
5. Permanently out-of-scope categories (captcha / antibot bypass,
   ad-click automation, banking / payment / protected-app
   automation) are closed regardless of review.

## Release-blocker criteria

An issue blocks a release (patch or otherwise) if **any** of:

- It is **S0** (security / safety regression).
- It is **S1** (app cannot launch on a supported OS).
- It breaks a **core flow** (S2) with no workaround.
- It weakens an Electron security setting, the CSP, or leaks
  private paths in diagnostics.
- It would, if shipped, allow real desktop input in a build that
  claims to be simulation-only.

Non-blocking: S3/S4 issues, cosmetic problems, and feature
requests.

## When to make `v0.2.1`

Cut a `v0.2.1` patch when one or more of the following is true:

- One or more **S0/S1** issues are confirmed after the beta.
- A cluster of **S2** core-flow bugs has accumulated.
- A packaging / installer defect blocks installation on a
  supported OS.
- Missing translations or doc errors are significant enough to
  confuse testers.

`v0.2.1` is **bugfix-only**. See `docs/V0_2_1_PATCH_PLAN.md` for
the allowed and disallowed change list.

## When to defer to `v0.3.0`

Defer to the `v0.3.0` research line when an item:

- Is a **new capability** rather than a fix (e.g. real desktop
  adapter research, audit-log persistence, confirmation flow).
- Requires a **safety review** before any code is written.
- Is a larger refactor or architecture change.
- Is an in-scope `enhancement` that is not urgent.

`v0.3.0` is a **research / planning** line for the gated real
adapter. Even there, real desktop actions remain disabled until
the safety review passes. See
`docs/V0_3_0_REAL_ADAPTER_BRANCH_PLAN.md`.
