import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});
const page=await context.newPage(); const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?az_a1_property='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:25000}); await page.waitForTimeout(1100);
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250);}
await page.locator('#searchInput').click(); await page.locator('#searchInput').fill('Arizona'); await page.waitForTimeout(800);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())try{await opt.tap({timeout:8000});await page.waitForTimeout(250)}catch(_){}
await page.evaluate(()=>document.getElementById('runBtn')?.click());
try{await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:45000,polling:150})}catch(_){}
await page.waitForTimeout(700);
const controls=await page.evaluate(()=>[...document.querySelectorAll('button,[role="button"]')].map((e,i)=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return{i,id:e.id,cls:String(e.className||''),text:String(e.textContent||e.getAttribute('aria-label')||'').replace(/\s+/g,' ').trim(),visible:s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.visible&&(/\bA1\b/i.test(x.text)||/zoom to location/i.test(x.text)||/20-acre|20 acre|property/i.test(x.text))));
console.log('EARTHLINE_AZ_A1_CONTROLS '+JSON.stringify(controls));

let a1=page.getByRole('button',{name:/^A1(?:\b|\s|$)/i}).first();
if(!(await a1.count()))a1=page.locator('button').filter({hasText:/\bA1\b/}).first();
if(await a1.count()){await a1.tap({timeout:8000});await page.waitForTimeout(500);}
let zoom=page.getByRole('button',{name:/zoom to location/i}).first();
if(!(await zoom.count()))zoom=page.locator('button').filter({hasText:/zoom to location/i}).first();
let zoomClicked=false;
if(await zoom.count()){await zoom.tap({timeout:8000});zoomClicked=true;await page.waitForTimeout(1500);}
const afterZoom=await page.evaluate(()=>({
  panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  selected:window.EARTHLINE_SELECTED_CORRIDOR_16323||window.EARTHLINE_SELECTED_REGIONAL_CORRIDOR_16323||null,
  tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
  mapCenter:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom()}:null}catch(_){return null}})()
}));
if(!afterZoom.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300);}
const prop=page.locator('#earthlineDeclareProperty16169');
const propVisible=await prop.isVisible().catch(()=>false);
let propClicked=false;
if(propVisible){await prop.tap({timeout:8000});propClicked=true;}
try{await page.waitForFunction(()=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,s=String(document.documentElement.dataset.earthlinePropertyRunState||'');
 return !!(a&&a.settled===true)||s==='failed';
},{timeout:30000,polling:120})}catch(_){}
await page.waitForTimeout(500);
const out=await page.evaluate(()=>({
 zoomClicked:document.getElementById('earthlineMobileZoomSpinner17003')!=null,
 tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
 runState:String(document.documentElement.dataset.earthlineRunState||''),
 propState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
 target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
 audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
 publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
 safety:M?.safetyAudit15806||null,
 lock:M?.propertyResultLock15815||null,
 swales:Number(M?.swales?.length||0),
 safeSwales:Number(M?.authoritativeSafeSwales15815?.length||0),
 waterPaths:Number(M?.waterPaths?.length||M?.flowPaths?.length||0),
 aquifers:Number(M?.usgsAquifers?.length||0),
 recharge:Number(M?.rechZones?.length||0),
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
}));
await page.screenshot({path:'/tmp/earthline-az-a1-property-mobile.png',fullPage:true});
console.log('EARTHLINE_AZ_A1_PROPERTY '+JSON.stringify({controls,zoomClicked,afterZoom,propVisible,propClicked,out,errs}));
await browser.close();
if(!propClicked||!out.audit?.settled)process.exitCode=1;

// rerun with render-layer audit
