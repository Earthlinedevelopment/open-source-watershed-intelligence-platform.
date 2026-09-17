import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Texas','Colorado','New Mexico','New York','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

const OLD="    const lines=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');\n";
const NEW="    const sourceLines16592=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');\n    const lines=[];\n    if(!focusMode&&jurisdictionGeometry16539){\n      for(const sourceLine16592 of sourceLines16592){\n        const runs16592=earthlineClipLine16539(sourceLine16592.geometry.coordinates||[],jurisdictionGeometry16539);\n        for(const run16592 of runs16592){\n          if(!run16592||run16592.length<10||lineLengthPixels(hy,run16592)<5)continue;\n          lines.push({type:'Feature',properties:sourceLine16592.properties||{},geometry:{type:'LineString',coordinates:run16592}});\n        }\n      }\n    }else lines.push(...sourceLines16592);\n";

for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let patchMatches=0,loadError=null,timedOut=false;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch(); let body=await response.text();
      patchMatches=body.split(OLD).length-1;
      if(patchMatches!==1)throw new Error('contour sampling source expected once, found '+patchMatches);
      body=body.replace(OLD,NEW);
      await route.fulfill({response,body}); return;
    }
    await route.continue();
  });
  try{
    await page.goto(BASE+'?earthline_jurisdiction_sampling='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const started=Date.now();
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{await page.waitForFunction(()=>{if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;},{timeout:35000,polling:50});}catch(_){timedOut=true;}
    const snap=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,u=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;return{p,g,u,d,f,b,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),visual:Array.isArray(v?.swales?.features)?v.swales.features.length:0};});
    const row={query,patchMatches,clickToTerminalMs:Date.now()-started,timedOut,loadError,pageErrors,coreMs:snap.p?.totalMs??null,phases:snap.p?.phaseTotalsMs??null,candidates:snap.g?.candidates??null,preferredEligible:snap.g?.preferredJurisdictionEligibleCandidates??null,eligible:snap.g?.jurisdictionEligibleCandidates??null,rejected:snap.g?.jurisdictionRejectedCandidates??null,chosen:snap.g?.chosenBeforeTierGate??null,published:snap.u?.generated??snap.visual,visible:snap.d?.swaleLines??snap.visual,visualSwales:snap.visual,grid:snap.f?.gridAudit?.grid||null,unsafe:snap.f?.unsafeSegments??null,outsideAfterClip:snap.b?.outsideAfterClip??null,lastError:snap.lastError,status:snap.status};
    results.push(row); console.log('EARTHLINE_JURISDICTION_SAMPLING '+JSON.stringify(row));
  }catch(e){loadError=String(e);results.push({query,patchMatches,loadError,timedOut,pageErrors});console.log('EARTHLINE_JURISDICTION_SAMPLING '+JSON.stringify(results.at(-1)));}
  await context.close();
}
await browser.close();
writeFileSync('shared-jurisdiction-contour-sampling.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut))process.exitCode=1;
