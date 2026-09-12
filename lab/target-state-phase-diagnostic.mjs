import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];const tigerRequests=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
page.on('request',req=>{
  if(!req.url().includes('tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Hydro/MapServer/'))return;
  try{
    const data=new URLSearchParams(req.postData()||'');
    const g=JSON.parse(data.get('geometry')||'null');
    const path=g?.paths?.[0]||[];
    let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;
    for(const p of path){if(!Array.isArray(p)||!Number.isFinite(+p[0])||!Number.isFinite(+p[1]))continue;w=Math.min(w,+p[0]);s=Math.min(s,+p[1]);e=Math.max(e,+p[0]);n=Math.max(n,+p[1]);}
    tigerRequests.push({layer:(req.url().match(/MapServer\/(\d+)\/query/)||[])[1]||null,points:path.length,first:path[0]||null,last:path.at(-1)||null,bbox:Number.isFinite(w)?[w,s,e,n]:null,span:Number.isFinite(w)?[e-w,n-s]:null});
  }catch(e){tigerRequests.push({parseError:String(e)});}
});

let deployed=false;
for(let attempt=0;attempt<45;attempt++){
  await page.goto(URL+'?ny-16620-extent-probe='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  deployed=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16620 — PER-SWALE TIGER INTERSECTION COUNTS'));
  if(deployed)break;await page.waitForTimeout(2000);
}
if(!deployed)throw new Error('16620 not deployed');
await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true&&typeof window.applyLocation==='function',null,{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput');i.focus();i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));});
await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:15000});
const picked=await page.evaluate(()=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const o=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];const b=o.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')==='new york'||n(x.dataset.query||'')==='new york state'))||o.find(x=>n(x.textContent||'').includes('new york'));if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;});
if(!picked)throw new Error('NY state suggestion missing');
try{await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609?.tigerHydroRequested===true||/ANALYSIS FAILED/i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')),null,{timeout:60000,polling:150});}catch(_){}
await page.waitForTimeout(700);
const state=await page.evaluate(()=>({audit:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim(),loc:{name:M?.loc?.name||null,bbox:M?.loc?.bbox||null,analysisBBox:M?.loc?.analysisBBox||null}}));
const unique=[];const seen=new Set();for(const r of tigerRequests){const k=JSON.stringify([r.points,r.first,r.last,r.bbox]);if(seen.has(k))continue;seen.add(k);unique.push(r);}
const spans=unique.filter(r=>r.span).map(r=>({points:r.points,bbox:r.bbox,span:r.span,first:r.first,last:r.last}));
spans.sort((a,b)=>(b.span[0]+b.span[1])-(a.span[0]+a.span[1]));
const out={generatedAt:new Date().toISOString(),picked,state,requestCount:tigerRequests.length,uniqueSwaleGeometries:spans.length,largest:spans.slice(0,12),smallest:spans.slice(-5),errors:errors.slice(0,30)};
await fs.mkdir('lab-results',{recursive:true});await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(out,null,2));
console.log('NY_16620_SWALE_EXTENTS '+JSON.stringify(out));
await browser.close();
