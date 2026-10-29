import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const URL='https://earthlinedevelopment.org/';
const STATES=['Vermont','New York','Texas','Colorado','California','Arizona','New Mexico'];
const browser=await chromium.launch({headless:true});
const rows=[];

for(const state of STATES){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  let row={state,pass:false};
  try{
    await page.goto(URL+'?m83-owner='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      window.__m83_owner_refs={
        v:window.earthlineBuildVectorNoBuildMask,
        p:window.earthlineDeclarePropertyAtCrosshair16173,
        s:window.earthlineSyncSafePropertyFallback16221
      };
    });

    await page.locator('#searchInput').fill(state);
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return !!d},{timeout:20000,polling:100});

    const regional=await page.evaluate(()=>({
      generated:Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0),
      visible:Number((window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020)?.swaleLines||0),
      labels:Number((window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020)?.swaleGradeLabels||0),
      geom:(window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020)?.corridorGeometryVisible===true,
      rendered:(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const ids=(m?.getStyle?.().layers||[]).map(x=>x.id).filter(id=>/swale|corridor/i.test(id));let n=0;for(const id of ids){try{n+=m.queryRenderedFeatures(undefined,{layers:[id]}).length}catch(_){}}return n}catch(_){return 0}})()
    }));
    if(!(regional.generated>0&&regional.visible===regional.generated&&regional.labels>0&&regional.geom&&regional.rendered>0))throw new Error('regional renderer truth '+JSON.stringify(regional));

    const target=await page.evaluate(()=>{
      const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
      const f=fs[0];if(!f)return null;const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];return{lng:Number(c[0]),lat:Number(c[1])};
    });
    if(!target)throw new Error('no target');
    await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});},target);
    await page.waitForTimeout(350);
    const serial=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    await page.locator('#earthlineDeclareProperty16169').click();
    await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},serial,{timeout:30000,polling:50});
    await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:50});

    const property=await page.evaluate(()=>({
      corridors:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.corridors||0),
      rendered:Number(window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221?.renderedFeatures||0),
      visible:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221?.visible===true,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null
    }));
    if(!(property.corridors>0&&property.visible&&property.rendered>0))throw new Error('property renderer truth '+JSON.stringify(property));

    const ownerStability=await page.evaluate(()=>{
      const v=window.earthlineBuildVectorNoBuildMask,p=window.earthlineDeclarePropertyAtCrosshair16173,s=window.earthlineSyncSafePropertyFallback16221;
      return {vector:window.__m83_owner_refs?.v===v,property:window.__m83_owner_refs?.p===p,safe:window.__m83_owner_refs?.s===s};
    });
    if(!ownerStability.vector||!ownerStability.property||!ownerStability.safe)throw new Error('owner identity changed '+JSON.stringify(ownerStability));

    row={state,regional,property,ownerStability,errors,pass:errors.length===0};
  }catch(e){row={state,pass:false,error:String(e),errors}}
  rows.push(row);console.log('M83_OWNER_RENDERER '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass);
console.log('M83_OWNER_RENDERER_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.length-failed.length,fail:failed.length,failed:failed.map(x=>({state:x.state,error:x.error||null}))}));
if(failed.length)process.exitCode=1;