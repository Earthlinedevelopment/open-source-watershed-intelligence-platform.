import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
let insertCount=0,branchCount=0;
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch(); let body=await resp.text();
 const needle='  async function loadAquifers(b,runToken,optionalBoundary16565=null){';
 const fn=`  async function loadUSGSPrincipalAquifers16620(b,runToken,optionalBoundary16565=null){
    const base="https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/USA_Aquifers_Feature_Layer_view/FeatureServer/0/query";
    const span=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1]));
    const p=new URLSearchParams({f:"geojson",where:"1=1",geometry:b.join(","),geometryType:"esriGeometryEnvelope",inSR:"4326",spatialRel:"esriSpatialRelIntersects",outFields:"AQ_NAME,ROCK_TYPE,ROCK_NAME",returnGeometry:"true",outSR:"4326",maxAllowableOffset:String(span>5?.01:span>2?.004:.001),geometryPrecision:"5",resultRecordCount:"2000"});
    const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),7000);
    try{
      const r=await fetch(base+"?"+p.toString(),{mode:"cors",cache:"force-cache",signal:ctl.signal}); if(!r.ok)throw new Error("USGS principal aquifer HTTP "+r.status);
      const j=await r.json(); if(j&&j.error)throw new Error(j.error.message||"USGS principal aquifer service error");
      const raw=(j.features||[]).filter(f=>{const n=String(f&&f.properties&&f.properties.AQ_NAME||"").trim();return f&&f.geometry&&n&&!/^other\\s+rocks?$/i.test(n);});
      let geo={type:"FeatureCollection",features:raw.map(f=>({type:"Feature",properties:Object.assign({},f.properties||{},{name:String(f.properties&&f.properties.AQ_NAME||"USGS principal aquifer"),source:"USGS Principal Aquifers of the United States",boundary_class:"national principal-aquifer extent — regional context, not a parcel boundary"}),geometry:f.geometry}))};
      const before=geo.features.length;
      const eastBefore=geo.features.filter(f=>{let hit=false;const walk=v=>{if(hit||!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){if(+v[0]>-96&&+v[0]<-93.45&&+v[1]>28&&+v[1]<34.5)hit=true;return;}v.forEach(walk)};walk(f.geometry&&f.geometry.coordinates);return hit;}).length;
      geo=earthlineContainOptionalContext16565(geo,optionalBoundary16565,"usgs-principal-regional-context",runToken);
      const after=geo.features.length;
      const eastAfter=geo.features.filter(f=>{let hit=false;const walk=v=>{if(hit||!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(+v[0])&&Number.isFinite(+v[1])){if(+v[0]>-96&&+v[0]<-93.45&&+v[1]>28&&+v[1]<34.5)hit=true;return;}v.forEach(walk)};walk(f.geometry&&f.geometry.coordinates);return hit;}).length;
      window.EARTHLINE_TX_PRINCIPAL_TEST_16620={before,after,eastBefore,eastAfter,names:raw.map(f=>String(f.properties&&f.properties.AQ_NAME||"")).slice(0,40),at:new Date().toISOString()};
      if(!after)throw new Error("principal aquifers all withheld by jurisdiction containment");
      if(!guardedSetGeo(runToken,map(),IDS.aquifer,geo,"usgs-principal-regional-context"))return 0;
      regionalAquiferSource="USGS Principal Aquifers of the United States";
      regionalAquiferBoundaryClass="national principal-aquifer extent — regional context, not a parcel boundary";
      window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126={source:regionalAquiferSource,bounds:b,features:after,transport:"fetch",boundaryClass:regionalAquiferBoundaryClass,loadedAt:new Date().toISOString()};
      return after;
    }finally{clearTimeout(timer);}
  }
`+needle;
 insertCount=body.split(needle).length-1; body=body.split(needle).join(fn);
 const old=`    if(bboxIntersectsContiguousUS(b)){
      try{return await loadUSGSKarstAquifers(b,runToken,optionalBoundary16565);}
      catch(usgsError){`;
 const repl=`    if(bboxIntersectsContiguousUS(b)){
      try{return await loadUSGSPrincipalAquifers16620(b,runToken,optionalBoundary16565);}
      catch(usgsError){`;
 branchCount=body.split(old).length-1; body=body.split(old).join(repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_principal='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>!!window.EARTHLINE_TX_PRINCIPAL_TEST_16620||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:30000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(800);
const state=await page.evaluate(()=>({principal:window.EARTHLINE_TX_PRINCIPAL_TEST_16620||null,aquiferAudit:window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,containment:window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()}));
console.log('EARTHLINE_TX_PRINCIPAL_CURRENT '+JSON.stringify({insertCount,branchCount,timedOut,state,errors:errors.slice(0,20)}));
await browser.close();
