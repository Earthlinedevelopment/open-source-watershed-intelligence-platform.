# Earthline M116 — Legacy scientific behavior audit (read-only)

Source inspected: `pages-live/index.html`, blob SHA `c8653b2adb7b45e60c6cf5dba2bcdcd3491c0688`. This is source review, **not** an assertion that each path reaches current published output.

## Documented conflicts with approved science rules

| Source location | Directly observed predicate or transform | Implication |
|---|---|---|
| `index.html:15465` in Regional fallback | `if(sp<2.2||sp>6.5)continue;` | Excludes 0–2.2% and considers 4–6.5%, inconsistent with approved 0–4%. Other downstream gates might still reject unsafe corridors. |
| `index.html:29929` inside `makeSwales` | `const segment=chaikin(raw,2,false);` | Generated centerline geometry may be modified by smoothing before corridor assessment. Subsequent filters may change its effective safety. |
| `index.html:29935` inside `sampleSegment` | `maxSlope=relaxed?18:13.5;` and stride-based sample | Wide sampling limits and spaced checkpoints are not independent proof of 0–4% across the entire corridor footprint. |
| `index.html:15490` Regional fallback | `earthlineNaturalContourDisplay(bestSeg)` | Display-oriented geometry transformation is coupled to science path; the M116 adapter forbids altering published science coordinates. |
| `index.html` hydrology function | Priority flood, filled elevations, D8 routing and accumulation with valid-cell masks | Approach can be extracted as an independently testable calculation, not wholesale copied with state and UI coupling. |

## New M116 safeguards

- Pure terrain/D8 module and explicit runoff-depth input with provenance.
- Independent Horn 3x3 slope check against DEM across all swale footprint cells (0–4%).
- Exact raster footprint collision against no-build mask; unknown cells and truncated bounds block.
- Separate metric-to-geographic projection match; geometry cannot silently be swapped between validation and rendering.
- Modeled runoff crossing check; no invented precipitation default.
- Immutable single-run publication and separate Mapbox layer adapter.

## Known limitations: NOT YET ACCEPTED

Synthetic tests do **not** establish that a specific real DEM, basin, rainfall period, ground-water source or protected-area mask is complete, correctly georeferenced, current or high-resolution enough for field decisions. The D8 model still needs independent GIS/engineering comparison, genuine source provenance and spatial-accuracy tests. Mapbox adapter tests use a fake map, not a public-domain live browser. No geographic region is certified yet.

Before a website replacement may be called reliable, the real source adapters and published GeoJSON must demonstrate: identical projected/geographic geometry, safe slopes and footprints at source resolution, supported runoff, trustworthy groundwater, retained approved visuals, browser lifecycle, and explicit region-specific acceptance evidence.
