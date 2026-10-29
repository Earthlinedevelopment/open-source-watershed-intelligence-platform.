import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const URL='https://earthlinedevelopment.org/';
const TARGET={lng:-71.83969365617006,lat:44.57121098943877};
const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const context=await browser.newContext({viewport:{width:1798,height:831}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(URL+'?elder-prime-candidate='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('Vermont');
  await page.waitForTimeout(650);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Vermont/i}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
  await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59})},TARGET);
  await page.waitForTimeout(300);
  const serial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},serial,{timeout:30000,polling:100});
  await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
  const safeMs=Date.now()-t0;
  await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'&&Number(e.featureCount||0)>0},{timeout:15000,polling:100});
  await page.waitForFunction(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return (m?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0)>0}catch(_){return false}},{timeout:5000,polling:100});
  const elderMs=Date.now()-t0;
  const row=await page.evaluate(({round,safeMs,elderMs,errors})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    let elderRendered=0;try{elderRendered=m?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0}catch(_){}
    return {round,safeMs,elderMs,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeRendered:Number(s.renderedFeatures||0),elderState:e.state||null,elderCount:Number(e.featureCount||0),elderRendered,errors};
  },{round,safeMs,elderMs,errors});
  row.pass=row.safeMs<=15000&&row.elderMs<=15000&&row.corridors>0&&row.renderVerified&&row.safeRendered>0&&row.elderState==='committed'&&row.elderCount>0&&row.elderRendered>0&&!row.errors.length;
  rows.push(row);console.log('M81_ELDER_PRIME '+JSON.stringify(row));
  await context.close();
}
await browser.close();
if(rows.some(r=>!r.pass))throw new Error('Elder prime candidate failed '+JSON.stringify(rows.filter(r=>!r.pass)));
console.log('M81_ELDER_PRIME_SUMMARY '+JSON.stringify({pass:rows.length,rows}));
