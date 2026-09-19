import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];

for(const cap of [80,100,120]){
 const page=await browser.newPage({viewport:{width:1800,height:1000}});
 const patches={};
 await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};
  if(cap!==80){
    apply('cap',`      if(chosen.length>=80)break;`,'      if(chosen.length>='+cap+')break;');
  }
  apply('distanceHelper',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const distWater16700=c16700=>{const x16700=Math.max(0,Math.min(hy.w-1,Math.round(Number(c16700&&c16700.x)))),y16700=Math.max(0,Math.min(hy.h-1,Math.round(Number(c16700&&c16700.y))));const out16700=hy.outsideLandMask16632||null,in16700=hy.inlandWaterMask16584||null;if(!out16700&&!in16700)return null;for(let r16700=0;r16700<=12;r16700++){for(let dy16700=-r16700;dy16700<=r16700;dy16700++)for(let dx16700=-r16700;dx16700<=r16700;dx16700++){if(Math.max(Math.abs(dx16700),Math.abs(dy16700))!==r16700)continue;const xx16700=x16700+dx16700,yy16700=y16700+dy16700;if(xx16700<0||xx16700>=hy.w||yy16700<0||yy16700>=hy.h)continue;const i16700=yy16700*hy.w+xx16700;if((out16700&&out16700[i16700])||(in16700&&in16700[i16700]))return r16700;}}return null;};
    candidates.sort((a,b)=>b.score-a.score);`);
  const chosenReplacement='    try{const d16700=chosen.map(distWater16700).filter(Number.isFinite).sort((a,b)=>a-b);window.EARTHLINE_CA_CAP_16700={cap:'+cap+',chosen:chosen.length,finite:d16700.length,min:d16700[0]??null,le1:d16700.filter(x=>x<=1).length,le2:d16700.filter(x=>x<=2).length,le3:d16700.filter(x=>x<=3).length,le4:d16700.filter(x=>x<=4).length};}catch(e16700){window.EARTHLINE_CA_CAP_16700={error:String(e16700)};}\n    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.';
  apply('chosenAudit',
`    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`,
chosenReplacement);
  return route.fulfill({response:resp,body});
 });
 await page.goto(URL+'?ca_cap_'+cap+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='California';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(300);
 const snap=await page.evaluate(()=>{const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,j=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {cap:window.EARTHLINE_CA_CAP_16700||null,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:j?.outsideAfterClip??null,unsafe:flow?.unsafeSegments??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
 const row={cap,elapsedMs:Date.now()-started,timedOut,patches,snap};rows.push(row);console.log('EARTHLINE_CA_CAP_AB '+JSON.stringify(row));
 await page.close();
}
console.log('EARTHLINE_CA_CAP_AB_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError||r.snap.visible!==r.snap.published||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.unsafe||0)!==0||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
