import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const EARTHLINE_SCIENCE_GOLDEN=JSON.parse(readFileSync(new URL('./science-kernel-golden-v1.json',import.meta.url),'utf8'));

const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));

await page.goto('https://earthlinedevelopment.org/?m78_desktop_crosshair='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:25000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE M78.44 — rejected local level-set pivot removed; pre-pivot contour prescriber restored')&&document.documentElement.innerHTML.includes('EARTHLINE M78.43 — generic moveend cannot replace an accepted crosshair target')&&document.documentElement.innerHTML.includes('earthline-launch-16872.js?v=17606'),undefined,{timeout:30000,polling:250});await page.waitForTimeout(1000);

if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(250);
}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('Mexico');
await page.waitForTimeout(800);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Mexico/i}).first();
if(await opt.count())await opt.click({timeout:8000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:30000,polling:100});
await page.waitForTimeout(800);

function fnv(payload){let h=2166136261;for(let i=0;i<payload.length;i++){h^=payload.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0).toString(16).padStart(8,'0')}


const lng=-102.00350,lat=19.99972;
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const tMove=Date.now();
await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m)throw new Error('map unavailable');
  m.jumpTo({center:[lng,lat],zoom:16.59});
  try{m.fire?.('dragend')}catch(_){}
},{lng,lat});
await page.waitForFunction(({lng,lat})=>{
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return !!t&&Math.abs(Number(t.lng)-Number(lng))<=0.00008&&Math.abs(Number(t.lat)-Number(lat))<=0.00008;
},{lng,lat},{timeout:10000,polling:50});
const targetMs=Date.now()-tMove;
const btn=page.locator('#earthlineDeclareProperty16169');
await btn.waitFor({state:'visible',timeout:10000});
const tClick=Date.now();
await btn.click({timeout:10000});
let settled=true;
await page.waitForFunction(prev=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return !!a&&Number(a.serial||0)>prev&&a.settled===true;
},before,{timeout:45000,polling:75}).catch(()=>{settled=false});
const propertyMs=Date.now()-tClick;
const out=await page.evaluate(({lng,lat,settled,targetMs,propertyMs})=>{
  const md=(typeof M!=='undefined'&&M)||window.M||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
  const meta=md?.swaleMeta||{};
  const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  return {
    requested:{lng,lat},settled,targetMs,propertyMs,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
    audit:a,
    stageTimings:a?.stageTimings||null,
    swales:{count:sw.length,meta},
    flowFirst:md?.flowFirstPlacement15836||null,
    vectorCoverage:md?.vectorNoBuildCoverage||null,
    elder,
    elderGauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').trim()
  };
},{lng,lat,settled,targetMs,propertyMs});
console.log('EARTHLINE_MEXICO_TIMING '+JSON.stringify(out));
await page.screenshot({path:'/tmp/mexico-property-timing.png',fullPage:true});
await browser.close();

// Exact Mexico diagnostic uses current pre-pivot science markers only
