import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const CASES=['Vermont','Colorado'];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const state of CASES){
  const page=await browser.newPage({viewport:{width:1798,height:831}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(URL+'?mantra81-elder='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(state);
  await page.waitForTimeout(700);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
  await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const s=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return !!e||s.length>0},{timeout:45000,polling:100});
  const target=await page.evaluate(()=>{
    const sw=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length);
    sw.sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
    const f=sw[0]; if(!f)return null;
    const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
    return {lng:Number(c[0]),lat:Number(c[1])};
  });
  if(!target)throw new Error(state+' has no Regional target');
  await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59})},target);
  await page.waitForTimeout(300);
  const serial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},serial,{timeout:60000,polling:100});
  await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
  await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'||e.state==='failed'},{timeout:20000,polling:100});
  const pre=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||{});
  if(pre.state!=='committed')throw new Error(state+' Elder '+JSON.stringify(pre));
  if(Number(pre.featureCount||0)>0){
    await page.waitForFunction(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return (m?.queryRenderedFeatures?.({layers:['earthline-elder-tree-points-17097']})?.length||0)>0}catch(_){return false}},{timeout:5000,polling:100});
  }
  const row=await page.evaluate(({state,target,t0,errors})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    let elderRendered=0;try{elderRendered=m?.queryRenderedFeatures?.({layers:['earthline-elder-tree-points-17097']})?.length||0}catch(_){}
    return {state,target,wallMs:Date.now()-t0,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeRendered:Number(s.renderedFeatures||0),elderState:e.state||null,elderCount:Number(e.featureCount||0),elderRendered,errors};
  },{state,target,t0,errors});
  row.pass=row.corridors>0&&row.renderVerified&&row.safeRendered>0&&row.elderState==='committed'&&(row.elderCount===0||row.elderRendered>0)&&row.wallMs<=15000&&!row.errors.length;
  rows.push(row);console.log('MANTRA81_ELDER '+JSON.stringify(row));
  await page.close();
}
await browser.close();
if(rows.some(r=>!r.pass))throw new Error('Elder actual-flow failure '+JSON.stringify(rows.filter(r=>!r.pass)));
