# Earthline: New York swale release blockers — 2026-11-19

**Status: HOLD.** This is diagnostic evidence only, not a production release or a repair.

## Exact user-observed Property locations
- New York A: lat 42.78781, lng -75.76996 (20 acres)
- New York B: lat 42.78860, lng -75.77379 (20 acres)

## Connected live-browser evidence
Source: GitHub branch `ny-test-results` (five profiles), and `live-test-results`.
- NY A / Chrome: first Property run engine 80, displayed 62; second engine 0, displayed 0. Both marked settled/result true.
- NY B / Chrome: first engine 98, displayed 70; second engine 1, displayed 0. Both marked settled/result true.
- NY A / Android: displayed 62 then 15.
- NY B / Android: displayed 68 then 22.
- NY A / Safari: first engine 0/result false, second engine 80/displayed 62.
- NY A / iPhone: first engine 0/result false, second engine 80/displayed 62.
- Firefox: Property map unavailable in test; not an acceptable pass.
- The test's `swalesOver4pct` measurement on NY A Chrome run 1 was 71 and NY B run 1 was 98. Verify units and exact geometry independently; do not interpret raw legacy slope fields as engineering certification.

## Additional live controlled rerun
Read-only run `44435651105` at Arizona 34.21572, -111.93073:
- Chrome: 78 -> 2 engine swales, source-input fingerprint b8f3446c1cd37477 -> bb66d3dd0fa54970, mask hash 136e51eeaef93010 -> eaf1f95ee4312680.
- Android: 78 -> 14 engine swales, fingerprint b8f3446c1cd37477 -> fecb498082f34ea7, mask hash 136e51eeaef93010 -> 41acae3bf8608b0f.
- Run 1 reports open-data exclusion acquisition failed; run 2 reports open-data acquisition. Legacy contract can publish when `exclusionVerified=false` if `publicationAllowed=true`. The source change is a plausible mechanism for differing candidates; precise causal chain remains unproven.

## Candidate independent local offline checks
Uploaded `Earthline-CANDIDATE-swale-engine-v1.2.zip`: six SHA256SUMS.txt entries all matched; engine-tests.js, bridge-tests.js, adapter-harness.js passed; syntax checks passed. Geometry audit's Playwright test was unavailable locally (missing package), not a pass. The candidate is based on `b71c5b2`, not the accepted popup branch. **Do not merge or deploy directly**: it omits later accepted changes.
R14 (minimum 1.0 m 5th–95th percentile relief) and recharge-oval exclusion are unapproved experimental rules; R14 must be disabled or separately authorized before production.

## Mandatory release gates
1. Identical input + same acquired evidence => byte-identical corridor IDs and geometry across two Property runs in all five browser profiles.
2. If upstream evidence differs, report it clearly; never silently claim a repeat run passed.
3. Independently re-measure all slopes <=4%, contour adherence, 15–25 ft spacing, setbacks, road/building/water/forest rules, property containment; no UI-only counts.
4. No overlapping stale/partial publication; zero corridors must explain why, with source coverage and uncertainty.
5. Regional source corridors must be bounded, physically plausible, and inside jurisdiction; fix ruler-straight flow-path errors separately.
6. NY exact sites -> primary states -> all 50 -> Thailand/Vietnam/Laos -> global country sweep; require evidence or explicit refusal, never presume a country passes because something drew.
7. Accepted Elder popup / Search Orb / logo / navigation unchanged, zero-cost operation preserved.
