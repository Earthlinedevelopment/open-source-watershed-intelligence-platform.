import { chromium } from 'playwright';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
let patchMatches=0;
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();
    const needle="      const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;";
    patchMatches=body.split(needle).length-1;
    if(patchMatches!==1)throw new Error('render rule expected once, found '+patchMatches);
    body=body.replace(needle,`      const pts=points(f.geometry.coordinates),len=polyLength(pts);
      try{
        const audit16690=window.EARTHLINE_VT_RENDER_DROP_AUDIT_16690||(window.EARTHLINE_VT_RENDER_DROP_AUDIT_16690={rows:[]});
        const cc16690=f.geometry.coordinates||[],mid16690=cc16690.length?cc16690[Math.floor((cc16690.length-1)/2)]:null;
        audit16690.rows.push({rank:f.properties&&f.properties.rank,grade:f.properties&&f.properties.grade,coordCount:cc16690.length,projectedPoints:pts.length,screenLength:Number(len.toFixed(2)),mid:mid16690,drop:pts.length<3?'projected-points':len<22?'screen-length':null});
      }catch(_){}
      if(pts.length<3||len<22)continue;`);
    await route.fulfill({response,body});return;
  }
  await route.continue();
});
await page.goto(BASE+'?vt_render_drop='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||/screening published\./i.test(s);},{},{timeout:35000,polling:50});}catch(_){timedOut=true;}
await page.waitForTimeout(500);
const state=await page.evaluate(()=>{
 const rows=(window.EARTHLINE_VT_RENDER_DROP_AUDIT_16690?.rows||[]);
 const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
 return {rows,dropRows:rows.filter(r=>r.drop),keptRows:rows.filter(r=>!r.drop),publication:pub,display:disp,generation:gen,boundary:b,perf:p,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
});
console.log('EARTHLINE_VT_RENDER_DROP '+JSON.stringify({patchMatches,timedOut,state}));
await browser.close();
if(patchMatches!==1||timedOut||state.lastError)process.exitCode=1;
