import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const TARGET={lat:37.41928,lng:-119.30587};
const OUT='artifacts/live-exact-property-17135';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:832},deviceScaleFactor:1});
const page=await context.newPage();
const failures=[];
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

async function shot(name){await page.screenshot({path:`${OUT}/${name}.png`,animations:'disabled'});}
async function visibleState(label){
  const state=await page.evaluate(({label,TARGET})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    let swales=[];let allLayers=[];
    try{
      allLayers=(m?.getStyle?.()?.layers||[]).filter(l=>/swale/i.test(l.id)).map(l=>l.id);
      const c=m?.getCanvas?.(),r=c?.getBoundingClientRect?.();
      if(r&&allLayers.length)swales=m.queryRenderedFeatures([[20,20],[Math.max(21,r.width-20),Math.max(21,r.height-20)]],{layers:allLayers});
    }catch(_){}
    const byLayer={};for(const f of swales){const id=f.layer?.id||'unknown';byLayer[id]=(byLayer[id]||0)+1}
    const b=document.getElementById('earthlineDeclareProperty16169');
    const span=b?.querySelector('[data-crosshair16247]');
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').replace(/\s+/g,' ').trim();
    return {
      label,
      targetRequested:TARGET,
      center:(()=>{const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null})(),
      zoom:m?.getZoom?.()||null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      propertyButton:b?{
        text:String(b.textContent||'').replace(/\s+/g,' ').trim(),
        crosshair:span?.getAttribute('data-crosshair16247')||null,
        disabled:!!b.disabled,
        visible:(()=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})()
      }:null,
      propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      elder,
      elderGauge:String(document.getElementById('earthlineElderTreesGauge17097')?.textContent||'').replace(/\s+/g,' ').trim(),
      swaleRenderedCount:swales.length,
      swaleRenderedByLayer:byLayer,
      regionalSvgHits:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').length,
      status
    };
  },{label,TARGET});
  console.log('EARTHLINE_EXACT_STATE '+JSON.stringify(state));
  return state;
}

await page.goto(BASE+'?exact17135='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(1000);
await shot('00-initial');

const input=page.locator('#searchInput');
await input.click();
await input.fill('California');
await page.waitForTimeout(900);
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await options.count()))throw new Error('No visible California search suggestions');
const stateOption=options.filter({hasText:/State \/ Region/i}).first();
await (await stateOption.count()?stateOption:options.first()).click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
await page.waitForTimeout(900);
await shot('01-regional');
await visibleState('regional');

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No visible Regional corridor hit target');
await hit.click({force:true});
await page.waitForTimeout(400);
const zoomButton=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoomButton.count()))throw new Error('No rendered Zoom to location button');
await zoomButton.click();
await page.waitForTimeout(1100);
await shot('02-after-zoom');
await visibleState('after-zoom');

// Place the real map at the exact user-reported failing property, then use a real
// one-pixel mouse drag to invoke the same dragend crosshair owner a user invokes.
await page.evaluate(({TARGET})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m?.stop?.();
  m?.jumpTo?.({center:[TARGET.lng,TARGET.lat],zoom:16.49,bearing:0,pitch:0});
},{TARGET});
await page.waitForTimeout(600);
const canvas=page.locator('#map .mapboxgl-canvas').first();
const box=await canvas.boundingBox();
if(!box)throw new Error('Map canvas unavailable');
const sx=box.x+box.width*0.72,sy=box.y+box.height*0.55;
await page.mouse.move(sx,sy);
await page.mouse.down();
await page.mouse.move(sx-2,sy,{steps:2});
await page.mouse.up();
await page.waitForTimeout(900);
await shot('03-exact-crosshair');
const cross=await visibleState('exact-crosshair');
if(!/^CROSSHAIR\b/i.test(cross.propertyButton?.text||''))failures.push('Property button did not become CROSSHAIR at exact target');
if(cross.propertyButton?.crosshair!=='1')failures.push('Property button crosshair flag not active at exact target');
if(!cross.propertyButton?.visible||cross.propertyButton?.disabled)failures.push('Property search button not usable at exact target');

await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:30000,polling:150});
await page.waitForTimeout(20000);
await shot('04-property-final');
const final=await visibleState('property-final');

const correctCenter=Math.abs((final.propertyAudit?.center?.lat??999)-TARGET.lat)<0.02 && Math.abs((final.propertyAudit?.center?.lng??999)-TARGET.lng)<0.02;
if(!correctCenter)failures.push('20-acre search ran from wrong center: '+JSON.stringify(final.propertyAudit?.center||null));
if(final.propertyAudit?.result!==true)failures.push('20-acre search did not settle successfully: '+JSON.stringify(final.propertyAudit||null));
if(final.swaleRenderedCount<=0)failures.push('No Property swales rendered at exact user location');
const elderFresh=final.elder?.summary?.coverageDatasetIds?.includes('dynamic-property-17130') && Number(final.elder?.featureCount||0)>0 && Number(final.elder?.dynamicCandidatePoolCount||0)>0;
if(!elderFresh)failures.push('No fresh dynamic Elder candidates at exact user location: '+JSON.stringify(final.elder||null));
if(pageErrors.length)failures.push('Page errors: '+JSON.stringify(pageErrors));

const result={TARGET,failures,pageErrors,cross,final,elderFresh};
writeFileSync(`${OUT}/result.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_EXACT_17135 '+JSON.stringify(result));
await browser.close();
if(failures.length)throw new Error('Exact user-location failures: '+JSON.stringify(failures));
