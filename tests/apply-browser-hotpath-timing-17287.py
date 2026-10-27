from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old="  async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){"
new="""  async function loadDEM(b,w=240,h=240,requestTimeoutMs=30000,timeoutLabel='open elevation'){
    const loadDEMStart17287=performance.now();"""
if s.count(old)!=1: raise SystemExit("loadDEM start anchor")
s=s.replace(old,new,1)

old="    try{await Promise.all(jobs);}"
new="    try{await Promise.all(jobs);}"
# unchanged anchor used below
if s.count(old)!=1: raise SystemExit("Promise all anchor")
s=s.replace(old,new,1)
old2="    catch(error){"
# insert fetch end between try and catch by replacing exact adjacent snippet
adj="    try{await Promise.all(jobs);}\n    catch(error){"
rep="    try{await Promise.all(jobs);}\n    catch(error){"
# Can't safely put timing before catch; record after finally instead.
old_final="    }finally{clearTimeout(timer);}\n    const elev=new Float32Array(w*h);let min=Infinity,max=-Infinity;"
new_final="""    }finally{clearTimeout(timer);}
    const loadDEMTilesDone17287=performance.now();
    const elev=new Float32Array(w*h);let min=Infinity,max=-Infinity;"""
if s.count(old_final)!=1: raise SystemExit("loadDEM finally anchor")
s=s.replace(old_final,new_final,1)

old_return="    return {elev,w,h,bounds:b,z,min,max,source:'Open Terrarium elevation tiles'};"
new_return="""    const loadDEMEnd17287=performance.now();
    (window.EARTHLINE_LOADDEM_TIMINGS_17287||(window.EARTHLINE_LOADDEM_TIMINGS_17287=[])).push({
      label:String(timeoutLabel||'open elevation'),w,h,z,
      tilesMs:Math.round(loadDEMTilesDone17287-loadDEMStart17287),
      resampleMs:Math.round(loadDEMEnd17287-loadDEMTilesDone17287),
      totalMs:Math.round(loadDEMEnd17287-loadDEMStart17287)
    });
    return {elev,w,h,bounds:b,z,min,max,source:'Open Terrarium elevation tiles'};"""
if s.count(old_return)!=1: raise SystemExit("loadDEM return anchor")
s=s.replace(old_return,new_return,1)

old="  async function hydrology(dem,validityMask16584=null){\n    const {elev,w,h,bounds:b}=dem,N=w*h;"
new="""  async function hydrology(dem,validityMask16584=null){
    const hydrologyStart17287=performance.now();
    const {elev,w,h,bounds:b}=dem,N=w*h;"""
if s.count(old)!=1: raise SystemExit("hydrology start anchor")
s=s.replace(old,new,1)

old="    let heapSteps16245=0;\n    while(heap.length){"
new="    const hydrologySeedDone17287=performance.now();\n    let heapSteps16245=0;\n    while(heap.length){"
if s.count(old)!=1: raise SystemExit("hydrology seed anchor")
s=s.replace(old,new,1)

old="    const mid=(b[1]+b[3])/2,cellX=(b[2]-b[0])*111320*Math.cos(mid*Math.PI/180)/(w-1),"
new="    const hydrologyPitDone17287=performance.now();\n    const mid=(b[1]+b[3])/2,cellX=(b[2]-b[0])*111320*Math.cos(mid*Math.PI/180)/(w-1),"
if s.count(old)!=1: raise SystemExit("hydrology pit anchor")
s=s.replace(old,new,1)

old="    const order=[];\n    for(let i=0;i<N;i++)if(!valid16584||valid16584[i])order.push(i);\n    order.sort((a,c)=>filled[c]-filled[a]);"
new="""    const hydrologyDirectionsDone17287=performance.now();
    const order=[];
    for(let i=0;i<N;i++)if(!valid16584||valid16584[i])order.push(i);
    order.sort((a,c)=>filled[c]-filled[a]);
    const hydrologySortDone17287=performance.now();"""
if s.count(old)!=1: raise SystemExit("hydrology sort anchor")
s=s.replace(old,new,1)

old="    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};"
new="""    const hydrologyEnd17287=performance.now();
    (window.EARTHLINE_HYDROLOGY_TIMINGS_17287||(window.EARTHLINE_HYDROLOGY_TIMINGS_17287=[])).push({
      w,h,N,source:String(dem&&dem.source||''),
      seedMs:Math.round(hydrologySeedDone17287-hydrologyStart17287),
      pitFillMs:Math.round(hydrologyPitDone17287-hydrologySeedDone17287),
      directionsMs:Math.round(hydrologyDirectionsDone17287-hydrologyPitDone17287),
      sortMs:Math.round(hydrologySortDone17287-hydrologyDirectionsDone17287),
      accumulationMs:Math.round(hydrologyEnd17287-hydrologySortDone17287),
      totalMs:Math.round(hydrologyEnd17287-hydrologyStart17287)
    });
    return {filled,to,slope,acc,cellX,cellY,w,h,bounds:b,elev:terrainElev16584,validityMask16584:valid16584};"""
if s.count(old)!=1: raise SystemExit("hydrology return anchor")
s=s.replace(old,new,1)

s="<!-- EARTHLINE_BROWSER_HOTPATH_TIMING_17287: diagnostic-only DEM/hydrology phase timing; no behavior/science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched diagnostic hotpath timings 17287")
