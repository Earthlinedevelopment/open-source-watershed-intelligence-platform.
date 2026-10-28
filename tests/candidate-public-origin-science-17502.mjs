import { chromium } from 'playwright';
import { existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT=process.cwd();
const ORIGIN='https://earthlinedevelopment.org';
const MIME={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8',
  '.py':'text/plain; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'
};
function safeLocal(pathname){
  let p=decodeURIComponent(pathname||'/').replace(/^\/+/, '');
  if(!p)p='index.html';
  const file=resolve(ROOT,p);
  if(!file.startsWith(ROOT))return null;
  try{if(existsSync(file)&&statSync(file).isFile())return file}catch(_){}
  return null;
}
const browser=await chromium.launch({headless:true,channel:'chrome'}).catch(()=>chromium.launch({headless:true}));
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1,serviceWorkers:'block'});
await context.route(ORIGIN+'/**',async route=>{
  const u=new URL(route.request().url());
  const f=safeLocal(u.pathname);
  if(f){
    await route.fulfill({status:200,path:f,contentType:MIME[extname(f).toLowerCase()]||'application/octet-stream',
      headers:{'cache-control':'no-store','access-control-allow-origin':'*'}});
    return;
  }
  await route.continue();
});
const page=await context.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(ORIGIN+'/?candidate_public_origin='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE M78.50')||document.documentElement.innerHTML.includes('complete accepted Build 16584 Property swale prescriber restored'),null,{timeout:30000,polling:100});

if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click({timeout:10000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:90000,polling:120});
await page.waitForTimeout(800);

function fnv(payload){let h=2166136261;for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}

async function runProperty(c){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(({lng,lat})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[lng,lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },c);
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201;
    return !!t&&Math.abs(Number(t.lng)-lng)<=0.00008&&Math.abs(Number(t.lat)-lat)<=0.00008;
  },c,{timeout:15000,polling:80});
  const pre=await page.evaluate(()=>({
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    disabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
    text:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim()
  }));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return !!a&&Number(a.serial||0)>prev&&a.settled===true;
  },before,{timeout:120000,polling:100}).catch(()=>{});
  const elapsedMs=Date.now()-t0;
  await page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    return !!e&&(e.state==='committed'||e.state==='failed');
  },null,{timeout:60000,polling:120}).catch(()=>{});
  await page.waitForTimeout(800);
  const snap=await page.evaluate(({c,elapsedMs})=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
    const wf=Array.isArray(md?.authoritativeWaterPaths15824?.features)?md.authoritativeWaterPaths15824.features:[];
    const boundary=Array.isArray(md?.analysisBoundaryLngLat)?md.analysisBoundaryLngLat:[];
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const elderSrc=map?.getSource?.('earthline-elder-trees-17097');
    const elderData=elderSrc&&(elderSrc._data||elderSrc._options?.data);
    const flow=md?.flowFirstPlacement15836||{};
    const unserved=Array.isArray(flow?.unserved)?flow.unserved:[];
    const reasons={};for(const x of unserved){const k=String(x?.reason||'unknown');reasons[k]=(reasons[k]||0)+1}
    const swPayload=JSON.stringify(sw.map(f=>f?.geometry?.coordinates||null));
    const wp=JSON.stringify(wf.map(f=>f?.geometry?.coordinates||null));
    const slopes=[];
    for(const f of sw){
      const p=f?.properties||{};
      for(const k of ['slopePct','slope_pct','maxSlopePct','max_slope_pct','slope_percent']){
        const v=Number(p[k]);if(Number.isFinite(v))slopes.push(v);
      }
    }
    return {
      requested:c,elapsedMs,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      lock:md?.propertyResultLock15815||null,
      swales:{count:sw.length,fingerprint:(()=>{let h=2166136261;for(let i=0;i<swPayload.length;i++){h^=swPayload.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')})(),maxRecordedSlope:slopes.length?Math.max(...slopes):null,meta:md?.swaleMeta||null},
      water:{count:wf.length,fingerprint:(()=>{let h=2166136261;for(let i=0;i<wp.length;i++){h^=wp.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')})(),publication:md?.authoritativeWaterPublication15824||null},
      flow:{eligiblePaths:Number(flow?.eligiblePaths||0),pathsServed:Number(flow?.pathsServed||0),noContour:Number(reasons['no-contour-trace']||0),reasons},
      elder:{last:elder,sourceFeatures:Array.isArray(elderData?.features)?elderData.features.length:null,layer:!!map?.getLayer?.('earthline-elder-tree-points-17097'),visibility:map?.getLayer?.('earthline-elder-tree-points-17097')?(map.getLayoutProperty?.('earthline-elder-tree-points-17097','visibility')??null):null},
      aquifer:{status:String(md?.usgsAquiferStatus||''),polys:Number(md?.usgsAquifers?.length||0),owner:md?.propertyAquiferOwner16393||null},
      recharge:{count:Number(md?.rechZones?.length||0)},
      noBuild:{provenance:md?.noBuildProvenance15843||null,vectorCoverage:md?.vectorNoBuildCoverage||null},
      boundaryCount:boundary.length
    };
  },{c,elapsedMs});
  return {pre,snap};
}

const controls=[
  {id:'AZ-FIRST',lng:-111.93067,lat:34.21568,expected:{swales:91,water:239,elderMin:2,pathsServedMin:137,noContourMax:9}},
  {id:'AZ-SECOND',lng:-111.93347,lat:34.21629,expected:{swales:84,water:240,elderMin:5,pathsServedMin:80,noContourMax:9}}
];
const rows=[];
for(const c of controls){
  const r=await runProperty(c);
  const near=(a,b,t=.00008)=>Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<=t;
  const s=r.snap;
  const identity=near(r.pre.target?.lng,c.lng)&&near(r.pre.target?.lat,c.lat)&&near(s.declaration?.center?.lng,c.lng)&&near(s.declaration?.center?.lat,c.lat);
  const science=s.run?.settled===true&&s.run?.result===true&&s.publication?.published===true&&s.lock?.safetyVerified===true&&s.swales.count>0&&s.water.count>0;
  const slope=s.swales.maxRecordedSlope==null||s.swales.maxRecordedSlope<=4.000001;
  const spacing=Number(s.swales.meta?.measuredMedianSpacingM);
  const spacingOk=!Number.isFinite(spacing)||(spacing>=4.572&&spacing<=7.62);
  const elders=String(s.elder.last?.state||'')==='committed'&&Number(s.elder.last?.featureCount||0)>=c.expected.elderMin&&s.elder.layer===true&&s.elder.visibility!=='none';
  const flow=Number(s.flow.pathsServed)>=c.expected.pathsServedMin&&Number(s.flow.noContour)<=c.expected.noContourMax;
  const expectedCounts=s.swales.count===c.expected.swales&&s.water.count===c.expected.water;
  rows.push({id:c.id,identity,science,slope,spacingOk,elders,flow,expectedCounts,pass:identity&&science&&slope&&spacingOk&&elders&&flow&&expectedCounts,details:s});
}
console.log('EARTHLINE_PUBLIC_ORIGIN_SCIENCE '+JSON.stringify({pass:rows.every(r=>r.pass)&&errors.length===0,rows,errors}));
await page.screenshot({path:'/tmp/earthline-public-origin-science.png',fullPage:true});
await browser.close();
if(rows.some(r=>!r.pass)||errors.length)process.exitCode=1;
