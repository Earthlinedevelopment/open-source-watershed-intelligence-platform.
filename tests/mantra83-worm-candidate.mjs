import {chromium} from 'playwright';
import {applyWormSuppression17434} from './mantra83-worm-transform.mjs';

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/',async route=>{
  const response=await route.fetch();
  const body=applyWormSuppression17434(await response.text());
  await route.fulfill({response,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2200);
await page.locator('#searchInput').fill('Vermont');
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return !!d&&String(d.tier||d.mode||'').toLowerCase()==='regional'&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},{timeout:120000});
await page.waitForTimeout(500);
const initial=await page.evaluate(()=>({
  zoom:Number(window.earthlineMap?.getZoom?.()),
  pubZoom:Number(window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337?.zoom),
  paths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
  labels:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').length,
  generated:Number(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.length||0)
}));
if(initial.paths!==0)throw new Error('initial Regional corridor geometry still visible');
if(!(initial.labels>0))throw new Error('Regional corridor labels disappeared');
if(!(initial.generated>0))throw new Error('Regional swale data missing');
await page.evaluate(()=>window.earthlineMap?.zoomTo?.(Number(window.earthlineMap?.getZoom?.()||0)+1,{duration:0}));
await page.waitForTimeout(700);
const zoomed=await page.evaluate(()=>({
  zoom:Number(window.earthlineMap?.getZoom?.()),
  paths:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length
}));
if(!(zoomed.paths>0))throw new Error('corridor geometry did not appear after zoom');
if(errors.length)throw new Error('page errors '+JSON.stringify(errors.slice(0,5)));
console.log('M83_WORM_CANDIDATE_PASS '+JSON.stringify({initial,zoomed}));
await browser.close();
