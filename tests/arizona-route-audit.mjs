import { chromium } from 'playwright';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));

await page.goto('https://earthlinedevelopment.org/?az_route_audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE TARGET AUTHORITY 1.0 — resolved-search/corridor/user-drag only'),null,{timeout:60000,polling:250});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(250);
}
await page.locator('#searchInput').click();
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(1000);
const opts=await page.locator('#earthlineSearchSuggestions15970 [role="option"]').allTextContents();
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click({timeout:10000});
const selected=await page.evaluate(()=>({
  input:document.getElementById('searchInput')?.value||'',
  mapCenter:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom?.()}:null})(),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  selectedLocation:window.EARTHLINE_SELECTED_LOCATION||window.EARTHLINE_SELECTED_PLACE||window.EARTHLINE_SEARCH_SELECTION||null
}));
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>{
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return !!p&&String(t&&t.source||'')==='regional-center';
},null,{timeout:20000,polling:100});
const regional=await page.evaluate(()=>({
  mapCenter:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom?.()}:null})(),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim()
}));
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const t0=Date.now();
await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
await page.waitForFunction(prev=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
  return !!a&&Number(a.serial||0)>prev&&a.settled===true;
},before,{timeout:30000,polling:100}).catch(()=>{});
const propertyMs=Date.now()-t0;
const after=await page.evaluate(()=>({
  mapCenter:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom?.()}:null})(),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
  audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  modelLoc:(()=>{try{return (typeof M!=='undefined'&&M&&M.loc)||window.M?.loc||null}catch{return null}})(),
  button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim()
}));
console.log('EARTHLINE_ARIZONA_ROUTE_AUDIT '+JSON.stringify({opts,selected,regional,propertyMs,after,errs}));
const near=(a,b,t=0.002)=>Number.isFinite(Number(a))&&Number.isFinite(Number(b))&&Math.abs(Number(a)-Number(b))<=t;
const arizona=(p)=>p&&Number(p.lat)>=31&&Number(p.lat)<=37.5&&Number(p.lng)>=-115&&Number(p.lng)<=-109;
const strict={
  searchSelectionHeldUntilRegional:!selected.target,
  regionalTargetArizona:arizona(regional.target),
  declarationArizona:arizona(after.declaration?.center),
  modelArizona:arizona(after.modelLoc),
  targetMatchesRegionalMap:near(regional.target?.lng,regional.mapCenter?.lng,0.02)&&near(regional.target?.lat,regional.mapCenter?.lat,0.02),
  declarationMatchesTarget:near(after.declaration?.center?.lng,after.target?.lng)&&near(after.declaration?.center?.lat,after.target?.lat),
  modelMatchesDeclaration:near(after.modelLoc?.lng,after.declaration?.center?.lng)&&near(after.modelLoc?.lat,after.declaration?.center?.lat),
  settled:after.audit?.settled===true,
  noMexico:!(Number(after.declaration?.center?.lat)>18&&Number(after.declaration?.center?.lat)<22&&Number(after.declaration?.center?.lng)>-104&&Number(after.declaration?.center?.lng)<-100)
};
strict.pass=Object.values(strict).every(Boolean);
console.log('EARTHLINE_ARIZONA_ROUTE_STRICT '+JSON.stringify(strict));
if(!strict.pass)process.exitCode=1;

await page.screenshot({path:'/tmp/arizona-route-audit.png',fullPage:true});
await browser.close();

// strict Arizona target authority gate trigger

// corrected strict gate: Property target is expected to be created by authoritative Regional resolution

// wait for authoritative Regional publication before Property launch
