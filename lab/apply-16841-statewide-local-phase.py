from pathlib import Path
import re, sys

if len(sys.argv) != 3:
    raise SystemExit('usage: apply-16841-statewide-local-phase.py INDEX JS_SOURCE')
index=Path(sys.argv[1]); js=Path(sys.argv[2])
s=index.read_text(encoding='utf-8')
src=js.read_text(encoding='utf-8')
if 'EARTHLINE 16841 — GROUPED STATEWIDE-DEM LOCAL PHASE' in s:
    raise SystemExit('16841 already present')
m=re.search(r"const injection=String\.raw`([\s\S]*?)`;\n\nconst browser=",src)
if not m:
    raise SystemExit('16839 tested injection not found')
injection=m.group(1)
injection=injection.replace('groupSize16839=4','groupSize16839=6')
injection=injection.replace('for(const d16839 of [-.2,0,.2])','for(const d16839 of [0])')
injection=injection.replace("grid:'24x24 grouped 4x4'","grid:'24x24 grouped 6x6; median-only cell phases'")
injection=injection.replace("build:'EARTHLINE 16839 A/B'","build:'EARTHLINE 16841'")
injection=injection.replace('/* EARTHLINE 16839 DIAGNOSTIC — GROUPED STATEWIDE-DEM LOCAL PHASE. */','/* EARTHLINE 16841 — GROUPED STATEWIDE-DEM LOCAL PHASE. */')
injection=injection.replace('max 36 statewide-DEM local contour windows','max 16 statewide-DEM local contour windows with one local median phase per gap plus group quantiles')
anchor='    /* EARTHLINE 16780 — the coarse 6x6 coverage owner can pass while a large'
if s.count(anchor)!=1:
    raise SystemExit(f'16780 anchor expected once, found {s.count(anchor)}')
pos=s.index(anchor)
s=s[:pos]+injection+s[pos:]
index.write_text(s,encoding='utf-8')
print('16841 applied; inserted chars',len(injection))
