import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=['Okinawa'];
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const rows=[];

async function openSurface(){
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return {page,frame};
}

async function selectRegion(frame,name){
  await frame.evaluate(q=>{const input=document.getElementById('searchInput');input.focus();input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));},name);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  return frame.evaluate(q=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const want=n(q);const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];const match=b=>n(b.dataset.query||'')===want||n(b.textContent||'').includes(want);const typed=b=>/state|region|province|prefecture/i.test(String(b.textContent||''));const b=opts.find(x=>match(x)&&typed(x))||opts.find(match);if(!b)return null;const out={text:String(b.textContent||'').trim(),query:String(b.dataset.query||'')};window.__EARTHLINE_PHASE_DIAG={clickAt:Date.now()};b.click();return out;},name);
}

async function waitTerminal(frame,timeout=35000){const t=Date.now();try{await frame.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&/screening published|analysis failed/i.test(s);},null,{timeout,polling:50});return {seen:true,waitMs:Date.now()-t};}catch(e){return {seen:false,waitMs:Date.now()-t,error:String(e)};}}

for(const target of TARGETS){
  const {page,frame}=await openSurface();
  const selection=await selectRegion(frame,target);
  if(!selection){rows.push({target,error:'authoritative regional selection missing'});await page.close();continue;}
  const terminal=await waitTerminal(frame);
  const stateData=await frame.evaluate(()=>({
    land:window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    water:window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null,
    sparse:window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609||null,
    loading:window.EARTHLINE_LOADING_AUDIT_16167||null,
    stall:window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
    center:(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat,zoom:m.getZoom?.()}:null;})()
  }));
  const row={target,selection,terminal,stateData};rows.push(row);console.log('TARGET_PHASE '+JSON.stringify(row));await page.close();
}
await fs.mkdir('lab-results',{recursive:true});await fs.writeFile('lab-results/target-state-phase-diagnostic.json',JSON.stringify({generatedAt:new Date().toISOString(),url:URL,targets:rows},null,2));
console.log('TARGET_PHASE_SUMMARY '+JSON.stringify(rows));
await browser.close();
