# Earthline V2 — Legacy / Mother Tree Candidate Layer
## Research and Interoperability Specification
Status: Research branch only. No V1 production or science changes.
Branch: `v2/legacy-tree-layer-research`

## Purpose
Add a scientifically defensible tree-conservation layer that can:
1. ingest verified ancient/veteran/legacy-tree records;
2. predict likely legacy-tree hotspots where verified records are incomplete;
3. identify remotely sensed individual-tree candidates where data resolution permits;
4. preserve a strict distinction between a remotely sensed legacy-tree candidate and a field/genetically verified mycorrhizal hub ("Mother Tree");
5. remain interoperable with external inventories such as the Woodland Trust Ancient Tree Inventory (ATI).

## England / Woodland Trust alignment

Earthline should mirror the ATI architecture rather than invent a parallel ontology.

### ATI observable/verification workflow
- Candidate found by recorder / survey.
- Precise location recorded.
- Species or genus recorded where possible.
- Girth measured using a standard method (normally 1.5 m above ground, with exceptions documented).
- Tree form recorded.
- Veteran / decay features recorded: hollowing, deadwood, cavities, holes/water pockets, fungi and related structural evidence.
- Multiple photographs supplied.
- Trained verifier reviews the record.
- Status retained as verified/unverified and classified as ancient, veteran, notable, etc.
- Historic maps are used as supporting evidence for persistence/age.
- The inventory explicitly warns that absence of a record is not evidence of absence.

### ATI predictive workflow
Earthline should preserve a separate predictive layer rather than conflating prediction with verified points.
- England was divided into 1 km x 1 km cells.
- ATI records were combined with environmental, historical and anthropogenic predictors.
- Sampling bias in citizen-science observations was explicitly tested/corrected.
- Independent, random field surveys were used to evaluate predictions.
- A wood-pasture study used zero-inflated negative-binomial modelling and independent historic-map verification.
- Historic Ordnance Survey maps plus a modern tree map were used to estimate persistence of individual trees.
- Output is a predicted hotspot/abundance surface, not a declaration that every predicted tree is ancient.

## Earthline interoperable data model

### Record classes
- VERIFIED_EXTERNAL_TREE
- VERIFIED_FIELD_TREE
- LEGACY_TREE_STRONG_CANDIDATE
- LEGACY_TREE_CANDIDATE
- LEGACY_TREE_HOTSPOT
- MYCORRHIZAL_HUB_VERIFIED

### Required fields
- geometry
- record_class
- verification_status
- source_name
- source_record_id
- source_date
- source_license
- method_version
- confidence
- species
- genus
- tree_form
- girth_m
- height_m
- crown_diameter_m
- crown_area_m2
- veteran_features
- historic_persistence_evidence
- remote_sensing_sources
- field_evidence
- mycorrhizal_network_evidence
- notes

Fields may be null when unavailable. Unknown must remain unknown rather than inferred.

## Scientific boundary
Large/old tree status and mycorrhizal network-hub status are not equivalent.
Earthline must never label a tree a verified Mother Tree solely from LiDAR, imagery, canopy height, crown morphology, age proxy, or size.
Remote sensing may support LEGACY_TREE_CANDIDATE classes.
MYCORRHIZAL_HUB_VERIFIED requires direct field/root/fungal/genetic evidence or an authoritative source that documents such evidence.

## U.S. rollout approach

Initial states:
- Vermont
- New York
- Arkansas
- Iowa
- Oklahoma
- Texas
- Colorado
- Maryland
- California

Primary national structural source:
- USGS 3DEP LiDAR point clouds where available.
- USGS Work Unit Extent Spatial Metadata (WESM) to determine exact AOI coverage, acquisition date and quality before analysis.
- NAIP imagery where useful for crown context and persistence.

Important: Vermont is not the only U.S. state with public LiDAR. Vermont was Earthline's first deeply integrated/tested LiDAR geography. USGS 3DEP now provides a national baseline, with 99% of the Nation having baseline data available or in progress by the end of FY2025. Exact point-cloud availability, age and quality still need to be checked per AOI.

### U.S. candidate workflow
1. Query WESM for exact AOI LiDAR coverage and metadata.
2. Build canopy-height model from first-return / surface and ground classifications.
3. Segment individual crowns only where point density and canopy structure support it.
4. Derive height, crown area/diameter, emergent status and neighboring-canopy context.
5. Add species/forest-type context from open authoritative layers.
6. Add persistence evidence from historical/current imagery where possible.
7. Rank candidates relative to species/forest cohort rather than use one global size threshold.
8. Publish evidence class and uncertainty.
9. Keep verified field inventory separate from remote candidates.

## Southeast Asia rollout approach

Initial countries:
- Laos
- Vietnam
- Thailand

Baseline sources:
- NASA GEDI footprint measurements for canopy height / vertical structure.
- Open global 10 m canopy-height products derived from Sentinel-2 + GEDI.
- Sentinel-2 optical imagery.
- Country/open-data airborne LiDAR where publicly available and license-compatible.

### Resolution rule
- Airborne LiDAR / sufficiently dense point cloud: individual-tree candidate mapping may be possible.
- GEDI + Sentinel-2 / 10 m global products: hotspot and exceptional-canopy screening only unless independent high-resolution evidence supports an individual tree.
- Never convert a 10–25 m canopy signal directly into a verified individual-tree point.

Thailand already exposes some public LiDAR survey metadata/data through the national open-data portal; coverage is partial and must be checked by AOI.
For Laos and Vietnam, Earthline should begin with global GEDI/Sentinel canopy structure, then add national/provincial airborne LiDAR only where authoritative open access is confirmed.

## Earthline scoring integration

Do not contaminate the existing Aquifer Recharge Potential score with a biological quantity that measures something different.

Phase 1:
- Add a separate `Legacy Tree Evidence` / `Ecological Sensitivity` indicator.
- Weight = 0 in the Recharge Potential score.
- Show verified/candidate/hotspot status transparently.

Phase 2:
- Use legacy-tree proximity as a corridor protection / avoidance factor after validation.
- Verified trees receive the strongest protection treatment.
- Candidates receive a cautionary buffer, not an automatic exclusion, until field verification.

Phase 3:
- If Earthline later creates a broader Site Suitability / Stewardship score, legacy-tree protection can become an explicit weighted component there while Recharge Potential remains hydrologically interpretable.

## Interoperability strategy
Earthline should support two-way exchange rather than create a closed proprietary ontology.

- Preserve external source IDs and licenses.
- Keep verified observations distinct from model predictions.
- Use standard geographic coordinates and GeoJSON-compatible geometry.
- Export evidence/provenance fields with every record.
- Map ATI classifications into Earthline without altering ATI meaning.
- If a future global ATI-compatible service exists, Earthline can ingest that layer.
- If Earthline develops broader geographic coverage first, its candidate/hotspot records can be shared in a schema that ATI or similar organizations can translate into their own verification workflow.
- No external dataset is republished until its data-sharing licence explicitly permits the intended use.

## Immediate research tasks
1. Retrieve and document ATI downloadable schema and licence conditions.
2. Reproduce the ATI field/verification ontology in an Earthline crosswalk.
3. Retrieve Nolan et al. modelling variables and bias-correction methods in full.
4. Build a USGS 3DEP WESM coverage matrix for the nine rollout states.
5. Identify one proof-of-concept AOI in Vermont and one contrasting AOI in California or Texas.
6. Build a GEDI/Sentinel hotspot prototype for Laos, Vietnam and Thailand.
7. Validate outputs against known old-tree inventories or field records where available.
8. Only after validation define scoring/protection weights.

## Core references
- Woodland Trust Ancient Tree Inventory recording guidance and data portal.
- Woodland Trust, Recognising and categorising ancient and other veteran trees (2025).
- Nolan V. et al. (2021), Journal of Applied Ecology, DOI 10.1111/1365-2664.13996.
- Nolan V. et al. (2022), Ecological Applications, DOI 10.1002/eap.2695.
- USGS 3D Elevation Program (3DEP) and Work Unit Extent Spatial Metadata.
- Lang N. et al. (2023), A high-resolution canopy height model of the Earth, Nature Ecology & Evolution.
- NASA GEDI Level 2 / Level 3 canopy structure products.

## Earthline engineering rule
Use the simplest defensible architecture:
verified points + predictive hotspots + candidate evidence.
Do not build a second competing tree-verification system, duplicate an external inventory unnecessarily, or infer biological relationships that the data cannot measure.


## ATI UI / UX patterns worth adopting

Earthline should align with the strongest interaction patterns in the Ancient Tree Inventory without copying its visual design.

### Useful ATI patterns
- **Persistent center crosshair:** ATI keeps a faint crosshair fixed at map center and reads coordinates from it. This is directly relevant to Earthline's Regional → move map → Property workflow.
- **Map / list duality:** ATI allows users to toggle between a map and a list of the trees currently visible in the map extent.
- **Viewport-scoped filtering:** filters apply to the current map view and refresh as the user pans/zooms.
- **Multiple contextual basemaps:** road, satellite, modern OS mapping, and a historic map can be switched without changing the record itself.
- **Historic/modern comparison:** users are encouraged to compare 1860–1890 mapping with modern satellite imagery to judge persistence.
- **Progressive disclosure:** the map shows compact symbols; clicking reveals a compact summary; a second action opens the full record.
- **Field-first mobile design:** recording is intentionally usable on mobile/tablet while standing at the tree.
- **Simple guided contribution:** mandatory fields are collected first; optional detail follows.
- **Verifier state is visible:** verified records and unverified records are distinct; public visibility respects verification/privacy.
- **Size filtering:** minimum / maximum girth filtering helps users find the oldest/largest likely candidates quickly.

### Earthline translation
- Keep the Earthline Search Orb and single map.
- Add a Legacy Tree layer toggle, not a second map.
- Candidate symbols should be visually distinct from verified records.
- Selecting a symbol should open a compact evidence card first, then a full record/report.
- Filters should remain map-extent aware: Verified / Strong Candidate / Candidate / Hotspot, species/genus, minimum structural size, confidence, historic-persistence evidence.
- Historic imagery/map comparison should be an evidence view, not a competing navigation mode.
- The center crosshair remains the authoritative Property target and must never be hidden by a presentation owner.
- Mobile field verification should allow location confirmation, photos, species/genus, girth, veteran features and notes.

## Thailand terrain-source audit

### Current Earthline state
The current production engine is **not yet Thailand-LiDAR-backed**.

Measured source ownership in the current product:
- Regional `loadDEM()` uses **Open Terrarium elevation tiles** as its principal elevation source.
- Regional can use **Mapbox Terrain-RGB** as a fallback through the live map.
- Property terrain uses **Mapbox Terrain-RGB** directly where available, with the existing Mapbox terrain sampler as a bounded fallback.
- Property generated/procedural terrain is forbidden for publishable Property results by the existing fail-closed rule.
- There is no Thailand RTSD / HII LiDAR source owner in the current code.

Therefore Earthline must not describe Thailand hydrology as LiDAR-based until an AOI actually intersects an integrated, verified LiDAR dataset and the run provenance identifies that dataset.

### Thailand authoritative/open LiDAR sources found
1. **Royal Thai Survey Department / Royal Thai Armed Forces open-data index**
   - Central watershed LiDAR survey.
   - Published resolution: **1 metre**.
   - Published vertical accuracy: **better than 15 cm**.
   - Public dataset/index distributed via Thailand's open-data portal.
   - Licence shown as Creative Commons Attribution.
   - Coverage is regional/partial, not nationwide.

2. **Hydro-Informatics Institute (HII) small-reservoir DTM**
   - Derived from bathymetric boat survey plus drone LiDAR.
   - 2025 dataset covers 60 small reservoirs in 8 provinces.
   - Useful for those reservoir AOIs but not a national terrain replacement.

### Required Thailand source hierarchy
For every Thailand hydrology run:
1. Test the requested AOI against the authoritative Thai LiDAR coverage index.
2. If covered and the actual terrain raster/point-cloud resource is openly retrievable and licence-compatible, use the Thai bare-earth DTM/LiDAR-derived terrain as the terrain owner.
3. Record source agency, dataset, acquisition/update date, nominal resolution, vertical accuracy, CRS and exact coverage fingerprint in the run provenance.
4. If not covered, fall back to the existing real global DEM path and explicitly label it **non-LiDAR terrain**.
5. Do not silently substitute modeled/procedural terrain for Property publication.
6. Do not imply national Thailand LiDAR coverage where only regional coverage exists.

### Integration target
The desired Earthline Thailand terrain interface is:

`AOI -> Thailand LiDAR coverage resolver -> authoritative Thai DTM/LiDAR terrain if covered -> existing shared hydrology / D8 / flow / contour / swale engine`

The LiDAR source must replace only the terrain input. It must **not** create a Thailand-specific hydrology engine or duplicate swale science.

### Acceptance test
A Thailand LiDAR-backed run is accepted only when:
- the AOI intersects a published Thai LiDAR work unit;
- Earthline successfully loads the actual LiDAR-derived terrain resource;
- the DEM fingerprint/provenance is recorded;
- the hydrology result is generated from that terrain;
- the UI/report says **LiDAR-derived terrain**;
- moving the same AOI outside LiDAR coverage switches provenance to the global fallback rather than retaining the LiDAR claim.

## V1 crosshair refresh defect noted during research
The current production file contains a presentation ownership conflict:
- earlier code restores `#earthlineCenterTarget15782`;
- later public-map CSS explicitly hides `#earthlineCenterTarget15782` with `display:none!important`.

This explains the observed post-refresh disappearance. The correct repair is to remove/consolidate the later conflicting presentation ownership, not add another timer or duplicate crosshair.
