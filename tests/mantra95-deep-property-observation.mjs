import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/m95-deep',{recursive:true});
const browser=await chromium.launch({headless:true});
const coords=[
 {name:'default-crosshair',lng:null,lat:null},
 {name:'pinned-control-via-map',lng:-111.93066,lat:34.21568}
];
for(const c of coords){
 const page=await browser.newPage({viewport:{width:1600,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const trace=[];
 async function capture(stage){
  const r=await page.evaluate(stage=>{
   const m=(typeof M!=='undefined'?M:window.M)||{};
   const map=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
   const el=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
   const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
   const src=map?.getSource?.('earthline-elder-trees-17097');
   const prop=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
   const pub=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
   const e=window.earthlineGetExclusionEvidence16516?.()||null;
   const co=map?.getCenter?.();
   return {stage,center:co?{lng:co.lng,lat:co.lat}:null,zoom:map?.getZoom?.(),
    target,tier:document.documentElement.dataset.earthlineAnalysisTier,
    property:prop?{stage:prop.stage,settled:prop.settled,result:prop.result,corridors:prop.corridors,error:prop.error,sourceEvidence:prop.sourceEvidence,source:prop.publicationAudit,safeFallback:prop.safeFallback}:null,
    publication:pub?{published:pub.published,engineCount:pub.engineCount,safeCount:pub.safeCount}:null,
    modeledSwales:Array.isArray(m.swales)?m.swales.length:null,
    authoritativeSwales:m.authoritativeSafeSwales15815?.features?.length??null,
    safetyAudit:m.safetyAudit15806||null,exclusion:e,vectorCoverage:m.vectorNoBuildCoverage||null,
    elder:el?{state:el.state,count:el.featureCount,mapPublished:el.mapPublished,propertyRunIdentity:el.propertyRunIdentity,dynamicError:el.dynamicError}:null,
    elderSource:src?._data?.features?.length??null,
    status:document.getElementById('earthlineVermontStatus16147')?.textContent?.trim()?.slice(0,380),
    evidenceText:document.getElementById('earthlineExclusionEvidence16516')?.innerText?.slice(0,380)
   };
  },stage);
  trace.push(r);console.log('M95_DEEP '+JSON.stringify({name:c.name,...r}));
 }
 try{
   await page.goto('https://earthlinedevelopment.org/?m95deep='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
   await page.locator('#searchInput').fill('Arizona');
   await page.locator('#runBtn').click();
   await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:55000});
   if(c.lat!=null){
    await page.evaluate(({lng,lat})=>{
      const mp=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
      mp.stop();mp.jumpTo({center:[lng,lat],zoom:17.7});
    },c);
    await page.waitForTimeout(1400);
   }
   await capture('before-click');
   const b=page.locator('#earthlineDeclareProperty16169');
   if(!(await b.isVisible()))throw Error('Property button not visible');
   await b.click();
   await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:55000});
   await capture('property-settled');
   await page.waitForTimeout(10000);
   await capture('property-after-10-sec');
   await page.screenshot({path:'artifacts/m95-deep/'+c.name+'.png'});
 }catch(e){errors.push(String(e));try{await capture('error')}catch{}}
 writeFileSync('artifacts/m95-deep/'+c.name+'.json',JSON.stringify({errors,trace},null,2));
 await page.close();
}
await browser.close();