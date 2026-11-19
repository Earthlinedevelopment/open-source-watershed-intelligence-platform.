# Earthline live sweep test v2.2 — NEW YORK FIRST

Read-only. It visits the PUBLIC site like a visitor and writes results to new branches. It never touches `pages-live`, `index.html`, or any deployed file.

New in v2.1/v2.2 (Nov 18, evening), on top of v2:
- **New York only run** (own workflow, 5 browsers, about 25–40 minutes), so New York results come first.
- **Jonathan's two New York screenshot spots are tested first** on every browser: 42.78781, -75.76996 and 42.78860, -75.77379. Five more New York sites: Lake George shore, Hudson Valley farmland, Catskills steep wooded, Finger Lakes farmland, Long Island flat.
- **State-outline check**: every Regional corridor vertex is tested against the New York outline the page itself ships (`data/jurisdiction/us-states-2025-500k/NY.geojson`). Also runs for all 50 states in the states phase.
- **Recharge-target check**: how much of the published swale output lies inside the orange "MODELED RECHARGE TARGETS" the page draws. Observation only. No rule R1–R13 covers it.
- **Why a Property run shows nothing**: when a Property run publishes 0 swales, the test now records the page's own reason (its location-integrity check result and the stage where the run stopped). Safari and iPhone came up empty on the first New York run in ChatGPT's diagnostic and the cause is not known yet. Every flagged run also reports how many published swales are steeper than 4% by the page's own slope figure, and how many swales the engine produced versus how many the display showed.

## Files (9)
- `.github/workflows/earthline-live-sweep-ny.yml`      ← New York only
- `.github/workflows/earthline-live-sweep-test.yml`    ← full sweep (primary states, 50 states, 195 countries)
- `tests/earthline-live-sweep-test.mjs`
- `tests/geometry-audit.mjs`
- `tests/boundary-audit.mjs`
- `tests/summarize-sweep.mjs`
- `tests/test-geometry.mjs`   (offline self-test: `node tests/test-geometry.mjs` → 13 PASS)
- `tests/test-boundary.mjs`   (offline self-test: `node tests/test-boundary.mjs` → 6 PASS)
- this README  (PASTE-TO-CHATGPT.txt is a note for ChatGPT, not a repo file)

## To run (for ChatGPT / whoever has repo write access)
**New York first**
1. Create branch `live-sweep-ny` from `live-test` (NOT from `pages-live`).
2. Add the nine files above, byte-for-byte. Change nothing else. Commit and push. The push starts the run by itself.
3. Results: branch `live-sweep-ny-results` (SUMMARY.md, summary.json, results.json, screenshots, BUILD.txt, BUILD-AT-START-*.txt).

**Then the full sweep** (only after New York results are published)
4. Create branch `live-sweep` from `live-test`, add the same nine files, push.
5. Results: `live-sweep-primary`, then `live-sweep-states`, then `live-sweep-countries` (each phase starts when the previous one is published; roughly 60–80 minutes).

Do not merge anything. Do not touch `pages-live`.

## New York sites (Property ×2 each, Regional ×2, then Regional → Property → Regional → Property at the first site)
| name | lat, lng | why |
|---|---|---|
| ny-your-screenshot-1 | 42.78781, -75.76996 | Jonathan's screenshot, score 50 |
| ny-your-screenshot-2 | 42.78860, -75.77379 | Jonathan's screenshot, score 46 |
| ny-lake-george-shore | 43.57293, -73.60775 | earlier New York water-setback target |
| ny-hudson-valley-farmland | 41.93, -73.90 | farmland |
| ny-catskills-steep-wooded | 42.10, -74.30 | steep, wooded |
| ny-finger-lakes-farmland | 42.68, -76.82 | farmland |
| ny-long-island-flat | 40.85, -72.80 | flat outwash |

## Geometry audit — exact definitions (tests/geometry-audit.mjs)
Measured in metres on what the page has drawn, for every line layer whose id starts `earthline-` / `el-` and for the swale engine's own output.
- roadCrossings: a drawn line properly crosses a road line from the basemap.
- withinRoadSetback: a drawn line comes within 3.05 m (10 ft) of a road line (spec R6).
- rulerStraightLong: ≥ 100 m long and never more than 1.5 m off a straight chord.
- axisAlignedLong: ≥ 100 m long, nearly straight, within 2° of due N–S or E–W.
- tightPairs / largestTightCluster: roughly parallel lines (≤ 6°) closer than 3.0 m over ≥ 10 m (published swales: closer than 4.572 m, spec R5). The cluster is how many lines chain together — the "comb".
- rechargeOverlap: swale output sampled every 2 m against the polygons returned by the page's own `earthlineRechargeGeoJSON()`. Reports how many swales touch a target, how many targets are touched, and about what share of swale length is inside. Observation only.
- If the basemap's road lines cannot be read, the summary says road checks are NOT valid for that item instead of reporting zero.
- Only features currently rendered in the viewport are seen.

## State-outline check — exact definition (tests/boundary-audit.mjs)
Fetches the page's own 1:500,000 generalised state outline, tests every vertex of the Regional corridor lines against it, and measures how far outside each outside vertex is. The summary flags only vertices more than 500 m outside, because the outline is generalised (its edges can be a few hundred metres off the true border). It checks corridors against the state line the page uses; it does not prove that line is the true border.

## What it reports (and does not)
Observations only: finished or not, how many swale corridors and aquifer patches drew, Property swale counts and whether a repeat run gives the same result, page errors, whether the search landed near the expected place, plus the geometry, recharge-target and state-outline findings above. It does NOT judge whether a swale is in the right spot on the ground. Screenshots are saved so a person can look.

## Honest limits
- Iowa, Vermont and Arizona Property sites are the ones used in all earlier tests. Arkansas, Nebraska and the other New York sites are sample points picked for these runs. The two New York screenshot spots and the two Arkansas screenshot spots are Jonathan's own.
- Terrain on the live page is Mapbox terrain-RGB (canopy-affected, 0.1 m steps), not bare earth. Wooded or very flat sites can read wrong whatever the rules say.
- Each profile runs once; a single run cannot show intermittent failures.
- Firefox on the GitHub runner may not start the map at all; the summary says so when it happens (no evidence either way).
- GitHub's hosted Safari/iPhone are Playwright WebKit, not real Apple devices.
- "Drew nothing" in a country may be correct if the site has no data there; the report says what happened, not what should have.
