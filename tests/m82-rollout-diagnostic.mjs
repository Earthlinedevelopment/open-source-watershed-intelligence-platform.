import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const browser=await chromium.launch({headless:true});

async function openState(state){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  await installCandidateOrigin(context);
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?m82diag='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(state);await page.waitForTimeout(650);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  const t0=Date.now();await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
  const series=[];
  for(let i=0;i<40;i++){
    series.push(await page.evaluate(ms=>{
      const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||{};
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
      const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const ids=(m?.getStyle?.()?.layers||[]).map(x=>x.id).filter(id=>/swale/i.test(id));
      const rendered={};
      for(const id of ids){try{rendered[id]=m.queryRenderedFeatures(undefined,{layers:[id]}).length}catch(_){}}
      return {ms,generated:Number(pub.generated||0),visible:Number(d.swaleLines||0),visual:fs.length,runToken:String(pub.runToken||''),ids,rendered};
    },Date.now()-t0));
    if(series.at(-1).visual>0)break;
    await page.waitForTimeout(250);
  }
  return {context,page,errors,t0,series};
}

for(const state of ['Vermont','New Mexico']){
  const x=await openState(state);
  console.log('M82_REGIONAL_RACE '+JSON.stringify({state,errors:x.errors,series:x.series}));
  await x.page.close();await x.context.close();
}

{
  const state='California';
  const x=await openState(state);
  await x.page.waitForFunction(()=>((window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).length>0),{timeout:15000,polling:100});
  const target=await x.page.evaluate(()=>{
    const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
    const f=fs[0];const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];return {lng:+c[0],lat:+c[1]};
  });
  await x.page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0})},target);
  await x.page.waitForTimeout(350);
  const before=await x.page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const p0=Date.now();await x.page.locator('#earthlineDeclareProperty16169').click();
  const timeline=[];
  for(let i=0;i<80;i++){
    timeline.push(await x.page.evaluate(ms=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},v=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{},e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
      return {ms,serial:Number(a.serial||0),stage:a.stage||null,settled:a.settled===true,scientificSettled:a.scientificSettled===true,result:a.result===true,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeVisible:v.visible===true,safeRendered:Number(v.renderedFeatures||0),elderState:e.state||null,elderCount:Number(e.featureCount||0),stageTimings:a.stageTimings||null};
    },Date.now()-p0));
    const z=timeline.at(-1);
    if(z.serial===before+1&&z.scientificSettled&&z.result&&z.safeVisible&&z.safeRendered>0)break;
    await x.page.waitForTimeout(250);
  }
  console.log('M82_CA_PROPERTY_TIMELINE '+JSON.stringify({target,errors:x.errors,timeline}));
  await x.page.close();await x.context.close();
}
await browser.close();