import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
let out=null;
for(let attempt=1;attempt<=5&&!out;attempt++){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
 try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:50000,polling:150})}catch(_){ }
 await page.waitForTimeout(2200);
 const snap=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),s=m?.getSource?.('el-live-flows-15970'),fc=s?._data||s?._options?.data||{features:[]},flows=(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow').length,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim();return {flows,status}});
 if(!(snap.flows>0&&/published/i.test(snap.status)&&!/failed/i.test(snap.status))){await page.close();continue;}
 out=await page.evaluate(attempt=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
   const probes=[[650,290],[690,300],[730,290],[775,300],[820,300],[860,295],[900,300],[940,305]];
   const probeOut=probes.map(([x,y])=>{let fs=[];try{fs=m.queryRenderedFeatures([[x-8,y-8],[x+8,y+8]])||[]}catch(_){};const hits=fs.filter(f=>{const id=String(f.layer?.id||'');return /earthline|el-live/i.test(id)}).map(f=>({layer:f.layer?.id||null,type:f.layer?.type||null,source:f.source||null,sourceLayer:f.sourceLayer||null,geom:f.geometry?.type||null,featureType:f.properties?.feature_type||null}));return {px:[x,y],lngLat:m.unproject([x,y]).toArray(),hits};});
   const region=m.queryRenderedFeatures([[560,190],[1050,390]])||[],counts={};for(const f of region){const id=String(f.layer?.id||'');if(/earthline|el-live/i.test(id))counts[id]=(counts[id]||0)+1;}
   const style=m.getStyle();const earthlineLayers=(style.layers||[]).filter(l=>/earthline|el-live/i.test(l.id||'')&&['line','symbol','fill'].includes(l.type)).map(l=>({id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer'],lineColor:l.type==='line'?m.getPaintProperty(l.id,'line-color'):null,lineWidth:l.type==='line'?m.getPaintProperty(l.id,'line-width'):null,visibility:m.getLayoutProperty(l.id,'visibility')||'visible'}));
   return {attempt,probes:probeOut,regionCounts:counts,earthlineLayers,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
 },attempt);
 await page.close();
}
console.log('MANTRA38_LAKE_VISIBLE_LAYER '+JSON.stringify(out));if(!out)process.exitCode=1;await browser.close();
