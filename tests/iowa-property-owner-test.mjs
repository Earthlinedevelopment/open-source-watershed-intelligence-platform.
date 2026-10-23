import { chromium } from 'playwright';
import fs from 'node:fs';
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:8787/?iowa-property='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count())await opts.first().click({force:true});else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
 return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:250});
await page.evaluate(({lat,lng})=>{
 const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 if(typeof M!=='undefined'&&M){M.centerLat=lat;M.centerLng=lng;M.loc=Object.assign({},M.loc||{},{name:'Iowa diagnostic',countryCode:'us',lat,lng,query:'Iowa'});}
 try{mp?.jumpTo?.({center:[lng,lat],zoom:13});}catch(_){}
},TARGET);
await page.waitForTimeout(1000);
const btn=page.locator('#earthlineDeclareProperty16169');
if(await btn.count())await btn.click({force:true});else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());
let settled=false;
try{
 await page.waitForFunction(()=>{
   const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
   return a?.settled===true&&a?.result===true;
 },null,{timeout:120000,polling:200});
 settled=true;
}catch(_){}
await page.waitForTimeout(1800);
const diag=await page.evaluate(()=>{
 const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const safe=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
 let living=null;try{living=typeof window.earthlineDisplayAudit15882==='function'?window.earthlineDisplayAudit15882():null}catch(_){}
 const safeIds=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
 const safeVisibility=safeIds.map(id=>({id,exists:!!mp?.getLayer?.(id),visibility:(()=>{try{return mp.getLayoutProperty(id,'visibility')||'visible'}catch(_){return null}})()}));
 const svg=document.getElementById('earthlineRegionalVectorOverlay16020')||document.querySelector('svg');
 const natural={
   canopy:document.querySelectorAll('.earthline-swale-canopy-16174').length,
   trees:document.querySelectorAll('.earthline-swale-tree-crown-16174').length,
   water:document.querySelectorAll('.earthline-swale-water-16174').length,
   understory:document.querySelectorAll('.earthline-swale-understory-16174').length
 };
 return {audit,safe,living,safeVisibility,natural,
   tier:String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.tier||''),
   propertyState:document.documentElement.dataset.earthlinePropertyRunState||''};
});
diag.settled=settled;diag.errors=errors;
fs.writeFileSync('iowa-property-owner-test.json',JSON.stringify(diag,null,2));
await page.screenshot({path:'iowa-property-owner-test.png',fullPage:false});
console.log('EARTHLINE_IOWA_PROPERTY_OWNER '+JSON.stringify(diag));
await browser.close();