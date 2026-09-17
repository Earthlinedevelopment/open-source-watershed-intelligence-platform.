import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Texas','Colorado','New Mexico','New York','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  try{
    await page.goto(BASE+'?earthline_original_funnel='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const started=Date.now();
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(()=>{
        if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191;
      },{timeout:35000,polling:50});
    }catch(_){timedOut=true;}
    const snap=await page.evaluate(()=>{
      const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
      const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const generation=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
      const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
      let camera=null;
      try{
        const m=earthlineMap,b=M?.loc?.bbox,c=m?.getContainer?.();
        if(m&&Array.isArray(b)&&b.length===4&&c){
          const sw=m.project([b[0],b[1]]),ne=m.project([b[2],b[3]]);
          camera={widthFraction:Math.abs(Number(ne.x)-Number(sw.x))/Math.max(1,c.clientWidth),heightFraction:Math.abs(Number(sw.y)-Number(ne.y))/Math.max(1,c.clientHeight),zoom:Number(m.getZoom()),center:{lng:Number(m.getCenter().lng),lat:Number(m.getCenter().lat)}};
        }
      }catch(_){}
      return {visual,perf,generation,pub,display,flow,boundary,status,camera,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
    });
    const row={
      query,
      clickToTerminalMs:Date.now()-started,
      timedOut,
      loadError,
      pageErrors,
      status:snap.status,
      lastError:snap.lastError,
      perf:snap.perf,
      generation:snap.generation,
      publication:snap.pub,
      display:snap.display,
      grid:snap.flow?.gridAudit?.grid||null,
      unsafe:snap.flow?.unsafeSegments??null,
      outsideAfterClip:snap.boundary?.outsideAfterClip??null,
      visualCounts:{
        swales:Array.isArray(snap.visual?.swales?.features)?snap.visual.swales.features.length:0,
        flows:Array.isArray(snap.visual?.flows?.features)?snap.visual.flows.features.length:0,
        contours:Array.isArray(snap.visual?.contours?.features)?snap.visual.contours.features.length:0
      },
      camera:snap.camera
    };
    results.push(row);
    console.log('EARTHLINE_ORIGINAL_FUNNEL '+JSON.stringify(row));
  }catch(e){
    loadError=String(e);
    results.push({query,loadError,timedOut,pageErrors});
    console.log('EARTHLINE_ORIGINAL_FUNNEL '+JSON.stringify(results.at(-1)));
  }
  await context.close();
}

await browser.close();
writeFileSync('shared-regional-original-funnel.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors?.length))process.exitCode=1;
