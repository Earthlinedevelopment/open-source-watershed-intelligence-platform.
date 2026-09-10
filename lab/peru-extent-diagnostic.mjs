import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=['Peru','Thailand','Portugal'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const rows=[];

async function openSurface(){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return frame;
}

async function choose(frame,name){
  await frame.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const pick=await frame.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/Country/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))));
    if(!b)return null;
    const r={text:(b.textContent||'').trim(),query:b.dataset.query||''};b.click();return r;
  },name);
  if(!pick)throw new Error('country option missing: '+name);
  await frame.waitForFunction(()=>typeof M!=='undefined'&&M?.loc?.placeType==='country',null,{timeout:12000,polling:150});
  await frame.waitForTimeout(600);
  return pick;
}

function runtimeSnap(){
  const m=typeof M!=='undefined'?M:null;
  const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
  const b=map?.getBounds?.();
  const center=map?.getCenter?.();
  const shallow={};
  if(m){
    for(const [k,v] of Object.entries(m)){
      if(!/(bbox|bound|extent|region|terrain|grid|loc)/i.test(k))continue;
      try{
        if(v==null||typeof v==='string'||typeof v==='number'||typeof v==='boolean'||Array.isArray(v))shallow[k]=JSON.parse(JSON.stringify(v));
        else if(typeof v==='object')shallow[k]=JSON.parse(JSON.stringify(v));
      }catch(_){shallow[k]=String(v);}
    }
  }
  const globals={};
  for(const k of Object.keys(window)){
    if(!/^EARTHLINE_/i.test(k)||!/(REGION|TERRAIN|GRID|FLOW|LAND_VALIDITY|DISPLAYED_RUN|CAMERA)/i.test(k))continue;
    try{const v=window[k]; if(v&&typeof v==='object')globals[k]=JSON.parse(JSON.stringify(v)); else if(['string','number','boolean'].includes(typeof v))globals[k]=v;}catch(_){ }
  }
  return {
    loc:m?.loc?JSON.parse(JSON.stringify(m.loc)):null,
    map:center&&b?{center:{lng:center.lng,lat:center.lat},zoom:map.getZoom(),bounds:[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]}:null,
    mRelevant:shallow,
    globals,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1800)
  };
}

async function runRegional(frame){
  await frame.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');return !!b&&!b.disabled;},null,{timeout:15000,polling:150});
  await frame.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||''))&&!x.disabled)||document.getElementById('runBtn');if(!b||b.disabled)throw new Error('run unavailable');b.click();});
  await frame.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /regional/i.test(String(d.tier||d.mode||''))||/ANALYSIS FAILED|Regional screening/i.test(status);
  },null,{timeout:30000,polling:200});
  await frame.waitForTimeout(1000);
}

for(const name of TARGETS){
  const frame=await openSurface();
  const pick=await choose(frame,name);
  const before=await frame.evaluate(runtimeSnap);
  let error=null;
  try{await runRegional(frame);}catch(e){error=String(e);}
  const after=await frame.evaluate(runtimeSnap);
  await page.screenshot({path:`/tmp/${name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.png`,fullPage:true});
  rows.push({name,pick,before,after,error});
}
await fs.writeFile('/tmp/peru-extent-diagnostic.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
console.log(JSON.stringify(rows.map(r=>({name:r.name,error:r.error,beforeLoc:r.before.loc,beforeMap:r.before.map,afterLoc:r.after.loc,afterMap:r.after.map,status:r.after.status,flowAudit:r.after.globals?.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,grid:r.after.globals?.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null})),null,2));
await browser.close();
