import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
if(!STATES.length) throw new Error('STATES is empty');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
let patchMatches=0;

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const needle=`    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`;
  const repl=`    let coastalValidCells16704=0,preferredNearCoast16704=0;
    if(!focusMode&&hy&&hy.validityMask16584&&hy.outsideLandMask16632){
      const nearOcean16704=(x16704,y16704,r16704=2)=>{for(let dy16704=-r16704;dy16704<=r16704;dy16704++)for(let dx16704=-r16704;dx16704<=r16704;dx16704++){const xx16704=x16704+dx16704,yy16704=y16704+dy16704;if(xx16704<0||xx16704>=hy.w||yy16704<0||yy16704>=hy.h)continue;if(hy.outsideLandMask16632[yy16704*hy.w+xx16704])return true;}return false;};
      for(let y16704=1;y16704<hy.h-1;y16704++)for(let x16704=1;x16704<hy.w-1;x16704++){const i16704=y16704*hy.w+x16704;if(hy.validityMask16584[i16704]===1&&nearOcean16704(x16704,y16704,2))coastalValidCells16704++;}
      for(const c16704 of candidates){if(c16704&&Number.isFinite(c16704.x)&&Number.isFinite(c16704.y)&&nearOcean16704(Math.round(c16704.x),Math.round(c16704.y),2))preferredNearCoast16704++;}
    }
    window.EARTHLINE_COASTAL_STARVATION_AUDIT_16704={maxCellM:Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0),cellX:Number(hy.cellX)||0,cellY:Number(hy.cellY)||0,coastalValidCells2:coastalValidCells16704,preferredCandidates:candidates.length,preferredNearCoast2:preferredNearCoast16704,starvationRatio:coastalValidCells16704>0?preferredNearCoast16704/coastalValidCells16704:null,at:new Date().toISOString()};
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`;
  patchMatches=body.split(needle).length-1;
  if(patchMatches!==1)throw new Error('coastal starvation audit anchor expected once, found '+patchMatches);
  body=body.replace(needle,repl);
  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?coastal_starvation_audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_COASTAL_STARVATION_AUDIT_16704=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;try{await page.waitForFunction(prev=>{const token=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||token!==prev)&&!!token&&/screening published\./i.test(s));},prior,{timeout:70000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(250);
  const snap=await page.evaluate(()=>({audit:window.EARTHLINE_COASTAL_STARVATION_AUDIT_16704||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_COASTAL_STARVATION '+JSON.stringify(row));
}
console.log('EARTHLINE_COASTAL_STARVATION_SUMMARY '+JSON.stringify({patchMatches,rows}));
await browser.close();
if(patchMatches!==1||rows.some(r=>r.timedOut))process.exitCode=1;
