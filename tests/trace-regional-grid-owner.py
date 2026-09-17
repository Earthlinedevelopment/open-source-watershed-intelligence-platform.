from pathlib import Path
import re
src=Path("index.html").read_text(encoding="utf-8")
lines=src.splitlines()

patterns=[
    re.compile(r"\b96\b"),
    re.compile(r"loadDEM",re.I),
    re.compile(r"hydrology",re.I),
    re.compile(r"cellX|cellY"),
    re.compile(r"grid",re.I),
]
hits=[]
for i,line in enumerate(lines):
    if any(p.search(line) for p in patterns):
        if ("96" in line and re.search(r"grid|dem|terrain|regional|width|height|\bw\b|\bh\b|cell",line,re.I)) or re.search(r"function\s+loadDEM|function\s+hydrology|cellX|cellY",line,re.I):
            hits.append(i)

print("EARTHLINE_GRID_OWNER_HITS",len(hits))
seen=set()
for i in hits:
    lo=max(0,i-12); hi=min(len(lines),i+13)
    key=(lo,hi)
    if key in seen: continue
    seen.add(key)
    print(f"\n===== GRID OWNER WINDOW line {i+1} =====")
    for j in range(lo,hi):
        print(f"{j+1:06d}: {lines[j]}")
