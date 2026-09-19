import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};

  apply('coastalGridAudit',
`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];`,
`    const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];
    try{
      const out16680=hy.outsideLandMask16632||null,mask16680=hy.validityMask16584||null;
      let coastalCells16680=0,suitableCells16680=0;
      const nearOut16680=(x16680,y16680,r16680=2)=>{if(!out16680)return false;for(let dy16680=-r16680;dy16680<=r16680;dy16680++)for(let dx16680=-r16680;dx16680<=r16680;dx16680++){const xx16680=x16680+dx16680,yy16680=y16680+dy16680;if(xx16680<0||xx16680>=hy.w||yy16680<0||yy16680>=hy.h)continue;if(out16680[yy16680*hy.w+xx16680])return true;}return false;};
      if(out16680&&mask16680){for(let y16680=1;y16680<hy.h-1;y16680++)for(let x16680=1;x16680<hy.w-1;x16680++){const i16680=y16680*hy.w+x16680;if(mask16680[i16680]!==1||!nearOut16680(x16680,y16680,2))continue;coastalCells16680++;const slope16680=Number(hy.slope[i16680]),acc16680=Number(hy.acc[i16680]);if(Number.isFinite(slope16680)&&slope16680>=.20&&slope16680<=13.5&&Number.isFinite(acc16680)&&acc16680<channel)suitableCells16680++;}}
      window.EARTHLINE_COASTAL_CROSSREF_GRID_16680={w:hy.w,h:hy.h,cellKm:Number((Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(2)),coastalCells:coastalCells16680,suitableCells:suitableCells16680,suitablePct:coastalCells16680?Number((100*suitableCells16680/coastalCells16680).toFixed(1)):null};
    }catch(e){window.EARTHLINE_COASTAL_CROSSREF_GRID_16680={error:String(e)};}`);

  apply('coastalChosenAudit',
`    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`,
`    try{
      const out16680=hy.outsideLandMask16632||null;
      const coastDist16680=c16680=>{const seg16680=c16680&&c16680.segment||[],ll16680=seg16680[Math.floor((seg16680.length-1)/2)]||null;if(!Array.isArray(ll16680)||!out16680)return null;const g16680=llGrid(hy,ll16680);if(!g16680||!Number.isFinite(g16680.x)||!Number.isFinite(g16680.y))return null;const cx16680=Math.max(0,Math.min(hy.w-1,Math.round(g16680.x))),cy16680=Math.max(0,Math.min(hy.h-1,Math.round(g16680.y)));for(let r16680=0;r16680<=20;r16680++)for(let dy16680=-r16680;dy16680<=r16680;dy16680++)for(let dx16680=-r16680;dx16680<=r16680;dx16680++){if(Math.max(Math.abs(dx16680),Math.abs(dy16680))!==r16680)continue;const xx16680=cx16680+dx16680,yy16680=cy16680+dy16680;if(xx16680<0||xx16680>=hy.w||yy16680<0||yy16680>=hy.h)continue;if(out16680[yy16680*hy.w+xx16680])return r16680;}return null;};
      const eligibleD16680=candidates.map(coastDist16680).filter(Number.isFinite).sort((a,b)=>a-b),chosenD16680=chosen.map(coastDist16680).filter(Number.isFinite).sort((a,b)=>a-b),km16680=Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000;
      window.EARTHLINE_COASTAL_CROSSREF_SWALES_16680={candidateCount:candidates.length,chosenCount:chosen.length,eligibleFinite:eligibleD16680.length,chosenFinite:chosenD16680.length,candidateMinCells:eligibleD16680[0]??null,chosenMinCells:chosenD16680[0]??null,chosenMinKm:chosenD16680.length?Number((chosenD16680[0]*km16680).toFixed(1)):null,chosenLe1:chosenD16680.filter(x=>x<=1).length,chosenLe2:chosenD16680.filter(x=>x<=2).length,chosenLe3:chosenD16680.filter(x=>x<=3).length,chosenLe4:chosenD16680.filter(x=>x<=4).length,chosenLe6:chosenD16680.filter(x=>x<=6).length};
    }catch(e){window.EARTHLINE_COASTAL_CROSSREF_SWALES_16680={error:String(e)};}
    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?coastal_crossref='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const states=['Texas','Florida','Alabama','North Carolina','Maryland','Massachusetts','New York','California'];
const rows=[];
for(const stateName of states){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_COASTAL_CROSSREF_GRID_16680=null;window.EARTHLINE_COASTAL_CROSSREF_SWALES_16680=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const state=await page.evaluate(()=>{const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {grid:window.EARTHLINE_COASTAL_CROSSREF_GRID_16680||null,coast:window.EARTHLINE_COASTAL_CROSSREF_SWALES_16680||null,generated:g?.publishedFeatures??null,visible:d?.swaleLines??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_COASTAL_CROSSREF '+JSON.stringify(row));
}
console.log('EARTHLINE_COASTAL_CROSSREF_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1))process.exitCode=1;
