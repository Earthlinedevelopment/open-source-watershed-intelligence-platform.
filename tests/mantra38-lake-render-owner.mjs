import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
let published=null;
for(let attempt=1;attempt<=4&&!published;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329?.passed===true||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:45000,polling:150});}catch(_){ }
  await page.waitForTimeout(2200);
  const r=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null); if(!mp)return {ok:false,reason:'no-map'};
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
    const pre=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null;
    const style=mp.getStyle?.()||{};
    const val=v=>{try{return JSON.parse(JSON.stringify(v))}catch(_){return String(v)}};
    const visible=[];
    for(const l of style.layers||[]){
      let vis='visible';try{vis=mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){}
      if(vis==='none')continue;
      const tag=((l.id||'')+' '+(l['source-layer']||'')).toLowerCase();
      if(!/flow|water|lake|river|stream|hydro|earthline|swale|contour/.test(tag))continue;
      let color=null,width=null,opacity=null;
      if(l.type==='line'){try{color=mp.getPaintProperty(l.id,'line-color')}catch(_){};try{width=mp.getPaintProperty(l.id,'line-width')}catch(_){};try{opacity=mp.getPaintProperty(l.id,'line-opacity')}catch(_){};}
      visible.push({id:l.id,type:l.type,source:l.source||null,sourceLayer:l['source-layer']||null,filter:val(l.filter||null),color:val(color),width:val(width),opacity:val(opacity)});
    }
    const probes=[];
    for(let lat=43.18;lat<=43.70;lat+=0.04){for(let lng=-79.15;lng<=-76.20;lng+=0.06){
      const p=mp.project([lng,lat]);
      if(!p||p.x<0||p.x>1800||p.y<0||p.y>1000)continue;
      let fs=[];try{fs=mp.queryRenderedFeatures([[p.x-3,p.y-3],[p.x+3,p.y+3]])||[]}catch(_){}
      const hits=[];
      for(const f of fs){const id=f?.layer?.id||'';const t=((id||'')+' '+(f?.layer?.['source-layer']||'')).toLowerCase();if(/flow|water|lake|river|stream|hydro|earthline/.test(t))hits.push({id,source:f?.layer?.source||null,sourceLayer:f?.layer?.['source-layer']||null,geom:f?.geometry?.type||null,props:{feature_type:f?.properties?.feature_type||null,class:f?.properties?.class||null,type:f?.properties?.type||null,name:f?.properties?.name||null}})}
      if(hits.length)probes.push({coord:[Number(lng.toFixed(3)),Number(lat.toFixed(3))],hits});
    }}
    const src=mp.getSource?.('el-live-flows-15970'); const fc=src?._data||src?._options?.data||{features:[]};
    const flowFeatures=(fc.features||[]).filter(f=>f?.properties?.feature_type==='flow');
    const north=[];
    for(let i=0;i<flowFeatures.length;i++){const c=flowFeatures[i]?.geometry?.coordinates||[];const pts=c.filter(p=>Array.isArray(p)&&p[1]>=43.18&&p[1]<=43.70&&p[0]>=-79.15&&p[0]<=-76.20);if(pts.length)north.push({i,count:pts.length,minLng:Math.min(...pts.map(p=>p[0])),maxLng:Math.max(...pts.map(p=>p[0])),minLat:Math.min(...pts.map(p=>p[1])),maxLat:Math.max(...pts.map(p=>p[1]))});}
    return {ok:!!pre?.passed&&!/ANALYSIS FAILED/i.test(status),status,pre,visibleLayers:visible,probeCount:probes.length,probes:probes.slice(0,160),flowCount:flowFeatures.length,northFlowFeatures:north,waterOwnership:window.EARTHLINE_REGIONAL_WATER_OWNERSHIP_AUDIT_16350||null,styleIndex:window.EARTHLINE_STYLE_WATER_INDEX_16584||null};
  });
  if(r.ok){published=r;console.log('MANTRA38_LAKE_OWNER '+JSON.stringify({attempt,result:r,errors:errs.slice(0,10)}));}
  await page.close();
}
if(!published){console.error('MANTRA38_LAKE_OWNER no published run');process.exitCode=1;}
await browser.close();
