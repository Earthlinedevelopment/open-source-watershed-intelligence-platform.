import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let row={round,pass:false};
  try{
    await page.goto('https://earthlinedevelopment.org/?m82ca='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill('California');await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/California/i}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    const r0=Date.now();await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return +p?.generated>0&&+d?.swaleLines===+p?.generated&&v.length>0},{timeout:20000,polling:100});
    const regionalWall=Date.now()-r0;
    const target=await page.evaluate(()=>{const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>+a.properties?.rank-+b.properties?.rank);const f=fs[0],c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];return{lng:+c[0],lat:+c[1]};});
    await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0})},target);
    await page.waitForTimeout(350);
    const before=await page.evaluate(()=>+window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0);
    const p0=Date.now();await page.locator('#earthlineDeclareProperty16169').click();
    let scientificMs=null,safeMs=null,elderMs=null;
    await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return +a.serial===s+1&&a.scientificSettled===true&&a.result===true},before,{timeout:60000,polling:50});scientificMs=Date.now()-p0;
    await page.waitForFunction(()=>{const v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return v.visible===true&&+v.renderedFeatures>0},{timeout:20000,polling:50});safeMs=Date.now()-p0;
    await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'||e.state==='failed'},{timeout:20000,polling:50});elderMs=Date.now()-p0;
    const snap=await page.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{},m=typeof M!=='undefined'?M:null,s=m?.safetyAudit15806||{};const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);let er=0;try{er=map?.queryRenderedFeatures(undefined,{layers:['earthline-elder-tree-points-17097']}).length||0}catch(_){}return{corridors:+a.corridors||0,renderVerified:a.renderVerified===true,safeRendered:+v.renderedFeatures||0,stageTimings:a.stageTimings||null,elderState:e.state||null,elderCount:+e.featureCount||0,elderRendered:er,accepted:+s.acceptedIntersections||0,road:+s.clearance?.roadIntersections||0,structure:+s.clearance?.structureIntersections||0,water:+s.clearance?.waterIntersections||0,developed:+s.clearance?.developedIntersections||0};});
    row={round,regionalWall,scientificMs,safeMs,elderMs,target,...snap,errors,pass:safeMs<=15000&&snap.renderVerified&&snap.safeRendered>0&&snap.accepted===0&&snap.road===0&&snap.structure===0&&snap.water===0&&snap.developed===0&&snap.elderState==='committed'&&(snap.elderCount===0||snap.elderRendered>0)&&!errors.length};
  }catch(e){row={round,pass:false,error:String(e),errors}}
  rows.push(row);console.log('M82_CA7 '+JSON.stringify(row));await context.close();
}
await browser.close();
console.log('M82_CA7_SUMMARY '+JSON.stringify({pass:rows.filter(r=>r.pass).length,total:rows.length,maxSafeMs:Math.max(...rows.map(r=>+r.safeMs||0)),rows}));
if(rows.some(r=>!r.pass))process.exitCode=1;