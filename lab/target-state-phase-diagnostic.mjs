import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL+'?ny-tiger-hydro-diagnostic='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

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
},null,{timeout:60000,polling:150});

const result=await page.evaluate(async()=>{
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const style=map?.getStyle?.()||{};
  const swales=[];
  const sourceAudit={};
  for(const [id] of Object.entries(style.sources||{})){
    let rows=[];try{rows=map.querySourceFeatures(id)||[]}catch(_){continue}
    const types={};
    for(const f of rows){const t=String(f?.properties?.feature_type||'');if(t)types[t]=(types[t]||0)+1;if(t==='swale-opportunity'&&f?.geometry?.type==='LineString')swales.push(f.geometry.coordinates);}
    if(Object.keys(types).length)sourceAudit[id]={rows:rows.length,types};
  }
  const uniq=[];const seen=new Set();
  for(const c of swales){const k=JSON.stringify(c);if(seen.has(k))continue;seen.add(k);uniq.push(c);}
  const rings=[];
  for(const c of uniq){let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;for(const p of c||[]){if(!Array.isArray(p)||!Number.isFinite(+p[0])||!Number.isFinite(+p[1]))continue;w=Math.min(w,+p[0]);s=Math.min(s,+p[1]);e=Math.max(e,+p[0]);n=Math.max(n,+p[1]);}if(!Number.isFinite(w))continue;const pad=.003;rings.push([[w-pad,s-pad],[w-pad,n+pad],[e+pad,n+pad],[e+pad,s-pad],[w-pad,s-pad]]);}
  const geom=JSON.stringify({rings,spatialReference:{wkid:4326}});
  async function query(layer){
    const body=new URLSearchParams({where:'1=1',geometry:geom,geometryType:'esriGeometryPolygon',inSR:'4326',spatialRel:'esriSpatialRelIntersects',outFields:'OBJECTID,NAME',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.00005',f:'geojson'});
    const t=performance.now();
    const r=await fetch('https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Hydro/MapServer/'+layer+'/query',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},body});
    const text=await r.text();let j=null;try{j=JSON.parse(text)}catch(_){}
    return {ok:r.ok,status:r.status,ms:Math.round(performance.now()-t),featureCount:Array.isArray(j?.features)?j.features.length:null,error:j?.error||(!j?text.slice(0,300):null),sampleNames:(j?.features||[]).map(f=>String(f?.properties?.NAME||'').trim()).filter(Boolean).slice(0,12)};
  }
  const [linear,areal]=await Promise.all([query(0),query(1)]);
  const c=map?.getCenter?.();
  return {camera:{center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.()??null},swaleCount:uniq.length,ringCount:rings.length,sourceAudit,linear,areal,mappedAudit:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,landValidity:{acquisitionResult:window.EARTHLINE_LAND_VALIDITY_16584?.acquisitionResult||null,riverCenterlineGeometry:window.EARTHLINE_LAND_VALIDITY_16584?.riverCenterlineGeometry||null},status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
});

const out={generatedAt:new Date().toISOString(),url:URL,picked,result,errors:errors.slice(0,50)};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(out,null,2));
console.log('NY_TIGER_HYDRO_DIAGNOSTIC '+JSON.stringify(result));
await browser.close();
