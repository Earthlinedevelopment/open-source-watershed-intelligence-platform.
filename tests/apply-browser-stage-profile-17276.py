from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def once(name,old,new):
    global s
    n=s.count(old); print(name,n)
    if n!=1: raise SystemExit(f"{name}: expected one anchor, found {n}")
    s=s.replace(old,new,1)

once("loadDEM rename","async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){","async function loadDEMUnprofiled17276(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){")
once("hydrology rename","async function hydrology(dem,validityMask16584=null){","async function hydrologyUnprofiled17276(dem,validityMask16584=null){")
once("makeContours rename","async function makeContours(hy,candidateQuantile16609=false,levelsOverride16710=null){","async function makeContoursUnprofiled17276(hy,candidateQuantile16609=false,levelsOverride16710=null){")
once("makeSwales rename","async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16710=null){","async function makeSwalesUnprofiled17276(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16710=null){")

anchor="  class Heap{"
i=s.find(anchor)
if i<0: raise SystemExit("Heap anchor missing")
wrap=r'''
  window.EARTHLINE_BROWSER_STAGE_PROFILE_17276=[];
  function earthlineProfile17276(kind17276,start17276,meta17276){
    const row17276={kind:kind17276,ms:Math.round((performance.now()-start17276)*10)/10,...meta17276};
    window.EARTHLINE_BROWSER_STAGE_PROFILE_17276.push(row17276);
    console.log('EARTHLINE_BROWSER_STAGE_PROFILE_17276 '+JSON.stringify(row17276));
  }
  async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){
    const st17276=performance.now();
    try{const r17276=await loadDEMUnprofiled17276(b,w,h,requestTimeoutMs,timeoutLabel);earthlineProfile17276('loadDEM',st17276,{label:String(timeoutLabel||''),w,h,z:r17276?.z??null});return r17276;}
    catch(e17276){earthlineProfile17276('loadDEM-error',st17276,{label:String(timeoutLabel||''),w,h,error:String(e17276)});throw e17276;}
  }
  async function hydrology(dem,validityMask16584=null){
    const st17276=performance.now();
    try{const r17276=await hydrologyUnprofiled17276(dem,validityMask16584);earthlineProfile17276('hydrology',st17276,{w:dem?.w??null,h:dem?.h??null,z:dem?.z??null});return r17276;}
    catch(e17276){earthlineProfile17276('hydrology-error',st17276,{w:dem?.w??null,h:dem?.h??null,error:String(e17276)});throw e17276;}
  }
  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16710=null){
    const st17276=performance.now(),r17276=await makeContoursUnprofiled17276(hy,candidateQuantile16609,levelsOverride16710);
    earthlineProfile17276('makeContours',st17276,{w:hy?.w??null,h:hy?.h??null,features:r17276?.features?.length??null,override:Array.isArray(levelsOverride16710)?levelsOverride16710.length:null});
    return r17276;
  }
  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16710=null){
    const st17276=performance.now(),r17276=await makeSwalesUnprofiled17276(hy,contours,focusMode,jurisdictionGeometry16539,supplementalCandidates16710);
    earthlineProfile17276('makeSwales',st17276,{w:hy?.w??null,h:hy?.h??null,contours:contours?.features?.length??null,supp:Array.isArray(supplementalCandidates16710)?supplementalCandidates16710.length:null,features:r17276?.features?.length??null});
    return r17276;
  }

'''
s=s[:i]+wrap+s[i:]
p.write_text(s,encoding="utf-8")
print("17276 profiler applied")
