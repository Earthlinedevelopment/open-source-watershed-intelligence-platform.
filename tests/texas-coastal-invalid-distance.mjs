import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const needle=`          hy.inlandWaterMask16632=validityGrid16584.inlandWaterMask16632||null;`;
 const repl=`          hy.inlandWaterMask16632=validityGrid16584.inlandWaterMask16632||null;
          if(!focusMode&&/texas/i.test(String(q||''))){
            try{
              const start16667=performance.now(),coastPts16667=[];
              const nearOutMain16667=(x16667,y16667)=>{for(let dy16667=-2;dy16667<=2;dy16667++)for(let dx16667=-2;dx16667<=2;dx16667++){const xx16667=x16667+dx16667,yy16667=y16667+dy16667;if(xx16667<0||xx16667>=hy.w||yy16667<0||yy16667>=hy.h)continue;if(validityGrid16584.outsideLandMask16632[yy16667*hy.w+xx16667])return true;}return false;};
              for(let y16667=1;y16667<hy.h-1;y16667++)for(let x16667=1;x16667<hy.w-1;x16667++){const i16667=y16667*hy.w+x16667;if(validityGrid16584.mask[i16667]===1&&nearOutMain16667(x16667,y16667))coastPts16667.push(gridLL(hy,x16667,y16667));}
              if(coastPts16667.length){
                let minX16667=Math.min(...coastPts16667.map(p=>p[0])),maxX16667=Math.max(...coastPts16667.map(p=>p[0])),minY16667=Math.min(...coastPts16667.map(p=>p[1])),maxY16667=Math.max(...coastPts16667.map(p=>p[1]));
                const coastB16667=[Math.max(b[0],minX16667-1.25),Math.max(b[1],minY16667-.55),Math.min(b[2],maxX16667+.55),Math.min(b[3],maxY16667+1.35)];
                const savedAudit16667=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584;
                const cd16667=await loadDEM(coastB16667,240,240,7000,'coastal detail elevation');
                const cg16667=earthlineLandValidityMask16584(cd16667,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedAudit16667;
                const ch16667=await hydrology(cd16667,cg16667.mask);ch16667.outsideLandMask16632=cg16667.outsideLandMask16632||null;
                let coastCells16667=0,s02=0,s05=0,s1=0,s3=0,maxS16667=0;const rows16667=[];
                const nearOut16667=(x16667,y16667,r16667=5)=>{for(let dy16667=-r16667;dy16667<=r16667;dy16667++)for(let dx16667=-r16667;dx16667<=r16667;dx16667++){const xx16667=x16667+dx16667,yy16667=y16667+dy16667;if(xx16667<0||xx16667>=ch16667.w||yy16667<0||yy16667>=ch16667.h)continue;if(cg16667.outsideLandMask16632[yy16667*ch16667.w+xx16667])return true;}return false;};
                for(let y16667=1;y16667<ch16667.h-1;y16667++)for(let x16667=1;x16667<ch16667.w-1;x16667++){const i16667=y16667*ch16667.w+x16667;if(cg16667.mask[i16667]!==1||!nearOut16667(x16667,y16667,5))continue;coastCells16667++;const sp16667=Number(ch16667.slope[i16667]),ac16667=Number(ch16667.acc[i16667]);if(Number.isFinite(sp16667)){maxS16667=Math.max(maxS16667,sp16667);if(sp16667>=.2)s02++;if(sp16667>=.5)s05++;if(sp16667>=1)s1++;if(sp16667>=3)s3++;if(sp16667>=.2&&rows16667.length<120)rows16667.push({x:x16667,y:y16667,slope:sp16667,acc:ac16667,ll:gridLL(ch16667,x16667,y16667)});}}
                window.EARTHLINE_TX_COAST_LOCAL_16667={bounds:coastB16667,w:ch16667.w,h:ch16667.h,cellKm:Number((Math.max(ch16667.cellX,ch16667.cellY)/1000).toFixed(2)),coastCells:coastCells16667,s02,s05,s1,s3,maxSlope:maxS16667,elapsedMs:Math.round(performance.now()-start16667),rows:rows16667};
              }
            }catch(e){window.EARTHLINE_TX_COAST_LOCAL_16667={error:String(e)};}
          }`;
 const n=body.split(needle).length-1;patches.local=n;if(n!==1)throw new Error('local expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_local_coast='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:50000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({local:window.EARTHLINE_TX_COAST_LOCAL_16667||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_COAST_LOCAL '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.local?.error||patches.local!==1)process.exitCode=1;
