import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16837-ar-fine-probe';
mkdirSync(OUT,{recursive:true});
const target={lat:34.77042,lng:-92.12943};
const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document') return route.continue();
  const resp=await route.fetch(); let body=await resp.text();
  if(body.split(capture).length-1!==1) throw new Error('capture owner mismatch');
  body=body.replace(capture,'window.__EARTHLINE_M47_16837={hy,candidates,chosen};'+capture);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
});
const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto(BASE+'?m47_16837='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Arkansas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16837;},null,{timeout:65000,polling:100});
await page.waitForTimeout(500);
const probe=await page.evaluate(target=>{
  const {hy,candidates,chosen}=window.__EARTHLINE_M47_16837;
  const slim=o=>{const r={}; for(const k of Object.keys(o||{})){const v=o[k]; if(typeof v==='number'||typeof v==='string'||typeof v==='boolean'||v==null)r[k]=v; else if(Array.isArray(v)&&v.length<=8)r[k]=v;} return r;};
  return {
    target,
    hyKeys:Object.keys(hy||{}),
    hyScalar:slim(hy),
    candidateKeys:Object.keys(candidates?.[0]||{}),
    chosenKeys:Object.keys(chosen?.[0]||{}),
    candidateSample:(candidates||[]).slice(0,8).map(slim),
    chosenSample:(chosen||[]).slice(0,8).map(slim),
    counts:{candidates:candidates?.length||0,chosen:chosen?.length||0},
    balance:window.EARTHLINE_OPPORTUNITY_BALANCE_16836||null,
    mapCenter:window.map?.getCenter?window.map.getCenter():null,
    mapBounds:window.map?.getBounds?{sw:window.map.getBounds().getSouthWest(),ne:window.map.getBounds().getNorthEast()}:null
  };
},target);
console.log('EARTHLINE_M47_16837 '+JSON.stringify(probe));
writeFileSync(`${OUT}/probe.json`,JSON.stringify({pageErrors,probe},null,2));
await page.screenshot({path:`${OUT}/arkansas.png`,fullPage:false});
await browser.close();
