import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
let last=null;
for(let attempt=1;attempt<=4;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto('https://earthlinedevelopment.org/?counttrace='+Date.now()+'-'+attempt,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForTimeout(2200);
  const invoke=await page.evaluate(async()=>{
    const t={lng:-105.55114,lat:39.02639,source:'crosshair',code:'',score:0,query:'Colorado',parentRunToken:'',at:new Date().toISOString()};
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    try{window.earthlineSetPropertyTarget16201?.(t);}catch(_){}
    try{window.earthlineMap?.jumpTo?.({center:[t.lng,t.lat],zoom:16.5,bearing:0,pitch:0});}catch(_){}
    try{return {value:await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173())}}
    catch(e){return {error:String(e?.stack||e)}}
  });
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:90000,polling:100}).catch(()=>{});
  await page.waitForTimeout(1300);
  const out=await page.evaluate(()=>{
    const summarize=v=>{
      try{
        if(v==null)return null;
        if(Array.isArray(v))return {kind:'array',length:v.length,first:v[0]||null};
        if(v?.type==='FeatureCollection'&&Array.isArray(v.features))return {kind:'FeatureCollection',length:v.features.length,first:v.features[0]||null};
        if(typeof v==='object')return {kind:'object',keys:Object.keys(v).slice(0,40),length:Number(v.length)||null,features:Array.isArray(v.features)?v.features.length:null};
        return {kind:typeof v,value:String(v)};
      }catch(e){return {error:String(e)}}
    };
    const auditNames=Object.keys(window).filter(k=>
      /SWALE|CORRIDOR|PROPERTY.*(SAFE|RESULT|PUBLICATION|AUDIT)|SAFETY.*15806|SCORE_ORDER_16717|SPATIAL_COVERAGE_SELECTION_16736|FINAL_PUBLISHED_SPREAD_16783/i.test(k)
    ).sort();
    const audits={};
    for(const k of auditNames){
      try{
        const v=window[k];
        if(v&&typeof v==='object'){
          const json=JSON.stringify(v);
          if(json.length<25000)audits[k]=v;
          else audits[k]={_large:true,keys:Object.keys(v).slice(0,60)};
        }
      }catch(_){}
    }
    return {
      invoke,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.M?.propertyPublication15816||window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      selection:window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,
      supportedCapacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
      spatialCoverage:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
      finalSpread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,
      M:{
        swales:summarize(window.M?.swales),
        authoritativePropertySwales15800:summarize(window.M?.authoritativePropertySwales15800),
        authoritativeSafeSwales15815:summarize(window.M?.authoritativeSafeSwales15815),
        propertyResultLock15815:summarize(window.M?.propertyResultLock15815),
        propertySafetyAudit15806:summarize(window.M?.propertySafetyAudit15806),
        vectorNoBuildCoverage:summarize(window.M?.vectorNoBuildCoverage)
      },
      audits
    };
  });
  console.log('PROPERTY_COUNT_TRACE_ATTEMPT_'+attempt+' '+JSON.stringify(out));
  last=out;
  await page.close();
  if(out.run?.result===true){break;}
}
await browser.close();
if(last?.run?.result!==true)throw new Error('no successful Property publication after retries');
