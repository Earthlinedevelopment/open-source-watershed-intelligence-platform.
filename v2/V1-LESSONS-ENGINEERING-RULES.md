# Earthline V2 — V1 Lessons Converted to Engineering Rules

V2 preserves what V1 proved and removes the failure patterns that caused regressions.

## 1. Rendered page is the acceptance authority
Internal counters, source counts, audit objects, and "published" flags are not a pass.
A user-visible feature passes only when it is actually rendered after the complete real user sequence and remains rendered after delayed work settles.

## 2. One owner per state transition
V2 must have one authoritative owner for Regional publication, Regional→Property targeting, Property publication, Property swale visibility, Elder Property refresh, hydrogeology publication, and report publication.

## 3. Atomic publication
Property publication commits run identity, boundary, safe swale geometry, visible swale renderer, recharge result, Property target, and completion event as one governed result.

## 4. No late writer may erase a committed result
After COMMITTED, only the authoritative owner may replace that run.
Optional async context may append context but may not clear core output.

## 5. Explicit lifecycle
IDLE → REGIONAL_RUNNING → REGIONAL_COMMITTED → PROPERTY_TARGETED → PROPERTY_RUNNING → PROPERTY_COMMITTED.
Failures are terminal for that run token.

## 6. Run-token ownership
Every async result carries the run token that created it.
Stale async work is discarded without UI mutation.

## 7. Fail closed
Missing hydrogeology, wells, Elder coverage, DEM, buildings, roads, or other required evidence never silently becomes a scientific positive.

## 8. Preserve source meaning
Well location ≠ aquifer boundary.
Water level ≠ storage.
Secondary Hydrogeologic Region ≠ Principal Aquifer.
CHMv2 canopy structure ≠ verified age.
Elder confidence ≠ probability of age.
Elder Recharge weight remains zero.

## 9. Core first, optional context second
Core Property analysis never waits for Elder detection, NAIP imagery, report decoration, or telemetry.

## 10. Stable fallback must be visibly safe
A fallback is valid only if it is actually visible when active.
A replacement renderer may hide fallback only after the replacement is verified visible.

## 11. No lifecycle proliferation
Do not add recurring styledata, idle, render, camera-motion, polling, or MutationObserver owners when an existing deterministic lifecycle event can solve the problem.

## 12. User navigation is governed behavior
Regional → corridor → Zoom → move map → CROSSHAIR → 20 ACRES is a permanent rendered regression test.

## 13. Production-origin equivalence
localhost is debugging only when HTTPS origin behavior can differ.
Acceptance uses branch code under production-origin-equivalent HTTPS semantics without modifying production.

## 14. Accepted baseline is immutable
Only Jon promotes V2.
Every accepted V2 build gets an exact SHA, immutable lock branch, rendered evidence, known-positive controls, and rollback target.

## 15. Known-positive controls are permanent
The California Property result shown by Jon on 2026-10-13 with visible Elder candidates is a permanent V2 Elder regression control.

## 16. Science and presentation are separate
Styling may not change hydrology geometry, ranking, exclusions, recharge weights, Elder science, or hydrogeology classification.

## 17. Editable architecture
The giant V1 page is a compatibility shell, not the normal V2 editing surface.
New V2 behavior belongs in small modules with explicit inputs, outputs, ownership, tests, and no hidden global writes.

## 18. Performance gates
Target approximately 6 seconds where practical; hard ceiling 15 seconds for normal launch-state analysis.
Performance work may not change science.

## 19. Zero-cost gate
No V2 dependency may create a charge except the domain/URL.

## 20. Promotion gate
V2 cannot replace V1 until rendered Regional, Property, crosshair, swales, Elder positive control, truthful Elder no-coverage, hydrogeology priority, repeat-run, representative-state, production-origin, and rollback gates all pass.
