from pathlib import Path

path = Path('index.html')
text = path.read_text(encoding='utf-8')

old_fn = """  async function makeContours(hy){
    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];
    for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);"""
new_fn = """  async function makeContours(hy,candidateQuantile16609=false){
    const min=percentile(hy.elev,0.02),max=percentile(hy.elev,0.98),range=Math.max(1,max-min),step=niceInterval(range,20),levels=[];
    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}"""

old_call = """    let swales=makeSwales(hy,contours,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""
new_call = """    const min16609=percentile(hy.elev,0.02),max16609=percentile(hy.elev,0.98),step16609=niceInterval(Math.max(1,max16609-min16609),20);
    const useSupplemental16609=!focusMode&&step16609>=200;
    const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;
    let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);"""

for name, old, new in [('makeContours', old_fn, new_fn), ('makeSwales call', old_call, new_call)]:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{name}: expected exactly 1 source match, found {count}')
    text = text.replace(old, new, 1)

path.write_text(text, encoding='utf-8')
print('Applied shared coarse-step candidate contour repair to index.html')
