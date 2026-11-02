# Earthline Reliability Reset — Mantra 92
Status: Engineering proposal and audit control plan — **NOT a deployed engine repair**
Date: 2026-11-02
Authoritative production at time of audit: `pages-live` `67de444b7048fc9a8ef5282dd3f4fb5961681779`
Historical October 5 launch reference: `9d059f0039ab305245b49e1a7ebda98e54a6d746`
Repository: `Earthlinedevelopment/open-source-watershed-intelligence-platform.`
Policy: Preserve Earthline branding, approved logo/orb, existing user-visible design and zero-cost constraint; no unapproved product additions.

## 1. Observed facts — do not confuse green automation with acceptance

1. A documented public launch passed the then-existing 50-state smoke on October 5. Later failures mean that smoke test was not sufficient to preserve scientific/visual correctness under subsequent changes.
2. The October 5 launch reference and November 2 production code have diverged; this is not a simple linear forward upgrade.
3. Same-origin headless Chrome comparisons recorded, for **Alaska**:
   - October 5 reference: 6,218 ms core, 258 water paths, 158 swales.
   - November 2 production: 19,386 ms core, 74 water paths, 59 swales.
   For **Arizona**: October 5: 4,726 ms, 363 paths, 192 swales; November 2: 11,572 ms, 115 paths, 111 swales.
   These counts indicate regression candidates, **not** that more is always better or that the older geometry was guaranteed correct.
4. A November 2 Mantra 92 candidate failed the explicit 15-second candidate gate: Alaska 29,104 ms and Arizona 21,839 ms, with changed water-path counts. Its successful comparison workflow was evidence collection, not certification.
5. Historical defect reports: Regional overlong 'worms'; Property water disappearing or blinking; stale Property/aquifer/Elder ownership; crosshair identity mismatches; excluded land; browser-specific slowdowns; runtime syntax errors; missing coverage in U.S. launch states.
6. Current `pages-live` branch metadata has **branch protection disabled**. A release workflow's success does not prevent directly updating that branch.
7. Mantra 85 Clock Architecture Charter already defines the needed one-way run contract. **Adopt and enforce that charter rather than inventing another parallel architecture.**

## 2. Non-negotiable correctness contracts

**Analysis lifecycle:** `RunIntent → Immutable RunIdentity → Acquisition → Pure Science → Safety Validation → Immutable ScienceBundle → Renderer/Report → Terminal Status`.

- One coordinator; no competing search/crosshair, Property, timer, Elder, report or presentation owner.
- RunIdentity includes mode, exact target coordinates, declared analysis bounds, jurisdiction, source versions, engine version and input fingerprint.
- Zero silent target substitution. A state/Property mismatch is a failed analysis, not a publishable fallback.
- ScienceBundle is frozen, includes provenance, and cannot be changed by renderer, browser animation, camera, Elder annotator, or a prior async run.
- Map, DATA, aquifer labels, groundwater sidecar, and report display **the same bundle IDs and counts**.
- All candidates must satisfy slope ≤4%, including flat land where otherwise valid; exclude roads, structures, driveways, mapped water, invalid/forest land under agreed rules.
- If required exclusions, coordinates, or source evidence cannot be verified, **fail closed and show an incomplete analysis**. Never silently display invalid swales.
- Regional line length, upstream/downstream direction, topology, density, water-continuity and polygon containment must be physically plausible. Renderer may not shorten invalid science purely to make it look acceptable.
- Groundwater semantics stay explicit: well point ≠ mapped aquifer; water level ≠ storage; absence of well ≠ absence of groundwater. Coverage unknown must remain unknown, not invented.
- Determinism: for identical frozen data and inputs, rerunning or changing map zoom/device/browser must not change science output.

## 3. Restore the working core **without deleting improvements**

First create a versioned component inventory between the October 5 launch reference, current production, and candidate branch:
- Geometry/contour/DEM/flow/swale scoring and selection
- Exclusion and jurisdiction masks
- Acquisition and aquifer/groundwater source adapters
- Search/target/camera/crosshair
- Property publish lifecycle, water paths, aquifer ownership
- Elder evidence
- Renderers, DATA, PDF and approved UX
- Performance and browser behavior

For every changed component record: original, current, intended improvement, measured effect, acceptance criteria, owner. Never import an entire old page into production.

Run controlled A/B on the **same origin** with frozen inputs and a single changed subsystem. Benchmark October 5, production and reconstructed candidate under identical conditions. Use staged field restoration only when safety and browser acceptance pass. The target is *October 5 speed with today's legitimate improvements*, not blind rollback.

Prioritize:
1. Regional generation selection and jurisdiction scan costs, not cosmetic renderer clipping.
2. Single terminal Property publication ownership to stop blinking/water loss.
3. Exact target acquisition and immutable swale/no-build compliance.
4. Elder, aquifer, and new data layers as non-blocking consumers; source failure cannot invalidate otherwise completed core science or invent evidence.

## 4. Golden Watershed Library — two kinds of truth

**Frozen scientific fixture library** (small, local datasets and expected invariants, versioned in Git):
- Reference cases for accepted Vermont control; NY/MA; Arkansas/Iowa/Nebraska; Oklahoma north; Colorado; Maryland; California/Bay Area; TX/FL/LA coasts; Arizona; Alaska; and initial Thailand/Vietnam/Laos controls.
- Cover flat, steep, coast, forest, roads, water and missing-source conditions; include Property and Regional.
- Capture source hashes, declared inputs, geometries, exclusion masks and authoritative run bundles.
- Independent spatial oracle checks every emitted segment, not just counts or whether JS executes.
- Metamorphic tests: repeat same run = same bundle; Property→Regional→same Property = no state leak; zoom/pan = no science change; phone/desktop and Chrome/Firefox/WebKit = equivalent scientific outcomes.
- Establish reference output ranges and scientific invariants. Do not blindly lock old totals: scientifically wrong but reproducible is still wrong.

**Live browser acceptance library** (replay exact end-user steps on the deployed candidate origin):
- Search → Regional; crosshair → Property; second Property; report; DATA; delayed async settle; phone and desktop.
- Compare rendered swale geometry and visible labels with source bundle IDs, not merely screenshots. Use screenshots as an additional visual acceptance check.
- Record missing features, stale state, wrong locations, error consoles, 404s, and stage timings.
- Require a human acceptance checkpoint only after machine verification, not as primary debugging.

## 5. Release airlock — enforce, don't just document

1. Keep `pages-live` unchanged while certifying.
2. Create an **immutable release candidate** from a recorded SHA, with engine version, data/fixture manifest and test scripts pinned.
3. Enforce independent tests on the candidate SHA: syntax/build; unit science; geospatial safety; frozen fixtures; repeat-state lifecycle; Chrome/Firefox/WebKit and mobile-sized rendering; speed; report parity; real-origin deployed browser.
4. Mandatory performance gate: core Regional ≤15 seconds for the established launch matrix. Record p50/p95; fail on exceptions or excessive variance. Additional published thresholds need explicit approval, not silent recalibration.
5. Block promotion on any invalid geometry, wrong target, stale run, missing required evidence, unsafe swale or state/display mismatch. Failures must be clearly classified rather than 'green' because logging succeeded.
6. Protect production branch through GitHub required status checks and restricted promotion (subject to available plan/repository controls); do not allow tests against moving branch heads to count as candidate acceptance.
7. Promotion uses the **exact certified artifact hash**, with deployment verification and post-deploy smoke. If it fails, revert to the last verified production SHA.
8. Keep a known-good release manifest and two stable URLs or routes for production and isolated candidate. A test URL is never interchangeable with the public page.

## 6. Flight recorder — no user debugging burden

For each run record a privacy-conscious local evidence manifest: run ID, declared target, source versions/coverage, source failures, phase timings, candidate counts, rejection reasons, final frozen geometry hash, displayed bundle ID, report bundle ID and terminal state. Preserve diagnostic exports on failures. Do not capture addresses, precise user locations or session recordings centrally without specific approval and privacy review; preserve zero-cost operation.

A new failure should produce a reproducible fixture automatically where practical. Never add timer-based cosmetic republishes to suppress the underlying owner conflict.

## 7. Geographic release sequence

Gate A — **Recover the engine** on Alaska + Arizona + Vermont, including slow and known-broken examples.
Gate B — **Original rollout/27-state matrix**, with a real pass/fail ledger for each known state and Property/Regional.
Gate C — **All 50 U.S. states**; zero unsafe or out-of-bound publication; core timing, repeated Property, deterministic results and browser parity.
Gate D — **Southeast Asia: Thailand → Vietnam → Laos**, incorporating jurisdiction-appropriate hydrogeology and coverage labels.
Gate E — **Global expansion** basin by basin, with a source-coverage and uncertainty gate before adding each country. Do not equate generic groundwater model output to confirmed aquifer polygons.

Never declare a geography done solely from a green count-only smoke or a screenshot that looks plausible.

## 8. Test completion definition

A subsystem is accepted only when:
- its scientific bundle is verified against independent invariants;
- output stays correct after repeated runs, transitions and async settling;
- the displayed map/report exactly corresponds to that bundle;
- required exclusion proofs are available and zero unsafe output is published;
- performance and cross-browser gates hold on a pinned candidate;
- real origin and exact deployed SHA are verified;
- the previous accepted behavior has not regressed.

**Success measure:** users no longer need to find basic bugs for Earthline. Failures may still occur (source outage, missing data, browser restrictions), but uncertain results fail safely, remain diagnosable, and never silently replace the last known-good release.

## 9. Immediate implementation order

1. Preserve production SHA and October 5 reference; freeze promotion pending audit.
2. Audit the precise commits that changed Regional `makeSwales`, jurisdiction lookups, and state boundary resolution; identify effects independently before editing.
3. Build replayable scientific fixtures for Alaska, Arizona and Vermont and enforce geometry + 15-second + display/Property invariants.
4. Reconstruct fast, correct science on an isolated candidate with all required modern improvements and one authoritative owner.
5. Run 27 → 50 → Southeast Asia release gates, then promote only the certified SHA.

No production or product feature change is authorized by merely writing this document.

## 10. Verified implementation/evidence update — 2026-11-02

**This section supersedes earlier speculative repair hypotheses.**

### Precisely isolated science regression

A seven-commit same-HTTPS-origin Chromium bisect, GitHub Actions run `41401221914`, showed:

| Code revision | Alaska swales | Arizona swales | Alaska core ms | Arizona core ms |
| --- | ---: | ---: | ---: | ---: |
| October 5 launch reference `9d059f0039` | 158 | 192 | 9,687 | 7,834 |
| Just before 10/31 geometry tightening `aa597601` | 192 | 192 | 11,282 | 7,944 |
| Geometry tightening `60575c59` | 186 | 189 | 8,807 | 8,999 |
| Further narrowing `6092d2c2` | 180 | 193 | 11,001 | 5,634 |
| Physical trim/new full-point validation `14351f06` | **59** | **105** | **17,097** | **14,359** |
| November 2 production `67de444b` | 59 | 111 | 36,687 | 26,718 |

Each row is one environment-specific run, not a statistical confidence interval. Historical intermediate revision `6092d2c2` had page exceptions; do not treat it as an accepted release.

Source examination confirmed:
- `14351f06` shortened sampled contour geometry by 8 km each side, forced a neighboring vertex if none fit, and validated all selected contour vertices. This coincides with the sharp coverage collapse.
- `screenJurisdictionCandidate16539` *subsequently* imposes a screen-space requirement of `Math.max(4, Math.min(10, minLinePx))` grid pixels. This rejects physically short candidates from coarse statewide raster grids.
- The renderer separately truncates displayed Regional swales to about 2 km on each side without fixing the underlying source geometry.
- Current source max length in later controlled A/B was approximately **15,695 m Alaska**, **15,241 m Arizona**—not 4 km. **Do not certify renderer-only clipping as sound science.**

### Failed and successful controlled variants

GitHub Actions `41401548619`, `41402534394`, and `41403504892`:
- Restoring the broad contour fallback alone added only 1 Alaska and 2 Arizona swales. **It is not the principal cause.**
- A naive 2 km half-length clip, with unchanged pixel screening, generated **zero** swales.
- Physically interpolating to 2 km per side and bypassing only the *coarse pixel metric* in the generator also generated zero: the **second jurisdiction screen** was still incorrectly rejecting short eligible corridors.
- The controlled candidate that applies physical interpolation **and** screens the same candidate in **metres after exact jurisdiction clipping**, without relaxing slope or land-exclusion rules, produced:
  - Alaska 174 candidate swales; max source length 4,000.09 m; max source slope 4.0%; core 42,717 ms — **FAIL performance**.
  - Arizona 174 candidate swales; max source length 4,000.02 m; max source slope 3.9%; core 10,423 ms — candidate improvement on that run, **not certified across browsers/states**.
- Restoring unconditional fallback with the metric screen did not raise 174 swales but increased Alaska latency to 55,608 ms, so **do not use the unconditional fallback**.
- An in-progress isolated profile `41404494553` is measuring clipping costs and per-tile generation timings for the metric candidate. Never report that run as passed until logs are checked.

**Technical consequence:** a physically correct short-corridor generator and a coarse grid pixel-length gate are incompatible. Fix **both** scientific generation and exact downstream screening, while optimizing Alaska so Regional core is ≤15 seconds; do not redefine the performance ceiling.

### Production release hardening implemented, not just proposed

- PR #11 merged: retire legacy `earthline-launch-matrix.yml` direct auto-writer.
- PR #12 merged: retire nine additional obsolete `pages-live` auto-writers.
- PR #13 merged: retire remaining Mantra 38 and Mantra 89 direct auto-writers after a full inventory.
- **12 direct-writing workflows retired** in total; original code preserved in Git history.
- PR #14 merged: add `earthline-release-airlock.yml`, pinned same-origin seven-rollout-state release test, and static preflight. On isolated branch it parsed **67 inline JS blocks** and scanned **63 workflows**, finding zero current direct-writer patterns. PR #14's own PR check also succeeded.
- Current safety-only production `pages-live` commit after PR #14: `527635dd390450d4506da3fa0ea05ed52abc6162`. The product `index.html` **blob remains unchanged**: `1c72681e912336fdf7a85d8798c27feafb0f0618`. This means **NO SCIENTIFIC ENGINE RECOVERY HAS BEEN DEPLOYED**.
- Production GitHub Pages has a successful deployment for `527635dd` as checked on November 2.
- **Important remaining governance blocker:** repository branch protection was disabled at audit time. The PR workflow can fail, but is not a required blocking check until the production branch rule is configured.

### Next evidence-driven action

Review profiling output for `41404494553`; eliminate the dominant measured CPU hotspot without changing physical geometry, ≤4% slopes, no-build masks, jurisdiction clipping, target identity, or Property authority. Run strict 15s release gate on Alaska and Arizona, then seven rollout states → difficult states → all 50 states → Thailand, Vietnam, Laos and country-by-country expansion. Do **not** promote an unverified or slow candidate.
