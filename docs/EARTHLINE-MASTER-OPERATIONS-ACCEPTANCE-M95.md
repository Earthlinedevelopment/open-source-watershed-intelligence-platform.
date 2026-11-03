# Earthline — Master Operations, Functionality & Acceptance Register
Version M95.2 | 2026-11-03 | **Recovery specification, not a claim of completed repairs**

## Mandatory new-chat procedure
**At the start of every Earthline chat:** retrieve and read this file from GitHub, review the newest handoff and live production GitHub state, identify the last VERIFIED accepted source, inspect actual latest tests and failures, and continue approved work without requesting repeated "proceed." This file cannot be automatically read in every future chat without access to the repository; the assistant must deliberately retrieve it. Never promise background progress. Do not ask the user to view, refresh or manually hunt bugs before independent testing.
**User-set constraints:** Do not add features without approval, never resurrect deleted ones; only domain costs money; preserve approved logo and Search Orb; tagline exactly **“Slow it. Sink it. Spread it.”**; no gratuitous status updates or unsupported statements of success. Any actual production change requires backup, isolated candidate, tests and rollback.
**Deleted features stay deleted:** Explore Water; Water story; Visual Scientific; rejected safety-gate box on Swales Explained; custom map sliders; rejected natural/worm swale presentation; rejected diagnostic and promotional panels.

## Current evidence versus claims
- On 2026-11-03 GitHub `pages-live` head `727eba8d2c70278336a94adb5b362f9caab1cfc9` stated it restored `index.html` from accepted Build 16584 (2026-09-06 commit `74343a24f90fed7d7abbe9267ef11a2836220de7`), blob `1c217d9486f0e234c08e1b6890e28d1db7dc03cf`. Source match was independently inspected; live functional behavior was NOT verified.
- Later Elder, blue-swale and geometry repairs exist in subsequent GitHub history and must be inspected selectively. Do not wholesale revert to an unaccepted later build.
- Known historic regressions: Iowa, Arkansas, Nebraska and Oklahoma missing/sparse; coast Texas/Florida/Louisiana; California Bay Area, Colorado, Maryland, NY; missing aquifer context in parts of Southeast Asia. These are **unverified current status**, not automatic current failures.
- Status language allowed: VERIFIED (with link/log), FAILED (with reproduction), UNVERIFIED, BLOCKED (and cause). Never mark geographic success by screenshot alone.

## P0 — Release-blocking science and safety
1. **Worm removal:** eliminate rejected textured/natural rendering and inspect actual underlying geometry for loops, excessive turns, spurious branches and unnatural curves. PASS: no invalid worms in representative contour fixtures.
2. **Accurate contour-following Property swales:** one authoritative `M.authoritativeSafeSwales15815` source, deterministic geometry, correct target and endpoints. PASS: swales scientifically supported, no fake fill or detached segments.
3. **≤4% local slope acceptance:** include flat 0–4% terrain, test corridor path not just mean slope, record DEM uncertainty. PASS: no corridor beyond allowed slope under specified rule.
4. **Modeled runoff interception:** require positive actual runoff crossing/interception evidence, refuse secondary fill without it. PASS: every accepted corridor has traceable flow evidence.
5. **Frozen no-build mask:** roads, homes, structures, driveways, mapped water, protected areas; verify sources and final corridor footprints; fail closed if verification absent. PASS: zero unsafe published intersections.
6. **Swale spacing/density:** terrain-based Property spacing guideline 15–25ft where appropriate; avoid forests and developed areas. PASS: no overlaps, clusters or artificial quota.
7. **Flow, DEM, basin logic:** test downhill routing, connectivity, contributing areas, hydrography and network arrows. PASS: source-aligned and hydraulically plausible.
8. **Publication/run ownership:** no stale async run can overwrite current science or presentation; separate Regional/Property owner and source. PASS: deterministic five repeat tier cycles.
9. **Elder trees:** evidence-based approved Elders, independent from swale scientific state and publication; restoring Elder cannot replace or clear swales. PASS: present when supported on first and subsequent runs.
10. **Truthful invalid/empty results:** distinguish valid zero opportunity, missing input, blocked exclusions and failed computation. PASS: no false success.

## P1 — Map and core interactive product
11. Regional first city/state/watershed analysis: correct scale, basin overlays and opportunity zones.
12. Property analysis: selected roughly 10–20 acres, correct framing, safe swales and full evidence.
13. Regional→Property→Regional→Property: repeat five times with no missing overlays or stale results.
14. Crosshair: one action selects accurate geographic target.
15. Search Orb: exact approved appearance, place suggestions, clear X and search persistence.
16. Native Mapbox navigation: pan/zoom/pinch/box zoom, no custom sliders.
17. Water paths: blue mapped waterways, tributaries and directional flow arrows.
18. Contours: legible elevation labels, correct units, nonoverlapping symbols.
19. Aquifer context: only source-backed groundwater polygons; no manufactured aquifers.
20. Nearby-well evidence: topmost source-supported label on every Property run where available.
21. Recharge targets: supported gold targets; no prohibited overlaps; preserved on zoom.
22. Blue swale visualization: thick approved blue safe-line pattern with **two blue dotted strips per swale**; presentation changes cannot change scientific geometry.
23. Elder presentation: correct icons/trees and stable lifecycle.
24. Search/map persistence: correct active target and run, no stale layers.
25. Approved interface: logo, Orb, tagline, panels, green controls, typography; none of removed widgets may return.
26. **Speed and responsiveness (explicit user priority):** instrument time from user action to meaningful Regional and Property publication, per phase (search/geocode, fetch, DEM, science, map, evidence). Repeated runs must not stall or accumulate listeners; core output must not wait on optional overlays. Establish measured browser/network budgets from accepted baseline and representative weak/mobile connections, use p50/p95 metrics, block releases that materially regress the approved baseline; do not invent a universal second-based guarantee before measurement.

## P2 — Evidence, language, reports and mobile
27. Recharge Suitability 0–100 brass gauge, centered rim screws, no needle.
28. DATA button/panel: current-run weighted drivers, evidence/coverage for both tiers.
29. Transparent model weights: slope, flow, canopy, groundwater; values reproduce total.
30. Correct source-specific rainfall value, units, period and coverage.
31. Well/groundwater aggregator: traceable public records, acquisition dates, no fabricated aquifer evidence.
32. Data lineage: versioned terrain, hydrography, aquifers, exclusions and basins.
33. Professional Bioswale PDF Report: faithful same-run map/evidence/limitations.
34. Earthline Process text: accurate description of actual functioning methods.
35. Swales Explained / How Bioswales Work: approved copy, beavers and climate note, professional verification and no deleted box.
36. Report design: approved exact logo, gray header, wave stamp, layout.
37. **Updated language (explicit user priority):** audit all live English UI, labels, scientific descriptions, report sentences, disclaimer and help copy; remove stale/contradictory terms, claims of verification not supported by engine, references to deleted functionality, awkward translations and outdated limitations. Preserve exactly approved tagline and language style. Validate Vietnamese and other approved locales, and Thai only after approval/implementation. PASS: translations complete for each deployed locale; no English leftovers, truncation, wrong numeric/unit formatting or science mismatches.
38. Mobile: touch map, responsive DATA/sidebars, search, results, report and language selector.
39. Source transparency: show uncertainty, gaps, dates, licensing and verification status.
40. Professional review requirement: no claim of construction-ready site engineering without professional site inspection.

## P3 — Geography and international scientific accuracy (explicit user priority)
41. **All 50 US states:** per state test several watershed and parcel fixtures including flat, mountainous, coastal, forested and built-up conditions. Validate geometry, ≤4% slope, flow, exclusion, aquifer honesty, rerun lifecycle, blue visual and Elders where supported. Evidence per state; no state marked complete before all required matrix cells pass.
42. **Southeast Asia:** Thailand (Chiang Mai, Bangkok, Sikhio/Nakhon Ratchasima), Vietnam (Can Tho/Mekong, Hanoi), Laos, then additional countries as approved. Validate coordinate reference systems, DEM vertical datum and coverage, local land-cover and road/building data, national and transboundary hydrography, low-gradient deltas, seasonality, well data licensing and actual aquifer evidence. **No US-specific assumptions silently reused globally.** PASS: documented geographic evidence and limitations for representative basins and parcels, with blocked outputs when mandatory safety sources absent.
43. **Global expansion:** define country coverage levels (scientifically qualified / partially supported / unavailable), supported source/version, test dates and caveats. Do not represent every country as proven merely because global map renders.

## Six mandatory gates
A. P0 geometry, hydraulics, exclusions and Elder isolation pass.
B. P1 desktop/mobile map visuals and repeated life-cycle tests pass.
C. P2 current-run data, accurate/updated language and report output pass.
D. 50 US states geographically qualified with archived fixture evidence.
E. Thailand→Vietnam→Laos followed by individually qualified countries; no unsupported global claims.
F. Artifact checksum verified on production, browser smoke test from deployed origin, automated monitoring and tested quick rollback.

## Permanent anti-regression mechanism
- Store one authoritative accepted production artifact, SHA/commit, source-data version, removed-feature registry and locked branding assets.
- Changes use an isolated branch/candidate; diff against accepted behavior; do not mix scientific and cosmetic repair without separate testing.
- Unit/property-based scientific fixtures for slopes, intersections, crossings, geometric naturalness, flatland, forest and coast; negative/fail-closed fixtures mandatory.
- Real-browser tests for first run, repeat run, Regional/Property switching, layer ordering and fast navigation. Test deployed HTTPS, not only file:// or localhost.
- Visual snapshots for approved Orb, logo, brass gauge, blue double strips, Elders, water arrows, contours, desktop and mobile.
- Capture actual time-to-science for Regional and Property, p50 and p95, errors and source timings; baseline then enforce budget.
- International fixture registry includes CRSs, transboundary basin flow, coastal deltas, data availability and coverage status.
- Any failed required gate blocks production promotion. After release, compare served `index.html` artifact with accepted SHA, repeat smoke tests, alert and rollback when unsafe.
- Persist human-readable evidence: fixture ID, location, country/state, run ID, commit, data versions, screenshots, status, failure reason and test timestamp.
- **No user-as-QA workflow:** assistant/integrated tests first; only request user verification for a truly inaccessible environment, with honest limitations.

## Every new chat handoff template
1. Read THIS document from GitHub first and identify its commit.
2. Current production URL(s), branch head and actual served artifact SHA (separate from repository file).
3. Last accepted build, candidate branch/commit and exact diffs.
4. Verified passes and failures with dated logs; geographic coverage counts.
5. Next highest-priority repair, reproduction test, expected acceptance, rollback ref.
6. Speed metrics and language/international coverage deltas.
7. State explicitly: no new features; removed features stay removed; do not seek user manual testing before independent verification.

## Current unverified work queue
Restore science-supported swales and remove worms; restore blue double strips; bring back approved Elders without modifying swale science; verify current live URL and source; instrument performance; audit and update language; then complete US and international qualification. **None of these are represented as completed merely by creating this document.**
