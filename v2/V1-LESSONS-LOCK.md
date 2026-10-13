# Earthline V2 — V1 Lessons Lock

This file is a build constraint, not a retrospective.

## Production and acceptance
- V1 production stays frozen until Jon explicitly approves V2 promotion.
- The rendered page is the acceptance authority. Internal counters, source counts, and audit flags cannot overrule missing pixels or broken controls.
- V2 testing must use production-origin-equivalent HTTPS behavior. localhost/file:// results are diagnostic only.
- A candidate is not stable until repeated real user-path runs remain stable.

## Ownership
- One authoritative owner per lifecycle state, verdict, source publication, and rendered output.
- Never stack a second repair owner on top of an old owner when the old owner can be replaced or simplified.
- No new recurring styledata, idle, map-render, camera-motion, polling, setInterval, or MutationObserver owner without explicit approval.
- Mapbox owns map navigation input. Presentation overlays may expose deliberate hit targets but may not own the full map surface.

## Regional → Property handoff
- Regional selection, Zoom, map drag, CROSSHAIR retarget, and 20-acre Property analysis are one governed handoff.
- A real user drag must move the map and retarget the Property button to CROSSHAIR.
- A stale corridor target must never masquerade as the current crosshair target.
- Property publication must be atomic: authoritative geometry, visible renderer, tier state, and completion event must agree before downstream systems refresh.

## Property swales
- Scientific corridor generation and visible publication are separate checks.
- Nonzero engineCount/safeCount does not mean visible swales.
- A fallback renderer must remain visibly nonzero until the intended replacement renderer is verified visible.
- Do not hide the fallback first and hope the texture/ditch renderer arrives later.
- Preserve the approved Property swale blue/style values; stability work must not alter hydrology or styling.

## Elder Trees
- Science baseline 17118 is locked unless separately approved.
- Evidence owner = high-recall structural pool.
- Density/cohort prior classifies; it does not erase valid evidence.
- Display thinning is presentation only.
- Elder must refresh downstream of authoritative Property publication, not from Zoom clicks or speculative camera events.
- Property Elder state must never reuse Regional overview data as Property evidence.
- A known-positive Property must remain visibly positive after every V2 edit.
- Elder Recharge weight remains zero.
- No modeled point may be presented as verified age/ancient/Mother Tree status without authoritative evidence.

## Data and failure behavior
- Fail closed when an authoritative source required for a verdict is unavailable.
- Absence of a well is not absence of groundwater.
- Well point locations are not aquifer boundaries.
- Water level is not storage.
- Aquifer polygons do not imply groundwater at every point.
- Hydrogeologic regions must retain their source meaning; Secondary Hydrogeologic Regions are not relabeled as aquifers.
- Context sources must not block core Property publication unless they are scientifically required.

## Performance
- Target approximately 6 seconds for normal launch-state analysis where practical.
- Hard ceiling 15 seconds for launch-state Property analysis.
- Optional imagery/context is non-blocking.
- Avoid duplicate fetches, duplicate renderer owners, and repeated source hydration.

## UI locks
- One map.
- One control rail.
- Search Orb remains intact.
- Earthline logo remains intact.
- Controls that Jon removes stay removed unless he explicitly asks for them back.
- A visible control must be tested by visible interaction, not by programmatic invocation of hidden functions.

## Promotion gate
V2 does not replace V1 until all of these pass on production-origin-equivalent rendering:
1. Regional search.
2. corridor selection.
3. Zoom.
4. real map drag.
5. visible CROSSHAIR retarget.
6. 20-acre Property run.
7. visibly rendered bioswales.
8. fresh Property Elder result.
9. known-positive Elder benchmark remains positive.
10. repeated reruns remain stable.
11. representative U.S. state matrix passes.
12. zero-cost and source-failure gates pass.
