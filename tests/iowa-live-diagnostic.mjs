import { chromium } from 'playwright';
import fs from 'node:fs';

const URL='https://earthlinedevelopment.org/?iowa-live-diagnostic='+Date.now();
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
const started=Date.now();

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(800);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(150);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
  return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:90000,polling:150});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat; M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',placeType:'state',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},{...TARGET});
await page.waitForTimeout(1200);

const pre=await page.evaluate(()=>({
  button:!!document.getElementById('earthlineDeclareProperty16169'),
  disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
  buttonText:document.getElementById('earthlineDeclareProperty16169')?.textContent||'',
  center:(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getCenter?.(),
  runState:document.documentElement.dataset.earthlinePropertyRunState||'',
  hasDeclare:typeof window.earthlineDeclarePropertyAtCrosshair16173==='function'
}));

const serialBefore=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
if(!pre.disabled && pre.button){
  await page.locator('#earthlineDeclareProperty16169').click({force:true});
}else if(pre.hasDeclare){
  await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173());
}else{
  throw new Error('Property declaration unavailable '+JSON.stringify(pre));
}

let settled=false;
try{
  await page.waitForFunction(()=>{
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const state=String(document.documentElement.dataset.earthlinePropertyRunState||'').toLowerCase();
    return audit?.settled===true || (state && state!=='running');
  },null,{timeout:90000,polling:200});
  settled=true;
}catch(_){}

await page.waitForTimeout(1500);

const diag=await page.evaluate(({target,serialBefore,pre,started,settled})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const style=mp?.getStyle?.()||{};
  const layers=(style.layers||[]).filter(l=>/swale|contour|safe/i.test(String(l.id||''))).map(l=>({
    id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']||null,
    visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})()
  }));
  const safeLayerIds=layers.filter(l=>/safe|swale/i.test(l.id)&&l.type==='line'&&l.visibility!=='none').map(l=>l.id);
  let feats=[];
  try{
    const c=mp?.getCanvas?.();
    const box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
    if(box&&safeLayerIds.length) feats=mp.queryRenderedFeatures(box,{layers:safeLayerIds})||[];
  }catch(_){}
  const seen=new Set(), lines=[];
  function flattenGeom(g){
    if(!g)return[];
    if(g.type==='LineString')return [g.coordinates];
    if(g.type==='MultiLineString')return g.coordinates||[];
    return[];
  }
  for(const f of feats){
    for(const coords of flattenGeom(f.geometry)){
      const key=JSON.stringify(coords);
      if(seen.has(key))continue; seen.add(key);
      const picks=[];
      if(coords.length){
        const idx=[0,Math.floor((coords.length-1)*0.25),Math.floor((coords.length-1)*0.5),Math.floor((coords.length-1)*0.75),coords.length-1];
        for(const i of [...new Set(idx)]){
          const p=coords[i]; let z=null;
          try{z=mp?.queryTerrainElevation?.({lng:p[0],lat:p[1]},{exaggerated:false});}catch(_){}
          picks.push({lng:p[0],lat:p[1],z:Number.isFinite(z)?z:null});
        }
      }
      const zs=picks.map(p=>p.z).filter(Number.isFinite);
      lines.push({
        layer:f.layer?.id||null,
        props:f.properties||{},
        points:coords.length,
        start:coords[0]||null,end:coords[coords.length-1]||null,
        elevationSamples:picks,
        elevationRange:zs.length?Math.max(...zs)-Math.min(...zs):null,
        endpointDelta:zs.length>1?Math.abs(zs[zs.length-1]-zs[0]):null
      });
      if(lines.length>=40)break;
    }
    if(lines.length>=40)break;
  }
  const mSummary={};
  try{
    if(typeof M!=='undefined'&&M){
      for(const k of Object.keys(M).filter(k=>/swale|contour|dem|slope|forest|tree|terrain|phase|timing/i.test(k)).slice(0,120)){
        const v=M[k];
        if(Array.isArray(v))mSummary[k]={type:'array',length:v.length};
        else if(v&&typeof v==='object')mSummary[k]={type:'object',keys:Object.keys(v).slice(0,40)};
        else mSummary[k]={type:typeof v,value:(typeof v==='string'||typeof v==='number'||typeof v==='boolean')?v:null};
      }
    }
  }catch(_){}
  return {
    target,pre,serialBefore,
    serialAfter:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    elapsedMs:Date.now()-started,settled,
    runState:document.documentElement.dataset.earthlinePropertyRunState||'',
    runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    phaseTrace:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null,
    publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safetyDiag:window.EARTHLINE_SAFETY_LOCK_DIAG_17695||null,
    clearance:window.EARTHLINE_PROPERTY_CLEARANCE_AUDIT_17696||null,
    layers,safeLayerIds,featureCount:feats.length,uniqueLines:lines,
    modelSummary:mSummary
  };
},{target:TARGET,serialBefore,pre,started,settled});

diag.pageErrors=errors;
fs.writeFileSync('iowa-live-diagnostic.json',JSON.stringify(diag,null,2));
console.log('EARTHLINE_IOWA_DIAGNOSTIC '+JSON.stringify(diag));
await browser.close();
