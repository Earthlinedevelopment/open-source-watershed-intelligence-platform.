# EARTHLINE PRODUCTION CHANGE LEDGER

Status: ACTIVE
Created: 2026-10-27

## Frozen production baseline
- Production branch: pages-live
- Frozen SHA: 89b0f5698b28828adc0f063b6fd144e599b0f1da
- Rollback branch: frozen-recovery-89b0f569
- Candidate branch: candidate-next
- Production writes: FORBIDDEN until candidate scope is isolated and reviewed

## Operating rule
ONE DEFECT · ONE OWNER · ONE CHANGE · ONE ROLLBACK

## Current recovery record
| BASELINE | DEFECT | OWNER | CHANGE | CANDIDATE SHA | RESULT | ROLLBACK |
|---|---|---|---|---|---|---|
| 89b0f5698b28828adc0f063b6fd144e599b0f1da | Property presentation regression: worms / blue safe-lines losing ownership / Elders absent | NOT YET ISOLATED | NONE | NONE | FROZEN FOR DIAGNOSIS | frozen-recovery-89b0f569 |

## Mandatory gates
1. No direct edits to pages-live during diagnosis.
2. No science changes during presentation recovery.
3. No presentation changes during science recovery.
4. No stacked patches. Failed candidate is abandoned or reverted.
5. Candidate may touch one file whenever physically possible.
6. Exact code owner must be identified before modification.
7. Diff must contain no unrelated runtime changes.
8. Automated checks never equal user acceptance.
9. User visual rejection = failed candidate.
10. Production promotion requires explicit comparison against this frozen baseline.
