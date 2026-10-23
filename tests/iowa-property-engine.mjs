import { chromium } from 'playwright';
import fs from 'node:fs';

const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:8787/?m75-iowa-property='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
  return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:200});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',placeType:'state',lat,lng,query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(1000);

async function snapshot(label){
  return await page.evaluate(label=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const style=mp?.getStyle?.()||{};
    const layers=(style.layers||[]).filter(l=>/tree|forest|canopy|vegetation|swale|safe/i.test(String(l.id||''))).map(l=>({
      id:l.id,type:l.type,source:l.source,
      visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})()
    }));
    const rendered={};
    try{
      const cv=mp?.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];
      if(box){
        for(const l of layers.filter(x=>x.visibility!=='none')){
          try{rendered[l.id]=(mp.queryRenderedFeatures(box,{layers:[l.id]})||[]).length}catch(_){}
        }
      }
    }catch(_){}
    const fc=(typeof M!=='undefined'&&(M.authoritativeSafeSwales15815||M.authoritativeSafeSwales15806))||null;
    const feats=Array.isArray(fc?.features)?fc.features:[];
    const sigs=new Map(),dups=[];
    for(const f of feats){
      const g=f?.geometry;
      const groups=g?.type==='LineString'?[g.coordinates]:(g?.type==='MultiLineString'?g.coordinates:[]);
      for(const coords of groups||[]){
        const norm=(coords||[]).map(p=>[Math.round(Number(p[0]||0)*100000)/100000,Math.round(Number(p[1]||0)*100000)/100000]);
        const a=JSON.stringify(norm),b=JSON.stringify(norm.slice().reverse()),sig=a<b?a:b;
        const n=(sigs.get(sig)||0)+1;sigs.set(sig,n);
        if(n===2)dups.push(sig);
      }
    }
    return {
      label,layers,rendered,
      runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      safeAudit:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      swaleCount:feats.length,duplicateGeometryCount:dups.length,
      flowFirstAudit:(typeof M!=='undefined'&&M.flowFirstPlacement15836)?JSON.parse(JSON.stringify(M.flowFirstPlacement15836)):null,
      swaleOrigins:(()=>{try{
        if(typeof M==='undefined'||!Array.isArray(M.swales))return null;
        const rows=M.swales.map((sw,i)=>({
          i,
          mode:String(sw?.placementMode15836||'contour'),
          primary:!!sw?.primaryFlowFirst15836,
          bandKey:sw?.bandKey??null,
          lenM:Number(sw?.lenM||0),
          score:Number(sw?.score||0),
          flowScore:Number(sw?.prescriptionFlowScore15833||0),
          capCells:Number(sw?.capCells||0)
        }));
        const byMode=rows.reduce((a,r)=>(a[r.mode]=(a[r.mode]||0)+1,a),{});
        const lengths=rows.map(r=>r.lenM).filter(Number.isFinite).sort((a,b)=>a-b);
        const pct=p=>lengths.length?lengths[Math.min(lengths.length-1,Math.floor((lengths.length-1)*p))]:null;
        return {byMode,rows,medianLenM:pct(.5),p25LenM:pct(.25),p75LenM:pct(.75),minLenM:lengths[0]??null,maxLenM:lengths[lengths.length-1]??null};
      }catch(e){return {error:String(e)}}})(),
      swaleDiagnostics:(typeof M!=='undefined'&&M.swaleDiagnostics)?JSON.parse(JSON.stringify(M.swaleDiagnostics)):null,
      canopy:(typeof M!=='undefined'&&M.terrainHandoff15791?.canopy)?JSON.parse(JSON.stringify(M.terrainHandoff15791.canopy)):null
    };
  },label);
}

const before=await snapshot('before-property');
const p0=Date.now();
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());
let settled=false;
try{
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return a?.settled===true&&a?.renderVerified===true;
  },null,{timeout:90000,polling:200});
  settled=true;
}catch(_){}
await page.waitForTimeout(1200);
const after=await snapshot('after-property');
await page.screenshot({path:'iowa-property-engine.png',fullPage:false});

const out={settled,propertyMs:Date.now()-p0,before,after,errors};
fs.writeFileSync('iowa-property-engine.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_IOWA_PROPERTY_ENGINE '+JSON.stringify(out));
await browser.close();

// M75_FLOW_FIRST_ORIGIN_AUDIT
