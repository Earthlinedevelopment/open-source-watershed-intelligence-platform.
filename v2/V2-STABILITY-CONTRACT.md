# Earthline V2 Stability Contract — 17138

## Purpose
Earthline V2 is the editable, testable successor to the locked V1 production page.

V2 starts from the exact V1 state visually passed by Jon:
- production commit: `4e80d2a5bfb1ba64661bcf5b9e5c91a0b677c398`
- production lock branch: `production-lock-17137`

V1 production remains frozen. No V2 work may write to `pages-live` without Jon's explicit approval.

## Architecture rule
V2 uses one authoritative owner for each concern. A subsystem may expose state and events, but it may not create a second competing verdict owner.

Authoritative V2 owners:
- core lifecycle / Regional→Property handoff: inherited locked V1 owner until explicitly replaced and parity-proven
- hydrology / swale science: inherited locked V1 owner until explicitly replaced and parity-proven
- hydrogeology context: `v2/hydrogeology-transport.js` + `v2/hydrogeology-source-adapter.js`
- Elder Trees science: approved Elder V2 science baseline 17118
- Elder browser transport: `earthline-chmv2-range` Supabase byte-range proxy only
- Elder browser detector: `earthline-elder-worker-17129.js` + `tools/elder_trees/chmv2_array_detector_17129.py` until moved without scientific change
- imagery context: `v2/naip-imagery-adapter.js`, non-blocking only
- V2 bootstrap / capability registry: `v2/bootstrap.js`

## Elder Trees scientific lock
- science baseline: 17118
- method: `earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse`
- evidence owner: high-recall structurally eligible candidate pool
- density/cohort owner: CURRENT / FUTURE / OUTSIDE_DENSITY_PRIOR classification
- display owner: independently thinned map subset
- Elder Tree Confidence is a local relative structural-evidence percentile, not probability of age
- modeled points are candidates only unless supported by authoritative inventory or field evidence
- absence of Elder evidence does not mean absence of Elder Trees
- Elder Recharge weight remains zero

## Stability gates
A V2 candidate cannot be considered stable because internal counters say it passed. The rendered page is authoritative.

Required gates before any V2 promotion:
1. load without uncaught page errors
2. locked V1 controls remain visually present/absent as approved
3. Regional search renders actual map output
4. Regional → Zoom → 20-acre Property works through visible controls
5. crosshair/orb state is visibly rendered
6. bioswales are actually rendered in the map viewport
7. Elder results are fresh for the current Property AOI, not stale Regional data
8. repeated runs do not lose swales, crosshair state, or Elder publication
9. zero-cost rule remains intact
10. no new recurring styledata, idle, camera-motion, map-render, polling, or MutationObserver owner unless separately approved

## Editability rule
New V2 work goes into `v2/` modules wherever practical. The giant V1 `index.html` is treated as a compatibility shell, not the normal editing surface.

A V2 subsystem is not complete until:
- its owner is named in `v2/runtime-manifest.json`
- it has a deterministic contract test
- any user-visible behavior has a rendered browser test
- fallback/failure behavior is explicit
- it does not silently mutate another subsystem's state

## Promotion rule
Only Jon can approve V2 as the replacement for V1.
