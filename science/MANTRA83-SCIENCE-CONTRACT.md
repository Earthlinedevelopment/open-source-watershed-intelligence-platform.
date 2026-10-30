# Mantra 83 — Unified Earthline Science Contract

Status: FORENSIC / NON-PRODUCTION. This document defines the science invariants that a replacement engine must satisfy before any UI integration.

## 1. One terrain/hydrology model
- DEM input is immutable for a run and carries source, resolution, bounds, and run identity.
- Depression handling uses priority-flood.
- Flow routing uses D8 on the filled surface.
- Flow accumulation is derived from that same D8 graph.
- Slope is percent rise/run from the same DEM grid.
- Regional and Property must call the same hydrology implementation. Only extent/resolution may differ.

## 2. Swale eligibility
Hard rule: a proposed swale cell or segment is eligible only when local slope is <= 4.0%.

No alternate 13.5%, 18%, or 33% swale eligibility paths are permitted.

A candidate is also ineligible when it intersects:
- outside analysis boundary;
- ponded cells;
- mapped roads or driveways;
- mapped structures / impervious built surfaces;
- mapped water or protected major-flow channels;
- manual no-build areas;
- dense forest canopy under the Earthline forest gate.

Every vertex and every interpolated segment between vertices must pass the same eligibility rule.

## 3. Swale geometry
Property spacing target:
- target 6.096 m (20 ft)
- minimum 4.572 m (15 ft)
- maximum 7.620 m (25 ft)

The engine may omit a swale when terrain/exclusions make this spacing impossible; it may not relax slope or safety rules merely to fill visual gaps.

Current physical minimum corridor-length rule is 12–40 m depending on grid resolution. This remains under validation and must be explicit in output metadata.

## 4. Exclusion evidence
Current Property implementation contains:
- hard/infrastructure buffer: 6 m;
- water mask buffer: 2.4 m;
- additional major-channel safety check near 4 m.

These values are preserved as current behavior for validation; they are not to be silently changed by rendering or state-specific logic.

If required exclusion evidence is unavailable where Earthline claims authoritative local screening, publication fails closed.

## 5. Forest/canopy
Current code classifies a corridor as forested when mean canopy score > 0.40, but only multiplies score by 0.84. That does not satisfy Earthline's approved dense-forest gating direction.

Unified rule: dense-forest candidates are withheld from swale publication rather than merely receiving a modest ranking penalty. Canopy unavailable must be disclosed and must not be misrepresented as open land.

## 6. Recharge suitability
Property formula currently uses:
- aquifer permeability 0.30
- soil infiltration 0.20
- slope 0.18
- flow accumulation 0.17
- climate/need term 0.15

Slope component is clamp(1 - slopePct / 12, 0, 1).
Flow component is log-normalized accumulation.
Climate need is clamp((45 - annualPrecipIn) / 40, 0, 1).
Final multiplier is 0.82 + need * 0.33.

Regional currently applies the same formula but may substitute aquifer=0.45 and soil=0.55 when those data are unavailable. Such substitution must be labeled as screening fallback and never displayed as measured aquifer/soil evidence.

## 7. Aquifer evidence
Aquifer geometry, well evidence, and recharge suitability are separate evidence types.
- Missing mapped aquifer data is not evidence that no aquifer exists.
- Fallback values must never be presented as observed groundwater evidence.
- Elder Tree evidence has zero recharge-score weight.
- Aquifer evidence displayed to users must belong to the same run identity and analysis extent as all other published science.

## 8. Publication invariant
A result can publish only when one immutable run bundle contains:
- run identity;
- target coordinates and extent;
- DEM provenance;
- hydrology;
- contours;
- exclusion evidence;
- water paths;
- swale candidates and final swales;
- recharge model;
- aquifer evidence;
- Elder evidence;
- coverage/confidence metadata.

Rendering may read this bundle. Rendering may not mutate it.

## 9. Determinism
Same input bundle + same engine version must produce the same scientific result.
Camera movement, zoom, browser, panel state, rerendering, and previous searches must not change science output.

## 10. Current conflicts that must be removed
Current live code contains:
- Property swale ceiling maxS=33;
- Regional swale ceilings of 4%, 13.5%, and 18% depending on branch;
- two separate swale engines;
- separate mutable Property and Regional state paths;
- multiple run-analysis owners and publication paths.

None of those conflicts are permitted in the unified engine.
