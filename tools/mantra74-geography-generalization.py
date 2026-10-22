from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

def one(old,new,label):
    global s
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 match, found {n}")
    s=s.replace(old,new,1)

one(
"""    const fullAlaskaExtent16905=locked&&!focusMode&&String(loc&&loc.jurisdictionProfileId16556||'')==='us-ak';
    if(!fullAlaskaExtent16905&&!governedCountryExtent16908){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}""",
"""    const governedAdministrativeExtent16905=locked&&!focusMode&&['state','province','region','country'].includes(pt);
    if(!governedAdministrativeExtent16905&&!governedCountryExtent16908){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}""",
"generalize locked administrative extent"
)

one(
"""  const CHIANG={lat:18.7883,lng:98.9853,bbox:[96.3,16.5,101.8,21.1],placeType:'place',label:'Chiang Mai, Thailand',query:'Chiang Mai, Thailand'};
  let diagramsUrl='',decorating=false;
  function core(){return typeof window.earthlineLiveRegionalRun15970==='function'?window.earthlineLiveRegionalRun15970:null;}
  function isChiang(v){return /^(?:chang|chiang)\s*mai(?:\s*,?\s*thailand)?$/i.test(String(v||'').trim())||/^(?:changmai|chiangmai)$/i.test(String(v||'').trim());}
  function prepareChiang(){
    const input=document.getElementById('searchInput');if(input)input.value='Chiang Mai, Thailand';
    try{if(typeof M!=='undefined'&&M){M.loc=Object.assign({},CHIANG);M.appliedSearchText='Chiang Mai, Thailand';}}catch(_){}
    try{const m=window.earthlineMap||earthlineMap;m&&m.fitBounds&&m.fitBounds([[CHIANG.bbox[0],CHIANG.bbox[1]],[CHIANG.bbox[2],CHIANG.bbox[3]]],{padding:54,maxZoom:8.4,duration:350});}catch(_){}
  }
  async function run(e){
    if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
    const input=document.getElementById('searchInput');if(input&&isChiang(input.value))prepareChiang();
    const fn=core();""",
"""  let diagramsUrl='',decorating=false;
  function core(){return typeof window.earthlineLiveRegionalRun15970==='function'?window.earthlineLiveRegionalRun15970:null;}
  async function run(e){
    if(e){e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();}
    const fn=core();""",
"remove Chiang Mai hardcoded run seed"
)

for bad in ["fullAlaskaExtent16905","const CHIANG=","function isChiang","prepareChiang()"]:
    if bad in s:
        raise RuntimeError("geography special case remains: "+bad)

p.write_text(s,encoding="utf-8")
print("EARTHLINE_GEOGRAPHY_GENERALIZATION",len(before)-len(s))

# trigger
