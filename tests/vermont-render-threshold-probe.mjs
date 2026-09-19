import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
let patchMatches=0;
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();
    const needle=`    const gradeCounts={A:0,B:0,C:0},gradeLabels=[];
    for(const f of (lastData.swales&&lastData.swales.features||[])){
      if(!f.geometry||f.geometry.type!=='LineString')continue;
      const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;`;
    const repl=`    const gradeCounts={A:0,B:0,C:0},gradeLabels=[];
    const rendererFeatureAudit16703={total:0,renderable:0,skipped:[]};let sourceIndex16703=-1;
    for(const f of (lastData.swales&&lastData.swales.features||[])){
      sourceIndex16703++;rendererFeatureAudit16703.total++;
      if(!f.geometry||f.geometry.type!=='LineString'){rendererFeatureAudit16703.skipped.push({i:sourceIndex16703,reason:'non-linestring',type:f&&f.geometry&&f.geometry.type||null});continue;}
      const pts=points(f.geometry.coordinates),len=polyLength(pts);
      if(pts.length<3||len<22){rendererFeatureAudit16703.skipped.push({i:sourceIndex16703,reason:pts.length<3?'projected-points<3':'screen-length<22',points:pts.length,len:Number(len.toFixed(3)),grade:f&&f.properties&&f.properties.grade||null,rank:f&&f.properties&&f.properties.rank||null,score:f&&f.properties&&f.properties.score||null,coordCount:(f.geometry.coordinates||[]).length});continue;}
      rendererFeatureAudit16703.renderable++;`;
    patchMatches=body.split(needle).length-1;
    if(patchMatches!==1)throw new Error('renderer skip anchor expected once, found '+patchMatches);
    body=body.replace(needle,repl);
    const auditNeedle=`    window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:swales,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};`;
    const auditRepl=`    window.EARTHLINE_RENDERER_FEATURE_AUDIT_16703=rendererFeatureAudit16703;
    window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16030=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020={build:'EARTHLINE-REGIONAL-FINAL-16050',contourLines,elevationLabels:labels,waterPaths,directionArrows:arrows,waterOwner:'native-mapbox',svgWaterRendered:false,nativeWaterReady:!!nativeWater.ready,swaleLines:swales,swaleGradeCounts:gradeCounts,swaleGradeLabels:gradeLabels.length,topSwaleGradeLabel:gradeLabels[0]||'',buttonText:(document.getElementById('earthlineMapRun16020')||{}).textContent||'',renderedAt:new Date().toISOString()};`;
    const auditMatches=body.split(auditNeedle).length-1;
    if(auditMatches!==1)throw new Error('display audit anchor expected once, found '+auditMatches);
    body=body.replace(auditNeedle,auditRepl);
    await route.fulfill({response,body});return;
  }
  await route.continue();
});
await page.goto(BASE+'?vt_renderer_skip='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of ['Vermont','Massachusetts','Texas']){
  for(let repeat=1;repeat<=2;repeat++){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''));
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_RENDERER_FEATURE_AUDIT_16703=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
    let timedOut=false;try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t&&/screening published\./i.test(s));},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(250);
    const snap=await page.evaluate(()=>({renderer:window.EARTHLINE_RENDERER_FEATURE_AUDIT_16703||null,publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
    const row={state:stateName,repeat,timedOut,snap};rows.push(row);console.log('EARTHLINE_RENDERER_SKIP_AUDIT '+JSON.stringify(row));
  }
}
console.log('EARTHLINE_RENDERER_SKIP_AUDIT_SUMMARY '+JSON.stringify({patchMatches,rows}));
await browser.close();
if(patchMatches!==1||rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
