import { chromium } from 'playwright';
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1798,height:831}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?blue_owner_17500='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(800);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const requested={lng:-111.93067,lat:34.21568};
await page.evaluate(({lng,lat})=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[lng,lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}
},requested);
await page.waitForFunction(({lng,lat})=>{
 const t=window.EARTHLINE_PROPERTY_TARGET_16201;return !!t&&Math.abs(Number(t.lng)-lng)<.00008&&Math.abs(Number(t.lat)-lat)<.00008;
},requested,{timeout:15000,polling:80});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click({timeout:10000});
await page.waitForFunction(prev=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>prev&&a.settled===true},before,{timeout:90000,polling:120});
await page.waitForFunction(()=>{const e=window.EARTHLINE_ELDER_TREE_LAST_17097;return !!e&&(e.state==='committed'||e.state==='failed')},null,{timeout:45000,polling:120}).catch(()=>{});
await page.waitForTimeout(700);
const snap=await page.evaluate(({lng,lat})=>{
 const md=(typeof M!=='undefined'&&M)||window.M||{},m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'].filter(id=>m?.getLayer?.(id));
 const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'].filter(id=>m?.getLayer?.(id));
 const c=m?.getCanvas?.(),box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
 const rendered=(ids)=>box&&ids.length?(m.queryRenderedFeatures?.(box,{layers:ids})||[]).length:0;
 const p=(id,key)=>{try{return m?.getLayer?.(id)?m.getPaintProperty(id,key):null}catch(_){return null}};
 const target=window.EARTHLINE_PROPERTY_TARGET_16201||null,decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||null;
 const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
 return {
   target,decl,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
   lock:md?.propertyResultLock15815||null,swales:Number(md?.authoritativeSafeSwales15815?.features?.length||0),
   water:Number(md?.authoritativeWaterPaths15824?.features?.length||0),elder,
   naturalRendered:rendered(natural),safeRendered:rendered(safe),
   safeStyle:safe.map(id=>({id,color:p(id,'line-color'),opacity:p(id,'line-opacity'),dash:p(id,'line-dasharray'),width:p(id,'line-width')})),
   naturalVisibility:natural.map(id=>({id,visibility:m.getLayoutProperty?.(id,'visibility'),lineOpacity:p(id,'line-opacity'),fillOpacity:p(id,'fill-opacity')})),
   spacing:Number(md?.swaleMeta?.measuredMedianSpacingM),
   recharge:Number(md?.rechZones?.length||0),aquifer:String(md?.usgsAquiferStatus||''),
   requested:{lng,lat}
 };
},requested);
const near=(a,b)=>Math.abs(Number(a)-Number(b))<.00008;
const life=snap.safeStyle.find(x=>x.id==='earthline-property-safe-life-16221'),water=snap.safeStyle.find(x=>x.id==='earthline-property-safe-water-16221');
const dotted=Array.isArray(life?.dash)&&life.dash.length>0&&Array.isArray(water?.dash)&&water.dash.length>0;
const pass=
  near(snap.target?.lng,requested.lng)&&near(snap.target?.lat,requested.lat)&&
  near(snap.decl?.center?.lng,requested.lng)&&near(snap.decl?.center?.lat,requested.lat)&&
  snap.run?.settled===true&&snap.run?.result===true&&snap.pub?.published===true&&snap.lock?.safetyVerified===true&&
  snap.swales>0&&snap.water>0&&String(snap.elder?.state||'')==='committed'&&Number(snap.elder?.featureCount||0)>0&&
  snap.naturalRendered===0&&snap.safeRendered>0&&dotted&&errors.length===0;
console.log('EARTHLINE_BLUE_OWNER_17500 '+JSON.stringify({pass,snap,errors}));
await page.screenshot({path:'/tmp/earthline-blue-owner-17500.png',fullPage:true});
await browser.close();
if(!pass)process.exitCode=1;
