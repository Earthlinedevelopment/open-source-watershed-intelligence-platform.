import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const needle=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const repl=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    if(!focusMode&&/texas/i.test(String(q||''))){
      try{
        const t16666=performance.now(),savedLandAudit16666=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16666=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
        const hiDem16666=await loadDEM(b,192,192,6000,'coastal refinement elevation');
        const hiGrid16666=earthlineLandValidityMask16584(hiDem16666,landValidity16584);
        window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16666;
        const hiHy16666=await hydrology(hiDem16666,hiGrid16666.mask);
        hiHy16666.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];
        hiHy16666.outsideLandMask16632=hiGrid16666.outsideLandMask16632||null;
        hiHy16666.inlandWaterMask16632=hiGrid16666.inlandWaterMask16632||null;
        const hiContours16666=await makeContours(hiHy16666,true);
        const hiSwales16666=await makeSwales(hiHy16666,hiContours16666,false,swaleJurisdictionGeometry16539);
        window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16666;
        const nearCoast16666=(ll16666,r16666=6)=>{const g16666=llGrid(hiHy16666,ll16666);if(!g16666||!Number.isFinite(g16666.x)||!Number.isFinite(g16666.y))return null;const cx16666=Math.max(0,Math.min(hiHy16666.w-1,Math.round(g16666.x))),cy16666=Math.max(0,Math.min(hiHy16666.h-1,Math.round(g16666.y)));for(let rr16666=0;rr16666<=r16666;rr16666++)for(let dy16666=-rr16666;dy16666<=rr16666;dy16666++)for(let dx16666=-rr16666;dx16666<=rr16666;dx16666++){if(Math.max(Math.abs(dx16666),Math.abs(dy16666))!==rr16666)continue;const xx16666=cx16666+dx16666,yy16666=cy16666+dy16666;if(xx16666<0||xx16666>=hiHy16666.w||yy16666<0||yy16666>=hiHy16666.h)continue;if(hiGrid16666.outsideLandMask16632[yy16666*hiHy16666.w+xx16666])return rr16666;}return null;};
        const rows16666=(hiSwales16666.features||[]).map(f16666=>{const c16666=f16666.geometry&&f16666.geometry.coordinates||[],m16666=c16666[Math.floor((c16666.length-1)/2)]||null,d16666=m16666?nearCoast16666(m16666,12):null;return {rank:f16666.properties&&f16666.properties.rank,score:f16666.properties&&f16666.properties.score,slope:f16666.properties&&f16666.properties.mean_slope_pct||f16666.properties&&f16666.properties.slope||null,mid:m16666,distCells:d16666,distKm:Number.isFinite(d16666)?Number((d16666*Math.max(hiHy16666.cellX,hiHy16666.cellY)/1000).toFixed(1)):null};}).filter(r16666=>Number.isFinite(r16666.distCells)).sort((a16666,b16666)=>a16666.distCells-b16666.distCells);
        window.EARTHLINE_TX_HIRES_SWALES_16666={elapsedMs:Math.round(performance.now()-t16666),total:(hiSwales16666.features||[]).length,coastal12:rows16666.length,within2:rows16666.filter(r=>r.distCells<=2).length,within4:rows16666.filter(r=>r.distCells<=4).length,within6:rows16666.filter(r=>r.distCells<=6).length,rows:rows16666.slice(0,30)};
      }catch(e){window.EARTHLINE_TX_HIRES_SWALES_16666={error:String(e)};}
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const n=body.split(needle).length-1;patches.hiresSwales=n;if(n!==1)throw new Error('hiresSwales expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_hires_swales='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:50000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({hi:window.EARTHLINE_TX_HIRES_SWALES_16666||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_HIRES_SWALES '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.hi?.error||patches.hiresSwales!==1)process.exitCode=1;
