// validate concurrent Elder raster reads
import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const context=await browser.newContext({viewport:{width:1798,height:831}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let row={round,pass:false};
  try{
    await page.goto('https://earthlinedevelopment.org/?elder-zoom-prime='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill('Vermont');
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Vermont/i}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
    await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const s=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return !!e||s.length>0},{timeout:30000,polling:100});
    const opened=await page.evaluate(()=>{
      const sw=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length)
        .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
      if(!sw[0]||typeof window.earthlineOpenCorridorDetail16149!=='function')return false;
      return window.earthlineOpenCorridorDetail16149(sw[0],0)!==false;
    });
    if(!opened)throw new Error('A1 detail did not open');
    await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').click();
    await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!t&&Number.isFinite(Number(t.lng))&&Number.isFinite(Number(t.lat))},{timeout:10000,polling:100});
    await page.waitForTimeout(350);
    const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    const t0=Date.now();
    await page.locator('#earthlineDeclareProperty16169').click();
    await page.waitForFunction(b=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===b+1&&a.scientificSettled===true&&a.result===true},before,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
    const safeMs=Date.now()-t0;
    await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'&&Number(e.featureCount||0)>0},{timeout:30000,polling:100});
    await page.waitForFunction(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return (m?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0)>0}catch(_){return false}},{timeout:7000,polling:100});
    const elderMs=Date.now()-t0;
    const s=await page.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);let er=0;try{er=m?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0}catch(_){}return {corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeRendered:Number(v.renderedFeatures||0),elderState:e.state||null,elderCount:Number(e.featureCount||0),elderRendered:er,workerTimings:e.workerTimings||null,target:window.EARTHLINE_PROPERTY_TARGET_16201||null}});
    row={round,safeMs,elderMs,...s,errors,pass:safeMs<=15000&&elderMs<=15000&&s.corridors>0&&s.renderVerified&&s.safeRendered>0&&s.elderState==='committed'&&s.elderCount>0&&s.elderRendered>0&&!errors.length};
  }catch(e){row={round,pass:false,error:String(e),errors}}
  rows.push(row);console.log('M81_ELDER_ZOOM_PRIME '+JSON.stringify(row));
  await context.close();
  if(!row.pass){await browser.close();throw new Error('Elder Zoom prime failed '+JSON.stringify(row));}
}
await browser.close();
console.log('M81_ELDER_ZOOM_PRIME_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.filter(r=>r.pass).length}));
