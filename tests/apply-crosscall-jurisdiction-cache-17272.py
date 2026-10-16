from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def once(name, old, new):
    global s
    n=s.count(old)
    print(name,n)
    if n!=1:
        raise SystemExit(f"{name}: expected exactly one anchor, found {n}")
    s=s.replace(old,new,1)

helpers=r'''
  /* EARTHLINE 17272 — cross-call exact jurisdiction screen cache.
     Scope is one hydrology object (one Regional run) plus one jurisdiction geometry.
     Cache key contains the COMPLETE candidate segment and the exact display-length
     threshold, so no science, clip, ranking, spacing or safety decision is relaxed. */
  const earthlineCrossCallScreenCache17272=new WeakMap();
  function earthlineScreenCacheMap17272(hy17272,g17272){
    if(!hy17272||typeof hy17272!=='object'||!g17272||typeof g17272!=='object')return null;
    let byGeometry17272=earthlineCrossCallScreenCache17272.get(hy17272);
    if(!byGeometry17272){byGeometry17272=new WeakMap();earthlineCrossCallScreenCache17272.set(hy17272,byGeometry17272);}
    let map17272=byGeometry17272.get(g17272);
    if(!map17272){map17272=new Map();byGeometry17272.set(g17272,map17272);}
    return map17272;
  }
  function earthlineScreenKey17272(candidate17272){
    const seg17272=candidate17272&&candidate17272.segment;
    if(!Array.isArray(seg17272)||seg17272.length<2)return null;
    const min17272=candidate17272&&candidate17272.coverageGap16731?0.75:Math.max(4,Math.min(10,Number(candidate17272&&candidate17272.minLinePx16632)||10));
    let key17272=String(min17272)+'|'+seg17272.length;
    for(const p17272 of seg17272){
      if(!Array.isArray(p17272)||p17272.length<2)return null;
      key17272+='|'+String(Number(p17272[0]))+','+String(Number(p17272[1]));
    }
    return key17272;
  }
'''

once("insert cross-call helpers",
"  async function makeSwales(",
helpers+"  async function makeSwales(")

once("rename original screen",
"function screenJurisdictionCandidate16539(candidate16539){",
"function screenJurisdictionCandidate16539Uncached17272(candidate16539){")

wrapper=r'''
    function screenJurisdictionCandidate16539(candidate16539){
      if(!jurisdictionGeometry16539)return candidate16539;
      if(candidate16539&&jurisdictionScreenCache16592.has(candidate16539))return jurisdictionScreenCache16592.get(candidate16539);
      const map17272=earthlineScreenCacheMap17272(hy,jurisdictionGeometry16539),key17272=earthlineScreenKey17272(candidate16539);
      if(map17272&&key17272&&map17272.has(key17272)){
        const hit17272=map17272.get(key17272);
        window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272=window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272||{hits:0,misses:0,stored:0,at:new Date().toISOString()};
        window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272.hits++;
        if(hit17272===null){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}
        const screened17272=Object.assign({},candidate16539,{segment:hit17272.segment,x:hit17272.x,y:hit17272.y,jurisdiction_screened:true});
        if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screened17272);
        return screened17272;
      }
      window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272=window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272||{hits:0,misses:0,stored:0,at:new Date().toISOString()};
      window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272.misses++;
      const screened17272=screenJurisdictionCandidate16539Uncached17272(candidate16539);
      if(map17272&&key17272){
        map17272.set(key17272,screened17272?{segment:screened17272.segment,x:screened17272.x,y:screened17272.y}:null);
        window.EARTHLINE_JURISDICTION_CROSSCALL_CACHE_17272.stored++;
      }
      return screened17272;
    }

'''
anchor="async function jurisdictionEligibleCandidates16539(pool16539){"
n=s.count(anchor)
print("wrapper anchor",n)
if n!=1: raise SystemExit(f"wrapper anchor expected once, found {n}")
pos=s.index(anchor)
s=s[:pos]+wrapper+s[pos:]

s="/* EARTHLINE_CROSSCALL_JURISDICTION_SCREEN_CACHE_17272 — exact screen result reuse within one Regional hydrology run; no science thresholds changed. */\n"+s
p.write_text(s,encoding="utf-8")
print("17272 cross-call exact jurisdiction screen cache applied")
