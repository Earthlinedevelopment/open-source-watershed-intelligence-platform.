# Mantra 2 — rollback functionality reset: measured acceptance gate

Baseline: a4824c090014c006aede0e67797264a1f999fda1
Recovery branch: repair/mantra2-functionality-reset
Protected November source: 2d858d5c798d8214c17c1645e262e1d1e640fe2e
Do not change pages-live without measured acceptance.

## Control runs (October baseline, same source fingerprint per test)
1. Iowa Regional (record search framing, run identity, rendered and generated swale counts, water paths, contour counts, labels and error state).
2. Property latitude 42.13000 longitude -93.68000.
3. Property latitude 34.21572 longitude -111.93073.
4. Repeat same Property, Regional, same Property to check stale-layer and aquifer ownership.

## Required measured fields on every Property run
- exact commit and index HTML SHA-256; date, requested coordinates, search generation, run token
- generated swales; published swales; blocked candidates and reasons
- min/max/mean sampled slope %, length-weighted route-average slope %, maximum uninterrupted distance above 4% (must be compared to the approved sustained-stretch definition)
- minimum adjacent-swale spacing ft and number of spacing violations vs the approved 15–25 ft target
- mapped road/building/water overlap counts for all published corridors (each must be 0); buffer assumptions and source coverage
- OSM request HTTP status, byte count, response XML validity, BBOX coverage, raw elements, mapped feature count; distinguish failed, incomplete and valid empty, and flag screening-only vs authoritative clearance
- maps and screenshots plus console errors and exact failure reasons

## Candidate ports (only after baseline reproduces missing protection)
1. OSM acquisition 6f7d7c6 + complete-empty distinction 783bddc: atomic dependent safety unit. Reject HTTP errors, invalid XML and incomplete bounds. Complete valid empty must remain screening-only and require field verification.
2. Property Rule B: length-weighted route average <=4%; reject any sustained above-4% segment as defined by the approved rule; retain exact underlying slope samples as evidence.
3. Regional auxiliary-label failure repair 239cb13: retain verified swale geometry if labels alone fail; still fail when actual required geometry/publication audit is missing.
4. Gauge current mode; Property hides Regional labels; Elder Tree failure/loading state clears.

## Acceptance
Each port needs source SHA, before/after counters for the same site, no extra unsafe corridors, both Property repeats and Iowa Regional control, plus regression tests. Never use visual-only swale counts to clear safety. No bulk merge.
