// rerun after final mapped-water production deployment
import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const state=process.env.STATE;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let out={state,pass:false};
try{
  await page.goto(URL+'?liveelder='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(state);
  await page.waitForTimeout(650);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
  const target=await page.evaluate(()=>{
    const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
    const f=fs[0]; if(!f)return null; const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
    return {lng:Number(c[0]),lat:Number(c[1])};
  });
  if(!target)throw new Error('no Regional target');
  await page.evaluate(t=>{const m=window.earthlineMap||earthlineMap;m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});},target);
  await page.waitForTimeout(350);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},before,{timeout:30000,polling:50});
  await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'||e.state==='failed'},{timeout:15000,polling:50});
  const first=await page.evaluate(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return {state:e.state||null,count:Number(e.featureCount||0),candidatePool:Number(e.candidatePoolSize||e.dynamicCandidatePoolCount||e.candidatePool||0),error:e.error||null}});
  if(first.state!=='committed')throw new Error('elder not committed '+JSON.stringify(first));
  if(first.count>0){
    await page.waitForFunction(()=>{const m=window.earthlineMap||earthlineMap;try{return (m.queryRenderedFeatures(undefined,{layers:['earthline-elder-tree-points-17097']})||[]).length>0}catch(_){return false}},{timeout:5000,polling:50});
  }
  const fin=await page.evaluate(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{},m=window.earthlineMap||earthlineMap;let rendered=0;try{rendered=(m.queryRenderedFeatures(undefined,{layers:['earthline-elder-tree-points-17097']})||[]).length}catch(_){}return {state:e.state||null,count:Number(e.featureCount||0),candidatePool:Number(e.candidatePoolSize||e.dynamicCandidatePoolCount||e.candidatePool||0),rendered,error:e.error||null}});
  const elapsedMs=Date.now()-t0;
  out={state,elapsedMs,...fin,errors,pass:fin.state==='committed'&&elapsedMs<=15000&&errors.length===0&&(fin.count===0||fin.rendered>0)};
}catch(e){out={state,pass:false,error:String(e),errors}}
console.log('EARTHLINE_LIVE_ELDER '+JSON.stringify(out));
await browser.close();
if(!out.pass)process.exitCode=1;