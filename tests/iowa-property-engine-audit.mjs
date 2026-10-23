import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?iowa-property-engine-audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(850);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:90000,polling:200});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa Property Audit',lat,lng,countryCode:'us',query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:17});}catch(_){}
},TARGET);
await page.waitForTimeout(900);

const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

await page.waitForFunction(()=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return a?.settled===true&&a?.result===true&&a?.renderVerified===true;
},null,{timeout:90000,polling:200});

async function snapshot(label){
  return await page.evaluate(({label,target})=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const md=(typeof M!=='undefined'?M:null);
    const style=mp?.getStyle?.()||{};
    const ids=(style.layers||[]).map(l=>l.id).filter(id=>/tree|elder|plant|canopy|forest|swale|safe/i.test(String(id||'')));
    const layers=ids.map(id=>{
      let visibility=null,rendered=null,source=null,type=null;
      try{
        const l=mp.getLayer(id);source=l?.source||null;type=l?.type||null;
        visibility=mp.getLayoutProperty(id,'visibility')||'visible';
        const cv=mp.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];
        rendered=box?(mp.queryRenderedFeatures(box,{layers:[id]})||[]).length:null;
      }catch(_){}
      return {id,source,type,visibility,rendered};
    });
    const sources={};
    for(const id of [...new Set(layers.map(x=>x.source).filter(Boolean))]){
      try{
        const src=mp.getSource(id),data=src&&(src._data||src._options?.data);
        sources[id]=Array.isArray(data?.features)?data.features.length:null;
      }catch(_){sources[id]=null}
    }
    const dom={
      plantingOverlay:document.querySelectorAll('.earthline-swale-planting-layer-15806,.earthline-swale-tree-crown-16174,.earthline-swale-canopy-16174').length,
      treeCrowns:document.querySelectorAll('.earthline-swale-tree-crown-16174').length,
      canopies:document.querySelectorAll('.earthline-swale-canopy-16174').length,
      swalePaths:document.querySelectorAll('[data-layer="swale-opportunities"] path').length
    };

    const fc=md?.authoritativeSafeSwales15815||md?.authoritativeSafeSwales15806||null;
    const features=Array.isArray(fc?.features)?fc.features:[];
    const geoms=[];
    const sigs=new Map();
    for(const f of features){
      const g=f?.geometry;
      const groups=g?.type==='LineString'?[g.coordinates]:(g?.type==='MultiLineString'?g.coordinates:[]);
      for(const coords of groups||[]){
        if(!Array.isArray(coords)||coords.length<2)continue;
        const key=JSON.stringify(coords.map(p=>[Number(p[0]).toFixed(7),Number(p[1]).toFixed(7)]));
        sigs.set(key,(sigs.get(key)||0)+1);
        const mid=coords[Math.floor((coords.length-1)/2)]||coords[0];
        geoms.push({mid:[Number(mid[0]),Number(mid[1])],points:coords.length});
      }
    }
    const dupGroups=[...sigs.values()].filter(n=>n>1);
    const b=md?.analysisBoundaryLngLat||md?.authoritativePropertyFrame15821?.boundary||null;
    let bbox=null;
    if(Array.isArray(b)&&b.length){
      const pts=(Array.isArray(b[0])&&Array.isArray(b[0][0])?b[0]:b).filter(p=>Array.isArray(p)&&p.length>=2);
      const xs=pts.map(p=>Number(p[0])).filter(Number.isFinite),ys=pts.map(p=>Number(p[1])).filter(Number.isFinite);
      if(xs.length&&ys.length)bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
    }
    const grid=Array.from({length:4},()=>Array(4).fill(0));
    if(bbox){
      const [w,s,e,n]=bbox,dx=(e-w)/4,dy=(n-s)/4;
      for(const row of geoms){
        const [lng,lat]=row.mid;
        const x=Math.max(0,Math.min(3,Math.floor((lng-w)/Math.max(dx,1e-12))));
        const y=Math.max(0,Math.min(3,Math.floor((n-lat)/Math.max(dy,1e-12))));
        grid[y][x]++;
      }
    }
    const model={};
    if(md){
      for(const k of Object.keys(md).filter(k=>/flowFirst|swale|tree|forest|canopy|plant|elder|coverage|spacing|terrainHandoff|phase|timing/i.test(k))){
        const v=md[k];
        if(Array.isArray(v)||ArrayBuffer.isView(v)) model[k]={type:'array',length:v.length};
        else if(v&&typeof v==='object'){
          try{model[k]={type:'object',value:JSON.parse(JSON.stringify(v))}}catch(_){model[k]={type:'object',keys:Object.keys(v).slice(0,100)}}
        } else if(['string','number','boolean'].includes(typeof v)) model[k]={type:typeof v,value:v};
      }
    }
    return {
      label,target,
      runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      safeVisibility:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      rendererAudit:window.EARTHLINE_SWALE_RENDERING_AUDIT_16167||null,
      elderAudit:window.EARTHLINE_ELDER_AUDIT_17097||window.EARTHLINE_ELDER_RENDER_AUDIT_17097||null,
      layers,sources,dom,
      swaleFeatureCount:features.length,
      swaleGeometryCount:geoms.length,
      exactDuplicateGroups:dupGroups.length,
      exactDuplicateExtra:dupGroups.reduce((a,n)=>a+n-1,0),
      midpointGrid4x4:grid,
      nonempty4x4:grid.flat().filter(v=>v>0).length,
      boundary:bbox,
      model
    };
  },{label,target:TARGET});
}

const samples=[];
for(const [label,delay] of [['settled',0],['plus1s',1000],['plus3s',2000],['plus6s',3000],['plus10s',4000]]){
  if(delay) await page.waitForTimeout(delay);
  samples.push(await snapshot(label));
}
await page.screenshot({path:'iowa-property-engine-audit.png',fullPage:false});
const out={target:TARGET,samples,errors};
fs.writeFileSync('iowa-property-engine-audit.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_IOWA_PROPERTY_ENGINE_AUDIT '+JSON.stringify(out));
await browser.close();