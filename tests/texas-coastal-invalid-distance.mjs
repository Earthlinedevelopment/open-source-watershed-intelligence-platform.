import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Texas','California','Maryland'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch(); let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('contourSignature',
    "  async function makeContours(hy,candidateQuantile16609=false){",
    "  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16702=null){"
  );
  apply('contourLevels',
`    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`,
`    if(Array.isArray(levelsOverride16702)&&levelsOverride16702.length){
      const seen16702=new Set();
      for(const raw16702 of levelsOverride16702){const k16702=Math.round(Number(raw16702)*10)/10;if(Number.isFinite(k16702)&&k16702>min&&k16702<max&&!seen16702.has(k16702)){seen16702.add(k16702);levels.push(k16702);}}
    }else if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`
  );
  apply('swaleSignature',
    "  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null){",
    "  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,allowScaleRefinement16702=true){"
  );

  const anchor=`    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`;
  const insert=`    if(allowScaleRefinement16702&&!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>8000&&hy.outsideLandMask16632&&hy.validityMask16584){
      const audit16702={triggered:false,coarseCellKm:Number((Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)/1000).toFixed(2)),coastalCoarseCells:0,tiles:0,rawLocalFeatures:0,nearCoastFeatures:0,addedCandidates:0,elapsedMs:0};
      const start16702=performance.now(),savedGen16702=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167,savedLand16702=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584;
      try{
        const coastCells16702=[];
        const nearOcean16702=(mask16702,w16702,h16702,x16702,y16702,r16702)=>{for(let dy16702=-r16702;dy16702<=r16702;dy16702++)for(let dx16702=-r16702;dx16702<=r16702;dx16702++){const xx16702=x16702+dx16702,yy16702=y16702+dy16702;if(xx16702<0||xx16702>=w16702||yy16702<0||yy16702>=h16702)continue;if(mask16702[yy16702*w16702+xx16702])return true;}return false;};
        for(let y16702=1;y16702<hy.h-1;y16702++)for(let x16702=1;x16702<hy.w-1;x16702++){const i16702=y16702*hy.w+x16702;if(hy.validityMask16584[i16702]===1&&nearOcean16702(hy.outsideLandMask16632,hy.w,hy.h,x16702,y16702,2))coastCells16702.push({x:x16702,y:y16702});}
        audit16702.coastalCoarseCells=coastCells16702.length;
        if(coastCells16702.length>=18){
          audit16702.triggered=true;coastCells16702.sort((a,b)=>a.y-b.y);
          const parts16702=Math.min(3,Math.max(1,Math.ceil(coastCells16702.length/90))),tiles16702=[];
          for(let part16702=0;part16702<parts16702;part16702++){
            const a16702=Math.floor(coastCells16702.length*part16702/parts16702),z16702=Math.floor(coastCells16702.length*(part16702+1)/parts16702),group16702=coastCells16702.slice(a16702,z16702);if(!group16702.length)continue;
            let minX16702=Math.min(...group16702.map(p=>p.x)),maxX16702=Math.max(...group16702.map(p=>p.x)),minY16702=Math.min(...group16702.map(p=>p.y)),maxY16702=Math.max(...group16702.map(p=>p.y));
            minX16702=Math.max(0,minX16702-4);maxX16702=Math.min(hy.w-1,maxX16702+4);minY16702=Math.max(0,minY16702-4);maxY16702=Math.min(hy.h-1,maxY16702+4);
            const b0=hy.bounds[0],b1=hy.bounds[1],b2=hy.bounds[2],b3=hy.bounds[3],lon16702=x=>b0+(x/(hy.w-1))*(b2-b0),lat16702=y=>b3-(y/(hy.h-1))*(b3-b1);
            const tb16702=[lon16702(minX16702),lat16702(maxY16702),lon16702(maxX16702),lat16702(minY16702)];
            if(tb16702[2]>tb16702[0]&&tb16702[3]>tb16702[1])tiles16702.push(tb16702);
          }
          audit16702.tiles=tiles16702.length;
          const local16702=await Promise.all(tiles16702.map(async(tb16702,ti16702)=>{
            const d16702=await loadDEM(tb16702,128,128,6000,'shared scale coastal refinement '+ti16702);
            const g16702=earthlineLandValidityMask16584(d16702,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLand16702;
            const h16702=await hydrology(d16702,g16702.mask);h16702.outsideLandMask16632=g16702.outsideLandMask16632||null;h16702.inlandWaterMask16632=g16702.inlandWaterMask16632||null;
            const channel16702=percentile(h16702.acc,.972),elevs16702=[];
            for(let y16702=1;y16702<h16702.h-1;y16702++)for(let x16702=1;x16702<h16702.w-1;x16702++){const i16702=y16702*h16702.w+x16702;if(g16702.mask[i16702]!==1||!nearOcean16702(g16702.outsideLandMask16632,h16702.w,h16702.h,x16702,y16702,4))continue;const sp16702=Number(h16702.slope[i16702]),ac16702=Number(h16702.acc[i16702]),el16702=Number(h16702.elev[i16702]);if(Number.isFinite(sp16702)&&sp16702>=.20&&sp16702<=13.5&&Number.isFinite(ac16702)&&ac16702<channel16702&&Number.isFinite(el16702))elevs16702.push(el16702);}
            elevs16702.sort((a,b)=>a-b);const levels16702=[],seen16702=new Set();
            for(const frac16702 of [.05,.12,.22,.34,.47,.60]){if(!elevs16702.length)break;const e16702=elevs16702[Math.min(elevs16702.length-1,Math.floor((elevs16702.length-1)*frac16702))],k16702=Math.round(e16702*2)/2;if(!seen16702.has(k16702)){seen16702.add(k16702);levels16702.push(k16702);}}
            const c16702=await makeContours(h16702,true,levels16702),s16702=await makeSwales(h16702,c16702,false,jurisdictionGeometry16539,false);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;
            const out16702=[];
            for(const f16702 of (s16702.features||[])){const cc16702=f16702.geometry&&f16702.geometry.coordinates||[];if(cc16702.length<2)continue;const m16702=cc16702[Math.floor((cc16702.length-1)/2)],gg16702=llGrid(h16702,m16702);if(!gg16702||!Number.isFinite(gg16702.x)||!Number.isFinite(gg16702.y))continue;const gx16702=Math.max(0,Math.min(h16702.w-1,Math.round(gg16702.x))),gy16702=Math.max(0,Math.min(h16702.h-1,Math.round(gg16702.y)));if(!nearOcean16702(g16702.outsideLandMask16632,h16702.w,h16702.h,gx16702,gy16702,4))continue;out16702.push(f16702);}
            return out16702;
          }));
          for(const group16702 of local16702)for(const f16702 of group16702){
            audit16702.rawLocalFeatures++;
            const seg16702=f16702.geometry&&f16702.geometry.coordinates||[];if(seg16702.length<2)continue;audit16702.nearCoastFeatures++;
            const mid16702=seg16702[Math.floor((seg16702.length-1)/2)],gg16702=llGrid(hy,mid16702);if(!gg16702||!Number.isFinite(gg16702.x)||!Number.isFinite(gg16702.y))continue;
            const candidate16702={segment:seg16702,x:Math.max(1,Math.min(hy.w-2,Math.round(gg16702.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(gg16702.y))),slope:Number(f16702.properties&&f16702.properties.slope_pct)||3.4,acc:0,maxAcc:0,score:Math.max(0,Math.min(1,Number(f16702.properties&&f16702.properties.score||0)/100)),confidence:'preferred',minLinePx16632:4,scale_refinement_16702:true};
            if(candidates.some(q16702=>Math.hypot(Number(q16702.x)-candidate16702.x,Number(q16702.y)-candidate16702.y)<1.5))continue;
            candidates.push(candidate16702);audit16702.addedCandidates++;
          }
        }
      }catch(e16702){audit16702.error=String(e16702);}
      finally{window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16702;window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLand16702;audit16702.elapsedMs=Math.round(performance.now()-start16702);window.EARTHLINE_SCALE_REFINEMENT_CANDIDATES_16702=audit16702;}
    }
    const preferredEligibleCount16539=await jurisdictionEligibleCount16539(candidates);`;
  apply('scaleCandidateMerge',anchor,insert);

  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?scale_candidate_merge='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_SCALE_REFINEMENT_CANDIDATES_16702=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;try{await page.waitForFunction(prev=>{const t=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||t!==prev)&&!!t&&/screening published\./i.test(s));},prior,{timeout:70000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},count=fn=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&fn(+m[0],+m[1])?1:0);},0);const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;let regions=null;if(/texas/i.test(q))regions={panhandle:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerGulf:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)};if(/california/i.test(q))regions={west:count(x=>x<=-119.5),east:count(x=>x>-119.5),north:count((x,y)=>y>=37.5),south:count((x,y)=>y<37.5),farEast:count(x=>x>-118)};if(/maryland/i.test(q))regions={west:count(x=>x<-78),central:count(x=>x>=-78&&x<-76.8),east:count(x=>x>=-76.8),north:count((x,y)=>y>=39),south:count((x,y)=>y<39)};return {state:q,refinement:window.EARTHLINE_SCALE_REFINEMENT_CANDIDATES_16702||null,swales:sw.length,visible:d?.swaleLines??null,published:pub?.generated??null,generation:g,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,regions,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};},stateName);
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_SCALE_CANDIDATE_MERGE '+JSON.stringify(row));
}
console.log('EARTHLINE_SCALE_CANDIDATE_MERGE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError||r.snap.visible!==r.snap.published||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;
