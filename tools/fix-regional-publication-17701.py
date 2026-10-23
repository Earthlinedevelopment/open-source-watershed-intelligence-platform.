from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
marker="window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700"
m=s.rfind(marker)
if m<0: raise SystemExit("publication selector audit not found")
start=s.rfind("const publishedSwales17700",0,m)
end=s.find("const visualData=",m)
if start<0 or end<0 or end<=start: raise SystemExit(f"selector bounds invalid {start} {end}")
old=s[start:end]
if "selected.length>=32" not in old or "one-per-6x6-terrain-sector" not in old:
    raise SystemExit("sparse publication selector contract not found")
new="""const publishedSwales17700=(()=>{
      const src=Array.isArray(swales&&swales.features)?swales.features:[];
      window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700={
        build:'EARTHLINE 17701',runToken,
        generatedCandidates:src.length,publishedCorridors:src.length,
        method:'full verified Regional corridor set; downstream sparse-preview truncation removed',
        at:new Date().toISOString()
      };
      return swales;
    })();
    """
s=s[:start]+new+s[end:]
if "selected.length>=32" in s[start:start+len(new)+2000]:
    raise SystemExit("32-corridor cap survived patch")
p.write_text(s)
print("EARTHLINE_M75_REGIONAL_PUBLICATION_FIX_OK")
