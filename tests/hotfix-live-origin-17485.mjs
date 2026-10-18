import { chromium } from 'playwright';
import fs from 'node:fs';

const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const browser=await chromium.launch({headless:true});

async function ctx(){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
      return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
      return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
    return r.continue();
  });
  return context;
}

async function regional(page,q){
  const input=page.locator('#searchInput');await input.click();await input.fill('');await input.fill(q);await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(!await opts.count())throw new Error('no suggestion '+q);
  await opts.first().click();await page.waitForTimeout(250);
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}

async function propViaUi(page,q,label){
  await regional(page,q);
  const corridor=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await corridor.waitFor({state:'visible',timeout:30000});await corridor.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const button=page.locator('#earthlineDeclareProperty16169');
  const box=await button.boundingBox();
  if(!box)throw new Error('Property button has no physical box');
  const clickAt=Date.now();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
  await page.mouse.down({button:'left'});
  await page.mouse.up({button:'left'});
  let immediateAccepted=false;
  try{
    await page.waitForFunction(s=>String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before,{timeout:900,polling:25});
    immediateAccepted=true;
  }catch(_){}
  const immediateMs=Date.now()-clickAt;
  await page.waitForFunction(s=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>s,before,{timeout:15000,polling:50});
  const startedAt=await page.evaluate(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.startedAt||null);
  const auditStartMs=startedAt?Date.parse(startedAt)-clickAt:null;
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>s&&a?.settled===true},before,{timeout:120000,polling:100});
  let elderMs=null,elder=null;
  try{
    await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed',null,{timeout:12000,polling:100});
    elderMs=Date.now()-clickAt;
    elder=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_ELDER_TREE_LAST_17097||null)));
  }catch(_){elderMs=Date.now()-clickAt}
  const audit=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null)));
  return {label,q,immediateAccepted,immediateMs,auditStartMs,elderMs,elder,audit};
}

async function scienceSite(site){
  const context=await ctx();const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?hotfixScience17485='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});await regional(page,'Vermont');
  await page.evaluate(async s=>{
    const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('apply rejected');
    await new Promise(r=>setTimeout(r,400));
    window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'hotfix-science-17485',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
  },site);
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
  await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:100});
  await page.waitForTimeout(400);
  const out=await page.evaluate(()=>{
    const d=M?.coverageDiagnostic15803||null,z=(d?.zones||[]).map(x=>({id:x.id,safe:x.safeCells,contour:x.contourCells,candidates:x.candidates,accepted:x.accepted}));
    return {
      safeCount:M?.authoritativeSafeSwales15815?.features?.length||0,
      spacing:M?.spacingStats||null,
      coverage:{contourZones:z.filter(x=>x.contour>0).length,candidateZones:z.filter(x=>x.candidates>0).length,acceptedZones:z.filter(x=>x.accepted>0).length,blankContour:z.filter(x=>x.contour>0&&x.candidates===0).map(x=>x.id),candidateBlank:z.filter(x=>x.candidates>0&&x.accepted===0).map(x=>x.id),maxAccepted:z.length?Math.max(...z.map(x=>Number(x.accepted||0))):0},
      safety:M?.safetyAudit15806||null,
      flag:M?.earthlinePropertyChannelBuffer17485===true,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
    };
  });
  await context.close();
  return {...site,...out,errors};
}

const clickContext=await ctx();const page=await clickContext.newPage();const clickErrors=[];page.on('pageerror',e=>clickErrors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?hotfix17485='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
const first=await propViaUi(page,'Essex Junction, Vermont','first');
const second=await propViaUi(page,'Rutland, Vermont','second');
await clickContext.close();

const A=await scienceSite({name:'A',lat:44.06957,lng:-72.27369});
const B=await scienceSite({name:'B',lat:44.0858,lng:-72.2802});
await browser.close();

const unsafe=x=>Number(x.safety?.unsafeCount??x.safety?.unsafe??0);
const clickPass=[first,second].every(x=>x.audit?.result===true&&x.immediateAccepted&&x.immediateMs<=1000&&x.elder?.state==='committed'&&x.elderMs<=10000)&&!clickErrors.length;
const sciencePass=[A,B].every(x=>x.flag&&x.run?.result===true&&x.safeCount>0&&x.coverage.contourZones===16&&x.coverage.acceptedZones>=14&&x.coverage.blankContour.length<=1&&x.spacing?.medianM>=4.572&&x.spacing?.medianM<=7.62&&x.safety?.verified===true&&unsafe(x)===0&&!x.errors.length);
const result={pass:clickPass&&sciencePass,clickPass,sciencePass,first,second,A,B,clickErrors};
console.log('EARTHLINE_HOTFIX_17485 '+JSON.stringify(result));
if(!result.pass)process.exitCode=1;
