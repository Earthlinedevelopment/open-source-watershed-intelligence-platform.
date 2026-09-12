import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=['New York'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const rows=[];
let runRegionalSource=null;

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

async function openSurface(){
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  if(!runRegionalSource)runRegionalSource=await frame.evaluate(()=>typeof runRegional==='function'?runRegional.toString():null);
  await frame.evaluate(()=>{
    window.__EARTHLINE_PHASE_DIAG={events:[],startedAt:Date.now()};
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(map){for(const ev of ['movestart','moveend','zoomstart','zoomend','idle'])map.on(ev,()=>window.__EARTHLINE_PHASE_DIAG?.events.push({ev,t:Date.now()}));}
  });
  return {page,frame};
}

async function selectState(frame,state){
  await frame.evaluate(q=>{const input=document.getElementById('searchInput');input.focus();input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},state);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  return frame.evaluate(q=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const want=n(q);const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];const match=b=>n(b.dataset.query||'')===want||n(b.textContent||'').includes(want);const typed=b=>/state|region/i.test(String(b.textContent||''));const b=opts.find(x=>match(x)&&typed(x))||opts.find(match);if(!b)return null;const out={text:String(b.textContent||'').trim(),query:String(b.dataset.query||'')};window.__EARTHLINE_PHASE_DIAG.clickAt=Date.now();b.click();return out;},state);
}

async function waitStage(frame,expr,timeout=30000){const t=Date.now();try{await frame.waitForFunction(expr,null,{timeout,polling:50});return {seen:true,waitMs:Date.now()-t,at:Date.now()};}catch(e){return {seen:false,waitMs:Date.now()-t,at:Date.now(),error:String(e)};}}

for(const state of TARGETS){
  const {page,frame}=await openSurface();
  const selection=await selectState(frame,state);
  if(!selection){rows.push({state,error:'authoritative state selection missing'});await page.close();continue;}
  const clickAt=await frame.evaluate(()=>window.__EARTHLINE_PHASE_DIAG.clickAt||Date.now());
  const landP=waitStage(frame,()=>{const a=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584;return !!a&&String(a.runToken||'').includes('new-york');},30000);
  const flowP=waitStage(frame,()=>{const a=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584;return !!a&&String(a.runToken||'').includes('new-york');},30000);
  const waterP=waitStage(frame,()=>{const a=window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609;return !!a&&String(a.runToken||'').includes('new-york');},30000);
  const terminalP=waitStage(frame,()=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&/screening published|analysis failed/i.test(s)&&(String(d.tier||d.mode||'').toLowerCase()==='regional'||/analysis failed/i.test(s));},35000);
  const [land,flow,water,terminal]=await Promise.all([landP,flowP,waterP,terminalP]);
  const stateData=await frame.evaluate(()=>({
    clickAt:window.__EARTHLINE_PHASE_DIAG?.clickAt||null,
    events:window.__EARTHLINE_PHASE_DIAG?.events||[],
    land:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    water:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
    sparse:window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    loading:window.EARTHLINE_LOADING_AUDIT_16167||null,
    stall:window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'
  }));
  const isoMs=v=>{const t=Date.parse(v||'');return Number.isFinite(t)?t-clickAt:null};
  const row={state,selection,totalMs:terminal.at-clickAt,landMs:isoMs(stateData.land?.at),flowMs:isoMs(stateData.flow?.at),waterMs:isoMs(stateData.water?.at),stages:{land,flow,water,terminal},stateData};
  rows.push(row);console.log('TARGET_PHASE '+JSON.stringify(row));await page.close();
}
const report={generatedAt:new Date().toISOString(),url:URL,targets:rows};
await fs.mkdir('lab-results',{recursive:true});await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify(report,null,2));
console.log('TARGET_PHASE_SUMMARY '+JSON.stringify(rows));
await browser.close();
