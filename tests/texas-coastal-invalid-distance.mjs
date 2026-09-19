import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const needle=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];`;
 const repl=`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    try{
      const rows16663=[];let coastal16663=0,suitable16663=0;
      const mask16663=hy.validityMask16584,out16663=hy.outsideLandMask16632;
      if(mask16663&&out16663){
        const nearOut16663=(x16663,y16663,r16663)=>{for(let dy16663=-r16663;dy16663<=r16663;dy16663++)for(let dx16663=-r16663;dx16663<=r16663;dx16663++){const xx16663=x16663+dx16663,yy16663=y16663+dy16663;if(xx16663<0||xx16663>=hy.w||yy16663<0||yy16663>=hy.h)continue;if(out16663[yy16663*hy.w+xx16663])return true;}return false;};
        for(let y16663=1;y16663<hy.h-1;y16663++)for(let x16663=1;x16663<hy.w-1;x16663++){
          const i16663=y16663*hy.w+x16663;if(mask16663[i16663]!==1||!nearOut16663(x16663,y16663,2))continue;
          coastal16663++;const slope16663=Number(hy.slope[i16663]),acc16663=Number(hy.acc[i16663]),ok16663=Number.isFinite(slope16663)&&slope16663>=.20&&slope16663<=13.5&&Number.isFinite(acc16663)&&acc16663<channel;
          if(ok16663)suitable16663++;
          if(rows16663.length<120)rows16663.push({x:x16663,y:y16663,slope:slope16663,acc:acc16663,ok:ok16663});
        }
      }
      window.EARTHLINE_TX_COAST_GRID_16663={coastalCells:coastal16663,suitableCells:suitable16663,channel:Number(channel),rows:rows16663};
    }catch(e){window.EARTHLINE_TX_COAST_GRID_16663={error:String(e)};}`;
 const n=body.split(needle).length-1;patches.grid=n;if(n!==1)throw new Error('grid expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_coast_grid='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:35000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({grid:window.EARTHLINE_TX_COAST_GRID_16663||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_COAST_GRID '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.lastError||patches.grid!==1)process.exitCode=1;
