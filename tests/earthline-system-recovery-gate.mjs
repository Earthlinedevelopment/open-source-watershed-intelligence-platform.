import { chromium } from 'playwright';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(BASE+'?earthline_recovery_gate='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});

if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(250);
}
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count()) await opt.click({timeout:10000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
await page.waitForTimeout(700);

async function runProperty(lng,lat,label){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(({lng,lat})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[lng,lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },{lng,lat});
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!t&&Math.abs(Number(t.lng)-lng)<=0.00008&&Math.abs(Number(t.lat)-lat)<=0.00008;
  },{lng,lat},{timeout:15000,polling:100});

  const button=page.locator('#earthlineDeclareProperty16169');
  await button.waitFor({state:'visible',timeout:15000});
  const disabledBefore=await button.isDisabled().catch(()=>false);
  const t0=Date.now();
  await button.click({timeout:10000});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return !!a&&Number(a.serial||0)>prev&&a.settled===true;
  },before,{timeout:90000,polling:120});
  const elapsedMs=Date.now()-t0;
  await page.waitForFunction(()=> {
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    return !!e&&(e.state==='committed'||e.state==='failed');
  },null,{timeout:45000,polling:120}).catch(()=>{});
  await page.waitForTimeout(600);

  return await page.evaluate(({lng,lat,label,disabledBefore,elapsedMs})=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const fc=md?.authoritativeSafeSwales15815;
    const swales=Array.isArray(fc?.features)?fc.features:[];
    const naturalIds=[
      'earthline-property-swale-footprint-16174',
      'earthline-property-swale-natural-casing-16174',
      'earthline-property-swale-natural-up-16174',
      'earthline-property-swale-natural-flip-16174',
      'earthline-property-swale-neutral-16177'
    ];
    const safeIds=[
      'earthline-property-safe-casing-16221',
      'earthline-property-safe-earth-16221',
      'earthline-property-safe-life-16221',
      'earthline-property-safe-water-16221'
    ];
    const canvas=map?.getCanvas?.();
    const box=canvas?[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]]:null;
    const getLayer=(id)=>!!map?.getLayer?.(id);
    const paint=(id,p)=>{try{return getLayer(id)?map.getPaintProperty(id,p):null}catch(_){return null}};
    const layout=(id,p)=>{try{return getLayer(id)?map.getLayoutProperty(id,p):null}catch(_){return null}};
    let naturalRendered=0,safeRendered=0,elderRendered=0;
    try{
      const n=naturalIds.filter(getLayer),s=safeIds.filter(getLayer);
      naturalRendered=box&&n.length?(map.queryRenderedFeatures?.(box,{layers:n})||[]).length:0;
      safeRendered=box&&s.length?(map.queryRenderedFeatures?.(box,{layers:s})||[]).length:0;
      elderRendered=box&&getLayer('earthline-elder-tree-points-17097')?(map.queryRenderedFeatures?.(box,{layers:['earthline-elder-tree-points-17097']})||[]).length:0;
    }catch(_){}
    const elderSrc=map?.getSource?.('earthline-elder-trees-17097');
    const elderData=elderSrc&&(elderSrc._data||elderSrc._options?.data);
    const publication=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const run=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    const lock=md?.propertyResultLock15815||null;
    const meta=md?.swaleMeta||null;
    const flow=md?.flowFirstPlacement15836||null;
    const water=md?.authoritativeWaterPaths15824;
    const waterFeatures=Array.isArray(water?.features)?water.features:[];
    const propKeys=swales[0]?Object.keys(swales[0].properties||{}):[];
    const slopeValues=[];
    for(const f of swales){
      const p=f?.properties||{};
      for(const k of ['slopePct','slope_pct','maxSlopePct','max_slope_pct','slope_percent']){
        const v=Number(p[k]); if(Number.isFinite(v)) slopeValues.push(v);
      }
    }
    return {
      label,requested:{lng,lat},disabledBefore,elapsedMs,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      run,publication,lock,meta,
      flow:{eligiblePaths:Number(flow?.eligiblePaths||0),pathsServed:Number(flow?.pathsServed||0),unservedCount:Array.isArray(flow?.unserved)?flow.unserved.length:0},
      swales:{count:swales.length,propertyKeys:propKeys,maxRecordedSlope:slopeValues.length?Math.max(...slopeValues):null},
      water:{count:waterFeatures.length,publication:md?.authoritativeWaterPublication15824||null},
      aquifer:{status:String(md?.usgsAquiferStatus||''),polys:Number(md?.usgsAquifers?.length||0),owner:md?.propertyAquiferOwner16393||null},
      recharge:{count:Number(md?.rechZones?.length||0)},
      elder:{last:elder,sourceFeatures:Array.isArray(elderData?.features)?elderData.features.length:null,rendered:elderRendered,layer:getLayer('earthline-elder-tree-points-17097'),visibility:layout('earthline-elder-tree-points-17097','visibility')},
      presentation:{
        naturalRendered,safeRendered,
        natural:naturalIds.map(id=>({id,exists:getLayer(id),visibility:layout(id,'visibility'),lineOpacity:paint(id,'line-opacity'),fillOpacity:paint(id,'fill-opacity'),width:paint(id,'line-width'),color:paint(id,'line-color')})),
        safe:safeIds.map(id=>({id,exists:getLayer(id),visibility:layout(id,'visibility'),opacity:paint(id,'line-opacity'),width:paint(id,'line-width'),color:paint(id,'line-color'),dash:paint(id,'line-dasharray'),offset:paint(id,'line-offset')}))
      },
      pageErrors:[...window.__earthlineRecoveryGateErrors||[]]
    };
  },{lng,lat,label,disabledBefore,elapsedMs});
}

await page.evaluate(()=>{window.__earthlineRecoveryGateErrors=[];window.addEventListener('error',e=>window.__earthlineRecoveryGateErrors.push(String(e.error||e.message||e)))});
const controls=[
  {label:'AZ-FIRST',lng:-111.93067,lat:34.21568},
  {label:'AZ-SECOND',lng:-111.93456,lat:34.21545}
];
const rows=[];
for(const c of controls) rows.push(await runProperty(c.lng,c.lat,c.label));

const near=(a,b,t=0.00008)=>Number.isFinite(Number(a))&&Math.abs(Number(a)-Number(b))<=t;
const results=rows.map(r=>{
  const spacing=Number(r.meta?.measuredMedianSpacingM);
  const slopeOk=r.swales.maxRecordedSlope==null || r.swales.maxRecordedSlope<=4.000001;
  const frameOk=r.run?.settled===true && r.run?.result===true && r.publication?.published===true;
  const safetyOk=r.lock?.safetyVerified===true;
  const targetOk=near(r.target?.lng,r.requested.lng)&&near(r.target?.lat,r.requested.lat)&&near(r.declaration?.center?.lng,r.requested.lng)&&near(r.declaration?.center?.lat,r.requested.lat);
  const systemsOk=r.swales.count>0&&r.water.count>0&&String(r.elder?.last?.state||'')==='committed'&&Number(r.elder?.last?.featureCount||0)>0&&r.elder.layer===true&&r.elder.visibility!=='none';
  const spacingOk=!Number.isFinite(spacing)||(spacing>=4.572&&spacing<=7.62);
  const presentationOk=r.presentation.naturalRendered===0 && r.presentation.safeRendered>0;
  return {label:r.label,targetOk,frameOk,safetyOk,slopeOk,spacingOk,systemsOk,presentationOk,pass:targetOk&&frameOk&&safetyOk&&slopeOk&&spacingOk&&systemsOk&&presentationOk};
});
const summary={pass:results.every(x=>x.pass)&&pageErrors.length===0,results,rows,pageErrors};
console.log('EARTHLINE_SYSTEM_RECOVERY_GATE '+JSON.stringify(summary));
await page.screenshot({path:'/tmp/earthline-system-recovery-gate.png',fullPage:true});
await browser.close();
if(!summary.pass)process.exitCode=1;
