# Earthline — Mantra 116 sustainable rebuild contract

**Status: isolated core implementation, not a verified production replacement.**

## Baseline audited

- Branch pages-live HEAD at the outset: ffa2ea97545c8128c56b9bcf4931b4297cf54e62.
- Production branch root index.html is approximately 3.76 MB. Separate late-stage Mantra 115 repairs were not accepted as the new scientific baseline.
- The governing repository register is docs/EARTHLINE-MASTER-OPERATIONS-ACCEPTANCE-M95.md.
- Regressions previously reported include missing swales in Arkansas, Iowa, Nebraska and Oklahoma; Texas/Florida/Louisiana coasts; California Bay, New York, Maryland and Colorado; groundwater ownership across run transitions; and unsound spline rendering. Current geographic pass/fail remains unverified.

## Rebuild rather than patch

Create a modular successor beside production; selectively revalidate existing hydrology, geography and approved visuals before reuse. No new features; no production writes.

| Owner | Responsibility | Forbidden coupling |
|---|---|---|
| Data adapter | provenance, versions, coverage, source errors | rendering or science scores |
| Science engine | real DEM/flow/corridor and full-footprint mask proof | DOM and map state |
| Publication gate | reject incomplete slope/flow/exclusion/groundwater claims | fabricating evidence or geometry |
| Run owner | current run, tier, cancellation and immutable publication | recalculating scientific results |
| Map renderer | display only current published layers | geometry alteration or stale publication |
| DATA and reports | faithful single-run snapshot | invented numbers or aquifer coverage |

## Completed isolated implementation

- Unique current-run ownership; superseded or cancelled runs cannot publish.
- Explicit blocked/verified/verified-empty results.
- Required source coverage, every-corridor slope (0–4% inclusive), positive runoff evidence and matched frozen no-build-mask fingerprint.
- Groundwater cannot be shown with evidence when recorded unavailable.
- Self-crossing/closed-loop geometry screened; source-point SVG polyline output with no spline adjustment.
- Immutable published snapshots.
- Synthetic scientific, run-ownership and map-adapter tests (including fully composed DEM→D8→raster audit→immutable publication).

- Frozen no-build union is now checked independently against five required complete class rasters (roads, buildings, driveways, mapped water and protected land) before routing or publication; mismatched or unknown source cells fail closed.
- DEM internal no-data holes no longer seed invented hydrologic outlets; any valid terrain isolated from raster edges blocks D8 routing.

## Remaining release-blocking work

1. Complete the independent scientific comparison of the extracted DEM/D8 algorithm against external GIS reference outputs and real source data; validate scientific proofs independently.
2. Connect the implemented full-footprint DEM/raster audits to real georeferenced and resolution-qualified GIS sources, including protected land and no-build coverage.
3. Build a Mapbox adapter that retains the approved Orb, logo, labels, gauge, Elder trees and two blue dotted strips without altering scientific geometry.
4. Prove first-run and repeated Regional/Property transitions in actual HTTPS browser sessions and mobile, including speed and groundwater continuity.
5. Complete the 50-state fixture matrix plus Thailand → Vietnam → Laos, including basin topology, low-gradient deltas, uncertainties and groundwater data limitations.
6. Validate report output, source provenance, multilingual accuracy, release SHA, rollback and safety monitoring.

**Do not mark the replacement launch-ready merely because unit tests pass.**

Branch: mantra116-sustainable-rebuild. Production branch pages-live is preserved.

## M116 progress evidence

- Existing production source science contradictions documented in `docs/EARTHLINE-M116-LEGACY-SCIENCE-AUDIT.md`.
- Isolated runnable modules for priority-flood D8, runoff crossings, Horn slope, no-build footprint, CRS-parity check, fail-closed publication, and Mapbox state ownership.
- Synthetic unit/integration tests in `rebuild/tests`; GitHub Actions automatic test workflow; no browser or geographic production acceptance yet. See workflow runs for the exact current test count.
- The existing live production `index.html`, DNS, logo, Search Orb, and CSS remain untouched by this branch.

## M116 November 5 continued-rebuild audit

- Isolated source-class mask proof: `rebuild/core/exclusion-source.mjs`, wired into `publishRasterAnalysis` before scientific routing. Five mandatory class presence+coverage rasters must agree cell-for-cell with the frozen mask; all five classes require full coverage. This does not authenticate remote source accuracy or spatial completeness.
- Corrected an unsafe priority-flood assumption: internal unknown DEM holes must never act as drainage outlets. Disconnected valid islands now block, rather than create synthetic runoff pathways.
- The latest branch remains unpromoted. This is *not* a validated 50-state or Southeast Asian scientific model. Production `pages-live` is unchanged.

## M116 public-production safety audit, 2026-11-05

- Production `pages-live` remained `ffa2ea97545c8128c56b9bcf4931b4297cf54e62`; no production HTML, DNS, logo, styling, or science was written during this continuation.
- The M89 public Arizona release workflow at run 41938001360 failed in the **prerequisite marker check** (HTTP 200 for all 18 attempts, but `rawLatM89` not found). The exact production HTML blob `c8653b2adb7b45e60c6cf5dba2bcdcd3491c0688` likewise does not contain `rawLatM89`. This outdated predicate is not evidence of a failed Arizona scientific run; no browser stage was reached.
- A separate **read-only** public HTTPS integrity workflow (run 41970968227) passed. Its production and public homepage HTML each contained exactly 3,760,307 bytes and SHA-256 `f7b1ef6b1092943f6fef7b9c5ce18bde2549caaaf16e31273ed00ba560505bb3`. This proves deployed HTML identity, **not** scientific validity.
- A separate desktop/mobile public-browser startup smoke was added on the isolated branch. It is a non-mutating startup check; it cannot certify water routing, 4% swale slopes, aquifer truth, GIS coverage or 50-state readiness.
- The standalone publication gate now requires protected land in addition to roads, buildings, driveways and mapped water. All 56 synthetic core tests passed in run 41970669319.

Production promotion remains **blocked** until source-backed geographical and real browser Regional→Property→Regional→Property acceptance. Never equate a successful static deployment with certified science.
