import fs from 'node:fs';
import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

await page.evaluate(()=>{
  window.__EARTHLINE_NY_PHASE_SAMPLES=[];
  window.__EARTHLINE_NY_LONGTASKS=[];
  try{
    new PerformanceObserver(list=>{
      for(const e of list.getEntries())window.__EARTHLINE_NY_LONGTASKS.push({startTime:e.startTime,duration:e.duration,name:e.name});
    }).observe({entryTypes:['longtask']});
  }catch(_){}
  const compact=()=>{
    const stall=window.EARTHLINE_REGIONAL_STALL_WATCHDOG_16347||null;
    const grid=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    const preview=window.EARTHLINE_SWALE_PRIORITY_PREVIEW_16249||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const mapped=window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null;
    const finalFlow=window.EARTHLINE_FINAL_MAPPED_WATER_FLOW_AUDIT_16628||null;
    const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const camera=window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null;
    const rd=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    return {
      t:performance.now(),
      wall:new Date().toISOString(),
      runState:String(document.documentElement.dataset.earthlineRunState||''),
      busy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,500),
      stall:stall?{runToken:stall.runToken,lastProgressLabel:stall.lastProgressLabel,lastProgressAt:stall.lastProgressAt,elapsedMs:stall.elapsedMs,failed:stall.failed}:null,
      grid:grid?{at:grid.at,validLandCellCount:grid.validLandCellCount,rasterizedInvalidWaterCellCount:grid.rasterizedInvalidWaterCellCount,mappedAreaCount:grid.mappedAreaCount}:null,
      preview:preview?{runToken:preview.runToken,generated:preview.generated,published:preview.published,previewMs:preview.previewMs,at:preview.at}:null,
      flow:flow?{runToken:flow.runToken,segments:flow.segments,unsafeSegments:flow.unsafeSegments,safe:flow.safe,at:flow.at}:null,
      mapped:mapped?{runToken:mapped.runToken,before:mapped.before,after:mapped.after,verified:mapped.verified,waterPolygonParts:mapped.waterPolygonParts,waterwayLines:mapped.waterwayLines,tigerHydroMs:mapped.tigerHydroMs,at:mapped.at}:null,
      finalFlow:finalFlow?{runToken:finalFlow.runToken,inputSegments:finalFlow.inputSegments,outputSegments:finalFlow.outputSegments,at:finalFlow.at}:null,
      displayed:displayed?{runToken:displayed.runToken,tier:displayed.tier,completedAt:displayed.completedAt}:null,
      camera:camera?{runToken:camera.runToken,settled:camera.settled,at:camera.at}:null,
      regionalDisplay:rd?{waterPaths:rd.waterPaths,swaleLines:rd.swaleLines,renderedAt:rd.renderedAt}:null
    };
  };
  let last='';
  window.__EARTHLINE_NY_PHASE_TIMER=setInterval(()=>{
    const s=compact();
    const sig=JSON.stringify({runState:s.runState,busy:s.busy,status:s.status,stall:s.stall,grid:s.grid,preview:s.preview,flow:s.flow,mapped:s.mapped,finalFlow:s.finalFlow,displayed:s.displayed,camera:s.camera,regionalDisplay:s.regionalDisplay});
    if(sig!==last){window.__EARTHLINE_NY_PHASE_SAMPLES.push(s);last=sig;}
  },100);
  window.__EARTHLINE_NY_PHASE_COMPACT=compact;
});

await page.evaluate(()=>{const i=document.getElementById('searchInput');i.focus();i.value='New York';i.dispatchEvent(new Event('input',{bubbles:true}));});
await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
const picked=await page.evaluate(()=>{
  const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
  const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
  const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')==='new york'||n(x.textContent||'').includes('new york')))||opts.find(x=>n(x.textContent||'').includes('new york'));
  if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
});
if(!picked)throw new Error('New York state suggestion not found');

await page.waitForTimeout(24000);
const result=await page.evaluate(()=>{
  clearInterval(window.__EARTHLINE_NY_PHASE_TIMER);
  const final=window.__EARTHLINE_NY_PHASE_COMPACT?.()||null;
  return {samples:window.__EARTHLINE_NY_PHASE_SAMPLES||[],longTasks:window.__EARTHLINE_NY_LONGTASKS||[],final};
});
const report={test:'Earthline NY phase runtime diagnostic',surface:'public-index',picked,errors,...result};
fs.mkdirSync('lab-results',{recursive:true});
fs.writeFileSync('lab-results/target-state-phase-diagnostic.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_NY_PHASE '+JSON.stringify(report));
await browser.close();
