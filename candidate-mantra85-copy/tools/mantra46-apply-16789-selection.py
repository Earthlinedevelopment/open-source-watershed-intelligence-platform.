from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="<!-- EARTHLINE 16788 — PRIORITIZED EFFICIENT TERRAIN-GAP RECOVERY."
comment="<!-- EARTHLINE 16789 — SAME-PARENT COUNT-NEUTRAL FINAL SPREAD. Regional final spread may replace a duplicate 12x12-cell corridor from a 6x6 parent holding exactly three corridors only when the missing replacement cell is in that same parent, so the parent's corridor count remains exactly three. Cross-parent donor protection remains unchanged. No science, water safety, capacity, ranking, containment, renderer or Property behavior changed. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16789 — SAME-PARENT COUNT-NEUTRAL FINAL SPREAD" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16788 marker expected once, found {n}")
    s=s.replace(marker,comment+marker,1)
old="if(duplicates16783<=1||parentN16783<=3)continue;"
new="if(duplicates16783<=1||(parentN16783<=3&&p16783.parent!==add16783.point.parent))continue;"
n=s.count(old)
if n!=1: raise SystemExit(f"donor condition expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE 16789 installer applied")
