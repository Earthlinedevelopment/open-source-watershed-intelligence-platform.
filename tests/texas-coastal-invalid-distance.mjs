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

  apply('eligibleSpatial',
`    const jurisdictionEligibleCandidates16539=candidates.length;
    candidates.sort((a,b)=>b.score-a.score);`,
`    const jurisdictionEligibleCandidates16539=candidates.length;
    const spatial16695=c16695=>{
      const seg16695=c16695&&c16695.segment||[],m16695=seg16695[Math.floor((seg16695.length-1)/2)]||null;
      return Array.isArray(m16695)?{lng:Number(m16695[0]),lat:Number(m16695[1]),score:Number(c16695.score||0),slope:Number(c16695.slope||0),acc:Number(c16695.acc||0),x:Number(c16695.x),y:Number(c16695.y)}:null;
    };
    const eligibleSpatial16695=candidates.map(spatial16695).filter(Boolean);
    candidates.sort((a,b)=>b.score-a.score);`);

  apply('chosenSpatial',
`    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`,
`    try{
      const chosenSpatial16695=chosen.map(spatial16695).filter(Boolean);
      const occupancy16695=rows16695=>{const cells16695=new Set();for(const r16695 of rows16695){const ix16695=Math.max(0,Math.min(3,Math.floor(Number(r16695.x)*4/Math.max(1,hy.w)))),iy16695=Math.max(0,Math.min(3,Math.floor(Number(r16695.y)*4/Math.max(1,hy.h))));cells16695.add(ix16695+','+iy16695);}return cells16695.size;};
      const grid16695=rows16695=>{const g16695=Array.from({length:4},()=>[0,0,0,0]);for(const r16695 of rows16695){const ix16695=Math.max(0,Math.min(3,Math.floor(Number(r16695.x)*4/Math.max(1,hy.w)))),iy16695=Math.max(0,Math.min(3,Math.floor(Number(r16695.y)*4/Math.max(1,hy.h))));g16695[iy16695][ix16695]++;}return g16695;};
      const quartiles16695=rows16695=>{const a16695=rows16695.map(r=>Number(r.score)).filter(Number.isFinite).sort((a,b)=>a-b);const q16695=p=>a16695.length?a16695[Math.min(a16695.length-1,Math.floor((a16695.length-1)*p))]:null;return {min:q16695(0),p25:q16695(.25),median:q16695(.5),p75:q16695(.75),max:q16695(1)};};
      window.EARTHLINE_SELECTION_SPATIAL_16695={
        eligibleCount:eligibleSpatial16695.length,chosenCount:chosenSpatial16695.length,
        eligibleOccupancy4x4:occupancy16695(eligibleSpatial16695),chosenOccupancy4x4:occupancy16695(chosenSpatial16695),
        eligibleGrid4x4:grid16695(eligibleSpatial16695),chosenGrid4x4:grid16695(chosenSpatial16695),
        eligibleScore:quartiles16695(eligibleSpatial16695),chosenScore:quartiles16695(chosenSpatial16695),
        eligibleRows:eligibleSpatial16695,chosenRows:chosenSpatial16695,
        primarySpacing:primarySpacing,hy:{w:hy.w,h:hy.h,cellX:hy.cellX,cellY:hy.cellY,bounds:hy.bounds}
      };
    }catch(e16695){window.EARTHLINE_SELECTION_SPATIAL_16695={error:String(e16695)};}
    // Fail visibly rather than silently: use the best remaining terrain-derived contour segments when strict thinning produced too few.`);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?selection_spatial='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_SELECTION_SPATIAL_16695=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>{
    const s=window.EARTHLINE_SELECTION_SPATIAL_16695||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const reg=(rows,fn)=>Array.isArray(rows)?rows.filter(r=>fn(Number(r.lng),Number(r.lat))).length:0;
    let regions=null;
    if(/texas/i.test(q)&&s)regions={
      eligible:{panhandle:reg(s.eligibleRows,(x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg(s.eligibleRows,(x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg(s.eligibleRows,(x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg(s.eligibleRows,(x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},
      chosen:{panhandle:reg(s.chosenRows,(x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:reg(s.chosenRows,(x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:reg(s.chosenRows,(x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:reg(s.chosenRows,(x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}
    };
    if(/california/i.test(q)&&s)regions={
      eligible:{west:reg(s.eligibleRows,x=>x<=-119.5),east:reg(s.eligibleRows,x=>x>-119.5),north:reg(s.eligibleRows,(x,y)=>y>=37.5),south:reg(s.eligibleRows,(x,y)=>y<37.5),farEast:reg(s.eligibleRows,x=>x>-118)},
      chosen:{west:reg(s.chosenRows,x=>x<=-119.5),east:reg(s.chosenRows,x=>x>-119.5),north:reg(s.chosenRows,(x,y)=>y>=37.5),south:reg(s.chosenRows,(x,y)=>y<37.5),farEast:reg(s.chosenRows,x=>x>-118)}
    };
    if(/maryland/i.test(q)&&s)regions={
      eligible:{west:reg(s.eligibleRows,x=>x<-78),central:reg(s.eligibleRows,x=>x>=-78&&x<-76.8),east:reg(s.eligibleRows,x=>x>=-76.8),north:reg(s.eligibleRows,(x,y)=>y>=39),south:reg(s.eligibleRows,(x,y)=>y<39)},
      chosen:{west:reg(s.chosenRows,x=>x<-78),central:reg(s.chosenRows,x=>x>=-78&&x<-76.8),east:reg(s.chosenRows,x=>x>=-76.8),north:reg(s.chosenRows,(x,y)=>y>=39),south:reg(s.chosenRows,(x,y)=>y<39)}
    };
    return {state:q,spatial:s?{eligibleCount:s.eligibleCount,chosenCount:s.chosenCount,eligibleOccupancy4x4:s.eligibleOccupancy4x4,chosenOccupancy4x4:s.chosenOccupancy4x4,eligibleGrid4x4:s.eligibleGrid4x4,chosenGrid4x4:s.chosenGrid4x4,eligibleScore:s.eligibleScore,chosenScore:s.chosenScore,primarySpacing:s.primarySpacing,hy:s.hy}:null,regions,generation:g,publication:pub,display:d,perf:p,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  },stateName);
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_TRI_STATE_SELECTION '+JSON.stringify(row));
}
console.log('EARTHLINE_TRI_STATE_SELECTION_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError))process.exitCode=1;
