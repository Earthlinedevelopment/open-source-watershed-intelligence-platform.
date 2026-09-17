import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const RUNS=2;
const browser=await chromium.launch({headless:true});
const results=[];

function vertexCount(geometry){
  let n=0;
  const walk=v=>{if(!Array.isArray(v))return;if(v.length>=2&&Number.isFinite(Number(v[0]))&&Number.isFinite(Number(v[1]))){n++;return;}for(const x of v)walk(x);};
  walk(geometry?.coordinates);return n;
}

for(let attempt=1;attempt<=RUNS;attempt++){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  const started=Date.now();
  let timedOut=false,loadError=null;
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)throw new Error('search controls unavailable');
      i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const m=typeof M!=='undefined'&&M?M:null;
        const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const tx=/texas/i.test(String(m?.loc?.name||''))||/texas/i.test(String(m?.loc?.fullName||''));
        return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(tx&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020);
      },{timeout:30000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(350);
  }catch(e){loadError=String(e);}
  let after=null;
  try{
    after=await page.evaluate(()=>{
      const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
      const audit=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
      const map=typeof earthlineMap!=='undefined'&&earthlineMap?earthlineMap:null;
      let renderedSwales=0,sourceSwales=0,zoom=null,center=null;
      try{
        if(map?.getLayer?.('el-live-swale-line-15970')) renderedSwales=map.queryRenderedFeatures({layers:['el-live-swale-line-15970']}).length;
      }catch(_){}
      try{
        const src=map?.getSource?.('el-live-swales-15970');
        const data=src?.serialize?.()?.data||src?._data||null;
        sourceSwales=Array.isArray(data?.features)?data.features.length:0;
      }catch(_){}
      try{zoom=Number(map?.getZoom?.());const c=map?.getCenter?.();center=c?{lng:Number(c.lng),lat:Number(c.lat)}:null;}catch(_){}
      const html=document.documentElement.outerHTML;
      const repairMarker=html.includes("maxAllowableOffset:'0.0025'")&&html.includes('const raw=await jsonp(cap.endpoint,params,6500)');
      return {
        pkg,perf,audit,status,repairMarker,
        visualCounts:{
          swales:Array.isArray(visual?.swales?.features)?visual.swales.features.length:0,
          flows:Array.isArray(visual?.flows?.features)?visual.flows.features.length:0,
          contours:Array.isArray(visual?.contours?.features)?visual.contours.features.length:0
        },
        sourceSwales,renderedSwales,zoom,center,
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
      };
    });
  }catch(e){loadError=loadError||String(e);}
  const vertices=vertexCount(after?.pkg?.boundary?.geometry);
  const r={
    attempt,
    elapsedMs:Date.now()-started,
    timedOut,
    loadError,
    coreMs:Number(after?.perf?.totalMs||Infinity),
    vertices,
    repairMarker:!!after?.repairMarker,
    visualCounts:after?.visualCounts||{swales:0,flows:0,contours:0},
    sourceSwales:Number(after?.sourceSwales||0),
    renderedSwales:Number(after?.renderedSwales||0),
    zoom:after?.zoom,
    center:after?.center,
    status:after?.status||'',
    lastError:after?.lastError||null,
    pageErrors:errors.slice(0,10)
  };
  results.push(r);console.log('EARTHLINE_TEXAS_AUTHORITATIVE_DIAGNOSTIC '+JSON.stringify(r));
  await page.close();
}
await browser.close();
const bad=results.some(r=>r.timedOut||r.loadError||r.lastError||!Number.isFinite(r.coreMs)||r.coreMs>15000||!/screening published\./i.test(r.status)||r.vertices<100||r.visualCounts.swales<1||r.sourceSwales<1);
if(bad)process.exitCode=1;
