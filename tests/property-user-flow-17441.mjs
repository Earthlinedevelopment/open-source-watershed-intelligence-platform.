import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?propertyUserFlow17441='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Vermont');
await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click();
const rb=page.locator('#runBtn');
if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
await page.waitForTimeout(500);

const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
await label.waitFor({state:'visible',timeout:20000});
await label.click({force:true});

await page.waitForFunction(()=>{
  const d=document.getElementById('earthlineCorridorDetail16149');
  return !!d&&!!d.querySelector('[data-action="zoom"]');
},null,{timeout:15000,polling:100});

const zoomBtn=page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first();
await zoomBtn.click();

await page.waitForFunction(()=>{
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  const b=document.getElementById('earthlineDeclareProperty16169');
  return !!t&&Number.isFinite(Number(t.lng))&&Number.isFinite(Number(t.lat))&&!!b&&!b.disabled;
},null,{timeout:20000,polling:100});
await page.waitForTimeout(250);

const before=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  return {
    target:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TARGET_16201||null)),
    serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    center:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null}catch(_){return null}})(),
    state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    governedType:typeof window.earthlineDeclarePropertyAtCrosshair16173,
    legacyType:typeof window.earthlineDeclarePropertyAtCrosshair16169,
    onclickType:typeof b?.onclick,
    clickOwner:b?.dataset?.earthlinePropertyClickOwner16546||null,
    disabled:!!b?.disabled
  };
});

const property=page.locator('#earthlineDeclareProperty16169');
const clickAt=Date.now();
await property.click();
let started=false;
try{
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre.serial||String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running';
  },before,{timeout:3000,polling:50});
  started=true;
}catch(_){}

const afterStart=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  return {
    target:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_TARGET_16201||null)),
    audit:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null)),
    declaration:JSON.parse(JSON.stringify(window.EARTHLINE_PROPERTY_DECLARATION_16169||null)),
    center:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null}catch(_){return null}})(),
    state:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    governedType:typeof window.earthlineDeclarePropertyAtCrosshair16173,
    legacyType:typeof window.earthlineDeclarePropertyAtCrosshair16169,
    onclickType:typeof b?.onclick,
    clickOwner:b?.dataset?.earthlinePropertyClickOwner16546||null,
    disabled:!!b?.disabled
  };
});

const sameTarget=!!before.target&&!!afterStart.audit?.center&&
  Math.abs(Number(before.target.lng)-Number(afterStart.audit.center.lng))<0.0008&&
  Math.abs(Number(before.target.lat)-Number(afterStart.audit.center.lat))<0.0008;

let elderCommitted=false,elderState=null,elderElapsedMs=null;
try{
  await page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return e?.state==='committed'||e?.state==='failed';
  },null,{timeout:15000,polling:100});
  const elder=await page.evaluate(()=>JSON.parse(JSON.stringify(window.EARTHLINE_ELDER_TREE_LAST_17097||null)));
  elderState=elder?.state||null;
  elderCommitted=elderState==='committed';
  elderElapsedMs=Date.now()-clickAt;
}catch(_){elderElapsedMs=Date.now()-clickAt;}

const pass=started&&sameTarget&&elderCommitted&&elderElapsedMs<=15000;
console.log('EARTHLINE_PROPERTY_USER_FLOW_17441 '+JSON.stringify({
  browser:BROWSER,pass,started,sameTarget,startLatencyMs:afterStart.audit?.startedAt?Date.parse(afterStart.audit.startedAt)-clickAt:Date.now()-clickAt,
  elderCommitted,elderState,elderElapsedMs,before,afterStart,errors
}));
await browser.close();
if(!pass)process.exitCode=1;
