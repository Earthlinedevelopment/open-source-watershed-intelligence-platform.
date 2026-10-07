import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/?handoffdiag='+Date.now();
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
 const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
 i.value='Colorado';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
});
await page.waitForFunction(()=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
 return String(d?.tier||d?.mode||'').toLowerCase()==='regional' && Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0)>0;
},{timeout:60000,polling:100});
await page.waitForTimeout(800);
const before=await page.evaluate(()=>({
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
 active:String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null
}));
const found=await page.evaluate(()=>{
 const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
 const f=sw.find(x=>String(x.properties?.display_code||x.properties?.code||'').toUpperCase()==='A10')||sw[9]||sw[0];
 if(!f)return {found:false,noFeature:true};
 const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
 const t={lng:Number(c[0]),lat:Number(c[1]),source:'handoff-diag',code:String(f.properties?.display_code||f.properties?.code||'A10'),score:Number(f.properties?.score||0),query:'Colorado',parentRunToken:String(d.runToken||''),at:new Date().toISOString()};
 window.EARTHLINE_PROPERTY_TARGET_16201=t;window.earthlineSetPropertyTarget16201?.(t);
 return {found:true,syntheticTarget:t};
});
await page.waitForTimeout(700);
const selected=await page.evaluate(()=>({
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
 active:String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null
}));
const result=await page.evaluate(async()=>{
 try{
   const fn=window.earthlineDeclarePropertyAtCrosshair16173;
   const out=typeof fn==='function'?await Promise.resolve(fn()):'NO_FN';
   return {out};
 }catch(e){return {error:String(e?.stack||e)}}
});
await page.waitForTimeout(500);
const after=await page.evaluate(()=>({
 audit:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),
 displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
 live:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
 active:String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null
}));
console.log('HANDOFF_DIAG '+JSON.stringify({found,before,selected,result,after}));
await browser.close();