import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL+'?ny-water-source-diagnostic='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

async function chooseNewYork(){
  await page.evaluate(()=>{const i=document.getElementById('searchInput');i.focus();i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));});
  await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const picked=await page.evaluate(()=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')==='new york'||n(x.dataset.query||'')==='new york state'||n(x.textContent||'').includes('new york')))||opts.find(x=>n(x.textContent||'').includes('new york'));
    if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
  });
  if(!picked)throw new Error('New York regional suggestion missing');
  await page.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
    return /screening published/i.test(s)&&String(d?.query||'').toLowerCase().includes('new york');
  },null,{timeout:45000,polling:150});
  return picked;
}

const picked=await chooseNewYork();

async function capture(label){
  return page.evaluate(label=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const style=map?.getStyle?.()||{};
    const vectorSources=Object.entries(style.sources||{}).filter(([,d])=>String(d?.type||'').toLowerCase()==='vector');
    const sourceCounts={};
    for(const [id] of vectorSources){
      sourceCounts[id]={loaded:null,water:null,waterway:null};
      try{sourceCounts[id].loaded=typeof map?.isSourceLoaded==='function'?!!map.isSourceLoaded(id):null}catch(_){ }
      for(const layer of ['water','waterway']){
        try{const rows=map.querySourceFeatures(id,{sourceLayer:layer})||[];sourceCounts[id][layer]=rows.length;}catch(e){sourceCounts[id][layer]='ERR:'+String(e)}
      }
    }
    const waterStyleLayers=(style.layers||[]).filter(l=>{
      const sl=String(l?.['source-layer']||'').toLowerCase();
      const id=String(l?.id||'').toLowerCase();
      return sl==='water'||sl==='waterway'||id.includes('water')||id.includes('river')||id.includes('stream');
    }).map(l=>({id:l.id,type:l.type,source:l.source,sourceLayer:l['source-layer']||null,minzoom:l.minzoom??null,maxzoom:l.maxzoom??null,visibility:l.layout?.visibility||null}));
    let renderedWater=0,renderedWaterway=0;
    try{for(const f of (map.queryRenderedFeatures?.()||[])){const sl=String(f?.sourceLayer||f?.layer?.['source-layer']||'').toLowerCase();if(sl==='water')renderedWater++;if(sl==='waterway')renderedWaterway++;}}catch(_){ }
    const c=map?.getCenter?.();
    return {
      label,
      camera:{center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.()??null,bearing:map?.getBearing?.()??null,pitch:map?.getPitch?.()??null},
      vectorSources:vectorSources.map(([id,d])=>({id,url:d.url||null,tiles:Array.isArray(d.tiles)?d.tiles.length:null,minzoom:d.minzoom??null,maxzoom:d.maxzoom??null})),
      sourceCounts,
      waterStyleLayers,
      renderedWater,
      renderedWaterway,
      mappedAudit:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
      flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    };
  },label);
}

async function jumpAndWait(center,zoom,label){
  await page.evaluate(({center,zoom})=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    map.jumpTo({center,zoom});
  },{center,zoom});
  await page.waitForTimeout(500);
  try{await page.waitForFunction(()=>{const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);return !!map&&(!map.isMoving||!map.isMoving())&&(!map.areTilesLoaded||map.areTilesLoaded());},null,{timeout:12000,polling:150});}catch(_){ }
  await page.waitForTimeout(1200);
  return capture(label);
}

const baseline=await capture('published-statewide-camera');
const albanyZ8=await jumpAndWait([-73.7562,42.6526],8,'albany-hudson-z8');
const albanyZ9=await jumpAndWait([-73.7562,42.6526],9,'albany-hudson-z9');
const lakeGeorgeZ8=await jumpAndWait([-73.6077,43.5729],8,'lake-george-z8');

const out={generatedAt:new Date().toISOString(),url:URL,picked,baseline,albanyZ8,albanyZ9,lakeGeorgeZ8,errors:errors.slice(0,50)};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(out,null,2));
console.log('NY_WATER_SOURCE_DIAGNOSTIC '+JSON.stringify({
  baseline:{camera:baseline.camera,sourceCounts:baseline.sourceCounts,renderedWater:baseline.renderedWater,renderedWaterway:baseline.renderedWaterway,mapped:baseline.mappedAudit},
  albanyZ8:{camera:albanyZ8.camera,sourceCounts:albanyZ8.sourceCounts,renderedWater:albanyZ8.renderedWater,renderedWaterway:albanyZ8.renderedWaterway},
  albanyZ9:{camera:albanyZ9.camera,sourceCounts:albanyZ9.sourceCounts,renderedWater:albanyZ9.renderedWater,renderedWaterway:albanyZ9.renderedWaterway},
  lakeGeorgeZ8:{camera:lakeGeorgeZ8.camera,sourceCounts:lakeGeorgeZ8.sourceCounts,renderedWater:lakeGeorgeZ8.renderedWater,renderedWaterway:lakeGeorgeZ8.renderedWaterway},
  waterStyleLayers:baseline.waterStyleLayers
}));
await browser.close();
