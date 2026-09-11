import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>document.documentElement.innerHTML.includes('EARTHLINE 16610 — DIRECT VECTOR WATER SOURCE QUERY'),null,{timeout:90000,polling:500});
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
await page.evaluate(()=>{
  const input=document.getElementById('searchInput');
  input.focus(); input.value='New York';
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
});
await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:15000});
const selection=await page.evaluate(()=>{
  const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const q='new york';
  const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
  const match=b=>norm(b.dataset.query||'')===q||norm(b.textContent||'').includes(q);
  const state=b=>/state|region/i.test(String(b.textContent||''));
  const chosen=opts.find(b=>match(b)&&state(b))||opts.find(match);
  if(!chosen)return null;
  const out={text:String(chosen.textContent||'').trim(),query:String(chosen.dataset.query||'')};
  chosen.click();
  return out;
});
if(!selection)throw new Error('authoritative New York state suggestion not found');
await page.waitForFunction(()=>{
  const m=typeof M!=='undefined'?M:null;
  const name=String(m?.loc?.name||m?.loc?.fullName||'').toLowerCase();
  return name.includes('new york');
},null,{timeout:15000,polling:100});
await page.waitForFunction(()=>{
  const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
  return !!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020 || /ANALYSIS FAILED/i.test(s);
},null,{timeout:50000,polling:200});
await page.waitForTimeout(1000);
const audit=await page.evaluate(()=>{
  const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const land=window.EARTHLINE_LAND_VALIDITY_16584||null;
  const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const finite=p=>Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1]));
  function bboxRing(r){let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;for(const p of r||[]){if(!finite(p))continue;w=Math.min(w,+p[0]);s=Math.min(s,+p[1]);e=Math.max(e,+p[0]);n=Math.max(n,+p[1]);}return Number.isFinite(w)?[w,s,e,n]:null}
  function partsFromGeom(g,source,name){const out=[];if(!g)return out;const polys=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?(g.coordinates||[]):[];for(const rings of polys){if(!Array.isArray(rings)||!rings.length)continue;const bbox=bboxRing(rings[0]);if(bbox)out.push({rings,bbox,source,name:name||''});}return out}
  const parts=[];
  for(const p of (land?.waterParts||[]))if(p?.rings&&p?.bbox)parts.push({rings:p.rings,bbox:p.bbox,source:'natural-earth-50m',name:String(p.properties?.name||p.properties?.name_en||'')});
  let vectorSources=0,sourceQueries=0,sourceSuccess=0,rawWaterFeatures=0;
  try{
    for(const [sourceId,def] of Object.entries(map?.getStyle?.().sources||{})){
      if(String(def?.type||'').toLowerCase()!=='vector')continue;
      vectorSources++;
      try{
        sourceQueries++;
        const rows=map.querySourceFeatures(sourceId,{sourceLayer:'water'})||[]; sourceSuccess++;
        rawWaterFeatures+=rows.length;
        for(const f of rows)parts.push(...partsFromGeom(f?.geometry,'map-vector-water',String(f?.properties?.name||f?.properties?.name_en||'')));
      }catch(_){}
    }
  }catch(_){}
  const orient=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
  const onSeg=(a,b,p)=>Math.min(a[0],b[0])-1e-10<=p[0]&&p[0]<=Math.max(a[0],b[0])+1e-10&&Math.min(a[1],b[1])-1e-10<=p[1]&&p[1]<=Math.max(a[1],b[1])+1e-10;
  const segInter=(a,b,c,d)=>{const o1=orient(a,b,c),o2=orient(a,b,d),o3=orient(c,d,a),o4=orient(c,d,b),eps=1e-12;if(Math.abs(o1)<eps&&onSeg(a,b,c))return true;if(Math.abs(o2)<eps&&onSeg(a,b,d))return true;if(Math.abs(o3)<eps&&onSeg(c,d,a))return true;if(Math.abs(o4)<eps&&onSeg(c,d,b))return true;return (o1>0)!==(o2>0)&&(o3>0)!==(o4>0);};
  function inRing(p,r){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if(!finite(a)||!finite(b))continue;const hit=((b[1]>p[1])!==(a[1]>p[1]))&&(p[0]<(a[0]-b[0])*(p[1]-b[1])/((a[1]-b[1])||1e-15)+b[0]);if(hit)inside=!inside;}return inside}
  function inPoly(p,rings){if(!rings?.length||!inRing(p,rings[0]))return false;for(let i=1;i<rings.length;i++)if(inRing(p,rings[i]))return false;return true}
  function segmentHitsPart(a,b,p){const sb=[Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])],bb=p.bbox;if(sb[2]<bb[0]||sb[0]>bb[2]||sb[3]<bb[1]||sb[1]>bb[3])return false;if(inPoly(a,p.rings)||inPoly(b,p.rings))return true;for(const ring of p.rings||[])for(let i=1;i<ring.length;i++)if(segInter(a,b,ring[i-1],ring[i]))return true;return false}
  const swales=visual?.swales?.features||[];let unsafeFeatures=0,unsafeSegments=0;const hits=[];
  swales.forEach((f,fi)=>{const c=f?.geometry?.type==='LineString'?(f.geometry.coordinates||[]):[];let bad=false;for(let i=1;i<c.length;i++){for(const p of parts){if(segmentHitsPart(c[i-1],c[i],p)){unsafeSegments++;bad=true;if(hits.length<20)hits.push({swale:fi+1,rank:f?.properties?.rank||null,source:p.source,name:p.name||'',a:c[i-1],b:c[i]});break;}}}if(bad)unsafeFeatures++;});
  const loc=typeof M!=='undefined'&&M?.loc?{name:M.loc.name,fullName:M.loc.fullName,countryCode:M.loc.countryCode,lat:M.loc.lat,lng:M.loc.lng}:null;
  return {query:'New York',loc,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),swales:swales.length,naturalEarthWaterParts:Number(land?.waterParts?.length||0),vectorSources,sourceQueries,sourceSuccess,rawWaterFeatures,waterPolygonParts:parts.length,unsafeFeatures,unsafeSegments,hits,landAudit:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,mappedWaterAudit16609:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,sparseAudit16609:window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609||null,displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,water16601:window.EARTHLINE_LAB_WATER_16601||null};
});
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/ny-regional-water-audit.json',JSON.stringify({generatedAt:new Date().toISOString(),url:URL,selection,audit,errors},null,2));
await page.screenshot({path:'lab-results/ny-regional-water-audit.png',fullPage:true});
console.log('EARTHLINE_NY_WATER_AUDIT '+JSON.stringify(audit));
await browser.close();
const identity=String(audit.loc?.name||audit.loc?.fullName||'').toLowerCase().includes('new york');
const terminalOk=!/ANALYSIS FAILED/i.test(audit.status)&&audit.swales>0;
const mappedVerified=audit.mappedWaterAudit16609?.verified===true;
if(!identity||!terminalOk||!mappedVerified||audit.unsafeFeatures>0)process.exitCode=1;
