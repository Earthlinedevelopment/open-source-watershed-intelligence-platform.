from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old="""      if(!relevant.length)return false;
      if(typeof earthlineMap.isSourceLoaded==="function"){
        const sources=[...new Set(relevant.map(l=>l.source).filter(Boolean))];
        for(const sourceId of sources){
          try{if(!earthlineMap.isSourceLoaded(sourceId))return false;}catch(_){return false;}
        }
      }
      return true;"""
new="""      if(!relevant.length)return false;
      /* EARTHLINE 17700 — the exclusion owner needs queryable style structure,
         not global source-settlement. Individual rendered/source queries below
         remain the evidence authority and still fail closed on real query failure. */
      return true;"""
const n=s.count(old)
if n!=1: raise SystemExit("STYLE_READY_COUNT="+str(n))
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_EXCLUSION_STYLE_READY_PATCH_OK")
