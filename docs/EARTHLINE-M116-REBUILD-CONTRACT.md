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
- Fourteen synthetic contract tests.

## Remaining release-blocking work

1. Audit and extract the proven real hydrology/terrain algorithms and data feeds from the existing app; validate scientific proofs independently.
2. Implement real GIS full-footprint and per-cell slope/flow audits, not merely asserted test certificates.
3. Build a Mapbox adapter that retains the approved Orb, logo, labels, gauge, Elder trees and two blue dotted strips without altering scientific geometry.
4. Prove first-run and repeated Regional/Property transitions in actual HTTPS browser sessions and mobile, including speed and groundwater continuity.
5. Complete the 50-state fixture matrix plus Thailand → Vietnam → Laos, including basin topology, low-gradient deltas, uncertainties and groundwater data limitations.
6. Validate report output, source provenance, multilingual accuracy, release SHA, rollback and safety monitoring.

**Do not mark the replacement launch-ready merely because unit tests pass.**

Branch: mantra116-sustainable-rebuild. Production branch pages-live is preserved.
