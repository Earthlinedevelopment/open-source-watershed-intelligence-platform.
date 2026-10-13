# Earthline Elder V2 — Current Science Baseline

**Status:** PROMOTED SCIENCE/RESEARCH BASELINE  
**Baseline:** 17118  
**Approval:** Explicitly approved by Jon on 2026-10-12  
**Scope:** Elder V2 science/research architecture only. This is **not** a hydrology production promotion and does **not** declare Earthline launch-ready.

## Authoritative source

- Research branch: `research/elder-density-calibration-17100`
- Detector: `tools/elder_trees/chmv2_aoi_candidates.py`
- 17118 detector implementation commit: `98f5496b6e796a42aebe44f05902f20a952abb30`
- Detector blob SHA at promotion: `275984241e273942681e0ab1d19add51a7b35b55`
- Method: `earthline-elder-tree-aoi-chmv2-v0.7-high-recall-plateau-collapse`

The detector source remained unchanged through the 17119 and 17120 audits.

## Promoted architecture

1. **Evidence owner:** high-recall structurally eligible candidate pool.
2. **Density/cohort owner:** classifies CURRENT / FUTURE / OUTSIDE_DENSITY_PRIOR cohorts.
3. **Display owner:** independently thins or filters map display for usability.

A density prior must not destructively erase otherwise structurally valid Elder evidence.

## 17118 repairs promoted

### Low-forest stand gate
In preserve-all/high-recall mode, a low stand-level forest fraction no longer erases an otherwise structurally valid canopy peak. The prior 18% stand rule remains in ordinary quota/density-calibration mode.

### Equal-score plateau collapse
Connected equal-score peak plateaus are collapsed to one representative candidate before global ranking. Representative choice is deterministic and favors:
1. tallest member
2. prominence
3. score
4. row/column tie-break

This prevents artificial global rank flooding without synthesizing tree coordinates.

## Vermont validation

### Before 17118 — prior 17111 high-recall result
- within 5 m: 6/24
- within 10 m: 11/24
- within 20 m: 13/24
- within 30 m: 14/24
- median nearest distance: 15.76 m
- median candidate-pool count: 967

### After 17118 — high-recall/preserve-all
- controls with candidates: 24/24
- within 5 m: 11/24
- within 10 m: 19/24
- within 20 m: 23/24
- within 30 m: 24/24
- median nearest distance: 5.73 m
- median candidate-pool count: 1,477

Independent measured Vermont QL1 validation:
- within 5 m: 13/24
- within 10 m: 21/24
- within 20 m: 23/24
- median nearest distance: 4.81 m
- median absolute height error: 2.9 m

The one 17118 Vermont control outside 20 m is a boundary case at approximately 20.11 m; the independent QL1 validator places its nearest detected canopy structure at approximately 19.71 m. No further selector repair is justified from this case alone.

## 17119 cross-biome volume audit

Research-only audit. No detector change.

Uncensored or measured candidate-pool counts:
- Alaska: 870
- Colorado: 3,293
- England: 3,809
- Vermont: 3,448
- Laos: 5,525

Thailand and Vietnam hit the 17119 6,000-candidate audit ceiling and were therefore escalated to 17120.

## 17120 Southeast Asia saturation audit

Research-only audit. No detector change. Ceiling increased to 20,000 per tile.

### Thailand
- candidate pool: 10,874
- reference peaks: 18,748
- candidates per forest ha: 28.849
- OUTSIDE_DENSITY_PRIOR: 171
- outside-density share: 1.57%
- 20,000 cap hit: no

### Vietnam
- candidate pool: 8,086
- reference peaks: 15,393
- candidates per forest ha: 20.718
- OUTSIDE_DENSITY_PRIOR: 0
- outside-density share: 0%
- 20,000 cap hit: no

Interpretation: the high Southeast Asia candidate counts are not being created by the 17118 preserve-all repair. Most or all of those candidates already fall within the density/cohort framework.

## Scientific boundaries

All modeled outputs remain **MODELED_ELDER_TREE_CANDIDATE** unless supported by an authoritative external inventory or Earthline field verification.

**ELDER TREE CONFIDENCE** remains a local relative structural-evidence percentile. It is **not** the probability that a tree is ancient, veteran, a Mother Tree, or a mycorrhizal hub.

Vermont Big Tree controls validate large-tree detection. They are not automatically verified Elder Trees.

A defensible absolute false-positive rate is not currently available because exhaustive independent Elder Tree truth inventories do not exist across the evaluated landscapes. Incomplete external inventories cannot make every unmatched Earthline candidate a false positive.

V1 Elder Recharge weight remains **ZERO**.

Absence of Elder evidence does not mean absence of Elder Trees.

## Production isolation

This promotion does **not** modify:
- public Earthline production
- hydrology
- bioswale generation
- recharge scoring
- accepted production science parent Build 16584
- `pages-live`

Accepted production science parent remains:
- Build 16584
- `EARTHLINE-LATEST-CANDIDATE-16584.html`
- SHA-256 `19f075d67cc19b12c6169be69aad78dc37acee0cdcb62c957f94d423bd45c33f`

Hydrology/state readiness remains a separate launch track.

## Governance

- One authoritative owner per scientific output.
- No stacked verdicts.
- No unrequested production changes.
- Production changes require separate explicit approval.
- Do not claim physical field verification from modeled remote sensing.
- Do not claim Earthline is launch-ready based on Elder V2 promotion alone.

This file is the authoritative record of the promoted Elder V2 science/research baseline until Jon explicitly approves a successor.
