import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const state=process.env.STATE;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
const row={state,errors};
const snap=async(label)=>{const x=await page.evaluate(()=>({
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200),
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  regErr:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
  display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
  root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
  property:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
  elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
  propertyDiag:(typeof M!=='undefined'&&M?.swaleDiagnostics)?M.swaleDiagnostics:null,
  zeroReason:(typeof M!=='undefined'&&M?.prescriptionZeroReason15870)||null,
  vectorCoverage:(typeof M!=='undefined'&&M?.vectorNoBuildCoverage)||null,
  noBuildProvenance:(typeof M!=='undefined'&&M?.noBuildProvenance15843)?{noBuildCellsFromWater:M.noBuildProvenance15843.noBuildCellsFromWater,noBuildCellsFromVector:M.noBuildProvenance15843.noBuildCellsFromVector,noBuildCellsAfterDilation:M.noBuildProvenance15843.noBuildCellsAfterDilation}:null,
  preflight:window.EARTHLINE_FINAL_PROPERTY_PREFLIGHT_17803||null
}));row[label]=x;};
try{
  await page.goto(URL+'?fourdiag='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(state);
  await page.waitForTimeout(650);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:state}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  const r0=Date.now(); await page.locator('#runBtn').click();
  try{await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});row.regPerfWaitMs=Date.now()-r0;}catch(e){row.regPerfTimeout=String(e);row.regPerfWaitMs=Date.now()-r0;}
  await snap('afterPerf');
  const p0=Date.now();
  try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167;const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020;return !!e||(+p?.generated>0&&!!d)},{timeout:45000,polling:100});row.regPublishWaitMs=Date.now()-p0;}catch(e){row.regPublishTimeout=String(e);row.regPublishWaitMs=Date.now()-p0;}
  await snap('afterPublish');
  const regionalOk=!row.afterPublish?.regErr&&Number(row.afterPublish?.pub?.generated||0)>0&&!!row.afterPublish?.display;
  if(regionalOk){
    const target=await page.evaluate(()=>{const fs=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999));const f=fs[0];if(!f)return null;const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];return{lng:Number(c[0]),lat:Number(c[1])};});
    row.target=target;
    if(target){
      await page.evaluate(t=>{const m=window.earthlineMap||earthlineMap;m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});},target);
      await page.waitForTimeout(350);
      const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
      const q0=Date.now(); await page.locator('#earthlineDeclareProperty16169').click();
      try{await page.waitForFunction(s=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===s+1&&a.scientificSettled===true&&a.result===true},before,{timeout:60000,polling:100});row.propertyWaitMs=Date.now()-q0;}catch(e){row.propertyTimeout=String(e);row.propertyWaitMs=Date.now()-q0;}
      await snap('afterProperty');
    }
  }
}catch(e){row.fatal=String(e)}
console.log('EARTHLINE_FOUR_DIAG '+JSON.stringify(row));
await browser.close();