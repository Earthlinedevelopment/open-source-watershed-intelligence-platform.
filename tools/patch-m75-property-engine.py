from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

pairs=[
(
"const primaryLimit15836=Math.min(work15771.maxCandidates,Math.max(1,canonicalPaths15836.length));",
"const primaryLimit15836=isRegionalTile15769?Math.min(work15771.maxCandidates,Math.max(1,canonicalPaths15836.length)):0;"
),
(
"    for(const path15836 of canonicalPaths15836){\n",
"    for(const path15836 of canonicalPaths15836){\n      if(primaryLimit15836<=0)break;\n"
)
]

for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"PATCH_{i}_COUNT={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_CONTOUR_FIRST_PROPERTY_PATCH_OK")
