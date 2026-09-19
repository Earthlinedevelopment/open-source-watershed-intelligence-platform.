import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Texas','California','Maryland'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('preJurisdictionSpatial',
`    const preferredCandidateCount16539=candidates.length;
    let jurisdictionRejectedCandidates16539=0;`,
`    const preferredCandidateCount16539=candidates.length;
    const midpoint16696=c16696=>{const seg16696=c16696&&c16696.segment||[],m16696=seg16696[Math.floor((seg16696.length-1)/2)]||null;return Array.isArray(m16696)?{lng:Number(m16696[0]),lat:Number(m16696[1]),score:Number(c16696.score||0),slope:Number(c16696.slope||0),acc:Number(c16696.acc||0),x:Number(c16696.x),y:Number(c16696.y)}:null;};
    const preJurisdictionSpatial16696=candidates.map(midpoint16696).filter(Boolean);
    const rejectionRows16696=[];
    let jurisdictionRejectedCandidates16539=0;`);

  apply('screenRejectCapture',
`      if(!screened16539){jurisdictionRejectedCandidates16539++;continue;}`,
`      if(!screened16539){jurisdictionRejectedCandidates16539++;const r16696=midpoint16696(candidate16539);if(r16696)rejectionRows16696.push(r16696);continue;}`);

  apply('eligibleAudit',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const eligibleSpatial16696=candidates.map(midpoint16696).filter(Boolean);
    const occ16696=rows16696=>{const cells16696=new Set();for(const r16696 of rows16696){const ix16696=Math.max(0,Math.min(3,Math.floor(Number(r16696.x)*4/Math.max(1,hy.w)))),iy16696=Math.max(0,Math.min(3,Math.floor(Number(r16696.y)*4/Math.max(1,hy.h))));cells16696.add(ix16696+','+iy16696);}return cells16696.size;};
    const grid16696=rows16696=>{const g16696=Array.from({length:4},()=>[0,0,0,0]);for(const r16696 of rows16696){const ix16696=Math.max(0,Math.min(3,Math.floor(Number(r16696.x)*4/Math.max(1,hy.w)))),iy16696=Math.max(0,Math.min(3,Math.floor(Number(r16696.y)*4/Math.max(1,hy.h))));g16696[iy16696][ix16696]++;}return g16696;};
    window.EARTHLINE_PRESELECT_STAGE_16696={preCount:preJurisdictionSpatial16696.length,eligibleCount:eligibleSpatial16696.length,rejectedCount:rejectionRows16696.length,preOccupancy4x4:occ16696(preJurisdictionSpatial16696),eligibleOccupancy4x4:occ16696(eligibleSpatial16696),rejectedOccupancy4x4:occ16696(rejectionRows16696),preGrid4x4:grid16696(preJurisdictionSpatial16696),eligibleGrid4x4:grid16696(eligibleSpatial16696),rejectedGrid4x4:grid16696(rejectionRows16696),preRows:preJurisdictionSpatial16696,eligibleRows:eligibleSpatial16696,rejectedRows:rejectionRows16696,hy:{w:hy.w,h:hy.h,cellX:hy.cellX,cellY:hy.cellY,bounds:hy.bounds}};
    candidates.sort((a,b)=>b.score-a.score);`);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?preselect_stage='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_PRESELECT_STAGE_16696=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>{
    const s=window.EARTHLINE_PRESELECT_STAGE_16696||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const reg=(rows,fn)=>Array.isArray(rows)?rows.filter(r=>fn(Number(r.lng),Number(r.lat))).length:0;
    let regions=null;
    if(/texas/i.test(q)&&s)regions={pre:{panhandle:reg(s.preRows,(x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg(s.preRows,(x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg(s.preRows,(x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg(s.preRows,(x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},eligible:{panhandle:reg(s.eligibleRows,(x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg(s.eligibleRows,(x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg(s.eligibleRows,(x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg(s.eligibleRows,(x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
    if(/california/i.test(q)&&s)regions={pre:{west:reg(s.preRows,x=>x<=-119.5),east:reg(s.preRows,x=>x>-119.5),north:reg(s.preRows,(x,y)=>y>=37.5),south:reg(s.preRows,(x,y)=>y<37.5),farEast:reg(s.preRows,x=>x>-118)},eligible:{west:reg(s.eligibleRows,x=>x<=-119.5),east:reg(s.eligibleRows,x=>x>-119.5),north:reg(s.eligibleRows,(x,y)=>y>=37.5),south:reg(s.eligibleRows,(x,y)=>y<37.5),farEast:reg(s.eligibleRows,x=>x>-118)}};
    if(/maryland/i.test(q)&&s)regions={pre:{west:reg(s.preRows,x=>x<-78),central:reg(s.preRows,x=>x>=-78&&x<-76.8),east:reg(s.preRows,x=>x>=-76.8),north:reg(s.preRows,(x,y)=>y>=39),south:reg(s.preRows,(x,y)=>y<39)},eligible:{west:reg(s.eligibleRows,x=>x<-78),central:reg(s.eligibleRows,x=>x>=-78&&x<-76.8),east:reg(s.eligibleRows,x=>x>=-76.8),north:reg(s.eligibleRows,(x,y)=>y>=39),south:reg(s.eligibleRows,(x,y)=>y<39)}};
    return {state:q,stage:s?{preCount:s.preCount,eligibleCount:s.eligibleCount,rejectedCount:s.rejectedCount,preOccupancy4x4:s.preOccupancy4x4,eligibleOccupancy4x4:s.eligibleOccupancy4x4,rejectedOccupancy4x4:s.rejectedOccupancy4x4,preGrid4x4:s.preGrid4x4,eligibleGrid4x4:s.eligibleGrid4x4,rejectedGrid4x4:s.rejectedGrid4x4,hy:s.hy}:null,regions,generation:g,perf:p,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  },stateName);
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_PRESELECT_STAGE '+JSON.stringify(row));
}
console.log('EARTHLINE_PRESELECT_STAGE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
