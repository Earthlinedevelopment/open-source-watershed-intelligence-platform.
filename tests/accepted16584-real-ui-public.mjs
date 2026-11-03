import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
mkdirSync('artifacts/accepted-16584-real-ui',{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1500,height:920}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const results={};
async function inspect(label){
 const out=await page.evaluate(label=>{
 const map=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
 const m=(typeof M!=='undefined'?M:window.M);
 const s=map?.getStyle?.()||{};
 const ws=(s.layers||[]).filter(x=>/water|stream|hydro|flow|river|corridor/i.test(x.id)||/water|stream|hydro|flow|river/i.test(x['source-layer']||'')).slice(0,80);
 const waterSources=Object.keys(s.sources||{}).filter(x=>/water|stream|hydro|flow|river/i.test(x));
 const layerData=ws.map(x=>({id:x.id,type:x.type,visibility:map.getLayoutProperty(x.id,'visibility')||'visible',
   opacity:(()=>{try{return map.getPaintProperty(x.id,x.type==='line'?'line-opacity':x.type==='fill'?'fill-opacity':'circle-opacity')}catch{return null}})()}));
 let rendered=0;try{rendered=map.queryRenderedFeatures({layers:ws.filter(x=>map.getLayer(x.id)).map(x=>x.id)}).length}catch{}
 const safe=m?.authoritativeSafeSwales15815;
 return {label,center:map?.getCenter?.(),zoom:map?.getZoom?.(),tier:document.documentElement.dataset.earthlineAnalysisTier,region:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated,
  property:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  safeArray:safe?.features?.length??safe?.length??null,
  waterLayers:layerData,waterSources,renderedWaterAndCorridors:rendered,
  buttons:[...document.querySelectorAll('button')].filter(b=>/property|crosshair/i.test(b.id+' '+b.textContent)).slice(0,8).map(b=>({id:b.id,text:b.textContent.trim().slice(0,70),display:getComputedStyle(b).display})),
  status:document.getElementById('earthlineVermontStatus16147')?.textContent?.trim().slice(0,300)};
 },label);
 console.log('ACCEPTED_16584_REAL_UI '+JSON.stringify(out));
 results[label]=out;
 await page.screenshot({path:'artifacts/accepted-16584-real-ui/'+label+'.png'});
 return out;
}
try{
 await page.goto('https://earthlinedevelopment.org/?accepted16584ui='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#searchInput').fill('Vermont');
 /* Visible search suggestion is deliberately above Run; choose it like a user. */
 const options=page.locator('#earthlineSearchSuggestions15970 strong');
 try{await options.first().waitFor({state:'visible',timeout:7000});await options.first().click();}
 catch(e){errors.push('suggestion:'+String(e));await page.locator('#searchInput').press('Escape');await page.locator('#runBtn').click();}
 if(!await page.evaluate(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0)){
  try{await page.waitForTimeout(1000);if(!await page.evaluate(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0))await page.locator('#runBtn').click({timeout:9000});}catch(e){errors.push('run-button-after-suggestion:'+String(e))}
 }
 try{await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:48000,polling:300})}catch(e){errors.push('region:'+String(e))}
 await inspect('vermont-regional');
 await page.evaluate(()=>{
   const map=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
   map?.stop?.();map?.jumpTo?.({center:[-73.012909,44.513845],zoom:17.8});
 });
 await page.waitForTimeout(1600);
 const button=page.locator('#earthlineDeclareProperty16169');
 if(await button.count()&&await button.isVisible()){await button.click({timeout:8000});
 try{await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:50000,polling:200})}catch(e){errors.push('property:'+String(e))}
 await page.waitForTimeout(700);
 await inspect('vermont-property-click');
 }else errors.push('Property button unavailable');
}catch(e){errors.push('fatal:'+String(e));}
results.errors=errors;
writeFileSync('artifacts/accepted-16584-real-ui/results.json',JSON.stringify(results,null,2));
console.log('ACCEPTED_16584_SUMMARY '+JSON.stringify({regional:results['vermont-regional']?.region,property:results['vermont-property-click']?.safeArray,
  regionalWaterLayers:results['vermont-regional']?.waterLayers?.length,
  waterVisible:results['vermont-regional']?.renderedWaterAndCorridors,errors}));
await browser.close();
if(errors.length||!results['vermont-property-click']?.safeArray)process.exitCode=1;