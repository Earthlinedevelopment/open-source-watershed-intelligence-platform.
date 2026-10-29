import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const CASES=['Vermont','Colorado'];
const browser=await chromium.launch({headless:true});
for(const state of CASES){
  const page=await browser.newPage({viewport:{width:1798,height:831}});
  const errors=[],failed=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('requestfailed',r=>failed.push({url:r.url().slice(0,180),failure:r.failure()?.errorText||''}));
  await page.goto(URL+'?perfdiag='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(state);
  await page.waitForTimeout(700);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  const rt=Date.now();
  await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
  await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const s=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return !!e||s.length>0},{timeout:45000,polling:100});
  const regional=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  const target=await page.evaluate(()=>{
    const sw=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length);
    sw.sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));
    const f=sw[0]; if(!f)return null;
    const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
    return {lng:Number(c[0]),lat:Number(c[1]),rank:Number(f.properties?.rank||0),code:String(f.properties?.display_code||''),props:f.properties||{}};
  });
  if(!target)throw new Error(state+' no target');
  await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59})},target);
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  const timeline=[];
  const seen={};
  for(let i=0;i<260;i++){
    const snap=await page.evaluate(()=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
      const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
      const p=window.EARTHLINE_PROPERTY_PRESENTATION_SETTLE_AUDIT_16521||{};
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      let safeRendered=0,elderRendered=0;
      try{
        const ids=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>m?.getLayer?.(id));
        safeRendered=ids.length?(m?.queryRenderedFeatures?.(undefined,{layers:ids})?.length||0):0;
      }catch(_){}
      try{elderRendered=m?.getLayer?.('earthline-elder-tree-points-17097')?(m?.queryRenderedFeatures?.(undefined,{layers:['earthline-elder-tree-points-17097']})?.length||0):0}catch(_){}
      return {
        serial:Number(a.serial||0),stage:String(a.stage||''),stageLabel:String(a.stageLabel||''),scientificSettled:a.scientificSettled===true,
        settled:a.settled===true,result:a.result===true,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,
        stageTimings:a.stageTimings||null,elapsedSeconds:a.elapsedSeconds??null,
        safe:{reason:s.reason||null,active:s.active===true,verified:s.verified===true,count:Number(s.count||0),visible:s.visible===true,rendered:Number(s.renderedFeatures||0),error:s.error||null,errors:s.errors||[]},
        safeRendered, presentation:p,
        elder:{state:e.state||null,featureCount:Number(e.featureCount||0),error:e.error||null,elapsedMs:e.elapsedMs??null,analysisMs:e.analysisMs??null,paintMs:e.paintMs??null},
        elderRendered,
        runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
        styleLoaded:!!m?.isStyleLoaded?.(),
        zoom:Number(m?.getZoom?.()||0)
      };
    });
    const ms=Date.now()-t0;
    const key=JSON.stringify([snap.serial,snap.stage,snap.scientificSettled,snap.settled,snap.result,snap.corridors,snap.renderVerified,snap.safe.reason,snap.safe.visible,snap.safe.rendered,snap.safeRendered,snap.elder.state,snap.elder.featureCount,snap.elderRendered,snap.runState,snap.styleLoaded]);
    if(!seen[key]){seen[key]=1;timeline.push({ms,...snap});}
    if(snap.settled&&snap.result&&snap.safe.visible&&snap.safeRendered>0&&snap.elder.state==='committed'&&(snap.elder.featureCount===0||snap.elderRendered>0))break;
    await page.waitForTimeout(250);
  }
  const final=timeline.at(-1);
  console.log('PERF_DIAG '+JSON.stringify({
    state,regionalWall:Date.now()-rt,regional,target,before,totalMs:Date.now()-t0,timeline,final,
    pageErrors:errors,requestFailures:failed.slice(-30)
  }));
  await page.close();
}
await browser.close();
