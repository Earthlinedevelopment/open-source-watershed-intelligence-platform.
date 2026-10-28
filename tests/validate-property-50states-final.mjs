import { chromium } from 'playwright';
import fs from 'node:fs';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const OUT=process.env.OUT||'property50.json';
const CANDIDATE_ORIGIN=process.env.EARTHLINE_CANDIDATE_ORIGIN==='1';
if(!STATES.length)throw new Error('STATES required');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
if(CANDIDATE_ORIGIN)await installCandidateOrigin(context);
const rows=[];

async function runRegional(page,stateName){
  await page.goto(URL+'?property50v16728='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw new Error('search controls unavailable');
    i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  await page.waitForFunction(expected=>{
    if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    return /screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(String(expected).toLowerCase());
  },stateName,{timeout:90000,polling:100});
  const a=await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    labels:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149,#earthlineRegionalVectorOverlay16020 [data-swale-grade]').length
  }));
  if(a.lastError)throw new Error('regional '+JSON.stringify(a.lastError));
  const generated=Number(a.pub?.generated||0),displayed=Number(a.display?.generatedSwales||0);
  const unsafe=Number(a.flow?.unsafeSegments||0),outside=Number(a.boundary?.outsideAfterClip?.swales||0);
  const hardRootFail=Array.isArray(a.root?.rankedCauses)&&a.root.rankedCauses.some(r=>r.status==='critical'||r.status==='fail');
  if(!(generated>0&&displayed===generated&&Number(a.labels)>0&&unsafe===0&&outside===0&&!hardRootFail)){
    throw new Error('regional publication/presentation gate failed '+JSON.stringify({generated,displayed,labels:a.labels,unsafe,outside,hardRootFail}));
  }
  return Date.now()-started;
}

async function rankedTargets(page,stateName){
  return page.evaluate(q=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const parent=String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||'');
    return sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
      .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))
      .slice(0,8).map(f=>{
        const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
        return {lng:Number(c[0]),lat:Number(c[1]),source:'property-50-state-certification-16728',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,parentRunToken:parent,at:new Date().toISOString()};
      });
  },stateName);
}

async function propertyAttempt(page,target){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(t=>{
    window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
    window.EARTHLINE_LOCATION_INTEGRITY_15801=null;
    window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727=null;
    window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529=null;
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },target);
  await page.waitForFunction(t=>{
    const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!p&&Math.abs(Number(p.lng)-Number(t.lng))<=0.00008&&Math.abs(Number(p.lat)-Number(t.lat))<=0.00008;
  },target,{timeout:15000,polling:100});
  const button=page.locator('#earthlineDeclareProperty16169');
  await button.waitFor({state:'visible',timeout:15000});
  if(await button.isDisabled().catch(()=>false))return {ok:false,error:'Property button disabled',gate:null,presses:0};
  await button.click({timeout:10000});
  try{
    await page.waitForFunction(prev=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const g=window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null;
      return (!!a&&Number(a.serial||0)>prev&&a.settled===true)||(g&&g.hit===true);
    },before,{timeout:90000,polling:120});
  }catch(e){
    return {ok:false,error:'Property user-flow timeout: '+String(e&&e.message||e),gate:await page.evaluate(()=>window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null),presses:1};
  }
  return page.evaluate(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const g=window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null;
    const ok=!!a&&Number(a.serial||0)>prev&&a.settled===true&&a.result===true&&p?.published===true;
    return {ok,error:ok?null:(a?.error||null),gate:g,presses:1,serial:Number(a?.serial||0),settled:a?.settled===true,result:a?.result===true,published:p?.published===true};
  },before);
}

async function snap(page){
  return page.evaluate(()=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
    const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
    const slopeValues=[];
    for(const f of sw){const p=f?.properties||{};for(const k of ['slopePct','slope_pct','maxSlopePct','max_slope_pct','slope_percent']){const v=Number(p[k]);if(Number.isFinite(v))slopeValues.push(v)}}
    const naturalIds=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    const naturalVisible=naturalIds.some(id=>{try{return !!map?.getLayer?.(id)&&map.getLayoutProperty?.(id,'visibility')!=='none'}catch(_){return false}});
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
      documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      published:pa?.published===true,
      publicationCount:Number(pa?.publicationCount||0),
      stage:ra?.stage||null,settled:ra?.settled===true,result:ra?.result===true,timedOut:ra?.timedOut===true,renderVerified:ra?.renderVerified===true,
      runError:ra?.error||null,stageTimings:ra?.stageTimings||null,
      publicationBlock:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
      handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
      corridors:Number(ra?.corridors??pa?.publicationCount??0),
      safeVisible:sv?.visible===true,safeCount:Number(sv?.count||0),naturalVisible,
      safetyVerified:md?.propertyResultLock15815?.safetyVerified===true,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      slopeOwner:{traceMaxS:Number(md?.earthlineTraceSafeCache16320?.maxS),maxRecordedSlope:slopeValues.length?Math.max(...slopeValues):null},
      swaleCount:sw.length,
      waterCount:Number(md?.authoritativeWaterPaths15824?.features?.length||0),
      rechargeCount:Number(md?.rechZones?.length||0),
      aquiferStatus:String(md?.usgsAquiferStatus||''),
      elder:{state:String(elder?.state||''),featureCount:Number(elder?.featureCount||0),coverageKnown:elder?.summary?.coverageKnown??null,identity:String(elder?.propertyRunIdentity||'')},
      integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
      reclaim:window.EARTHLINE_PROPERTY_DISPLAY_RECLAIM_16727||null,
      timeoutAudit:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null
    };
  });
}

for(const stateName of STATES){
  const page=await context.newPage();
  const started=Date.now();let regionalMs=null,propertyMs=null,error=null,usedTarget=null;const attempts=[];
  try{
    regionalMs=await runRegional(page,stateName);
    const targets=await rankedTargets(page,stateName);
    if(!targets.length)throw new Error('no published Regional corridor target');
    const ps=Date.now();
    for(const target of targets.slice(0,6)){
      const a=await propertyAttempt(page,target);
      attempts.push({target,ok:a.ok,error:a.error||null,waterGate:a.gate||null});
      if(a.ok){usedTarget=target;break;}
      if(!(a.gate&&a.gate.hit===true))throw new Error(a.error||'Property failed without a mapped-water gate');
    }
    propertyMs=Date.now()-ps;
    if(!usedTarget)throw new Error('top six Regional corridors were all rejected by finer Property water evidence');
    await page.waitForTimeout(3200);
  }catch(e){error=String(e&&e.message||e);}
  const s=await snap(page).catch(e=>({snapshotError:String(e)}));
  const failures=[];
  if(error)failures.push(error);
  if(s.snapshotError)failures.push('snapshot '+s.snapshotError);
  if(!s.published)failures.push('Property not published');
  if(!s.settled||!s.result||s.timedOut)failures.push('Property run not settled successfully'+(s.runError?' — '+s.runError:''));
  if(!s.renderVerified)failures.push('Property render not verified');
  if(Number(s.corridors)>0&&!s.safeVisible)failures.push('safe Property corridors not visible');
  if(s.naturalVisible)failures.push('obsolete natural Property presentation visible');
  if(s.safetyVerified!==true)failures.push('Property safety lock not verified');
  if(Number(s.slopeOwner?.traceMaxS)!==4)failures.push('Property slope owner '+String(s.slopeOwner?.traceMaxS));
  if(Number.isFinite(Number(s.slopeOwner?.maxRecordedSlope))&&Number(s.slopeOwner.maxRecordedSlope)>4.000001)failures.push('published slope exceeds 4 percent');
  if(usedTarget){
    const near=(a,b)=>Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<=0.00008;
    if(!near(s.target?.lng,usedTarget.lng)||!near(s.target?.lat,usedTarget.lat)||!near(s.declaration?.center?.lng,usedTarget.lng)||!near(s.declaration?.center?.lat,usedTarget.lat))failures.push('Property target/declaration mismatch');
  }
  if(s.displayedTier!=='property'||s.documentTier!=='property')failures.push('canonical tier '+s.displayedTier+'/'+s.documentTier);
  if(s.integrity&&s.integrity.ok!==true)failures.push('location integrity '+JSON.stringify(s.integrity.reasons||[]));
  if(s.timeoutAudit)failures.push('Property timeout audit present');
  if(propertyMs!=null&&propertyMs>55000)failures.push('Property wall '+propertyMs);
  rows.push({state:stateName,elapsedMs:Date.now()-started,regionalMs,propertyMs,usedTarget,attempts,snap:s,failures,pass:failures.length===0});
  await page.close();
}
await context.close();
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({state:r.state,failures:r.failures}));
const out={at:new Date().toISOString(),url:URL,rows,failed,pass:failed.length===0};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));console.log(JSON.stringify(out));
if(failed.length)process.exitCode=1;
