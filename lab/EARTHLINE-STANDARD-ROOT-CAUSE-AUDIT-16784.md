# Earthline Standard Root-Cause Audit — 16784

Purpose: eliminate ad-hoc diagnosis. Every Regional/Property run must inspect the same evidence chain, rank the same cause classes, identify the first failing stage, and limit repair work to that owner.

## Operational prior ranking for recurring Earthline failures
These are diagnostic priors, not statistically calibrated probabilities.

1. Selection / spatial dispersion collapse — 28%
2. Terrain resolution / refinement insufficiency — 20%
3. Run identity / lifecycle ownership — 14%
4. Candidate-generation gate loss — 12%
5. Jurisdiction containment / boundary clipping — 9%
6. Land-water validity / exclusion over-mask — 7%
7. Publication / render handoff loss — 5%
8. Performance / timeout — 3%
9. Optional source availability (aquifer / watershed context) — 2%

## Fixed causal test order
This order never changes because upstream failures invalidate downstream interpretation.

1. RUN IDENTITY / LIFECYCLE
   Test: active token, displayed tier, publication token, Property generation fingerprint.
   Repair owner: lifecycle only. Retire stale owner / restore canonical run ownership. No science change.

2. LAND-WATER VALIDITY / EXCLUSIONS
   Test: land-validity acquisition, valid-cell count, unsafe displayed flow segments, Property safety publication.
   Repair owner: Water Sidecar / Exclusions only. Fail closed. Never place a corridor on mapped water or unverified Property exclusions.

3. TERRAIN RESOLUTION
   Test: whether coarse terrain required bounded high-resolution refinement to recover measurable <=4% opportunity.
   Repair owner: Slope/Terrain only. Refine locally from real elevation data. Never globally lower the slope rule and never fabricate corridors.

4. CANDIDATE GENERATION
   Test: 12x12 opportunity cells -> screened-candidate cells.
   Repair owner: existing makeSwales generation gate only. Inspect contour geometry, length, slope, and flow filtering in the failed cells. No synthetic lines.

5. SELECTION / DISPERSION
   Test: candidate cells -> selected cells.
   Repair owner: existing Regional selector only. Count-neutral reservation/rebalancing within the authoritative capacity.

6. JURISDICTION CONTAINMENT
   Test: selected/pre-boundary corridors -> after-boundary corridors and before/after boundary audit.
   Repair owner: clipping/containment only. Never weaken the jurisdiction boundary.

7. PUBLICATION / RENDER
   Test: post-boundary generated corridors -> source features -> visible overlay lines.
   Repair owner: publication/renderer only. No terrain/science changes.

8. PERFORMANCE
   Test: total core <= 15,000 ms plus phase timings and timeout stage.
   Repair owner: slowest existing phase only. Preserve scientific result.

9. OPTIONAL SOURCE AVAILABILITY
   Test: aquifer/watershed/context acquisition failures.
   Repair owner: source fallback/registry only. If unavailable, state unavailable; never invent groundwater geometry.

## Cell lineage
For every Regional run the audit records the same 12x12 lineage:
- O = terrain cell has measurable valid <=4% opportunity.
- C = at least one real screened candidate exists.
- S = at least one candidate survives final selection.
- P = at least one corridor is present in the final published map.

Loss classification is deterministic:
- O=1, C=0 => candidate-generation / terrain-resolution investigation.
- C=1, S=0 => selection/dispersion.
- S=1 but post-boundary corridor disappears => jurisdiction containment.
- generated != visible => publication/render.
- unsafe > 0 => land-water validity overrides all lower-stage diagnoses.
- core > 15,000 ms => performance failure after scientific correctness is established.

## Repair lock
The audit publishes `firstFailedStage`, `repairOwner`, and `blockedLowerStages`.
No lower-stage code should be changed until the first failed stage passes.
Manual visible evidence remains authoritative over automated pass labels.
