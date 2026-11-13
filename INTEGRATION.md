# Earthline Property clean-engine integration — staging-only contract

Status: **BLOCKED — not connected to live Property publication.** This contract does not authorize switching the renderer or promoting production.

## Existing single-Property ownership boundary
The existing Property route builds contour candidates through `earthlineSwaleFromPts(...)`, then the safety gate makes `M.authoritativeSafeSwales15815` authoritative only when both `M.propertyResultLock15815.safetyVerified === true` and `M.safetyAudit15806.verified === true`. `earthlineDeliverPropertyResult15817(...)` publishes that governed output. The `earthline:analysis-complete` event with `detail.tier === 'property'` is a **post-publication notification**, not a pre-publication validation hook.

Never call `screenProperty()` on this event to mutate published swales; doing so would break run identity, exclusion enforcement, and the one-owner publication model.

## Required input adapter before any engine substitution
Construct *and validate*, from the same Property run:
- measured property boundary and local projection, candidate points with aligned longitude/latitude coordinates;
- verified bare-earth elevation grid with coverage, resolution, source/provenance and no-data handling;
- contour-following candidate geometries and per-vertex slope/elevation from that same grid, with stable run ID;
- authoritative no-build features and complete acquisition evidence: roads, buildings, driveways, parking, wetlands, water, modeled channels and buffers; distinguish missing/partial/valid empty; an OSM valid-empty screening result is not authoritative clearance;
- drainage and soil/infiltration evidence used for any 48-hour drawdown claim; do not supply guessed values;
- immutable `runToken` / `searchGen` matching the current display owner.

The current `earthline-property-swales.js` is a pure **screening kernel**, not an autonomous terrain acquisition or accepted site-design engine. It cannot substitute for the existing authorized hydrology/DEM pipeline, and its `screenProperty()` result is not a release safety verdict.

## Integration acceptance sequence
1. Add isolated unit tests for adapter source coverage, stale run token, missing bare-earth terrain, partial/failed/valid-empty exclusions, water/road/building intersection, and 4% Rule B (length-weighted route mean plus approved uninterrupted >4% stretch definition).
2. Keep existing 15–25 ft swale spacing target distinct from hard minimum spacing. No swales over any frozen exclusion.
3. Connect the adapter exactly once inside the current-run Property pre-publication safety boundary; **fail closed** if verified inputs or source ownership are absent. Preserve existing published output until comparison acceptance.
4. Perform side-by-side same-site checks against baseline and candidate, including both Property repeats and Regional rerun; archive generated/published/rejected counts, source fingerprints and screenshots.
5. Do not swap the Property renderer or merge to `pages-live` without measured acceptance.

## Test harness
`tests/m210-live-gate.mjs` listens before declaring Property for `earthline:analysis-complete` with `tier:'property'` (180 s). A timeout means **harness/CI inconclusive**, not scientifically proven engine failure. Require run-token and target-center matching in addition to the event before certifying success.

## 4% candidate
The uploaded M201/M211 ZIP is not approved for production: its vertex sample mean is not length weighted, and its grid-wide steep-ground notice does not prove the slopes of accepted corridors. Retain as a review candidate only.

## Release gate
No new deployment from this contract. Production `pages-live` remains frozen at `a9d4e04e1c00ca74f6fac1c762b0c370c57ef1fc`.
