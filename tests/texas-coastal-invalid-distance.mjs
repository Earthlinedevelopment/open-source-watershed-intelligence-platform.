import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];

for(const variant of ['baseline','spatial']){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 const patches={};
 await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('distanceHelper',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const distWater16699=c16699=>{const x16699=Math.max(0,Math.min(hy.w-1,Math.round(Number(c16699&&c16699.x)))),y16699=Math.max(0,Math.min(hy.h-1,Math.round(Number(c16699&&c16699.y))));const out16699=hy.outsideLandMask16632||null,in16699=hy.inlandWaterMask16584||null;if(!out16699&&!in16699)return null;for(let r16699=0;r16699<=12;r16699++){for(let dy16699=-r16699;dy16699<=r16699;dy16699++)for(let dx16699=-r16699;dx16699<=r16699;dx16699++){if(Math.max(Math.abs(dx16699),Math.abs(dy16699))!==r16699)continue;const xx16699=x16699+dx16699,yy16699=y16699+dy16699;if(xx16699<0||xx16699>=hy.w||yy16699<0||yy16699>=hy.h)continue;const i16699=yy16699*hy.w+xx16699;if((out16699&&out16699[i16699])||(in16699&&in16699[i16699]))return r16699;}}return null;};
    const eligibleNear16699=candidates.map(distWater16699).filter(Number.isFinite);
    candidates.sort((a,b)=>b.score-a.score);`);

  if(variant==='spatial'){
   apply('selection',
`    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    for(const c of candidates){
      if(chosen.length>=80)break;
      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }`,
`    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    const bin16699=c16699=>Math.max(0,Math.min(7,Math.floor(Number(c16699.x)*8/Math.max(1,hy.w))))+','+Math.max(0,Math.min(7,Math.floor(Number(c16699.y)*8/Math.max(1,hy.h)));
    const bins16699=new Set();
    for(const c of candidates){if(chosen.length>=80)break;const k16699=bin16699(c);if(bins16699.has(k16699))continue;if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<primarySpacing))continue;chosen.push(c);bins16699.add(k16699);}
    const seeded16699=chosen.length;
    for(const c of candidates){if(chosen.length>=80)break;if(chosen.includes(c))continue;const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;chosen.push(c);}
    window.EARTHLINE_CA_SELECTION_16699={seeded:seeded16699,bins:Array.from(bins16699)};`);
  }

  apply('chosenAudit',
`    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`,
`    try{const d16699=chosen.map(distWater16699).filter(Number.isFinite).sort((a,b)=>a-b);window.EARTHLINE_CA_WATER_SELECTION_16699={eligible:{count:eligibleNear16699.length,min:eligibleNear16699.length?Math.min(...eligibleNear16699):null,le1:eligibleNear16699.filter(x=>x<=1).length,le2:eligibleNear16699.filter(x=>x<=2).length,le3:eligibleNear16699.filter(x=>x<=3).length},chosen:{count:d16699.length,min:d16699[0]??null,le1:d16699.filter(x=>x<=1).length,le2:d16699.filter(x=>x<=2).length,le3:d16699.filter(x=>x<=3).length},cellKm:Number((Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(2))};}catch(e16699){window.EARTHLINE_CA_WATER_SELECTION_16699={error:String(e16699)};}
    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`);
  return route.fulfill({response:resp,body});
 });

 await page.goto(URL+'?ca_selection_'+variant+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='California';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(300);
 const snap=await page.evaluate(()=>{const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,j=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {water:window.EARTHLINE_CA_WATER_SELECTION_16699||null,selection:window.EARTHLINE_CA_SELECTION_16699||null,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:j?.outsideAfterClip??null,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
 const row={variant,elapsedMs:Date.now()-started,timedOut,patches,snap};rows.push(row);console.log('EARTHLINE_CA_SELECTION_FAST '+JSON.stringify(row));
 await page.close();
}
console.log('EARTHLINE_CA_SELECTION_FAST_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError||r.snap.visible!==r.snap.published||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.unsafe||0)!==0||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
