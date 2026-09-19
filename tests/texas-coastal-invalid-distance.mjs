import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['California','Texas','Maryland'];
const variants=['baseline','spatial'];
const browser=await chromium.launch({headless:true});
const rows=[];

for(const variant of variants){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const patches={};
  if(variant==='spatial'){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch();let body=await resp.text();
      const needle=`    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    for(const c of candidates){
      if(chosen.length>=80)break;
      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }`;
      const replacement=`    const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));
    const spatialBin16698=c16698=>Math.max(0,Math.min(7,Math.floor(Number(c16698.x)*8/Math.max(1,hy.w))))+','+Math.max(0,Math.min(7,Math.floor(Number(c16698.y)*8/Math.max(1,hy.h)));
    const spatialSeedBins16698=new Set();
    for(const c of candidates){
      if(chosen.length>=80)break;
      const key16698=spatialBin16698(c);if(spatialSeedBins16698.has(key16698))continue;
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<primarySpacing))continue;
      chosen.push(c);spatialSeedBins16698.add(key16698);
    }
    const spatialSeedCount16698=chosen.length;
    for(const c of candidates){
      if(chosen.length>=80)break;if(chosen.includes(c))continue;
      const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));
      if(chosen.some(p=>Math.hypot(p.x-c.x,p.y-c.y)<spacing))continue;
      chosen.push(c);
    }
    window.EARTHLINE_SPATIAL_SELECTION_16698={seeded:spatialSeedCount16698,total:chosen.length,bins:Array.from(spatialSeedBins16698)};`;
      const n=body.split(needle).length-1;patches.selection=n;if(n!==1)throw new Error('selection expected once, found '+n);body=body.replace(needle,replacement);
      return route.fulfill({response:resp,body});
    });
  }
  await page.goto(URL+'?spatial_selection='+variant+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(const stateName of STATES){
    const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
    let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||((!prev||at!==prev)&&!!at);},prior,{timeout:35000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(300);
    const snap=await page.evaluate(q=>{
      const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
      const mids=sw.map(f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;}).filter(Array.isArray);
      const b8=new Set(),b4=new Set();
      const bb=(typeof M!=='undefined'&&M&&M.loc&&Array.isArray(M.loc.bounds))?M.loc.bounds:null;
      let bounds=bb;
      if(!bounds&&mids.length){const xs=mids.map(p=>+p[0]),ys=mids.map(p=>+p[1]);bounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];}
      if(bounds){const dx=Math.max(1e-9,bounds[2]-bounds[0]),dy=Math.max(1e-9,bounds[3]-bounds[1]);for(const p of mids){b8.add(Math.max(0,Math.min(7,Math.floor(8*(p[0]-bounds[0])/dx)))+','+Math.max(0,Math.min(7,Math.floor(8*(p[1]-bounds[1])/dy))));b4.add(Math.max(0,Math.min(3,Math.floor(4*(p[0]-bounds[0])/dx)))+','+Math.max(0,Math.min(3,Math.floor(4*(p[1]-bounds[1])/dy))));}}
      const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,j=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      const count=fn=>mids.filter(p=>fn(+p[0],+p[1])).length;
      let regions={};
      if(/california/i.test(q))regions={west:count(x=>x<=-119.5),east:count(x=>x>-119.5),north:count((x,y)=>y>=37.5),south:count((x,y)=>y<37.5),farEast:count(x=>x>-118)};
      if(/texas/i.test(q))regions={panhandle:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)};
      if(/maryland/i.test(q))regions={west:count(x=>x<-78),central:count(x=>x>=-78&&x<-76.8),east:count(x=>x>=-76.8),north:count((x,y)=>y>=39),south:count((x,y)=>y<39)};
      return {selection:window.EARTHLINE_SPATIAL_SELECTION_16698||null,swales:sw.length,visible:d?.swaleLines??null,published:gen?.publishedFeatures??null,candidates:gen?.candidates??null,eligible:gen?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,outside:j?.outsideAfterClip??null,unsafe:flow?.unsafeSegments??null,occupancy4x4:b4.size,occupancy8x8:b8.size,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
    },stateName);
    const row={variant,state:stateName,elapsedMs:Date.now()-started,timedOut,patches,snap};rows.push(row);console.log('EARTHLINE_SPATIAL_SELECTION_AB '+JSON.stringify(row));
  }
  await page.close();
}
console.log('EARTHLINE_SPATIAL_SELECTION_AB_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError||r.snap.visible!==r.snap.published||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.unsafe||0)!==0||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
