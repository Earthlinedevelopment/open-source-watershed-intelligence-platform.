import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const needle=`          hy=await hydrology(dem,validityGrid16584.mask);
          hy.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];
          hy.outsideLandMask16632=validityGrid16584.outsideLandMask16632||null;
          hy.inlandWaterMask16632=validityGrid16584.inlandWaterMask16632||null;`;
 const repl=`          hy=await hydrology(dem,validityGrid16584.mask);
          hy.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];
          hy.outsideLandMask16632=validityGrid16584.outsideLandMask16632||null;
          hy.inlandWaterMask16632=validityGrid16584.inlandWaterMask16632||null;
          if(!focusMode&&/texas/i.test(String(q||''))){
            try{
              const hiStarted16665=performance.now(),savedAudit16665=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584;
              const hiDem16665=await loadDEM(b,192,192,6000,'coastal refinement elevation');
              const hiGrid16665=earthlineLandValidityMask16584(hiDem16665,landValidity16584);
              window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedAudit16665;
              const hiHy16665=await hydrology(hiDem16665,hiGrid16665.mask);
              hiHy16665.outsideLandMask16632=hiGrid16665.outsideLandMask16632||null;
              let coastal16665=0,suitable02=0,suitable05=0,suitable3=0,minSlope16665=Infinity,maxSlope16665=0;
              const rows16665=[];
              const nearOut16665=(x16665,y16665,r16665=4)=>{for(let dy16665=-r16665;dy16665<=r16665;dy16665++)for(let dx16665=-r16665;dx16665<=r16665;dx16665++){const xx16665=x16665+dx16665,yy16665=y16665+dy16665;if(xx16665<0||xx16665>=hiHy16665.w||yy16665<0||yy16665>=hiHy16665.h)continue;if(hiGrid16665.outsideLandMask16632[yy16665*hiHy16665.w+xx16665])return true;}return false;};
              for(let y16665=1;y16665<hiHy16665.h-1;y16665++)for(let x16665=1;x16665<hiHy16665.w-1;x16665++){
                const i16665=y16665*hiHy16665.w+x16665;if(hiGrid16665.mask[i16665]!==1||!nearOut16665(x16665,y16665,4))continue;
                coastal16665++;const sp16665=Number(hiHy16665.slope[i16665]),ac16665=Number(hiHy16665.acc[i16665]);
                if(Number.isFinite(sp16665)){minSlope16665=Math.min(minSlope16665,sp16665);maxSlope16665=Math.max(maxSlope16665,sp16665);if(sp16665>=.2)suitable02++;if(sp16665>=.5)suitable05++;if(sp16665>=3)suitable3++;}
                if(sp16665>=.2&&rows16665.length<80)rows16665.push({x:x16665,y:y16665,slope:sp16665,acc:ac16665,ll:gridLL(hiHy16665,x16665,y16665)});
              }
              window.EARTHLINE_TX_COAST_HIRES_16665={w:hiHy16665.w,h:hiHy16665.h,cellKm:Number((Math.max(hiHy16665.cellX,hiHy16665.cellY)/1000).toFixed(2)),coastalCells:coastal16665,suitable02,suitable05,suitable3,minSlope:Number.isFinite(minSlope16665)?minSlope16665:null,maxSlope:maxSlope16665,elapsedMs:Math.round(performance.now()-hiStarted16665),rows:rows16665};
            }catch(e){window.EARTHLINE_TX_COAST_HIRES_16665={error:String(e)};}
          }`;
 const n=body.split(needle).length-1;patches.hires=n;if(n!==1)throw new Error('hires expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_hires_coast='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:45000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({hi:window.EARTHLINE_TX_COAST_HIRES_16665||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_COAST_HIRES '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.hi?.error||patches.hires!==1)process.exitCode=1;
