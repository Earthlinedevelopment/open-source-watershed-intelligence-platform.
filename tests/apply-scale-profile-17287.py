from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
def rename(name,old,new):
    global s
    n=s.count(old);print(name,n)
    if n!=1: raise SystemExit(f"{name}: expected one anchor, found {n}")
    s=s.replace(old,new,1)
rename("loadDEM","async function loadDEM(","async function loadDEMUnprofiled17287(")
rename("hydrology","async function hydrology(","async function hydrologyUnprofiled17287(")
rename("makeContours","async function makeContours(","async function makeContoursUnprofiled17287(")
rename("makeSwales","async function makeSwales(","async function makeSwalesUnprofiled17287(")
rename("landMask","function earthlineLandValidityMask16584(","function earthlineLandValidityMask16584Unprofiled17287(")
anchor="  class Heap{"
i=s.find(anchor)
if i<0: raise SystemExit("Heap anchor missing")
wrap=r'''
  window.EARTHLINE_SCALE_PROFILE_17287=[];
  function earthlineProf17287(kind17287,st17287,meta17287){
    const row17287={kind:kind17287,ms:Math.round((performance.now()-st17287)*10)/10,...meta17287};
    window.EARTHLINE_SCALE_PROFILE_17287.push(row17287);
    console.log('EARTHLINE_SCALE_PROFILE_17287 '+JSON.stringify(row17287));
  }
  async function loadDEM(...args17287){
    const st17287=performance.now();
    try{const r17287=await loadDEMUnprofiled17287(...args17287);earthlineProf17287('loadDEM',st17287,{label:String(args17287[4]||''),w:args17287[1]??240,h:args17287[2]??240,z:r17287?.z??null});return r17287;}
    catch(e17287){earthlineProf17287('loadDEM-error',st17287,{label:String(args17287[4]||''),error:String(e17287)});throw e17287;}
  }
  function earthlineLandValidityMask16584(...args17287){
    const st17287=performance.now(),r17287=earthlineLandValidityMask16584Unprofiled17287(...args17287);
    earthlineProf17287('landMask',st17287,{w:args17287[0]?.w??null,h:args17287[0]?.h??null});return r17287;
  }
  async function hydrology(...args17287){
    const st17287=performance.now(),r17287=await hydrologyUnprofiled17287(...args17287);
    earthlineProf17287('hydrology',st17287,{w:args17287[0]?.w??null,h:args17287[0]?.h??null});return r17287;
  }
  async function makeContours(...args17287){
    const st17287=performance.now(),r17287=await makeContoursUnprofiled17287(...args17287);
    earthlineProf17287('makeContours',st17287,{w:args17287[0]?.w??null,h:args17287[0]?.h??null,features:r17287?.features?.length??null});return r17287;
  }
  async function makeSwales(...args17287){
    const st17287=performance.now(),r17287=await makeSwalesUnprofiled17287(...args17287);
    earthlineProf17287('makeSwales',st17287,{w:args17287[0]?.w??null,h:args17287[0]?.h??null,features:r17287?.features?.length??null,supp:Array.isArray(args17287[4])?args17287[4].length:null});return r17287;
  }

'''
s=s[:i]+wrap+s[i:]
p.write_text(s,encoding="utf-8")
print("17287 profiler applied")
