# Earthline Version 2 — Working Branch

Branch: `version-2`  
Production branch: `pages-live` — FROZEN unless Jon explicitly authorizes a production repair.

## Version 2 objective

Improve Earthline's groundwater context and map/report realism without changing the scientific meaning of Version 1, without introducing paid services, and without reintroducing performance regressions or competing verdict owners.

## 1. Hydrogeology upgrade — first implementation track

### Current production state
Production uses:
1. USGS Principal Aquifers of the United States as the primary U.S. regional aquifer source.
2. Existing USGS karst context as fallback when the principal-aquifer source is unavailable.

Production does **not** currently use the 2025 USGS National Extent Hydrogeologic Framework.

### Version 2 source
USGS: **Hydrogeologic regions of the conterminous United States**  
Release date: 2025-12-19  
DOI: https://doi.org/10.5066/P1F39LHM  
Rights: CC0 / public domain.

This dataset combines Principal Aquifers with 69 Secondary Hydrogeologic Regions into one shallowest-hydrogeologic-region framework for CONUS. It fills areas previously represented as “other rocks.” The earlier Secondary Hydrogeologic Regions work states that “other rocks” account for about 40% of CONUS.

### Earthline ownership rule
Use one authoritative groundwater-context verdict owner:
1. Higher-resolution authoritative state/national agency hydrogeology, when installed and validated.
2. USGS 2025 Hydrogeologic Regions national framework.
3. Existing Principal Aquifers source as fallback during transition/testing.
4. Existing karst context as a lower-tier fallback/context source only.

Do not relabel every Hydrogeologic Region polygon as an “aquifer.” Preserve whether the feature is a Principal Aquifer or a Secondary Hydrogeologic Region.

### Important limitation
The 2025 Hydrogeologic Regions release does not include sand-and-gravel aquifers of alluvial and glacial origin; the next shallowest hydrogeologic region is shown in those areas. V2 must preserve separate authoritative alluvial/glacial sources where required.

## 2. Imagery / rendering upgrade

The major imagery source recovered from the post-launch discussions is **USDA NAIP aerial imagery** for CONUS.

USDA current NAIP ImageServer:
https://apps.geo.fpac.usda.gov/geo-imagery/rest/services/naip/conus_naip/ImageServer

Earlier Earthline proof timing:
- NAIP 1800×1050: about 4.290 s.
- Optimized NAIP 1400×840: about 3.653 s.
- Blocking USGS 3DEP hillshade: about 8.102 s — rejected as a blocking dependency.

V2 rule:
- NAIP may be used as a real-land background for U.S. Property/report rendering.
- Cache/reuse it and, where useful, prefetch only after core Property analysis.
- Never make 3DEP a blocking request.
- Keep the Earthline engine's swales, water paths, contours, aquifer/hydrogeologic context, and analysis boundary authoritative over the imagery.
- No AI-generated land image should replace measured/mapped site context.

### Land-cover companion
Use current **Annual NLCD** as the U.S. land-cover classification companion where it adds analytical value. The current USGS product suite includes land cover, land-cover change, confidence, fractional impervious surface, impervious descriptor, and spectral change day-of-year.

### Global rendering fallback
For non-U.S. V2 work, the previously discussed zero-cost stack remains:
- Sentinel-2 imagery
- ESA WorldCover 10 m
- Copernicus DEM GLO-30

These are post-U.S. implementation items and must not block U.S. V2 progress.

## 3. Report renderer V2

Recovered post-launch requirements:
- Export/render the actual Earthline engine map rather than constructing a separate fake geography.
- Use the authoritative Analysis Boundary, not an invented parcel boundary.
- Preserve canonical engine swale IDs in report presentation.
- Keep interactive zoom in the engine; report output only needs to be easily readable.
- Keep rendering lightweight and production-first.
- No new heavy map engine, photorealistic pipeline, or unnecessary recurring network dependency.

## 4. Water-data evidence stack

Maintain distinct meanings:
- Mapped hydrogeology = authoritative mapped aquifer/hydrogeologic context.
- Wells = point observations; not polygon boundaries.
- NASA GRACE / GRACE-FO = regional terrestrial-water-storage / inferred groundwater-storage trend; not local water-table depth and not aquifer geometry.
- Terrain/hydrology = Earthline surface-water movement, slope, corridors, and recharge-opportunity analysis.

## 5. Recovered Version 2 / post-launch backlog

Items previously deferred until after launch:
- Full cleanup/consolidation of historical aquifer owners.
- State geological-survey / groundwater-agency hydrogeology overrides.
- Global groundwater-potential modeling, after authoritative mapped layers are established.
- Coverage-index geometry completion.
- Capture-accounting / unique-area methodology review.
- Future spacing science.
- Dual-flow-builder cleanup.
- Percentile/channel methodology review.
- Cosmetic aquifer-label redesign.
- Broader report redesign after the data-source upgrade is stable.
- Additional interventions/features only after core science remains stable.
- Nonessential global adapters after U.S. V2.
- Member/auth completion: signup, login, password reset, email verification, persistent session/account state.
- Automated welcome email only after SMTP/auth is truly connected.
- PostHog production instrumentation/verification.
- Merch/store completion using the approved artwork, without redesigning the user-supplied mockups.

Older visual requests retained for review rather than automatically reapplied:
- Stronger/darker, more-blue bioswale treatment.
- Two dotted blue strips where that remains the approved swale visual language.
- Tighter report layout.
- Larger engineer stamp with logo-offset waves.
- Fuller Earthline Process page.
- Contact button and Corrections Registry content where still applicable.

## 6. Performance and governance locks

- Zero-cost rule remains: domain/URL may cost money; datasets, APIs, hosting, and software must not create a charge.
- No new recurring `styledata`, `idle`, camera-motion, polling, or map-render owner without explicit necessity.
- One authoritative owner per verdict.
- One map, one control rail, one Search Orb.
- Preserve the accepted production map/report until V2 has its own validation.
- Target approximately 6 s where practical; hard ceiling 15 s for launch-state analysis.
- Fail closed when an authoritative data source is unavailable.
- No invented aquifer boundary from wells, geology, GRACE, or imagery.

## 7. Immediate Version 2 build sequence

1. Inspect the 2025 Hydrogeologic Regions schema and create a normalized Earthline feature model distinguishing Principal Aquifer from Secondary Hydrogeologic Region.
2. Build the source adapter on `version-2` only.
3. Validate Vermont, Arkansas, Iowa, New York, Massachusetts, Maryland, Texas, and coastal/flat-terrain states before broad 50-state testing.
4. Add NAIP as a non-blocking U.S. rendering layer and measure end-to-end timing.
5. Add Annual NLCD only where it improves land-context classification without slowing the core verdict path.
6. Re-run the full 50-state safety/publication matrix.
7. Only then begin state-authority overrides and the broader post-launch backlog.

## Clarification on the remembered “30–40%” improvement

The exact imagery claim “30–40% improvement” was not recoverable in the retained Earthline records. The concrete imagery improvement recovered is USDA NAIP. Separately, the hydrogeology work has an explicit ~40% figure: the older USGS Principal Aquifer map classified about 40% of CONUS as “other rocks,” and Secondary Hydrogeologic Regions were developed to subdivide that area. Do not merge those two claims in public Earthline copy without supporting evidence.
