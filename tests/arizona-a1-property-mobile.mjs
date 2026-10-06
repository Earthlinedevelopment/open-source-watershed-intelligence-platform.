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

let a1=page.locator('[aria-label="Open details for A1"]').first();
if(!(await a1.count()))a1=page.getByText(/^A1$/i).first();
let a1Clicked=false;
if(await a1.count()){try{await a1.tap({timeout:8000});a1Clicked=true}catch(_){const bb=await a1.boundingBox();if(bb){await page.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);a1Clicked=true}}await page.waitForTimeout(650);}
const a1Detail=await page.evaluate(()=>[...document.querySelectorAll('button,[role="button"],a')].map(e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return {id:e.id,tag:e.tagName,cls:String(e.className||''),aria:e.getAttribute('aria-label')||'',text:String(e.textContent||'').replace(/\s+/g,' ').trim(),visible:s.display!=='none'&&s.visibility!=='hidden'&&r.width>1&&r.height>1,x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height)}}).filter(x=>x.visible&&(/A1/i.test(x.text+x.aria)||/zoom to location/i.test(x.text+x.aria))));
console.log('EARTHLINE_AZ_A1_DETAIL '+JSON.stringify({a1Clicked,a1Detail}));
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
 safeSwales:Number(M?.authoritativeSafeSwales15815?.features?.length||M?.authoritativeSafeSwales15815?.length||0),
 render:(()=>{
   try{
     const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
     const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
     const src=m?.getSource?.('earthline-property-safe-visible-16221');
     const data=src&&(src._data||src._options?.data);
     const naturalSource=m?.getSource?.('earthline-property-swale-texture-16174');
     const naturalData=naturalSource&&(naturalSource._data||naturalSource._options?.data);
     const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
     return {
       sourceFeatures:Array.isArray(data?.features)?data.features.length:null,
       textureAudit:(()=>{try{return typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null}catch(e){return {error:String(e)}}})(),
       naturalSourceFeatures:Array.isArray(naturalData?.features)?naturalData.features.length:null,
       naturalLayers:naturalIds.map(id=>({
         id,exists:!!m?.getLayer?.(id),
         visibility:m?.getLayoutProperty?.(id,'visibility')??null,
         lineOpacity:m?.getPaintProperty?.(id,'line-opacity')??null,
         fillOpacity:m?.getPaintProperty?.(id,'fill-opacity')??null,
         width:m?.getPaintProperty?.(id,'line-width')??null
       })),
       layers:ids.map(id=>({
         id,exists:!!m?.getLayer?.(id),
         visibility:m?.getLayoutProperty?.(id,'visibility')??null,
         opacity:m?.getPaintProperty?.(id,'line-opacity')??null,
         width:m?.getPaintProperty?.(id,'line-width')??null
       }))
     };
   }catch(e){return {error:String(e)}}
 })(),
 waterPaths:Number(M?.waterPaths?.features?.length||M?.waterPaths?.length||M?.flowPaths?.features?.length||M?.flowPaths?.length||0),
 aquifers:Number(M?.usgsAquifers?.length||0),
 recharge:Number(M?.rechZones?.length||0),
 status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
}));
await page.screenshot({path:'/tmp/earthline-az-a1-property-mobile.png',fullPage:true});
console.log('EARTHLINE_AZ_A1_PROPERTY '+JSON.stringify({controls,a1Clicked,a1Detail,zoomClicked,afterZoom,propVisible,propClicked,out,errs}));
await browser.close();
const visibleFallback=Number(out?.render?.sourceFeatures||0)>0 && Array.isArray(out?.render?.layers) && out.render.layers.some(x=>x.exists&&x.visibility!=='none'&&Number(x.opacity)>0);
console.log('EARTHLINE_TEXTURE_DIAGNOSTIC '+JSON.stringify(out?.render||null));
if(!propClicked||!out.audit?.settled)process.exitCode=1;

// rerun with render-layer audit

// exact A1 detail tap rerun

// exact A1 + layer/source audit

// verify fail-visible 17011

// diagnose natural replacement visibility after safe fallback fade
