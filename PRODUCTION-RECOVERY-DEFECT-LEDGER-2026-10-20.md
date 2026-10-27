# Earthline Production Recovery Defect Ledger — Mantra 69

Recovery branch: `production-recovery-2026-10-20-m69`
Frozen live starting SHA: `b2e8bd2c0b099648bbe96873e531fe494a61363b`
Live branch: `pages-live` (must remain untouched until recovery gates pass)
Acceptance authority: Jon

## D1 — Unapproved “AUTHORITATIVE LOCAL DATA” Property status box
- Symptom: Property results show an unapproved exclusion-evidence status box.
- Reproduction: Run Property analysis; box is inserted into the Property status slot.
- Source owner: `index.html`, script `earthline-16516-evidence-grade-js`, function `render()`, DOM id `earthlineExclusionEvidence16516`.
- Trigger: `earthline:analysis-complete` listener plus DOMContentLoaded/install-time render.
- Science dependency: `evidence()` reads `M.vectorNoBuildCoverage`; this evidence must remain available.
- Repair: remove only the public DOM publication path while retaining evidence/science APIs and report evidence data.
- Verification: no box on first/repeated Property; no blank placeholder; exclusion gates unchanged.
- Status: source traced; repair pending on recovery branch.

## D2 — First Property blue water appears then disappears
- Symptom: first Property run briefly shows correct blue water, then clears/hides/replaces it.
- Primary suspects from handoff: 17562 stale-water prevention and 17563 exact 20-acre clipping.
- Required trace: target -> Property serial -> propertyPublication -> authoritative water source -> overlay visibility -> later clear/hide event.
- Repair constraint: no hydrology/science change; one authoritative water publication path; no new lifecycle owner.
- Status: deferred until D1/D3/D4/D5 recovery pass is built, per handoff.

## D3 — Unapproved Support / Help modal in ordinary live workflow
- Symptom: “Support — Help & Documentation” modal appears from public UI.
- Source owners: footer `data-act="support"`; `handleAction("support")`; `brandHome` click binding to `handleAction("support")`.
- Repair: remove Support from the public action path and remove the brand-to-support trigger. Preserve approved CONTACT separately.
- Verification: no Support modal after load, Regional, Zoom, Property, or repeat Property.
- Status: source traced; repair pending on recovery branch.

## D4 — Obsolete/internal Support copy exposed publicly
- Symptom: Support modal exposes “Upgrade path to live data”, generated-terrain/build/workflow language.
- Source owner: `supportHTML()` in `index.html`.
- Repair: remove obsolete Support content from the public source path together with D3; no replacement UI.
- Verification: text cannot be opened through live workflow.
- Status: source traced; repair pending on recovery branch.

## D5 — Instructional overlay can stack above modal/panel state
- Symptom: instructional hint/overlay can remain visible above modal/panel UI.
- Source owner traced to Regional corridor onboarding overlay `earthlineCorridorTip16248`, created by `ensureCorridorTip16248()` and re-opened by delayed `maybeShowCorridorTip16248()` calls after `earthline:analysis-complete`.
- Layering cause: `#earthlineCorridorTip16248` uses z-index 2750 while the legacy modal backdrop uses z-index 60.
- Existing Property transition only dismisses the tip at Property start; delayed Regional show scheduling can still create layered states outside that transition.
- Repair: retire the unapproved onboarding tip publication owner; do not add a new observer/listener/polling/camera owner.
- Verification: no instructional overlay stacks above any remaining legitimate panel.
- Status: source traced; repair pending on recovery branch.

## Governance
- No direct edits to `pages-live`.
- No science changes for D1/D3/D4/D5.
- No new map lifecycle owner/listener/polling loop.
- No replacement UI unless Jon explicitly requests it.
- Recovery diff must be reviewed before one production deployment.
