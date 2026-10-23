from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

pairs=[
(
"const minSegmentM=earthlineMinimumSwaleLengthM15768();",
"""const minSegmentM=isRegionalTile15769
      ? earthlineMinimumSwaleLengthM15768()
      : Math.max(24,earthlineMinimumSwaleLengthM15768());"""
),
(
"""      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      ((b.score||0)-(a.score||0)) ||""",
"""      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      (earthlineSegmentLengthM(b.pts||[])-earthlineSegmentLengthM(a.pts||[])) ||
      ((b.score||0)-(a.score||0)) ||"""
),
(
"        if(sw.bandKey===ex.bandKey)continue;\n",
""
)
]

for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"PATCH_{i}_COUNT={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_PROPERTY_ENGINE_PATCH_OK")
