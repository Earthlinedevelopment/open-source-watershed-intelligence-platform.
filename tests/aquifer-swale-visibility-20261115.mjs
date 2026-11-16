import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const browser=await chromium.launch({headless:true});
const cases=['Arkansas','Iowa','Vermont'];
const rows=[];
mkdirSync('artifacts/aquifer-swale',{recursive:true});
try {
for(const name of cases){
 const page=await browser.newPage({viewport:{width:1600,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  await page.goto('https://earthlinedevelopment.org/?aquifer_swale_audit='+encodeURIComponent(name)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click()},name);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||Number(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated||0)>0,null,{timeout:85000});
  await page.waitForTimeout(3500);
  const result=await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
   const layers=m?.getStyle?.()?.layers||[];
   const filtered=layers.map((x,i)=>({id:x.id,type:x.type,index:i,visible:m?.getLayoutProperty?.(x.id,'visibility')||'visible'})).filter(x=>/aquifer|swale/i.test(x.id));
   const a=filtered.filter(x=>/aquifer/i.test(x.id)),sw=filtered.filter(x=>/swale/i.test(x.id));
   const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
   const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||{};
   const source=m?.getSource?.('el-live-swales-15970');
   const fc=source?._data||source?.serialize?.()?.data;
   const features=Array.isArray(fc?.features)?fc.features:[];
   const slopes=features.map(f=>Number(f?.properties?.slope_pct)).filter(Number.isFinite);
   const aquiferFill=a.filter(x=>x.type==='fill');
   const swaleLines=sw.filter(x=>x.type==='line');
   const aquiferAboveSwales=aquiferFill.some(fill=>swaleLines.some(line=>fill.index>line.index));
   return {profileId:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?.profileId||null,pubCount:pub.generated||0,sourceFeatures:features.length,
    maxSlope:slopes.length?Math.max(...slopes):null,selection:window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null,
    cap:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,aquiferModelCount:(typeof M!=='undefined'?M?.usgsAquifers?.length:null),
    aquiferAboveSwales,layerOrder:filtered,genCount:gen.publishedFeatures,genCandidates:gen.candidates,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  rows.push({name,...result,errors});
 }catch(e){rows.push({name,error:String(e),errors})}
 await page.close();
}
}finally {await browser.close();}
writeFileSync('artifacts/aquifer-swale/visibility.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_AQUIFER_SWALE_LAYER_AUDIT '+JSON.stringify(rows.map(({name,profileId,pubCount,sourceFeatures,maxSlope,aquiferModelCount,aquiferAboveSwales,layerOrder,genCount,genCandidates,error,errors})=>({name,profileId,pubCount,sourceFeatures,maxSlope,aquiferModelCount,aquiferAboveSwales,layerOrder,genCount,genCandidates,error,errors}))));
