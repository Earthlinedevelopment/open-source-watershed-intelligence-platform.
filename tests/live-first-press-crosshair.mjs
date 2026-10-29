import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
await page.goto(URL+'?first-press-crosshair='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(700);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:100});

async function runAt(target,label){
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
  },target);
  await page.waitForTimeout(250);
  const before=await page.evaluate(()=>({
    serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
    stored:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    center:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.();return c?{lng:Number(c.lng),lat:Number(c.lat)}:null})()
  }));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(b=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    return Number(a.serial)===b+1&&a.scientificSettled===true&&a.result===true;
  },before.serial,{timeout:90000,polling:100});
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    return a.visible===true&&Number(a.count||0)>0&&Number(a.renderedFeatures||0)>0;
  },{timeout:15000,polling:100});
  let elderMs=null;
  try{
    await page.waitForFunction(()=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
      return e.state==='committed'&&Number(e.featureCount||0)>0;
    },{timeout:20000,polling:100});
    elderMs=Date.now()-t0;
  }catch(_){}
  return await page.evaluate(({before,target,label,t0,elderMs})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
    const ac=window.EARTHLINE_PROPERTY_ACCEPTED_TARGET_M7839||null;
    const d=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
    const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
    const vis=id=>{try{return !!m?.getLayer?.(id)&&m.getLayoutProperty?.(id,'visibility')!=='none'}catch(_){return false}};
    return {
      label,serialBefore:before.serial,serialAfter:Number(a.serial||0),
      storedBefore:before.stored,mapCenterBefore:before.center,target,
      accepted:ac,declaration:d,
      swaleMs:Date.now()-t0,elderMs,
      corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,safeRendered:Number(s.renderedFeatures||0),
      safeVisible:safe.map(vis),naturalVisible:natural.map(vis),
      elderState:e.state||null,elderCount:Number(e.featureCount||0),
      elderLayers:(()=>{
        try{
          const ids=(m?.getStyle?.().layers||[]).map(x=>x.id).filter(id=>/elder|tree/i.test(String(id)));
          return ids.map(id=>{
            let visible=false,count=0;
            try{visible=m.getLayoutProperty?.(id,'visibility')!=='none';}catch(_){}
            try{count=m.queryRenderedFeatures?.({layers:[id]})?.length||0;}catch(_){}
            return {id,visible,count};
          });
        }catch(_){return [];}
      })()
    };
  },{before,target,label,t0,elderMs});
}

const first=await runAt({lng:-111.93066,lat:34.21568},'first');
await page.waitForTimeout(600);
const firstShot=(await page.screenshot({type:'jpeg',quality:45})).toString('base64');
console.log('EARTHLINE_SCREEN_FIRST '+firstShot);
const second=await runAt({lng:-111.93456,lat:34.21545},'second');
await page.waitForTimeout(600);
const secondShot=(await page.screenshot({type:'jpeg',quality:45})).toString('base64');
console.log('EARTHLINE_SCREEN_SECOND '+secondShot);
console.log('EARTHLINE_FIRST_PRESS_CROSSHAIR '+JSON.stringify({first,second}));
for(const r of [first,second]){
  const close=(p,t)=>p&&Math.abs(Number(p.lng)-t.lng)<.00008&&Math.abs(Number(p.lat)-t.lat)<.00008;
  if(r.serialAfter!==r.serialBefore+1)throw new Error(r.label+' did not start on one Property press');
  if(!close(r.accepted,r.target))throw new Error(r.label+' accepted stale target');
  if(!r.declaration||Math.abs(Number(r.declaration.center?.lng)-r.target.lng)>=.00008||Math.abs(Number(r.declaration.center?.lat)-r.target.lat)>=.00008)throw new Error(r.label+' declaration center stale');
  if(!(r.corridors>0&&r.renderVerified&&r.safeRendered>0&&r.safeVisible.every(Boolean)))throw new Error(r.label+' safe swales not visibly rendered');
  if(r.naturalVisible.some(Boolean))throw new Error(r.label+' natural/worm swales visible');
  if(r.elderState!=='committed'||!(r.elderCount>0))throw new Error(r.label+' Elders did not commit');
}
await browser.close();
