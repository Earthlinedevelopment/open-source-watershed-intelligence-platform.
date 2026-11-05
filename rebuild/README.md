# Earthline — Mantra 116 isolated rebuild

This directory is **not connected to production**. Live index.html, published assets, approved branding and DNS remain untouched.

## Permanent boundaries

1. Data adapters obtain versioned terrain, hydrography, land-cover, groundwater and exclusion coverage. No fallback may invent an aquifer.
2. The scientific engine alone generates swale coordinates and independently auditable slope, positive-runoff-interception and exclusion-footprint evidence.
3. The publication gate blocks incomplete evidence and distinguishes supported zero opportunity from failed processing.
4. The run owner holds exactly one authoritative run ID and analysis tier; stale asynchronous completions cannot publish.
5. A future map adapter consumes immutable source coordinates without geometry-changing spline paths. Map visuals cannot decide science.
6. DATA panels and reports must consume the same current-run snapshot, with source dates, gaps and uncertainty.

## Checks and status

Run: node --test rebuild/tests/*.test.mjs

These are **synthetic contract tests**, not independent verification of DEM, flow, GIS footprint validity, groundwater evidence or regional coverage. No states or countries have been certified by this rebuild.

## Existing decisions preserved

- No features without approval; deleted features stay deleted.
- Approved logo and Search Orb; exactly "Slow it. Sink it. Spread it."
- Native Mapbox gestures; no custom sliders; zero-cost operation except domain.
- Entire corridor local slope 0 to 4% inclusive, not merely 3 to 4%.
- Positive modeled runoff crossing, full-footprint no-build exclusion, and truthful groundwater status.
- Property spacing guidance 15–25 ft where supported, never artificial quota fill.
- First and repeated Regional/Property transitions must pass real browser tests.
- All 50 states and Thailand, Vietnam, Laos require separate representative source-backed geographic acceptance.
- Preserve production rollback, pin artifact SHA and test the real HTTPS origin before promotion.

## Promotion

No merge or deployment until scientific fixtures, real-world source adapters, browser lifecycle, desktop/mobile visuals, performance, international coverage and exact production checksum gates pass. See docs/EARTHLINE-M116-REBUILD-CONTRACT.md.

## Implemented on the isolated branch

- Pure deterministic priority-flood D8 and runoff model adapter: `core/terrain-flow.mjs`
- Full metric raster slope, no-build and crossing verification: `core/raster-audit.mjs`
- Source-class exclusion union and coverage proof: `core/exclusion-source.mjs` (five complete layers required; unknown cells block)
- D8 drainage never treats internal DEM no-data as a fabricated outlet; unreachable terrain blocks
- Exact geo/metric corridor equivalence check (caller supplies a trusted CRS transform)
- Verified source/DEM/flow certification entrypoint: `core/science-runner.mjs`
- Single-run lifecycle owner: `core/run-owner.mjs`
- Mapbox-only publication adapter requiring injected **approved** styles: `core/map-publication.mjs`
- GitHub CI runs `node --test rebuild/tests/*.test.mjs` covering 55 synthetic contract/integration tests (55/55 passing on 2026-11-05).

All 55 are synthetic fixtures; **zero real regions certified**. Existing production map and old baseline remain unchanged. Next: real source adapter, science fixtures and browser/cross-region verification. The audited legacy code discrepancies are recorded at `docs/EARTHLINE-M116-LEGACY-SCIENCE-AUDIT.md`.
