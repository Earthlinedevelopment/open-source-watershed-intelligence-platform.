import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=[
  {name:'Vermont',type:/State|Region/i},
  {name:'New York',type:/State|Region/i},
  {name:'Thailand',type:/Country/i},
  {name:'Peru',type:/Country/i},
  {name:'France',type:/Country/i}
];

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

async function choose(frame,target){
  await frame.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},target.name);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  const pick=await frame.evaluate(({name,typeSource})=>{
    const type=new RegExp(typeSource,'i');
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>type.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))));
    if(!b)return null;
    const r={text:(b.textContent||'').trim(),query:b.dataset.query||''};b.click();return r;
  },{name:target.name,typeSource:target.type.source});
  if(!pick)throw new Error('selection missing: '+target.name);
  await frame.waitForTimeout(800);
  return pick;
}

function snap(){
  const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
  const canvas=map?.getCanvas?.();
  const rect=canvas?.getBoundingClientRect?.();
  const style=map?.getStyle?.();
  const layers=Array.isArray(style?.layers)?style.layers:[];
  const earthlineLayers=layers.filter(l=>/(earthline|flow|contour|swale|regional|corridor|recharge|aquifer)/i.test(String(l?.id||'')));
  let renderedCount=null;
  try{renderedCount=map?.queryRenderedFeatures?.()?.length??null;}catch(_){ }
  const displayRun=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const flowAudit=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
  return {
    mapExists:!!map,
    styleLoaded:!!map?.isStyleLoaded?.(),
    canvas:{width:rect?.width||0,height:rect?.height||0,display:canvas?getComputedStyle(canvas).display:null,visibility:canvas?getComputedStyle(canvas).visibility:null,opacity:canvas?getComputedStyle(canvas).opacity:null},
    styleLayerCount:layers.length,
    earthlineLayerIds:earthlineLayers.map(l=>l.id),
    renderedCount,
    center:map?.getCenter?.()?{lng:map.getCenter().lng,lat:map.getCenter().lat}:null,
    zoom:map?.getZoom?.()??null,
    displayRun,
    flowAudit,
    status:status.slice(0,1600)
  };
}

async function runRegional(frame){
  await frame.waitForFunction(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||'')))||document.getElementById('runBtn');return !!b&&!b.disabled;},null,{timeout:20000,polling:150});
  await frame.evaluate(()=>{const b=[...document.querySelectorAll('button')].find(x=>/\brun\s+analysis\b/i.test(String(x.textContent||''))&&!x.disabled)||document.getElementById('runBtn');if(!b||b.disabled)throw new Error('run unavailable');b.click();});
  await frame.waitForFunction(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /regional/i.test(String(d.tier||d.mode||''))||/ANALYSIS FAILED|Regional screening/i.test(s);
  },null,{timeout:35000,polling:200});
  await frame.waitForTimeout(1200);
}

function integrity(s){
  const canvasVisible=s.mapExists&&s.styleLoaded&&s.canvas.width>300&&s.canvas.height>250&&s.canvas.display!=='none'&&s.canvas.visibility!=='hidden'&&Number(s.canvas.opacity??1)>0;
  const basemapPresent=(s.styleLayerCount||0)>0&&(s.renderedCount===null||s.renderedCount>0);
  const regionalPublished=/regional/i.test(String(s.displayRun?.tier||s.displayRun?.mode||''))||/Regional screening/i.test(s.status||'');
  const unsafe=Number(s.flowAudit?.unsafeDisplayedSegments??s.flowAudit?.unsafeSegments??0);
  return {canvasVisible,basemapPresent,regionalPublished,unsafe,pass:canvasVisible&&basemapPresent&&regionalPublished&&unsafe===0};
}

for(const target of TARGETS){
  const frame=await openSurface();
  let error=null,pick=null,before=null,after=null;
  try{
    pick=await choose(frame,target);
    before=await frame.evaluate(snap);
    await runRegional(frame);
    after=await frame.evaluate(snap);
  }catch(e){error=String(e);try{after=await frame.evaluate(snap);}catch(_){}}
  const check=after?integrity(after):{pass:false};
  const slug=target.name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  await page.screenshot({path:`/tmp/map-integrity-${slug}.png`,fullPage:true});
  rows.push({target:target.name,pick,before,after,check,error});
}

await fs.writeFile('/tmp/map-integrity-gate.json',JSON.stringify({at:new Date().toISOString(),url:URL,rows},null,2));
console.log(JSON.stringify(rows.map(r=>({target:r.target,check:r.check,error:r.error,status:r.after?.status,flowAudit:r.after?.flowAudit,earthlineLayers:r.after?.earthlineLayerIds?.length||0})),null,2));

const failed=rows.filter(r=>!r.check?.pass);
await browser.close();
if(failed.length){
  console.error('MAP INTEGRITY GATE FAILED:',failed.map(r=>r.target).join(', '));
  process.exit(1);
}
