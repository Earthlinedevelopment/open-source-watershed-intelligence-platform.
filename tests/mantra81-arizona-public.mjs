import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto(URL+'?mantra81-az='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
const regionalStart=Date.now();
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
await page.waitForFunction(()=>{
  const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
  return !!err||sw.length>0;
},{timeout:45000,polling:100}).catch(()=>{});
const regional=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,err:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
if(regional.err)throw new Error('Arizona Regional error '+JSON.stringify(regional.err));
if(!(Number(regional.perf?.totalMs)>0&&Number(regional.perf?.totalMs)<=15000))throw new Error('Arizona Regional core too slow '+JSON.stringify(regional.perf));
const regionalWall=Date.now()-regionalStart;

async function runAt(target,label){
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
  },target);
  await page.waitForTimeout(300);
  const before=await page.evaluate(()=>({
    serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    center:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null})()
  }));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(b=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    return Number(a.serial)===b+1&&a.scientificSettled===true&&a.result===true;
  },before.serial,{timeout:60000,polling:100});
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    return a.visible===true&&Number(a.count||0)>0&&Number(a.renderedFeatures||0)>0;
  },{timeout:15000,polling:100});
  await page.waitForFunction(()=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    return e.state==='committed'&&Number(e.featureCount||0)>0;
  },{timeout:20000,polling:100});
  await page.waitForFunction(()=>{try{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return (m?.queryRenderedFeatures?.({layers:['earthline-elder-tree-points-17097']})?.length||0)>0}catch(_){return false}},{timeout:5000,polling:100});
  const wallMs=Date.now()-t0;
  return page.evaluate(({before,target,label,wallMs})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const ac=window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null;
    const d=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const vis=id=>{try{return !!m?.getLayer?.(id)&&m.getLayoutProperty?.(id,'visibility')!=='none'}catch(_){return false}};
    let elderRendered=0;
    try{elderRendered=m?.queryRenderedFeatures?.({layers:['earthline-elder-tree-points-17097']})?.length||0}catch(_){}
    return {
      label,serialBefore:before.serial,serialAfter:Number(a.serial||0),mapCenterBefore:before.center,target,
      accepted:ac,declaration:d,wallMs,corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,
      safeRendered:Number(s.renderedFeatures||0),safeVisible:safe.map(vis),naturalVisible:natural.map(vis),
      elderState:e.state||null,elderCount:Number(e.featureCount||0),elderRendered,
      zeroReason:(window.M||{}).prescriptionZeroReason15870||null
    };
  },{before,target,label,wallMs});
}

const first=await runAt({lng:-111.93066,lat:34.21568},'first');
const second=await runAt({lng:-111.93456,lat:34.21545},'second');
const close=(p,t)=>p&&Math.abs(Number(p.lng)-t.lng)<.00008&&Math.abs(Number(p.lat)-t.lat)<.00008;
console.log('MANTRA81_AZ '+JSON.stringify({regionalWall,regionalCoreMs:regional.perf?.totalMs,first,second}));
for(const r of [first,second]){
  if(r.serialAfter!==r.serialBefore+1)throw new Error(r.label+' not one-press');
  if(!close(r.accepted,r.target))throw new Error(r.label+' stale accepted target');
  if(!r.declaration||!close(r.declaration.center,r.target))throw new Error(r.label+' stale declaration center');
  if(!(r.corridors>0&&r.renderVerified&&r.safeRendered>0&&r.safeVisible.every(Boolean)))throw new Error(r.label+' bioswales not rendered');
  if(r.naturalVisible.some(Boolean))throw new Error(r.label+' old natural swales visible');
  if(r.elderState!=='committed'||!(r.elderCount>0)||!(r.elderRendered>0))throw new Error(r.label+' Elders not visibly rendered');
  if(r.wallMs>15000)throw new Error(r.label+' Property too slow '+r.wallMs+'ms');
}
if(errors.length)throw new Error('page errors '+JSON.stringify(errors));
await browser.close();
