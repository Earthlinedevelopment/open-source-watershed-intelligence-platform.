from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

pairs=[
(
"      const binsX=6,binsY=6;",
"""      const midLat17701=(south+north)*.5*Math.PI/180;
      const spanX17701=Math.max(1e-9,(east-west)*Math.max(.2,Math.cos(midLat17701)));
      const spanY17701=Math.max(1e-9,north-south);
      const aspect17701=spanX17701/spanY17701;
      const targetCells17701=64;
      const binsX=Math.max(6,Math.min(12,Math.round(Math.sqrt(targetCells17701*aspect17701))));
      const binsY=Math.max(6,Math.min(12,Math.round(targetCells17701/binsX)));
      const publishCap17701=Math.min(64,src.length);"""
),
(
"        if(selected.length>=32)break;",
"        if(selected.length>=publishCap17701)break;"
),
(
"""      if(selected.length<12){
        for(const r of rows){
          if(selected.includes(r.f))continue;
          selected.push(r.f);
          if(selected.length>=Math.min(24,rows.length))break;
        }
      }""",
"""      const minimumSpread17701=Math.min(36,rows.length);
      if(selected.length<minimumSpread17701){
        for(const r of rows){
          if(selected.includes(r.f))continue;
          selected.push(r.f);
          if(selected.length>=Math.min(48,rows.length))break;
        }
      }"""
),
(
"        method:'score-ranked one-per-6x6-terrain-sector; candidate pool retained internally',",
"        method:'score-ranked aspect-aware fine-sector coverage; candidate pool retained internally',"
)
]
for i,(old,new) in enumerate(pairs,1):
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"selector patch {i} target count={n}")
    s=s.replace(old,new,1)

p.write_text(s)
print("EARTHLINE_M75_REGIONAL_COVERAGE_PATCH_OK")
