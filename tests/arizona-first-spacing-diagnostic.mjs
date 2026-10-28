import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(BASE+'?az_first_spacing_diag='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click()); await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona'); await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const target={lng:-111.93067,lat:34.21568};
await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}},target);
await page.waitForFunction(t=>{const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008},target,{timeout:15000,polling:100});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
await page.waitForTimeout(800);
const d=await page.evaluate(()=>{
 const md=(typeof M!=='undefined'&&M)||window.M||{};
 const cov=md.coverageDiagnostic15803||null;
 const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
 const slim=(x)=>x&&typeof x==='object'?JSON.parse(JSON.stringify(x)):x;
 return {
   meta:slim(md.swaleMeta||null),
   stage:slim(md.swaleDiagnostics?.stage||null),
   levels:slim(cov?.levels||null),
   termination:slim(cov?.termination||null),
   totals:slim(cov?.totals||null),
   zones:slim(cov?.zones||null),
   spatialCandidates:slim(cov?.spatial?.candidates||null),
   spatialSeeds:slim(cov?.spatial?.seeds||null),
   swales:sw.map(f=>({geometry:f.geometry,properties:f.properties})),
   flow:slim(md.flowFirstPlacement15836||null)
 };
});
console.log('EARTHLINE_AZ_FIRST_SPACING_DIAG '+JSON.stringify(d));
await browser.close();
