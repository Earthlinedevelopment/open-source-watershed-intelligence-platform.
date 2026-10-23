from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
s = path.read_text(errors="strict")

old_budget = "? {maxLevels:24,maxSeedsPerLevel:6,maxCandidates:28,maxFinal:12,perLevel:3,maxMs:2500}"
new_budget = "? {maxLevels:36,maxSeedsPerLevel:8,maxCandidates:48,maxFinal:24,perLevel:4,maxMs:10000}"
old_seed = "const effectiveSeedBudget15841=isRegionalTile15769?4:work15771.maxSeedsPerLevel;"
new_seed = "const effectiveSeedBudget15841=isRegionalTile15769?6:work15771.maxSeedsPerLevel;"

checks = [
    ("regional-budget", old_budget, 1),
    ("regional-seed-budget", old_seed, 1),
    ("exact-dedupe-owner", "const exactGeometrySeen17699=new Set();", 1),
    ("exact-dedupe-reject", 'finalRec15803.reason="exact-duplicate";', 1),
]
for label, token, expected in checks:
    count = s.count(token)
    if count != expected:
        raise SystemExit(f"{label}: count={count}, expected={expected}")

s = s.replace(old_budget, new_budget, 1)
s = s.replace(old_seed, new_seed, 1)
path.write_text(s)
print("EARTHLINE_M75_REGIONAL_ENGINE_REPAIR_OK")
