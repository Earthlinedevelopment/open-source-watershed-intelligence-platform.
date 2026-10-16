from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def rename(name,old,new):
    global s
    n=s.count(old); print(name,n)
    if n!=1: raise SystemExit(f"{name}: expected one anchor, found {n}")
    s=s.replace(old,new,1)
rename("loadDEM","async function loadDEM(","async function loadDEMUnprofiled17290(")
rename("hydrology","async function hydrology(","async function hydrologyUnprofiled17290(")
rename("makeContours","async function makeContours(","async function makeContoursUnprofiled17290(")
rename("makeSwales","async function makeSwales(","async function makeSwalesUnprofiled17290(")
rename("landMask","function earthlineLandValidityMask16584(","function earthlineLandValidityMask16584Unprofiled17290(")
anchor="  class Heap{"
i=s.find(anchor)
if i<0: raise SystemExit("Heap anchor missing")
wrap=r'''
  window.EARTHLINE_STAGE_PROFILE_17290=[];
  function earthlineProf17290(kind17290,st17290,meta17290){
    const row17290={kind:kind17290,ms:Math.round((performance.now()-st17290)*10)/10,...meta17290};
    window.EARTHLINE_STAGE_PROFILE_17290.push(row17290);
    console.log('EARTHLINE_STAGE_PROFILE_17290 '+JSON.stringify(row17290));
  }
  async function loadDEM(...args17290){
    const st17290=performance.now();
    try{const r17290=await loadDEMUnprofiled17290(...args17290);earthlineProf17290('loadDEM',st17290,{label:String(args17290[4]||''),w:args17290[1]??240,h:args17290[2]??240,z:r17290?.z??null});return r17290;}
    catch(e17290){earthlineProf17290('loadDEM-error',st17290,{label:String(args17290[4]||''),error:String(e17290)});throw e17290;}
  }
  function earthlineLandValidityMask16584(...args17290){
    const st17290=performance.now(),r17290=earthlineLandValidityMask16584Unprofiled17290(...args17290);
    earthlineProf17290('landMask',st17290,{w:args17290[0]?.w??null,h:args17290[0]?.h??null});return r17290;
  }
  async function hydrology(...args17290){
    const st17290=performance.now(),r17290=await hydrologyUnprofiled17290(...args17290);
    earthlineProf17290('hydrology',st17290,{w:args17290[0]?.w??null,h:args17290[0]?.h??null});return r17290;
  }
  async function makeContours(...args17290){
    const st17290=performance.now(),r17290=await makeContoursUnprofiled17290(...args17290);
    earthlineProf17290('makeContours',st17290,{w:args17290[0]?.w??null,h:args17290[0]?.h??null,features:r17290?.features?.length??null});return r17290;
  }
  async function makeSwales(...args17290){
    const st17290=performance.now(),r17290=await makeSwalesUnprofiled17290(...args17290);
    earthlineProf17290('makeSwales',st17290,{w:args17290[0]?.w??null,h:args17290[0]?.h??null,features:r17290?.features?.length??null,supp:Array.isArray(args17290[4])?args17290[4].length:null});return r17290;
  }

'''
s=s[:i]+wrap+s[i:]
p.write_text(s,encoding="utf-8")
print("17290 profiler applied")
