import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const cases=[
  {name:'baseline',patch:false},
  {name:'renderer-repair',patch:true}
];
const repeats=3;
const browser=await chromium.launch({headless:true});
const results=[];

for(const c of cases){
  for(let repeat=1;repeat<=repeats;repeat++){
    const page=await browser.newPage({viewport:{width:1800,height:1000}});
    const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    let preResizeMatches=0,lateResizeMatches=0;
    if(c.patch){
      await page.route('**/*',async route=>{
        if(route.request().resourceType()!=='document')return route.continue();
        const resp=await route.fetch(); let body=await resp.text();
        const n1='    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);';
        const r1='    try{m.resize&&m.resize();}catch(_){}\n    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);';
        const n2="const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;try{map.resize&&map.resize();}catch(_){}}";
        const r2="const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;}";
        preResizeMatches=body.split(n1).length-1; lateResizeMatches=body.split(n2).length-1;
        body=body.split(n1).join(r1).split(n2).join(r2);
        return route.fulfill({response:resp,body});
      });
    }
    const started=Date.now();
    await page.goto(URL+'?salida_renderer_ab='+c.name+'_'+repeat+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='salida, co';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
    let timedOut=false;
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(500);
    const state=await page.evaluate(()=>{
      const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
      const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const ov=document.getElementById('earthlineRegionalVectorOverlay16020');
      return {
        generated:g?.publishedFeatures??null,
        chosen:g?.chosenBeforeTierGate??null,
        displaySwales:d?.swaleLines??null,
        pubOverlaySwales:pub?.overlaySwaleLines??null,
        sourceFeatures:pub?.sourceFeatures??null,
        svgChildren:ov?ov.children.length:null,
        svgDisplay:ov?getComputedStyle(ov).display:null,
        totalMs:p?.totalMs??null,
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
        status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
      };
    });
    const row={case:c.name,repeat,preResizeMatches,lateResizeMatches,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,12)};
    results.push(row); console.log('EARTHLINE_SALIDA_RENDERER_AB '+JSON.stringify(row));
    await page.close();
  }
}
console.log('EARTHLINE_SALIDA_RENDERER_AB_SUMMARY '+JSON.stringify(results.map(r=>({case:r.case,repeat:r.repeat,timedOut:r.timedOut,preResizeMatches:r.preResizeMatches,lateResizeMatches:r.lateResizeMatches,generated:r.state.generated,displaySwales:r.state.displaySwales,pubOverlaySwales:r.state.pubOverlaySwales,svgChildren:r.state.svgChildren,totalMs:r.state.totalMs,lastError:r.state.lastError,errors:r.errors.length}))));
await browser.close();
