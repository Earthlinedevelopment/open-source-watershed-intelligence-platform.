import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true,null,{timeout:30000,polling:200});
await page.waitForTimeout(2500);
const out=await page.evaluate(()=>{
 const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const bboxGeom=g=>{let xs=[],ys=[];const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&typeof v[0]==='number'&&typeof v[1]==='number'){xs.push(v[0]);ys.push(v[1]);return;}for(const x of v)walk(x)};walk(g?.coordinates);return xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:null};
 const audit=(sourceId,layerIds)=>{
   const src=m?.getSource?.(sourceId);const data=src?._data||null;const features=(data?.features||[]).map((f,i)=>({i,bbox:bboxGeom(f.geometry),props:Object.fromEntries(Object.entries(f.properties||{}).slice(0,12))}));
   const layers={};for(const id of layerIds){const l=m?.getLayer?.(id);layers[id]=l?{type:l.type,visibility:m.getLayoutProperty(id,'visibility')||'visible',paint:{fillColor:l.type==='fill'?m.getPaintProperty(id,'fill-color'):null,fillOpacity:l.type==='fill'?m.getPaintProperty(id,'fill-opacity'):null,lineColor:l.type==='line'?m.getPaintProperty(id,'line-color'):null,lineOpacity:l.type==='line'?m.getPaintProperty(id,'line-opacity'):null,lineWidth:l.type==='line'?m.getPaintProperty(id,'line-width'):null}}:null;}
   return {sourceId,featureCount:features.length,features:features.slice(0,40),layers};
 };
 const aquifer=audit('el-live-aquifer-15970',['el-live-aquifer-fill-15970','el-live-aquifer-line-15970','el-live-aquifer-label-15970']);
 const basin=audit('el-live-basin-15970',['el-live-basin-fill-15970','el-live-basin-line-15970']);
 const rendered={};for(const id of ['el-live-aquifer-fill-15970','el-live-basin-fill-15970']){try{rendered[id]=m.queryRenderedFeatures(undefined,{layers:[id]}).length}catch(e){rendered[id]=String(e)}}
 return {aquifer,basin,rendered,aquiferAudit:window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,aquiferVisibility:window.EARTHLINE_REGIONAL_AQUIFER_VISIBILITY_AUDIT_16374||null,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null};
});
console.log('MANTRA38_NY_FILL_AUDIT '+JSON.stringify(out));
await browser.close();
