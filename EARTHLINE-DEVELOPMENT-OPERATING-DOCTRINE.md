# EARTHLINE DEVELOPMENT OPERATING DOCTRINE

**Status:** CONTROLLING OPERATING STANDARD  
**Effective:** 2026-10-27  
**Purpose:** Prevent scientific drift, regression, lost context, and uncontrolled production change.

## Core mandate

Earthline is a real scientific product. Every development action must preserve accepted behavior, originate from the canonical science or clearly separated presentation system, be reversible, and be supported by evidence before production is changed.

The burden of continuity belongs to the development process, not to Jon.

## Permanent duties

1. **Preserve** — Do not reopen accepted behavior while solving a different problem.
2. **Isolate** — Identify the exact defect, exact owner, expected result, and permitted files before changing anything.
3. **Prove** — Use scientific controls, runtime evidence, regression checks, and visual evidence before promotion.
4. **Record** — Enter every meaningful action in the change ledger with baseline, defect, owner, files, candidate SHA, result, and rollback SHA.

## Canonical scientific order

1. Input and location authority
2. Terrain and elevation
3. Hydrology
4. Land and infrastructure exclusions
5. Groundwater and recharge evidence
6. Swale eligibility
7. Swale geometry
8. Publication
9. Independent ecological evidence
10. Presentation

A downstream display problem must not be used to alter upstream science unless evidence proves the science is wrong.

## Separation rule

- Scientific defects are corrected in canonical science ownership, not display behavior.
- Presentation defects are corrected in presentation ownership, not slope, hydrology, exclusions, aquifer evidence, recharge logic, eligibility, or geometry.
- Search and crosshair defects are corrected in location and run authority.
- Elder Tree defects are corrected in the Elder evidence pipeline or publication lifecycle and must not alter swale science.
- When a symptom could be scientific or presentational, science is proven first.

## Locked Earthline invariants

- Property swales are eligible only at slope <= 4%, including flat terrain.
- No swales on roads, driveways, structures, mapped water, or major waterways.
- Property swales follow contour and use approximately 15–25 ft spacing where terrain and exclusions permit.
- Published Property swales remain inside the declared Property frame.
- Regional searches default to watershed/regional context before optional Property analysis.
- Crosshair and Property search use one authoritative target and one intentional user action.
- Water paths are scientifically derived and directionally meaningful.
- Contours are derived from terrain and remain readable.
- Aquifer and well evidence is factual, source-aware, and visible where required.
- Recharge outputs reflect their scientific drivers and sources.
- Elder evidence is independent, run-scoped, and publishes when valid evidence exists.
- Accepted Property swales use the authoritative blue safe-line presentation.
- Required blue identity and two dotted blue strips are preserved.
- The approved Earthline logo and Search Orb are not changed without explicit approval.
- The exact tagline is **“Slow it. Sink it. Spread it.”**
- Map navigation remains native and intuitive.

## Mandatory read-before-write gate

No Earthline repository write is permitted until all of the following are known:

1. Current production SHA
2. Current frozen baseline
3. One clearly defined defect
4. Required correct behavior
5. Exact canonical owner
6. Exact permitted files/functions
7. Exact rollback SHA
8. Expected scientific and visual evidence

If any item is unknown, no production development action is allowed.

## Development lifecycle

1. Observe the real failure exactly as seen.
2. Reproduce on a known control without changing code.
3. Trace upstream to the first incorrect state.
4. State one evidence-supported cause.
5. Work on an isolated candidate branch.
6. Change only the canonical owner.
7. Verify science before judging appearance.
8. Verify presentation and interaction without changing science.
9. Run the regression matrix.
10. Review the exact candidate diff.
11. Promote only after all gates pass.
12. Accept or reject based on real product evidence.

## Evidence hierarchy

1. Direct user browser evidence
2. Instrumented browser evidence
3. Deterministic control tests
4. Static code and data inspection
5. Repository and deployment metadata

**An automated PASS never overrules a visible FAIL.**

## Scientific validation gate

Every candidate must verify:

- location and run authority
- terrain and slope scale
- hydrology
- water exclusions
- road, driveway, and structure exclusions
- <= 4% Property slope rule
- contour-following geometry
- approximately 15–25 ft spacing
- Property frame containment
- aquifer and well evidence
- recharge drivers and targets
- Elder evidence lifecycle

## Presentation and interaction validation gate

Every candidate must verify:

- authoritative blue Property swales
- required blue identity
- correct layer order
- Elder display
- one-press crosshair behavior
- search behavior
- map navigation
- Recharge Suitability and DATA panel
- reports and information pages
- logo, orb, and tagline

## Regression matrix

At minimum, representative controls must include:

- Arizona Property controls
- Vermont
- New York
- Massachusetts
- Texas / Florida / Louisiana
- Oklahoma / Iowa / Arkansas / Nebraska
- California Bay Area / Colorado / Maryland
- Thailand / Vietnam / Laos

A candidate is not accepted only because the location where the defect was found now works.

## Production promotion rules

- Production remains unchanged during diagnosis and candidate development.
- Every candidate is compared against the frozen production baseline.
- Every file difference must be expected and tied to the declared defect.
- Large-file integrity is verified by exact blob SHA or equivalent byte-level identity.
- Production SHA is re-read immediately before promotion.
- Rollback SHA is recorded before production moves.
- Deployment success is not the same as product acceptance.
- User-visible regression rejects the candidate.
- Accepted behavior becomes frozen and is not reopened while solving another defect unless evidence proves it wrong.

## Failure handling

When a candidate fails:

1. Mark it REJECTED in the ledger.
2. Restore the recorded stable SHA if production was affected.
3. Do not layer new corrective logic over the failed change.
4. Preserve the evidence.
5. Return to the first incorrect state in the scientific chain.
6. Do not ask Jon to repeat the same test unless a materially relevant change has actually been deployed.

## Session continuity and self-reminder protocol

At the start of every new Earthline work session, after any context compaction, and before any repository write:

1. Read this doctrine.
2. Read the current change ledger.
3. Re-read current production SHA.
4. Re-establish accepted baseline, current candidate, current defect, allowed scope, and rejected candidates.
5. Re-read locked invariants.
6. Re-read promotion rules before any production move.
7. Update the ledger after every material result.
8. If evidence conflicts, stop changing code and reconcile the evidence.
9. If uncertain, choose no change over an unproven change.

## Communication standard

- Report only material facts: what changed, what was verified, what failed, and what remains.
- Never describe a planned change as completed.
- Never call a problem solved merely because code was committed or deployment succeeded.
- Never ask Jon to test an unchanged state.
- Continue through an already approved repair sequence without requiring repeated authorization.
- When a result fails, state the failure plainly and return immediately to controlled diagnosis.
- When no safe change is justified, make no change.

## Standing instruction

Before changing Earthline, re-establish the real production state, read the governing rules, identify one defect and its canonical owner, protect every accepted behavior, change only the responsible science or presentation owner, verify the complete scientific chain, verify the user experience, compare the exact candidate against the frozen baseline, and preserve a clean rollback.

When evidence is incomplete or contradictory, stop changing the site and diagnose.

**This doctrine is the default operating method for all future Earthline development.**
