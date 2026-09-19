import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL='https://earthlinedevelopment.org/';
const candidateHtml=await fs.readFile('index.html','utf8');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const origin=new globalThis.URL(BASE_URL).origin;
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route('**/*',async route=>{
  const req=route.request();
  if(req.resourceType()==='document'){
    try{
      const u=new globalThis.URL(req.url());
      if(u.origin===origin){
        const resp=await route.fetch();
        return route.fulfill({response:resp,body:candidateHtml});
      }
    }catch(_){}
  }
  return route.continue();
});

await page.goto(BASE_URL+'?shared_renderer_trace='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

await page.evaluate(()=>{
  window.__EARTHLINE_SHARED_RENDER_TRACE_16690=[];
  window.__EARTHLINE_LAST_RENDER_INPUT_16690=null;

  const mapCandidate16690=()=>{
    const candidates=[];
    try{if(typeof earthlineMap!=='undefined')candidates.push(earthlineMap);}catch(_){}
    try{if(typeof map!=='undefined')candidates.push(map);}catch(_){}
    try{if(typeof M!=='undefined'&&M&&M.map)candidates.push(M.map);}catch(_){}
    for(const k of ['earthlineMap','map','earthlineMap15778','mapboxMap']){
      try{if(window[k])candidates.push(window[k]);}catch(_){}
    }
    for(const v of candidates){
      try{if(v&&typeof v.getBounds==='function'&&typeof v.project==='function')return v;}catch(_){}
    }
    try{
      for(const k of Object.keys(window)){
        let v=null;try{v=window[k];}catch(_){continue;}
        try{if(v&&typeof v.getBounds==='function'&&typeof v.project==='function'&&typeof v.getCanvas==='function')return v;}catch(_){}
      }
    }catch(_){}
    return null;
  };

  const camera16690=()=>{
    const m=mapCandidate16690();
    if(!m)return {found:false};
    try{
      const b=m.getBounds(),c=m.getCenter(),canvas=m.getCanvas&&m.getCanvas();
      return {
        found:true,
        zoom:Number(m.getZoom&&m.getZoom()),
        center:c?{lng:Number(c.lng),lat:Number(c.lat)}:null,
        bounds:b?[Number(b.getWest()),Number(b.getSouth()),Number(b.getEast()),Number(b.getNorth())]:null,
        span:b?Number((b.getEast()-b.getWest()).toFixed(6)):null,
        canvas:canvas?{clientWidth:Number(canvas.clientWidth||0),clientHeight:Number(canvas.clientHeight||0),width:Number(canvas.width||0),height:Number(canvas.height||0)}:null
      };
    }catch(e){return {found:true,error:String(e)};}
  };

  const overlay16690=()=>{
    const e=document.getElementById('earthlineRegionalVectorOverlay16020')||
      document.querySelector('svg[data-earthline-regional-overlay]')||
      document.querySelector('.earthline-regional-vector-overlay');
    if(!e)return null;
    try{
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return {id:e.id||null,w:Number(r.width),h:Number(r.height),left:Number(r.left),top:Number(r.top),children:Number(e.children?.length||0),display:s.display,visibility:s.visibility,opacity:s.opacity};
    }catch(err){return {id:e.id||null,error:String(err)};}
  };

  const bboxData16690=data=>{
    const pts=[];
    for(const key of ['swales','contours','flows']){
      const fs=data&&data[key]&&Array.isArray(data[key].features)?data[key].features:[];
      for(const f of fs){
        const g=f&&f.geometry;if(!g)continue;
        const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?(g.coordinates||[]):g.type==='Point'?[[g.coordinates]]:[];
        for(const line of lines)for(const p of line||[])if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]))pts.push([+p[0],+p[1]]);
      }
    }
    if(!pts.length)return null;
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    return [Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  };

  const original=window.earthlineRenderRegionalOverlay16020;
  window.__EARTHLINE_RENDER_FN_FOUND_16690=typeof original==='function';
  if(typeof original==='function'){
    window.earthlineRenderRegionalOverlay16020=function(data){
      const input={
        runToken:String(data&&data.runToken||''),
        swales:Number(data&&data.swales&&data.swales.features&&data.swales.features.length||0),
        contours:Number(data&&data.contours&&data.contours.features&&data.contours.features.length||0),
        flows:Number(data&&data.flows&&data.flows.features&&data.flows.features.length||0),
        bbox:bboxData16690(data)
      };
      window.__EARTHLINE_LAST_RENDER_INPUT_16690=data;
      const before={camera:camera16690(),overlay:overlay16690(),input};
      let ret=null,error=null;
      try{ret=original.apply(this,arguments);}catch(e){error=String(e);throw e;}
      finally{
        window.__EARTHLINE_SHARED_RENDER_TRACE_16690.push({
          at:new Date().toISOString(),
          before,
          after:{camera:camera16690(),overlay:overlay16690(),audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null},
          ret,error
        });
      }
      return ret;
    };
  }

  window.__earthlineCameraSnapshot16690=camera16690;
  window.__earthlineOverlaySnapshot16690=overlay16690;
  window.__earthlineMap16690=mapCandidate16690;
});

const sequence=['Wisconsin','Wisconsin','Vermont','Wisconsin','Vermont','Vermont','Wisconsin','Vermont'];
const rows=[];

for(let i=0;i<sequence.length;i++){
  const stateName=sequence[i];
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const traceStart=await page.evaluate(()=>Number(window.__EARTHLINE_SHARED_RENDER_TRACE_16690?.length||0));
  const started=Date.now();

  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const input=document.getElementById('searchInput'),btn=document.getElementById('runBtn');
    input.value=q;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
    btn.click();
  },stateName);

  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const token=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const busy=document.getElementById('runBtn')?.getAttribute('aria-busy')==='true';
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||token!==prev)&&!!token&&!busy);
    },prior,{timeout:35000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);

  const snap=await page.evaluate(startIndex=>{
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const trace=(window.__EARTHLINE_SHARED_RENDER_TRACE_16690||[]).slice(startIndex);
    const lastInput=window.__EARTHLINE_LAST_RENDER_INPUT_16690||null;
    return {
      renderFnFound:!!window.__EARTHLINE_RENDER_FN_FOUND_16690,
      generated:Number(gen?.chosenBeforeTierGate??gen?.publishedFeatures??0),
      published:Number(gen?.publishedFeatures??0),
      visible:Number(display?.swaleLines??0),
      visualSwales:Number(visual?.swales?.features?.length||0),
      visualContours:Number(visual?.contours?.features?.length||0),
      visualFlows:Number(visual?.flows?.features?.length||0),
      totalMs:perf?.totalMs??null,
      currentCamera:window.__earthlineCameraSnapshot16690?window.__earthlineCameraSnapshot16690():null,
      currentOverlay:window.__earthlineOverlaySnapshot16690?window.__earthlineOverlaySnapshot16690():null,
      trace,
      savedInputCounts:lastInput?{
        swales:Number(lastInput?.swales?.features?.length||0),
        contours:Number(lastInput?.contours?.features?.length||0),
        flows:Number(lastInput?.flows?.features?.length||0),
        runToken:String(lastInput?.runToken||'')
      }:null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  },traceStart);

  let recovery=null;
  if((snap.published>0||snap.generated>0)&&snap.visible===0){
    recovery=await page.evaluate(async()=>{
      const m=window.__earthlineMap16690?window.__earthlineMap16690():null;
      const data=window.__EARTHLINE_LAST_RENDER_INPUT_16690||null;
      const before={
        camera:window.__earthlineCameraSnapshot16690?window.__earthlineCameraSnapshot16690():null,
        overlay:window.__earthlineOverlaySnapshot16690?window.__earthlineOverlaySnapshot16690():null,
        audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null
      };
      let resizeCalled=false,renderCalled=false,fitCalled=false,error=null,bbox=null;
      try{
        if(data){
          const pts=[];
          for(const key of ['swales','contours','flows']){
            const fs=data?.[key]?.features||[];
            for(const f of fs){
              const g=f?.geometry;if(!g)continue;
              const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?(g.coordinates||[]):[];
              for(const line of lines)for(const p of line||[])if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]))pts.push([+p[0],+p[1]]);
            }
          }
          if(pts.length){
            const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);bbox=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
          }
        }
        if(m&&typeof m.resize==='function'){m.resize();resizeCalled=true;}
        if(m&&bbox&&typeof m.fitBounds==='function'){
          m.fitBounds([[bbox[0],bbox[1]],[bbox[2],bbox[3]]],{padding:36,duration:0});
          fitCalled=true;
        }
        await new Promise(r=>setTimeout(r,50));
        if(typeof window.earthlineRenderRegionalOverlay16020==='function'&&data){
          window.earthlineRenderRegionalOverlay16020(data);renderCalled=true;
        }
      }catch(e){error=String(e);}
      await new Promise(r=>setTimeout(r,100));
      return {
        resizeCalled,fitCalled,renderCalled,bbox,error,
        after:{
          camera:window.__earthlineCameraSnapshot16690?window.__earthlineCameraSnapshot16690():null,
          overlay:window.__earthlineOverlaySnapshot16690?window.__earthlineOverlaySnapshot16690():null,
          audit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null
        }
      };
    });
  }

  const row={index:i+1,state:stateName,elapsedMs:Date.now()-started,timedOut,snap,recovery};
  rows.push(row);
  console.log('EARTHLINE_SHARED_RENDERER_CAMERA '+JSON.stringify(row));
}

console.log('EARTHLINE_SHARED_RENDERER_CAMERA_SUMMARY '+JSON.stringify({
  rows:rows.map(r=>({
    index:r.index,state:r.state,timedOut:r.timedOut,
    generated:r.snap.generated,published:r.snap.published,visible:r.snap.visible,
    totalMs:r.snap.totalMs,
    camera:r.snap.currentCamera,
    overlay:r.snap.currentOverlay,
    renderCalls:r.snap.trace.length,
    trace:r.snap.trace.map(t=>({input:t.before?.input,beforeCamera:t.before?.camera,afterCamera:t.after?.camera,afterAudit:t.after?.audit,afterOverlay:t.after?.overlay})),
    recovery:r.recovery
  })),
  pageErrors
}));
await browser.close();
if(rows.some(r=>r.timedOut))process.exitCode=1;
