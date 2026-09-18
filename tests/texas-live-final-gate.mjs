import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?tx_live_final='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  window.__EL_TX_RENDER_TRACE_16641=[];
  const orig=window.earthlineRenderRegionalOverlay16020;
  if(typeof orig==='function'){
    window.__EL_TX_RENDER_ORIG_16641=orig;
    window.earthlineRenderRegionalOverlay16020=function(data){
      const snap=()=>{
        const m=window.earthlineMap||null,e=document.getElementById('earthlineRegionalVectorOverlay16020'),h=document.querySelector('.map-area')||document.getElementById('mapboxBase');
        const r=e?.getBoundingClientRect?.(),c=m?.getCanvas?.(),b=m?.getBounds?.();
        return {overlay:e?{w:r?.width||0,h:r?.height||0,children:e.children.length,paths:e.querySelectorAll('path').length,swalePaths:e.querySelectorAll('[data-layer="swale-opportunities"] path').length,viewBox:e.getAttribute('viewBox')}:null,host:{w:h?.clientWidth||0,h:h?.clientHeight||0},canvas:{w:c?.clientWidth||0,h:c?.clientHeight||0,width:c?.width||0,height:c?.height||0},zoom:m?.getZoom?.()??null,bounds:b?[b.getWest(),b.getSouth(),b.getEast(),b.getNorth()]:null};
      };
      const rec={at:new Date().toISOString(),runToken:data?.runToken||null,inputSwales:Array.isArray(data?.swales?.features)?data.swales.features.length:null,pre:snap()};
      window.__EL_TX_LAST_RENDER_DATA_16641=data;
      try{rec.result=orig.apply(this,arguments);return rec.result;}catch(error){rec.error=String(error);throw error;}finally{rec.post=snap();rec.display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;window.__EL_TX_RENDER_TRACE_16641.push(rec);}
    };
  }
  const m=window.earthlineMap||null;
  if(m&&typeof m.resize==='function'){
    const resize=m.resize.bind(m);window.__EL_TX_RESIZE_TRACE_16641=[];
    m.resize=function(){window.__EL_TX_RESIZE_TRACE_16641.push({at:new Date().toISOString(),w:m.getCanvas?.()?.clientWidth||0,h:m.getCanvas?.()?.clientHeight||0});return resize();};
  }
});
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const traceStart=await page.evaluate(()=>window.__EL_TX_RENDER_TRACE_16641?.length||0);
  const resizeStart=await page.evaluate(()=>window.__EL_TX_RESIZE_TRACE_16641?.length||0);
  const started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(({traceStart,resizeStart})=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    const traces=(window.__EL_TX_RENDER_TRACE_16641||[]).slice(traceStart),resizes=(window.__EL_TX_RESIZE_TRACE_16641||[]).slice(resizeStart);
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,view=window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null,shown=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,performance:p,generation:{runToken:g?.runToken||null,at:g?.at||null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,published:g?.publishedFeatures??null},display:d,publication:pub,publicationView:view,displayedRun:shown,renderRetry:window.EARTHLINE_REGIONAL_RENDER_RETRY_16630||null,renderTraces:traces,resizeTraces:resizes,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  },{traceStart,resizeStart});
  let recovery=null;
  if(state.lastError&&state.generation?.published>0){
    recovery=await page.evaluate(async()=>{
      const snap=()=>{const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,e=document.getElementById('earthlineRegionalVectorOverlay16020');return {visible:d?.swaleLines??null,paths:e?.querySelectorAll('[data-layer="swale-opportunities"] path').length??null};};
      const data=window.__EL_TX_LAST_RENDER_DATA_16641||null,orig=window.__EL_TX_RENDER_ORIG_16641,m=window.earthlineMap||null;
      const out={hasData:!!data,inputSwales:Array.isArray(data?.swales?.features)?data.swales.features.length:null,before:snap()};
      if(data&&typeof orig==='function'){
        try{out.immediateReturn=orig(data);}catch(e){out.immediateError=String(e);}out.afterImmediate=snap();
        try{m?.resize?.();}catch(e){out.resizeError=String(e);}
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        try{out.rafReturn=orig(data);}catch(e){out.rafError=String(e);}out.afterRaf=snap();
      }
      return out;
    });
  }
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state,recovery};rows.push(row);console.log('EARTHLINE_TX_LIVE_FINAL '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_LIVE_FINAL_SUMMARY '+JSON.stringify(rows));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||r.state.visible!==66||r.state.published!==66||!(r.state.totalMs<=15000)||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10);
const principal=rows.some(r=>/Principal Aquifers/i.test(String(r.state.aquifer?.source||''))&&Number(r.state.aquifer?.features||0)>0);
if(bad||!principal)process.exitCode=1;
