import { chromium } from 'playwright';
import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});

async function context17481(){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(r.request().resourceType()==='document'&&/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&u.pathname==='/')
      return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\\.)?earthlinedevelopment\\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
      return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
    return r.continue();
  });
  return context;
}

async function waitRegional(page){
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}

async function searchRegional(page,query){
  const input=page.locator('#searchInput'); await input.click(); await input.fill(''); await input.fill(query); await page.waitForTimeout(800);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(!await opts.count())throw new Error('no suggestion '+query);
  await opts.first().click(); await page.waitForTimeout(250);
  const rb=page.locator('#runBtn'); if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await waitRegional(page);
}

async function exactProperty(page,query,label){
  await searchRegional(page,query);
  const corridor=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await corridor.waitFor({state:'visible',timeout:30000}); await corridor.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000,polling:100});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000,polling:100});
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const clickAt=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before,{timeout:15000,polling:50});
  const startedAt=await page.evaluate(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.startedAt||null);
  const startLatencyMs=startedAt?Date.parse(startedAt)-clickAt:999999;
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before,{timeout:120000,polling:100});
  let elderMs=Date.now()-clickAt,elder=null;
  try{
    await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:15000,polling:100});
    elderMs=Date.now()-clickAt;
    elder=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_ELDER_TREE_LAST_17097||null)));
  }catch(_){}
  const audit=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null)));
  return {label,query,startLatencyMs,elderMs,elder,audit};
}

const clickContext=await context17481();
const page=await clickContext.newPage();
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?integrated17481='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const first=await exactProperty(page,'Essex Junction, Vermont','first');
const second=await exactProperty(page,'Rutland, Vermont','second');
await clickContext.close();

const scienceContext=await context17481();
const sp=await scienceContext.newPage();
const scienceErrors=[]; sp.on('pageerror',e=>scienceErrors.push(String(e)));
await sp.goto('https://earthlinedevelopment.org/?science17481='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await sp.waitForSelector('#searchInput',{timeout:30000});
await searchRegional(sp,'Vermont');
const site={lat:44.06957,lng:-72.27369};
await sp.evaluate(async s=>{
  const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
  if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
  await new Promise(r=>setTimeout(r,400));
  window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'integrated-17481',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
},site);
const before=await sp.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await sp.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
await sp.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},before,{timeout:120000,polling:100});
await sp.waitForTimeout(500);
const science=await sp.evaluate(()=>{
  const safe=M?.authoritativeSafeSwales15815?.features||[],d=M?.coverageDiagnostic15803||null,z=(d?.zones||[]).map(x=>({id:x.id,contourCells:x.contourCells,candidates:x.candidates,accepted:x.accepted}));
  return {
    safeCount:safe.length,spacing:M?.spacingStats||null,
    coverage:{contourZones:z.filter(x=>x.contourCells>0).length,candidateZones:z.filter(x=>x.candidates>0).length,acceptedZones:z.filter(x=>x.accepted>0).length,maxAccepted:z.length?Math.max(...z.map(x=>+x.accepted||0)):0,blankContour:z.filter(x=>x.contourCells>0&&x.candidates===0).map(x=>x.id),candidateBlank:z.filter(x=>x.candidates>0&&x.accepted===0).map(x=>x.id)},
    safety:M?.safetyAudit15806||null,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
  };
});
await scienceContext.close();
await browser.close();

const unsafe=Number(science.safety?.unsafeCount??science.safety?.unsafe??0);
const clickPass=[first,second].every(x=>x.audit?.result===true&&x.startLatencyMs>=0&&x.startLatencyMs<=3500&&x.elder?.state==='committed'&&x.elderMs<=10000);
const sciencePass=science.run?.result===true&&science.safeCount>=100&&science.coverage.acceptedZones>=14&&science.safety?.verified===true&&unsafe===0;
const result={pass:clickPass&&sciencePass&&!errors.length&&!scienceErrors.length,clickPass,sciencePass,first,second,science,errors,scienceErrors};
console.log('EARTHLINE_INTEGRATED_17481 '+JSON.stringify(result));
if(!result.pass)process.exitCode=1;
