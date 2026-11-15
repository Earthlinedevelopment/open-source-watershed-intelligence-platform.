#!/usr/bin/env python3
"""Surgical presentation-only changes. Existing grades, geometries and clicks retained."""
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def change(old,new,label):
 global s
 n=s.count(old)
 if n!=1:raise SystemExit(f"STOP {label}: expected 1 anchor, found {n}")
 s=s.replace(old,new,1)
 print("PASS",label)
change("        waterPockets16174(sg,waterPts,swales*131+rank*17,water,zoom);",
"""        waterPockets16174(sg,waterPts,swales*131+rank*17,water,zoom);
        /* Two visible dotted blue strips: presentation only, no new swale geometry. */
        for(const [i,offset] of [[1,.12],[2,.44]]){
          const bluePts=offsetPoints16174(pts,uphill*footprint*offset);
          addPath(sg,bluePts,{class:'earthline-swale-water-strip-blue-1'+i,
            stroke:'#008fff','stroke-width':String(Math.max(2.6,water*.82)),
            'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'1.5 6',
            'data-swale-index':String(swales)});
        }""","focus-double-blue")
change("""        addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});""",
"""        addPath(sg,pts,{stroke:light,'stroke-width':String((grade==='A'?1.8:1.2)*regionalScale),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':grade==='C'?'6 9':'10 7'});
        /* Two blue dotted swale strips. Grades remain encoded by the core and label. */
        for(const [i,side] of [[1,-1],[2,1]]){
          const bluePts=offsetPoints16174(pts,side*Math.max(1.3,core*.27));
          addPath(sg,bluePts,{class:'earthline-regional-swale-blue-strip-'+i,
            stroke:'#008fff','stroke-width':String(Math.max(1.3,2.6*regionalScale)),
            'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':'1.3 5',
            'data-swale-index':String(swales)});
        }""","regional-double-blue")
assert "earthline-swale-water-strip-blue-1" in s
assert "earthline-regional-swale-blue-strip-" in s
p.write_text(s,encoding="utf-8")
