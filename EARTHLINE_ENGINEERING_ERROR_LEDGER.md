# EARTHLINE ENGINEERING ERROR LEDGER

Purpose: prevent recurrence of known Earthline engineering failures.
This file is part of the release process, not a narrative history.

## E-001 — Shared-core change promoted without adequate cross-state regression
Failure:
A repair that improved one state was allowed to change shared behavior before proving that previously-good states remained good.

Rule:
Shared-core changes require the full state matrix before production promotion.

Status:
OPEN PROCESS DEFECT — now governed by EARTHLINE_GOVERNANCE_CONTRACT.md.

## E-002 — Declaring a state passed from automated counts while Jon still saw a visible defect
Failure:
Texas was called complete while the Gulf coastal gap remained visibly unacceptable.

Rule:
Manual visible evidence overrides automated "pass" counts.
Do not call a state accepted until Jon explicitly accepts the visible result where manual acceptance is required.

Status:
LOCKED.

## E-003 — Texas-specific patch drift
Failure:
Diagnostics moved toward Texas-only coastal refinement before proving that the defect belonged to a shared design owner and before checking California/Maryland.

Rule:
No state-name science branch.
Repairs must belong to Slope, Water Paths, Aquifers, or Exclusions and pass cross-state regression.

Status:
LOCKED.

## E-004 — Microtask performance repair starved rendering
Failure:
Replacing timer yields with Promise.resolve reduced timing but caused truncated/chunked map updates.

Rule:
Performance fixes must preserve browser responsiveness and visible rendering, not just core timing.

Status:
LOCKED.

## E-005 — Repeating rejected hypotheses
Failure:
Time was lost revisiting endpoint sampling, coarse contour density, lower-tail contours, and statewide resolution changes after diagnostics had already rejected them.

Rule:
Rejected hypotheses must be recorded here or in the active handoff and not repeated unless new evidence invalidates the rejection.

Known rejected Texas coastal approaches:
- endpoint-near contour sampling
- denser sampling on the same coarse contours
- lower-tail statewide contours as sole fix
- statewide 128x128 replacement
- full-state 192-grid approach
- fake/display-only swales
- slope-threshold relaxation to fill visual gaps

Status:
LOCKED.

## E-006 — Treating deployed production as accepted parent
Failure risk:
A live repair may be deployed but unaccepted.

Rule:
Only Jon promotes accepted parent.
Accepted parent remains Build 16584 until Jon explicitly changes it.

Status:
LOCKED.

## E-007 — Letting governance live only in chat continuity
Failure:
Rules existed in conversations and handoffs but were not part of repository release mechanics.

Rule:
Canonical governance must live in-repo and be checked before release work.

Status:
REPAIR IN PROGRESS — governance contract, baseline manifest, error ledger, and preflight checker added on diagnostic branch.
