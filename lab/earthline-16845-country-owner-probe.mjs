import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=(process.env.TARGETS||'Singapore|Brunei|Indonesia|Philippines|India|Australia|Cabo Verde|Comoros|Mauritius|Seychelles').split('|').map(s=>s.trim()).filter(Boolean);
const OUTDIR=process.env.OUTDIR||'out-16845-country-owner';
fs.mkdirSync(OUTDIR,{recursive:true});
const safe=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];

for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  let error=null;
  try{
    await page.goto(URL+`?country-owner-16845=${encodeURIComponent(target)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},target);
    await page.waitForFunction(expected=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||(String(d?.query||'').trim().toLowerCase()===String(expected).trim().toLowerCase());},target,{timeout:95000,polling:100});
    await page.waitForTimeout(500);
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){error=String(e?.message||e);}

  const snap=await page.evaluate(()=>{
    const clone=v=>{try{return JSON.parse(JSON.stringify(v));}catch{return null;}};
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const extent=window.EARTHLINE_REGIONAL_ANALYSIS_EXTENT_16712||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const land=window.EARTHLINE_LAND_VALIDITY_16584||window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    let mapState=null;
    for(const k of Object.keys(window)){
      let v;try{v=window[k];}catch{continue;}
      if(v&&typeof v==='object'&&typeof v.getBounds==='function'&&typeof v.getCenter==='function'&&typeof v.getZoom==='function'){
        try{const b=v.getBounds(),c=v.getCenter();mapState={key:k,bounds:[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()],center:[c.lng,c.lat],zoom:v.getZoom()};break;}catch{}
      }
    }
    const keySummary={};
    for(const k of Object.keys(window).filter(k=>/EARTHLINE.*(JURIS|BOUND|EXTENT|IDENT|PLACE|ATOMIC|REGION)/i.test(k)).slice(0,120)){
      let v;try{v=window[k];}catch{continue;}
      if(v==null||['string','number','boolean'].includes(typeof v)){keySummary[k]=v;continue;}
      if(Array.isArray(v)){keySummary[k]={type:'array',length:v.length};continue;}
      if(typeof v==='object'){
        const small={};for(const p of Object.keys(v).slice(0,25)){const x=v[p];if(x==null||['string','number','boolean'].includes(typeof x))small[p]=x;else if(Array.isArray(x))small[p]={type:'array',length:x.length};else if(x&&typeof x==='object')small[p]={type:'object',keys:Object.keys(x).slice(0,12)};}
        keySummary[k]=small;
      }
    }
    const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const swales=vis?.swales?.features||[];
    let swaleBBox=null;
    const pts=[];for(const f of swales){for(const c of (f?.geometry?.coordinates||[])){if(Array.isArray(c)&&Number.isFinite(+c[0])&&Number.isFinite(+c[1]))pts.push([+c[0],+c[1]]);}}
    if(pts.length)swaleBBox=[Math.min(...pts.map(p=>p[0])),Math.min(...pts.map(p=>p[1])),Math.max(...pts.map(p=>p[0])),Math.max(...pts.map(p=>p[1]))];
    return {
      atomicStatePackage:clone(pkg),
      extent:clone(extent),
      boundary:clone(boundary),
      publication:pub?{generated:Number(pub.generated||0),outsideJurisdiction:Number(pub.outsideJurisdiction??pub.outside??pub.outsideCount??0),runToken:String(pub.runToken||'')}:null,
      displayedRun:d?{query:String(d.query||''),tier:String(d.tier||d.mode||''),center:clone(d.center||null),bbox:clone(d.bbox||d.bounds||null),identity:clone(d.identity||null)}:null,
      performance:perf?{totalMs:Number(perf.totalMs??NaN)}:null,
      land:land?{bbox:clone(land.bbox||land.bounds||null),waterParts:Array.isArray(land.waterParts)?land.waterParts.length:null,landAreas:Number(land.landAreas??NaN),invalidCells:Number(land.invalidCells??NaN)}:null,
      mapState,swaleBBox,keySummary
    };
  }).catch(e=>({probeError:String(e?.message||e)}));
  try{await page.screenshot({path:path.join(OUTDIR,`${safe(target)}.jpg`),type:'jpeg',quality:50,fullPage:false});}catch{}
  const row={target,error,snap};rows.push(row);console.log(JSON.stringify(row));await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,build:'EARTHLINE 16844 live',rows};
fs.writeFileSync(path.join(OUTDIR,'probe.json'),JSON.stringify(out,null,2));
console.log(JSON.stringify({targets:rows.length,errors:rows.filter(r=>r.error).map(r=>r.target),atomic:rows.map(r=>({target:r.target,hasAtomic:!!r.snap?.atomicStatePackage,hasExtent:!!r.snap?.extent,query:r.snap?.displayedRun?.query||null,mapBounds:r.snap?.mapState?.bounds||null,swaleBBox:r.snap?.swaleBBox||null}))}));