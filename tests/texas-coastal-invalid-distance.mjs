import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['California'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('capturePre',
`    const candidatesBeforeJurisdiction16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;`,
`    const candidatesBeforeJurisdiction16539=candidates.length;
    const distWater16697=c16697=>{
      const x16697=Math.max(0,Math.min(hy.w-1,Math.round(Number(c16697&&c16697.x)))),y16697=Math.max(0,Math.min(hy.h-1,Math.round(Number(c16697&&c16697.y))));
      if(!Number.isFinite(x16697)||!Number.isFinite(y16697))return null;
      const out16697=hy.outsideLandMask16632||null,inland16697=hy.inlandWaterMask16584||null;
      if(!out16697&&!inland16697)return null;
      for(let r16697=0;r16697<=20;r16697++){
        for(let dy16697=-r16697;dy16697<=r16697;dy16697++)for(let dx16697=-r16697;dx16697<=r16697;dx16697++){
          if(Math.max(Math.abs(dx16697),Math.abs(dy16697))!==r16697)continue;
          const xx16697=x16697+dx16697,yy16697=y16697+dy16697;if(xx16697<0||xx16697>=hy.w||yy16697<0||yy16697>=hy.h)continue;
          const i16697=yy16697*hy.w+xx16697;
          if((out16697&&out16697[i16697])||(inland16697&&inland16697[i16697]))return r16697;
        }
      }
      return null;
    };
    const row16697=c16697=>({x:Number(c16697&&c16697.x),y:Number(c16697&&c16697.y),score:Number(c16697&&c16697.score||0),distWater:distWater16697(c16697)});
    const preRows16697=candidates.map(row16697);
    let jurisdictionRejectedCandidates16539=0;`);

  apply('captureEligible',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const eligibleRows16697=candidates.map(row16697);
    candidates.sort((a,b)=>b.score-a.score);`);

  apply('captureChosen',
`    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`,
`    try{
      const chosenRows16697=chosen.map(row16697);
      const summarize16697=rows16697=>{const ds16697=rows16697.map(r=>r.distWater).filter(Number.isFinite).sort((a,b)=>a-b);return {count:rows16697.length,finite:ds16697.length,min:ds16697[0]??null,le1:ds16697.filter(x=>x<=1).length,le2:ds16697.filter(x=>x<=2).length,le3:ds16697.filter(x=>x<=3).length,le4:ds16697.filter(x=>x<=4).length,le6:ds16697.filter(x=>x<=6).length,le10:ds16697.filter(x=>x<=10).length};};
      window.EARTHLINE_WATER_DISTANCE_STAGE_16697={pre:summarize16697(preRows16697),eligible:summarize16697(eligibleRows16697),chosen:summarize16697(chosenRows16697),preRows:preRows16697,eligibleRows:eligibleRows16697,chosenRows:chosenRows16697,cellKm:Number((Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(2)),hy:{w:hy.w,h:hy.h,bounds:hy.bounds}};
    }catch(e16697){window.EARTHLINE_WATER_DISTANCE_STAGE_16697={error:String(e16697)};}
    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?water_distance_stage='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_WATER_DISTANCE_STAGE_16697=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>({state:q,water:window.EARTHLINE_WATER_DISTANCE_STAGE_16697||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_WATER_DISTANCE_STAGE '+JSON.stringify(row));
}
console.log('EARTHLINE_WATER_DISTANCE_STAGE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
