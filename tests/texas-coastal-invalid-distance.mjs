import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Texas','California'];
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};

await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected once, found '+n);body=body.replace(needle,replacement);};

  apply('contourSignature',
  `  async function makeContours(hy,candidateQuantile16609=false){`,
  `  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16701=null){`);

  apply('contourLevels',
  `    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`,
  `    if(Array.isArray(levelsOverride16701)&&levelsOverride16701.length){
      const seen16701=new Set();
      for(const raw16701 of levelsOverride16701){const k16701=Math.round(Number(raw16701)*10)/10;if(Number.isFinite(k16701)&&k16701>min&&k16701<max&&!seen16701.has(k16701)){seen16701.add(k16701);levels.push(k16701);}}
    }else if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`);

  const needle=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
  const repl=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    if(!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>8000&&hy.outsideLandMask16632&&hy.validityMask16584){
      const savedLandAudit16701=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16701=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
      try{
        const coastCells16701=[];
        const nearOcean16701=(x16701,y16701,r16701=2)=>{for(let dy16701=-r16701;dy16701<=r16701;dy16701++)for(let dx16701=-r16701;dx16701<=r16701;dx16701++){const xx16701=x16701+dx16701,yy16701=y16701+dy16701;if(xx16701<0||xx16701>=hy.w||yy16701<0||yy16701>=hy.h)continue;if(hy.outsideLandMask16632[yy16701*hy.w+xx16701])return true;}return false;};
        for(let y16701=1;y16701<hy.h-1;y16701++)for(let x16701=1;x16701<hy.w-1;x16701++){const i16701=y16701*hy.w+x16701;if(hy.validityMask16584[i16701]===1&&nearOcean16701(x16701,y16701,2))coastCells16701.push({x:x16701,y:y16701});}
        const tiles16701=[];
        if(coastCells16701.length>=18){
          coastCells16701.sort((a,b)=>a.y-b.y);
          const parts16701=Math.min(3,Math.max(1,Math.ceil(coastCells16701.length/90)));
          for(let part16701=0;part16701<parts16701;part16701++){
            const a16701=Math.floor(coastCells16701.length*part16701/parts16701),z16701=Math.floor(coastCells16701.length*(part16701+1)/parts16701),group16701=coastCells16701.slice(a16701,z16701);
            if(!group16701.length)continue;
            let minX16701=Math.min(...group16701.map(p=>p.x)),maxX16701=Math.max(...group16701.map(p=>p.x)),minY16701=Math.min(...group16701.map(p=>p.y)),maxY16701=Math.max(...group16701.map(p=>p.y));
            minX16701=Math.max(0,minX16701-4);maxX16701=Math.min(hy.w-1,maxX16701+4);minY16701=Math.max(0,minY16701-4);maxY16701=Math.min(hy.h-1,maxY16701+4);
            const b0=hy.bounds[0],b1=hy.bounds[1],b2=hy.bounds[2],b3=hy.bounds[3];
            const lon16701=x16701=>b0+(x16701/(hy.w-1))*(b2-b0),lat16701=y16701=>b3-(y16701/(hy.h-1))*(b3-b1);
            const tb16701=[lon16701(minX16701),lat16701(maxY16701),lon16701(maxX16701),lat16701(minY16701)];
            if(tb16701[2]>tb16701[0]&&tb16701[3]>tb16701[1])tiles16701.push({id:'coast-'+(part16701+1),b:tb16701,coarseCells:group16701.length});
          }
        }
        const start16701=performance.now();
        const tileResults16701=await Promise.all(tiles16701.map(async tile16701=>{
          const st16701=performance.now(),d16701=await loadDEM(tile16701.b,128,128,6000,'scale coastal refinement '+tile16701.id);
          const g16701=earthlineLandValidityMask16584(d16701,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16701;
          const h16701=await hydrology(d16701,g16701.mask);h16701.outsideLandMask16632=g16701.outsideLandMask16632||null;h16701.inlandWaterMask16632=g16701.inlandWaterMask16632||null;
          const channel16701=percentile(h16701.acc,.972),elevs16701=[];
          const nearOut16701=(x16701,y16701,r16701=4)=>{for(let dy16701=-r16701;dy16701<=r16701;dy16701++)for(let dx16701=-r16701;dx16701<=r16701;dx16701++){const xx16701=x16701+dx16701,yy16701=y16701+dy16701;if(xx16701<0||xx16701>=h16701.w||yy16701<0||yy16701>=h16701.h)continue;if(g16701.outsideLandMask16632[yy16701*h16701.w+xx16701])return true;}return false;};
          for(let y16701=1;y16701<h16701.h-1;y16701++)for(let x16701=1;x16701<h16701.w-1;x16701++){const i16701=y16701*h16701.w+x16701;if(g16701.mask[i16701]!==1||!nearOut16701(x16701,y16701,4))continue;const sp16701=Number(h16701.slope[i16701]),ac16701=Number(h16701.acc[i16701]),el16701=Number(h16701.elev[i16701]);if(Number.isFinite(sp16701)&&sp16701>=.20&&sp16701<=13.5&&Number.isFinite(ac16701)&&ac16701<channel16701&&Number.isFinite(el16701))elevs16701.push(el16701);}
          elevs16701.sort((a,b)=>a-b);const levels16701=[],seen16701=new Set();
          if(elevs16701.length){for(const frac16701 of [.05,.12,.22,.34,.47,.60]){const e16701=elevs16701[Math.min(elevs16701.length-1,Math.floor((elevs16701.length-1)*frac16701))],k16701=Math.round(e16701*2)/2;if(!seen16701.has(k16701)){seen16701.add(k16701);levels16701.push(k16701);}}}
          const c16701=await makeContours(h16701,true,levels16701),s16701=await makeSwales(h16701,c16701,false,swaleJurisdictionGeometry16539);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16701;
          const dist16701=ll16701=>{const gg16701=llGrid(h16701,ll16701);if(!gg16701||!Number.isFinite(gg16701.x)||!Number.isFinite(gg16701.y))return null;const cx16701=Math.max(0,Math.min(h16701.w-1,Math.round(gg16701.x))),cy16701=Math.max(0,Math.min(h16701.h-1,Math.round(gg16701.y)));for(let r16701=0;r16701<=30;r16701++)for(let dy16701=-r16701;dy16701<=r16701;dy16701++)for(let dx16701=-r16701;dx16701<=r16701;dx16701++){if(Math.max(Math.abs(dx16701),Math.abs(dy16701))!==r16701)continue;const xx16701=cx16701+dx16701,yy16701=cy16701+dy16701;if(xx16701<0||xx16701>=h16701.w||yy16701<0||yy16701>=h16701.h)continue;if(g16701.outsideLandMask16632[yy16701*h16701.w+xx16701])return r16701;}return null;};
          const rows16701=(s16701.features||[]).map(f16701=>{const cc16701=f16701.geometry&&f16701.geometry.coordinates||[],m16701=cc16701[Math.floor((cc16701.length-1)/2)]||null,dd16701=m16701?dist16701(m16701):null;return {mid:m16701,distCells:dd16701,distKm:Number.isFinite(dd16701)?Number((dd16701*Math.max(h16701.cellX,h16701.cellY)/1000).toFixed(1)):null,score:f16701.properties&&f16701.properties.score};}).filter(r=>Number.isFinite(r.distCells)).sort((a,b)=>a.distCells-b.distCells);
          return {id:tile16701.id,bounds:tile16701.b,coarseCells:tile16701.coarseCells,cellKm:Number((Math.max(h16701.cellX,h16701.cellY)/1000).toFixed(2)),elapsedMs:Math.round(performance.now()-st16701),levels:levels16701,coastalEligibleElevations:elevs16701.length,swales:(s16701.features||[]).length,minKm:rows16701[0]?.distKm??null,within10km:rows16701.filter(r=>r.distKm<=10).length,within20km:rows16701.filter(r=>r.distKm<=20).length,rows:rows16701.slice(0,8)};
        }));
        window.EARTHLINE_SCALE_COAST_REFINEMENT_16701={triggered:tiles16701.length>0,coarseCellKm:Number((Math.max(hy.cellX,hy.cellY)/1000).toFixed(2)),coastalCoarseCells:coastCells16701.length,elapsedMs:Math.round(performance.now()-start16701),tiles:tileResults16701};
      }catch(e16701){window.EARTHLINE_SCALE_COAST_REFINEMENT_16701={error:String(e16701)};}
      finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16701;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16701;}
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
  apply('scaleRefinement',needle,repl);
  return route.fulfill({response:resp,body});
});

await page.goto(URL+'?scale_coast_refine='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_SCALE_COAST_REFINEMENT_16701=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},stateName);
  let timedOut=false;try{await page.waitForFunction(prev=>{const token=String(window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167?.runToken||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||token!==prev)&&!!token&&/screening published\./i.test(s));},prior,{timeout:70000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(q=>({state:q,refinement:window.EARTHLINE_SCALE_COAST_REFINEMENT_16701||null,generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
  const row={state:stateName,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_SCALE_COAST_REFINEMENT '+JSON.stringify(row));
}
console.log('EARTHLINE_SCALE_COAST_REFINEMENT_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
if(Object.values(patches).some(v=>v!==1)||rows.some(r=>r.timedOut||r.snap.lastError||r.snap.refinement?.error))process.exitCode=1;
