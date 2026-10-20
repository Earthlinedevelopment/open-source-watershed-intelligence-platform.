# Earthline Production Recovery Defect Ledger — Mantra 69

Recovery branch: `production-recovery-2026-10-20-m69`
Frozen live starting SHA: `b2e8bd2c0b099648bbe96873e531fe494a61363b`
Live branch: `pages-live`
Acceptance authority: Jon
Production policy: no pages-live edit until recovery branch passes the governed workflow.

| ID | User-visible symptom | Source owner / trigger | Repair scope | Verification |
|---|---|---|---|---|
| D1 | Unapproved “AUTHORITATIVE LOCAL DATA” box appears in Property status/results. | Embedded `earthline-16516-evidence-grade-js`, function `render()`, event `earthline:analysis-complete`; underlying evidence model is `M.vectorNoBuildCoverage`. | Stop this renderer from creating/inserting the public box. Preserve `evidence()`, safety/publication fields, audit access, and report evidence. | Fresh + repeat Property: no `#earthlineExclusionEvidence16516`, no layout hole; exclusion gates unchanged. |
| D2 | First Property blue water appears, then disappears. | `earthline-build-15824-direct-water-overlay`; 17562 added publication/searchGen gate; 17563 added exact-frame clipping. Later render calls can clear the SVG whenever readiness is transiently false. | Preserve 17562 stale-water gate + 17563 exact-frame clip, but once current exact-frame water has published, retain that same-frame render through transient post-publication readiness changes. New Property/Regional transitions still clear it through existing owners. No new listeners. | First Property: water remains immediately, 15 s later, after settlement, and on repeat. No Regional water leakage. |
| D3 | Unapproved “Support — Help & Documentation” modal appears during ordinary use. | Legacy `handleAction("support")`, footer `data-act="support"`, and `brandHome` binding. | Remove Support from live action path and remove its unapproved trigger/button. Preserve CONTACT. | Modal never opens on load, Regional, Zoom, Property, second Property, or logo click. |
| D4 | Support modal exposes obsolete internal copy (“Upgrade path to live data”, generated-terrain/build language). | Legacy `supportHTML()`. | Remove obsolete support copy/function from the live source path rather than hide with CSS. | Forbidden strings no longer exist in the live Support path; no Support modal can expose them. |
| D5 | Crosshair instructional hint can stack over other UI state. | `EARTHLINE_CROSSHAIR_MOVE_HINT_17093` in `earthline-launch-16872.js`; it created the fixed high-z-index “Place hand cursor over bare land to move map.” overlay after every Regional publication. | Remove that owner block itself, including its style and `earthline:analysis-complete` listener. Preserve crosshair targeting, Property target/button, and map interaction. | Hint owner/text/style are absent; Regional→Property targeting still launches exactly one Property run. |

## Protected behavior
- No hydrology/D8/slope/swale science changes.
- No exclusion, road, building, driveway, water, or authority gate weakening.
- Preserve exact 20-acre Property frame.
- Preserve accepted/current performance work.
- No new styledata, idle, camera-motion, map-render, polling, observer, or persistent lifecycle owner.
- No production deployment until branch verification is complete.


## Recovery source status
- Source repair commit: `dd57536121bfbcdfc42e0384d969bf69fa1aa8a7`.
- Report-style preservation commit: `f28f0c0a851b10ee6cb450d98bd98526f7121c49`.
- Static recovery gate: PASS.
- Every inline JavaScript block: PASS under `node --check`.
- `earthline-launch-16872.js`: PASS under `node --check`.
- Protected 17562 publication gate: present.
- Protected 17563 exact 20-acre water clip: present.
- Protected vector exclusion owner: present.
- Production branch `pages-live`: not modified by this recovery work.
