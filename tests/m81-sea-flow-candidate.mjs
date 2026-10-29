import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const CASES=[
  {name:'Thailand',query:'Chiang Mai'},
  {name:'Vietnam',query:'Can Tho'},
  {name:'Laos',query:'Vientiane'}
];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
await installCandidateOrigin(context);
const rows=[];
for(const tc of CASES){
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let row={name:tc.name,query:tc.query,pass:false};
  try{
    await page.goto('https://earthlinedevelopment.org/?m81-sea='+encodeURIComponent(tc.query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(tc.query);await page.waitForTimeout(700);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:new RegExp(tc.query,'i')}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    const r0=Date.now();await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,s=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];return !!e||s.length>0},{timeout:25000,polling:100});
    const regional=await page.evaluate(()=>({
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
      aquiferStatus:String((window.M||{}).usgsAquiferStatus||'')
    }));
    const regionalWall=Date.now()-r0;
    if(regional.error)throw new Error('Regional '+JSON.stringify(regional.error));
    const generated=Number(regional.pub?.generated||0),visible=Number(regional.display?.swaleLines??regional.pub?.overlaySwaleLines??0);
    if(!(generated>0&&visible===generated))throw new Error('Regional visibility '+generated+'/'+visible);
    if(regional.flow?.unsafeSegments!=null&&Number(regional.flow.unsafeSegments)!==0)throw new Error('unsafe Regional swales');
    if(regional.boundary?.outsideAfterClip?.swales!=null&&Number(regional.boundary.outsideAfterClip.swales)!==0)throw new Error('outside jurisdiction');
    if(!(Number(regional.perf?.totalMs)>0&&Number(regional.perf.totalMs)<=15000))throw new Error('Regional core slow '+regional.perf?.totalMs);
    const target=await page.evaluate(()=>{
      const a=(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).sort((x,y)=>Number(x.properties?.rank||999)-Number(y.properties?.rank||999));
      const f=a[0];if(!f)return null;const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),source:'m81-sea-ranked',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0)};
    });
    if(!target)throw new Error('no ranked Property target');
    await page.evaluate(t=>{window.EARTHLINE_PROPERTY_TARGET_16201=t;window.earthlineSetPropertyTarget16201?.(t);},target);
    const p0=Date.now();const result=await page.evaluate(async()=>{
      try{return await window.earthlineDeclarePropertyAtCrosshair16173()}catch(e){return {error:String(e)}}
    });
    await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return a.scientificSettled===true&&a.settled===true},{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
    const propertyWall=Date.now()-p0;
    const property=await page.evaluate(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{},s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return{result:a.result===true,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeVisible:s.visible===true,safeRendered:Number(s.renderedFeatures||0),tier:String(document.documentElement.dataset.earthlineAnalysisTier||'')}})
    if(!(property.result&&property.corridors>0&&property.renderVerified&&property.safeVisible&&property.safeRendered>0&&property.tier==='property'))throw new Error('Property publication '+JSON.stringify(property));
    if(propertyWall>15000)throw new Error('Property slow '+propertyWall);
    row={name:tc.name,query:tc.query,pass:!errors.length,regionalWall,regionalCoreMs:Number(regional.perf?.totalMs||0),generated,visible,propertyWall,target,property,aquiferStatus:regional.aquiferStatus,errors};
  }catch(e){row={...row,error:String(e),errors}}
  rows.push(row);console.log('M81_SEA_FLOW '+JSON.stringify(row));
  await page.close();
}
await context.close();await browser.close();
console.log('M81_SEA_FLOW_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.name)}));
if(rows.some(r=>!r.pass))process.exitCode=1;
