from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      if(out16584.length<8){droppedLines16584++;continue;}"""
new="""      /* EARTHLINE 16922 — shared final-publication tributary preservation.
         Valid confluence-ending tributaries have already passed the same point, segment,
         land-validity and shoreline checks as trunk paths. Do not discard them solely
         because they are shorter than eight vertices. */
      const tributaryFinal16922=!!(f16584.properties&&Number(f16584.properties.tributary)===1);
      if(out16584.length<(tributaryFinal16922?2:8)){droppedLines16584++;continue;}"""
if "EARTHLINE 16922" not in s:
    if old not in s:
        raise SystemExit("16922 final publication anchor missing")
    s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE 16922 shared final publication tributary preservation applied")
