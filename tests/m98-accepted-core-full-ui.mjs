import {chromium} from 'playwright';
import {existsSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const dir='artifacts/m98-actual-controls';mkdirSync(dir,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push('console:'+m.text())});
const bad=[];page.on('response',r=>{if(r.status()>=400&&r.url().includes('earthlinedevelopment.org'))bad.push({status:r.status(),url:r.url()})});
const root=process.cwd();
await page.route('**/*',route=>{
  const u=new URL(route.request().url());
  if(u.origin!=='https://earthlinedevelopment.org')return route.continue();
  let rel;
  try{rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
  const f=path.resolve(root,rel);
  if((f!==root&&!f.startsWith(root+path.sep))||!existsSync(f)||!statSync(f).isFile())return route.abort();
  const ext=path.extname(f).toLowerCase(),mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
  return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:readFileSync(f)});
});
let region=null,prop=null,language=null,fatal=null;
try{
 await page.goto('https://earthlinedevelopment.org/?m98_candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.locator('#searchInput').fill('Arizona');
 const suggest=page.locator('#earthlineSearchSuggestions15970 strong');
 if(await suggest.count()&&await suggest.first().isVisible()){
    await suggest.first().click({timeout:7000});
 }else await page.locator('#runBtn').click({timeout:7000});
 await page.waitForFunction(()=>window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated>0||window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:60000,polling:170});
 await page.waitForTimeout(2300);
 region=await page.evaluate(()=>{
  const m=typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap;
  const overlay=document.getElementById('earthlineRegionalVectorOverlay16020');
  const regional=overlay?.querySelector('[data-layer="swale-opportunities"]');
  const lines=[...regional?.querySelectorAll('path')||[]].filter(p=>p.getAttribute('stroke')==='rgba(8,18,13,.96)');
  const widths=lines.map(p=>parseFloat(p.style.strokeWidth||p.getAttribute('stroke-width')||'0'));
  const source=m?.getSource?.('el-live-flows-15970');
  const flowFeatures=source?._data?.features?.length??null;
  const layer=m?.getLayer?.('el-live-flow-line-15970');
  const visible=!!layer&&m.getLayoutProperty(layer.id,'visibility')!=='none';
  const opacity=layer?m.getPaintProperty(layer.id,'line-opacity'):null;
  let flowRendered=0;try{if(layer)flowRendered=m.queryRenderedFeatures({layers:[layer.id]}).length}catch{}
  return {count:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.generated,zoom:m?.getZoom?.(),
    worms:{blackPathCount:lines.length,maxWidth:Math.max(0,...widths),over10px:widths.filter(x=>x>10).length},
    water:{sourceReady:!!source,featureCount:flowFeatures,layerVisible:visible,paintOpacity:opacity,renderedFeatures:flowRendered}};
 });
 console.log('M98_REGIONAL '+JSON.stringify(region));
 await page.screenshot({path:dir+'/arizona-regional.png'});
 await page.evaluate(()=>{const m=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);m.stop();m.jumpTo({center:[-111.93066,34.21568],zoom:17.7})});
 await page.waitForTimeout(1700);
 const before=await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201);
 const btn=page.locator('#earthlineDeclareProperty16169');
 await btn.click({timeout:12000});
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:65000,polling:175});
 try{await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed'&&window.EARTHLINE_ELDER_TREE_LAST_17097?.featureCount>0,null,{timeout:24000,polling:220})}catch(e){errors.push('ELDER_SETTLE '+String(e).slice(0,180))}
 await page.waitForTimeout(2400);
 prop=await page.evaluate(before=>{
  const m=(typeof earthlineMap!=='undefined'?earthlineMap:window.earthlineMap);
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
  const pub=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
  const eid='earthline-elder-tree-points-17097';
  const e=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
  const src=m?.getSource?.('earthline-elder-trees-17097');
  const ids=['earthline-property-safe-water-16221','earthline-property-safe-water-2-m98'];
  const line=ids.map(id=>({id,present:!!m?.getLayer?.(id),opacity:m?.getLayer?.(id)?m.getPaintProperty(id,'line-opacity'):null,dash:m?.getLayer?.(id)?m.getPaintProperty(id,'line-dasharray'):null,
    source:m?.getLayer?.(id)?.source||null}));
  let waterRendered=0,elderRendered=0;
  try{waterRendered=m.queryRenderedFeatures({layers:ids.filter(x=>m.getLayer(x))}).length}catch{}
  try{elderRendered=m.queryRenderedFeatures({layers:[eid]}).length}catch{}
  return {before,center:a.center,settled:a.settled,result:a.result,corridors:a.corridors,safeCount:pub.count,
    blue:line,waterRendered,elder:{status:e.state,count:e.featureCount,sourceCount:src?._data?.features?.length??null,layer:!!m?.getLayer?.(eid),rendered:elderRendered},
    sourceSafety:pub.verified,errors:window.EARTHLINE_RUNTIME_ERRORS_15857?.slice(-2)};
 },before);
 console.log('M98_PROPERTY '+JSON.stringify(prop));
 await page.screenshot({path:dir+'/arizona-property.png'});
 const sel=page.locator('#earthlineLanguage16488');
 await sel.waitFor({state:'visible',timeout:18000});
 language={options:await sel.locator('option').evaluateAll(nodes=>nodes.map(x=>({code:x.value,label:x.textContent}))),results:[]};
 for(const code of ['th','vi','lo','en']){
  await sel.selectOption(code);
  await page.waitForTimeout(130);
  const r=await page.evaluate(()=>({lang:document.documentElement.lang,key:localStorage.getItem('earthlineLanguage16488'),label:document.getElementById('earthlineLanguageLabel16488')?.textContent}));
  language.results.push({requested:code,...r});
 }
 console.log('M98_LANGUAGES '+JSON.stringify(language));
}catch(e){fatal=String(e);console.log('M98_FATAL '+fatal)}
const checks={
  regional:!!region&&region.count>0,
  wormFree:!!region&&region.worms.over10px===0,
  regionalWater:!!region&&region.water.sourceReady&&region.water.layerVisible&&(region.water.featureCount>0||region.water.renderedFeatures>0),
  property:!!prop&&prop.settled&&prop.result&&prop.safeCount>=20&&Math.abs(prop.center.lng+111.93066)<.00001,
  blueVisible:!!prop&&prop.blue.length===2&&prop.blue.every(x=>x.present&&x.opacity>=.95&&x.dash?.length===2)&&prop.waterRendered>0,
  elders:!!prop&&prop.elder.status==='committed'&&prop.elder.count>0&&prop.elder.layer&&prop.elder.rendered>0,
  languages:!!language&&language.options.map(x=>x.code).join(',')==='en,th,vi,lo'&&language.results.every(x=>x.lang===x.requested&&x.key===x.requested),
  noJsErrors:errors.length===0&&!fatal
};
console.log('M98_FULL_ACCEPTANCE '+JSON.stringify({pass:Object.values(checks).every(Boolean),checks,fatal,errors:errors.slice(0,7),bad:bad.slice(0,7)}));
writeFileSync(dir+'/result.json',JSON.stringify({checks,region,prop,language,fatal,errors,bad},null,2));
await browser.close();
if(!Object.values(checks).every(Boolean))process.exitCode=1;