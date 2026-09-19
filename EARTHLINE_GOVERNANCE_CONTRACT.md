# EARTHLINE GOVERNANCE CONTRACT

Status: CANONICAL ENGINEERING RULES
Owner of acceptance: Jon
Last updated: 2026-09-19

## 1. Product architecture — four authoritative design owners

Every SCIENCE correction must belong to one and only one of these four core owners:

1. SLOPE
2. WATER PATHS
3. AQUIFERS
4. EXCLUSIONS

A science repair that cannot be assigned to one of these four core owners must not ship without Jon's explicit approval. Presentation, lifecycle, renderer, camera, publication, and performance repairs must remain inside their already-existing authoritative software owner and must not create a second owner.

Earthline is not a patch stack. Do not add a second owner for an existing verdict.

## 2. Accepted lineage

Accepted parent:
- Build: 16584
- File: EARTHLINE-LATEST-CANDIDATE-16584.html
- SHA-256: 19f075d67cc19b12c6169be69aad78dc37acee0cdcb62c957f94d423bd45c33f

Only Jon can promote a new accepted parent.
A deployed production repair is not automatically an accepted parent.

## 3. Production rules

- Production branch: pages-live
- Live URL: https://earthlinedevelopment.org/
- HTTPS live behavior governs acceptance.
- No repair may be promoted merely because one state passes.
- Manual visible results override automation when they reveal a defect.
- Do not revert production to Build 16584 merely because it is the accepted parent if later unaccepted live repairs are intentionally present.

## 4. No unrequested additions

Do not add or change UI, copy, controls, metrics, datasets, data families, science behavior, owners, renderers, polling, map instances, control rails, logo, or Search Orb without Jon's explicit approval.

## 5. Single-owner constraints

Do not add:
- another renderer owner
- another camera owner
- another water-mask owner
- another publication owner
- another lifecycle owner
- another hydrology verdict owner
- recurring styledata, idle, camera-motion, map-render, or polling owners

One map. One control rail. One Search Orb.

## 6. Scientific locks

- Swales remain terrain/science-derived.
- Swales are level on contour.
- Avoid mapped water, creeks, houses, roads, and driveways where supported.
- Slope threshold behavior must not be changed without measured evidence and explicit approval.
- Do not fabricate density or fill visual gaps with fake corridors.
- Fail closed when authoritative inputs or containment checks fail.
- Preserve the groundwater distinctions:
  - well location != aquifer boundary
  - water level != storage
  - aquifer polygon != groundwater at every point
  - absence of a well != absence of groundwater
  - missing/source failure != no groundwater

## 7. Performance contract

- Hard Regional core ceiling: <= 15,000 ms on repeated live HTTPS runs.
- Historical healthy target: approximately 6 seconds.
- Water paths must remain visible; they may not be removed for speed.
- Same-location repeats must be scientifically consistent and use fresh run-scoped state.

## 8. Regression contract

Before any shared-core production repair:
- run the full U.S. state matrix
- compare generated / published / visible swales
- verify 0 outside-jurisdiction swales
- verify 0 unsafe displayed water segments
- verify runtime ceiling
- verify renderer publication
- inspect distribution, not merely total counts
- preserve previously accepted/manual-good controls
- test Property -> Property -> Regional lifecycle where the repair touches lifecycle/shared state

A state-specific success does not authorize promotion when another state regresses.

## 9. Coastal / large-area rule

Do not solve a coastal or large-state defect with a state-name branch.
If coarse statewide resolution loses real terrain detail, fix the appropriate shared owner or add a shared scale/resolution mechanism that passes cross-state regression.
Do not append display-only swales.

## 10. Change discipline

Before editing:
1. Name the defect.
2. Name the authoritative owner being changed.
3. State which locked behaviors must remain unchanged.
4. Identify the regression set.
5. Reject the change if it creates a second owner.

After editing:
1. Run focused diagnostic.
2. Run cross-state regression.
3. Run full state matrix for shared-core changes.
4. Do not deploy on partial evidence.
5. Report exact commit and test results.
6. Jon alone decides acceptance.

## 11. Cost constraint

Nothing except the domain may generate a charge unless Jon explicitly changes this rule.

## 12. Communication / workflow

- Do not require Jon to say "Proceed" between already-approved repair steps.
- Continue automatically until a consequential choice, acceptance decision, or new scope requires approval.
- Do not call a state passed until Jon has accepted a visible result when manual visual acceptance is part of the gate.
- Do not claim a build accepted unless Jon explicitly says so.
