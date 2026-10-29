import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
await page.goto(URL+'?live-two-property='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:100});

async function propertyRun(target,label){
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },target);
  await page.waitForFunction(t=>{
    const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!p&&Math.abs(Number(p.lng)-t.lng)<.00008&&Math.abs(Number(p.lat)-t.lat)<.00008;
  },target,{timeout:15000,polling:100});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(b=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    return Number(a.serial)===b+1&&a.result===true&&a.scientificSettled===true;
  },before,{timeout:90000,polling:100});
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    return a.visible===true&&Number(a.count||0)>0&&Number(a.renderedFeatures||0)>0;
  },{timeout:15000,polling:100});
  const swaleMs=Date.now()-t0;
  let elderMs=null;
  try{
    await page.waitForFunction(()=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
      return e.state==='committed'&&Number(e.featureCount||0)>0;
    },{timeout:20000,polling:100});
    elderMs=Date.now()-t0;
  }catch(_){}
  return await page.evaluate(({before,t0,label,elderMs,swaleMs})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const vis=id=>{try{return !!m?.getLayer?.(id)&&m.getLayoutProperty?.(id,'visibility')!=='none'}catch(_){return false}};
    return {
      label,serialBefore:before,serialAfter:Number(a.serial||0),swaleMs,elderMs,
      corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,
      safeRendered:Number(s.renderedFeatures||0),safeVisible:safe.map(vis),
      naturalVisible:natural.map(vis),elderState:e.state||null,elderCount:Number(e.featureCount||0)
    };
  },{before,t0,label,elderMs,swaleMs});
}

const first=await propertyRun({lng:-111.93066,lat:34.21568},'first');
const second=await propertyRun({lng:-111.93456,lat:34.21545},'second');
console.log('EARTHLINE_LIVE_TWO_PROPERTY '+JSON.stringify({first,second}));
for(const r of [first,second]){
  if(r.serialAfter!==r.serialBefore+1)throw new Error(r.label+' required more than one Property activation');
  if(!(r.corridors>0&&r.renderVerified&&r.safeRendered>0&&r.safeVisible.every(Boolean)))throw new Error(r.label+' safe swales not visibly rendered');
  if(r.naturalVisible.some(Boolean))throw new Error(r.label+' natural/worm swale layer visible');
  if(r.elderState!=='committed'||!(r.elderCount>0))throw new Error(r.label+' Elder publication did not commit');
}
await browser.close();
