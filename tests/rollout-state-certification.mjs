import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const ELDER_REQUIRED=new Set(['Vermont','New York','Arkansas','Iowa','Oklahoma','Texas','Colorado','Maryland','California']);
if(!STATES.length)throw new Error('STATES required');

const browser=await chromium.launch({headless:true});
const rows=[];
for(const state of STATES){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let row={state,pass:false};
  try{
    const t0=Date.now();
    await page.goto(URL+'?rollout-cert='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(state);
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167;const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return !!e||(+p?.generated>0&&!!d)}, {timeout:30000,polling:100});
    const regionalMs=Date.now()-t0;
    const reg=await page.evaluate(()=>({
      err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      generated:Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0),
      visible:Number((window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020)?.swaleLines||0),
      unsafe:Number(window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584?.unsafeSegments||0),
      outside:Number(window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539?.outsideAfterClip?.swales||0),
      swales:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).length
    }));
    if(reg.err)throw new Error('Regional '+JSON.stringify(reg.err));
    if(!(Number(reg.perf?.totalMs)>0&&Number(reg.perf?.totalMs)<=15000))throw new Error('Regional load '+reg.perf?.totalMs);
    if(!(reg.generated>0&&reg.visible===reg.generated&&reg.unsafe===0&&reg.outside===0&&reg.swales>0))throw new Error('Regional swale gate '+JSON.stringify(reg));

    const target=await page.evaluate(()=>{
      const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
      const f=fs[0]; if(!f)return null; const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),code:String(f.properties?.display_code||f.properties?.grade||'A1')};
    });
    if(!target)throw new Error('no A1 target');
    await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});},target);
    await page.waitForTimeout(350);
    const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    const p0=Date.now();
    await page.locator('#earthlineDeclareProperty16169').click();
    await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},before,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
    const propertyMs=Date.now()-p0;
    const prop=await page.evaluate(()=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},m=typeof M!=='undefined'?M:null;
      const safety=m?.safetyAudit15806||null;
      return {
        corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,settled:a.settled===true,result:a.result===true,
        safeRendered:Number(v.renderedFeatures||0),safeVisible:v.visible===true,
        safetyVerified:safety?.verified===true,acceptedIntersections:Number(safety?.acceptedIntersections||0),
        roadIntersections:Number(safety?.clearance?.roadIntersections||0),structureIntersections:Number(safety?.clearance?.structureIntersections||0),
        waterIntersections:Number(safety?.clearance?.waterIntersections||0),developedIntersections:Number(safety?.clearance?.developedIntersections||0),
        maxSlopePct:Number(a?.swaleDiagnostics?.maxSlopePct??m?.swaleDiagnostics15803?.maxSlopePct??4)
      };
    });
    if(propertyMs>15000)throw new Error('Property load '+propertyMs);
    if(!(prop.corridors>0&&prop.renderVerified&&prop.safeVisible&&prop.safeRendered>0&&prop.acceptedIntersections===0&&prop.roadIntersections===0&&prop.structureIntersections===0&&prop.waterIntersections===0&&prop.developedIntersections===0&&prop.maxSlopePct<=4.0001))throw new Error('Property swale gate '+JSON.stringify(prop));

    let elderMs=null,elder=null;
    if(ELDER_REQUIRED.has(state)){
      const e0=Date.now();
      await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};return e.state==='committed'||e.state==='failed'},{timeout:20000,polling:100});
      elderMs=Date.now()-e0;
      elder=await page.evaluate(()=>{
        const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{},map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
        let rendered=0;try{rendered=map?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0}catch(_){}
        return {state:e.state||null,count:Number(e.featureCount||0),rendered,candidatePool:Number(e.candidatePoolSize||e.candidatePool||0),error:e.error||null};
      });
      if(!(elder.state==='committed'&&elder.count>0&&elder.rendered>0&&elderMs<=15000))throw new Error('Elder gate '+JSON.stringify({elderMs,...elder}));
    }

    row={state,regionalMs,regionalCoreMs:Number(reg.perf?.totalMs||0),propertyMs,elderMs,reg,prop,elder,errors,pass:errors.length===0};
  }catch(e){row={state,pass:false,error:String(e),errors}}
  rows.push(row);console.log('EARTHLINE_ROLLOUT_STATE '+JSON.stringify(row));
  await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass);
console.log('EARTHLINE_ROLLOUT_STATE_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.length-failed.length,fail:failed.length,failed:failed.map(r=>({state:r.state,error:r.error||null}))}));
if(failed.length)process.exitCode=1;