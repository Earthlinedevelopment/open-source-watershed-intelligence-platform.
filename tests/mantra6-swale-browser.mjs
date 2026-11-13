import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
const HTML=readFileSync('index.html','utf8');
const BASE_URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const errors=[],report={at:new Date().toISOString(),target:{lng:-73.012909,lat:44.513845},errors,pass:false};
mkdirSync('artifacts/mantra6-swale',{recursive:true});
const context=await browser.newContext({viewport:{width:1440,height:920},serviceWorkers:'block'});
await context.route('https://earthlinedevelopment.org/**',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&new URL(req.url()).pathname==='/')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:HTML});
  return route.continue();
});
const page=await context.newPage();
page.on('pageerror',e=>errors.push(String(e)));
try{
  await page.goto(BASE_URL+'?mantra6=swale-browser',{waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#searchInput').waitFor({timeout:30000});
  await page.evaluate(()=>{const input=document.getElementById('searchInput'),run=document.getElementById('runBtn');input.value='Vermont';input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));run.click();});
  await page.waitForFunction(()=>Boolean(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970),null,{timeout:55000});
  report.prepared=await page.evaluate(async t=>{
    const m=typeof M!=='undefined'?M:window.M;
    const site=window.earthlineSelectedSiteFromCenter?.(m?.loc,t.lng,t.lat,20);
    if(!site)return {ok:false,reason:'selected site unavailable'};
    const applied=await window.applyLocation?.(site,null,m.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation failed'};
    await new Promise(r=>setTimeout(r,750));
    const set=window.earthlineSetPropertyTarget16201?.({lng:t.lng,lat:t.lat,source:'mantra6-swale-regression'},{openPanel:false});
    return {ok:!!set};
  },report.target);
  if(!report.prepared.ok)throw Error(JSON.stringify(report.prepared));
  report.propertyCall=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.());
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:120000});
  await page.waitForTimeout(1400);
  report.afterProperty=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const a=window.EARTHLINE_PROPERTY_TEXTURE_AUDIT_16169||{};
    return {tier:document.documentElement.dataset.earthlineAnalysisTier,settled:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled,sourceReady:a.sourceReady,centerlines:a.centerlines,layers:a.layers,publishedSwales:(typeof M!=='undefined'?M:null)?.authoritativeSafeSwales15815?.features?.length||0,runAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,lastError:window.EARTHLINE_PROPERTY_LAST_ERROR_16173||null,textureAudit:a,sourceComplete:(typeof M!=='undefined'?M:null)?.vectorNoBuildCoverage?.overpass?.sourceComplete??null,mapReady:!!mp};
  });
  if(report.afterProperty.centerlines<=0||!report.afterProperty.sourceReady)throw Error('No published Property swale texture to measure');
  report.camera=await page.evaluate(async()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const ids=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    const writes=[],samples=[];
    const prevLayout=mp.setLayoutProperty.bind(mp),prevPaint=mp.setPaintProperty.bind(mp);
    mp.setLayoutProperty=(id,prop,value,...args)=>{if(ids.includes(id)&&prop==='visibility')writes.push({type:'layout',id,value});return prevLayout(id,prop,value,...args)};
    mp.setPaintProperty=(id,prop,value,...args)=>{if(ids.includes(id)&&prop==='line-width')writes.push({type:'paint',id,value});return prevPaint(id,prop,value,...args)};
    const snapshot=()=>Object.fromEntries(ids.map(id=>[id,mp.getLayer(id)?mp.getLayoutProperty(id,'visibility')||'visible':'missing']));
    try {
      const start=mp.getCenter(),zoom=mp.getZoom();
      samples.push(snapshot());
      for(let i=0;i<5;i++){
        mp.jumpTo({center:[start.lng+(i%2===0?.00009:-.00009),start.lat],zoom:(i%2===0?zoom:.95+zoom)});
        await new Promise(r=>setTimeout(r,600));
        samples.push(snapshot());
      }
      await window.earthlineSyncPropertyTexture16169?.('idle');
      await window.earthlineSyncPropertyTexture16169?.('idle');
      samples.push(snapshot());
      return {writes,samples,zoom:mp.getZoom()};
    }finally{mp.setLayoutProperty=prevLayout;mp.setPaintProperty=prevPaint;}
  });
  const active=['earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
  const disappear=report.camera.samples.some(s=>active.every(id=>s[id]!=='visible'));
  const hasRedundant=report.camera.writes.some(w=>w.type==='layout'&&w.value==='none');
  report.pass=!disappear&&!hasRedundant&&report.afterProperty.centerlines>0&&errors.length===0;
  await page.screenshot({path:'artifacts/mantra6-swale/after-camera.png',timeout:12000});
}catch(e){report.error=String(e)}
finally{writeFileSync('artifacts/mantra6-swale/result.json',JSON.stringify(report,null,2));console.log('MANTRA6_SWALE_BROWSER '+JSON.stringify({pass:report.pass,error:report.error,afterProperty:report.afterProperty,camera:report.camera,errors:errors.slice(0,8)}));await browser.close()}
if(!report.pass)process.exitCode=1;
