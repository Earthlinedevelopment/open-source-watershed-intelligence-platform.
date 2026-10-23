from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")
marker="    const publishedSwales17700=focusMode?swales:(()=>{"
start=s.find(marker)
end=s.find("    const visualData=",start)
if s.count(marker)!=1 or start<0 or end<=start:
    raise SystemExit(f"PUBLICATION_BLOCK count={s.count(marker)} start={start} end={end}")

replacement="""    const publishedSwales17700=swales;
    window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700={
      build:'EARTHLINE 17701',runToken,
      generatedCandidates:Array.isArray(swales&&swales.features)?swales.features.length:0,
      publishedCorridors:Array.isArray(swales&&swales.features)?swales.features.length:0,
      method:'publish full governed Regional selection; upstream terrain, jurisdiction, spacing, capacity and coverage owners already finalized this set',
      at:new Date().toISOString()
    };
"""
s=s[:start]+replacement+s[end:]
p.write_text(s)
print("EARTHLINE_REGIONAL_PUBLICATION_17701_PATCH_OK")
