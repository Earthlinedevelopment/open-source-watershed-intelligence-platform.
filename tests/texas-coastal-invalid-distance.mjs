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
        const start16668=performance.now(),coastPts16668=[];
        const nearOutMain16668=(x16668,y16668)=>{for(let dy16668=-2;dy16668<=2;dy16668++)for(let dx16668=-2;dx16668<=2;dx16668++){const xx16668=x16668+dx16668,yy16668=y16668+dy16668;if(xx16668<0||xx16668>=hy.w||yy16668<0||yy16668>=hy.h)continue;if(validityGrid16584.outsideLandMask16632[yy16668*hy.w+xx16668])return true;}return false;};
        for(let y16668=1;y16668<hy.h-1;y16668++)for(let x16668=1;x16668<hy.w-1;x16668++){const i16668=y16668*hy.w+x16668;if(validityGrid16584.mask[i16668]===1&&nearOutMain16668(x16668,y16668))coastPts16668.push(gridLL(hy,x16668,y16668));}
        if(coastPts16668.length){
          const minX16668=Math.min(...coastPts16668.map(p=>p[0])),maxX16668=Math.max(...coastPts16668.map(p=>p[0])),minY16668=Math.min(...coastPts16668.map(p=>p[1])),maxY16668=Math.max(...coastPts16668.map(p=>p[1]));
          const cb16668=[Math.max(b[0],minX16668-1.25),Math.max(b[1],minY16668-.55),Math.min(b[2],maxX16668+.55),Math.min(b[3],maxY16668+1.35)];
          const savedLandAudit16668=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16668=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
          const cd16668=await loadDEM(cb16668,240,240,7000,'coastal detail elevation');
          const cg16668=earthlineLandValidityMask16584(cd16668,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16668;
          const ch16668=await hydrology(cd16668,cg16668.mask);
          ch16668.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];
          ch16668.outsideLandMask16632=cg16668.outsideLandMask16632||null;ch16668.inlandWaterMask16632=cg16668.inlandWaterMask16632||null;
          const cc16668=await makeContours(ch16668,true);
          const cs16668=await makeSwales(ch16668,cc16668,false,swaleJurisdictionGeometry16539);
          window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16668;
          const coastDist16668=ll16668=>{const g16668=llGrid(ch16668,ll16668);if(!g16668||!Number.isFinite(g16668.x)||!Number.isFinite(g16668.y))return null;const cx16668=Math.max(0,Math.min(ch16668.w-1,Math.round(g16668.x))),cy16668=Math.max(0,Math.min(ch16668.h-1,Math.round(g16668.y)));for(let r16668=0;r16668<=24;r16668++)for(let dy16668=-r16668;dy16668<=r16668;dy16668++)for(let dx16668=-r16668;dx16668<=r16668;dx16668++){if(Math.max(Math.abs(dx16668),Math.abs(dy16668))!==r16668)continue;const xx16668=cx16668+dx16668,yy16668=cy16668+dy16668;if(xx16668<0||xx16668>=ch16668.w||yy16668<0||yy16668>=ch16668.h)continue;if(cg16668.outsideLandMask16632[yy16668*ch16668.w+xx16668])return r16668;}return null;};
          const rows16668=(cs16668.features||[]).map(f16668=>{const c16668=f16668.geometry&&f16668.geometry.coordinates||[],m16668=c16668[Math.floor((c16668.length-1)/2)]||null,d16668=m16668?coastDist16668(m16668):null;return {rank:f16668.properties&&f16668.properties.rank,score:f16668.properties&&f16668.properties.score,mid:m16668,distCells:d16668,distKm:Number.isFinite(d16668)?Number((d16668*Math.max(ch16668.cellX,ch16668.cellY)/1000).toFixed(1)):null};}).filter(r=>Number.isFinite(r.distCells)).sort((a,b)=>a.distCells-b.distCells);
          window.EARTHLINE_TX_LOCAL_SWALES_16668={bounds:cb16668,cellKm:Number((Math.max(ch16668.cellX,ch16668.cellY)/1000).toFixed(2)),elapsedMs:Math.round(performance.now()-start16668),total:(cs16668.features||[]).length,within2:rows16668.filter(r=>r.distCells<=2).length,within4:rows16668.filter(r=>r.distCells<=4).length,within6:rows16668.filter(r=>r.distCells<=6).length,within8:rows16668.filter(r=>r.distCells<=8).length,within12:rows16668.filter(r=>r.distCells<=12).length,rows:rows16668.slice(0,30)};
        }
      }catch(e){window.EARTHLINE_TX_LOCAL_SWALES_16668={error:String(e)};}
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const n=body.split(needle).length-1;patches.localSwales=n;if(n!==1)throw new Error('localSwales expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_local_swales='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:60000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({local:window.EARTHLINE_TX_LOCAL_SWALES_16668||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_LOCAL_SWALES '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.local?.error||patches.localSwales!==1)process.exitCode=1;
