import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
await page.goto('https://earthlinedevelopment.org/?m81-cozero='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Colorado');
await page.waitForTimeout(650);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Colorado/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const s=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return !!e||s.length>0},{timeout:45000,polling:100});
const regional=await page.evaluate(()=>({
  preflight:window.EARTHLINE_FINAL_PROPERTY_PREFLIGHT_17803||null,
  top:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).slice(0,5).map(f=>({p:f.properties,c:f.geometry?.coordinates?.[Math.floor((f.geometry?.coordinates?.length-1)/2)]}))
}));
const top=regional.top[0];
if(!top?.c)throw new Error('no top');
const target={lng:Number(top.c[0]),lat:Number(top.c[1])};
await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59})},target);
await page.waitForTimeout(300);
const serial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},serial,{timeout:60000,polling:100});
const out=await page.evaluate(({regional,target})=>{
 const Mx=(typeof M!=='undefined'?M:null)||{};
 return {
   regional,target,
   audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
   safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
   zeroReason:Mx.prescriptionZeroReason15870||null,
   swaleDiagnostics:Mx.swaleDiagnostics15870||Mx.swaleDiagnostics||null,
   levelGenerator:Mx.swaleDiagnostics15870?.levelGenerator||null,
   prescriptionMaskAudit:Mx.prescriptionMaskAudit15876||null,
   noBuildCount:Array.isArray(Mx.noBuildMask15857)?Mx.noBuildMask15857.filter(Boolean).length:null
 };
},{regional,target});
console.log('M81_CO_CURRENT_ZERO '+JSON.stringify(out));
await browser.close();
