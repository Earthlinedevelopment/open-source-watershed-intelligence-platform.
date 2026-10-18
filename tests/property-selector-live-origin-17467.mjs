import { chromium } from 'playwright';
import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const browser=await chromium.launch({headless:true});
const sites=[{name:'A',lat:44.06957,lng:-72.27369},{name:'B',lat:44.0858,lng:-72.2802}];
const rows=[];
for(const site of sites){
  const context=await browser.newContext();
  await context.route('**/*',async r=>{const u=new URL(r.request().url());if(r.request().resourceType()==='document'&&/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&u.pathname==='/')return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});return r.continue();});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?selectorLive17467='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:30000});
  const prep=await page.evaluate(async s=>{
    const siteObj=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    const applied=await window.applyLocation(siteObj,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'selector-live-17467',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    return {ok:!!set};
  },site);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  let call=false,err=null;
  try{call=await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169())}catch(e){err=String(e)}
  await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true},before,{timeout:120000,polling:100}).catch(()=>{});
  await page.waitForTimeout(600);
  const snap=await page.evaluate(()=>{
    const safe=M?.authoritativeSafeSwales15815?.features||[],raw=Array.isArray(M?.swales)?M.swales:[],cov=M?.coverageDiagnostic15803||null;
    const zones=(cov?.zones||[]).map(z=>({id:z.id,safeCells:z.safeCells,contourCells:z.contourCells,candidates:z.candidates,accepted:z.accepted,rejectFinalSpacing:z.rejections?.finalSpacing||0}));
    return {rawCount:raw.length,safeCount:safe.length,selector:window.EARTHLINE_PROPERTY_SPATIAL_SELECTION_17448||null,spacing:M?.spacingStats||null,
      coverage:{safeZones:zones.filter(z=>z.safeCells>0).length,contourZones:zones.filter(z=>z.contourCells>0).length,candidateZones:zones.filter(z=>z.candidates>0).length,acceptedZones:zones.filter(z=>z.accepted>0).length,maxAccepted:zones.length?Math.max(...zones.map(z=>Number(z.accepted||0))):0,blankContourZones:zones.filter(z=>z.contourCells>0&&z.candidates===0).map(z=>z.id),candidateBlank:zones.filter(z=>z.candidates>0&&z.accepted===0).map(z=>z.id),zones},
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,safety:M?.safetyAudit15806||null};
  });
  rows.push({site,prep,call,err,elapsedMs:Date.now()-t0,...snap,errors});
  console.log('EARTHLINE_SELECTOR_LIVE_17467 '+JSON.stringify(rows.at(-1)));
  await context.close();
}
await browser.close();
const pass=rows.every(r=>r.call===true&&r.run?.result===true&&r.safety?.verified===true&&r.safeCount>0);
console.log('EARTHLINE_SELECTOR_LIVE_17467_SUMMARY '+JSON.stringify({pass,rows:rows.map(r=>({site:r.site,safeCount:r.safeCount,spacing:r.spacing,selector:r.selector,coverage:r.coverage,elapsedMs:r.elapsedMs}))}));
if(!pass)process.exitCode=1;
