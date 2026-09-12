import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL+'?ny-16617-live-validation='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const has16617Marker=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16617 — OFFICIAL US FINAL-SWALE HYDROGRAPHY'));

await page.evaluate(()=>{const i=document.getElementById('searchInput');i.focus();i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));});
await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
const picked=await page.evaluate(()=>{
  const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
  const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')==='new york'||n(x.dataset.query||'')==='new york state'||n(x.textContent||'').includes('new york')))||opts.find(x=>n(x.textContent||'').includes('new york'));
  if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
});
if(!picked)throw new Error('New York regional suggestion missing');

try{
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
    return a?.tigerHydroRequested===true||/failed|error|unavailable/i.test(s);
  },null,{timeout:60000,polling:150});
}catch(_){ }
await page.waitForTimeout(500);

const result=await page.evaluate(()=>{
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const c=map?.getCenter?.();
  return {
    camera:{center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.()??null},
    mappedAudit:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    landValidity:{
      acquisitionResult:window.EARTHLINE_LAND_VALIDITY_16584?.acquisitionResult||null,
      riverCenterlineGeometry:window.EARTHLINE_LAND_VALIDITY_16584?.riverCenterlineGeometry||null
    },
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
  };
});

const audit=result.mappedAudit||{};
const checks={
  has16617Marker,
  tigerRequested:audit.tigerHydroRequested===true,
  tigerVerified:audit.tigerHydroVerified===true,
  tigerFeatures:Number(audit.tigerArealFeatures||0)+Number(audit.tigerLinearFeatures||0),
  before:Number(audit.before||0),
  rejected:Number(audit.rejected||0),
  after:Number(audit.after||0),
  tigerHydroMs:Number(audit.tigerHydroMs||0),
  published:/screening published/i.test(result.status)
};
const out={generatedAt:new Date().toISOString(),url:URL,picked,checks,result,errors:errors.slice(0,50)};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(out,null,2));
console.log('NY_16617_LIVE_VALIDATION '+JSON.stringify(out));
const pass=checks.has16617Marker&&checks.tigerRequested&&checks.tigerVerified&&checks.tigerFeatures>0&&checks.published&&errors.length===0;
await browser.close();
if(!pass)process.exitCode=1;
