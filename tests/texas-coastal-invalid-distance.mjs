import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,needle,replacement)=>{const n=body.split(needle).length-1;patches[name]=n;if(n!==1)throw new Error(name+' expected 1, found '+n);body=body.replace(needle,replacement);};

 apply('contourSignature',
 `  async function makeContours(hy,candidateQuantile16609=false){`,
 `  async function makeContours(hy,candidateQuantile16609=false,levelsOverride16672=null){`);

 apply('contourLevels',
 `    if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`,
 `    if(Array.isArray(levelsOverride16672)&&levelsOverride16672.length){
      const seen16672=new Set();for(const raw16672 of levelsOverride16672){const k16672=Math.round(Number(raw16672)*10)/10;if(Number.isFinite(k16672)&&k16672>min&&k16672<max&&!seen16672.has(k16672)){seen16672.add(k16672);levels.push(k16672);}}
    }else if(candidateQuantile16609){
      const seen16609=new Set();
      for(let qi16609=1;qi16609<20;qi16609++){const v16609=percentile(hy.elev,qi16609/20),k16609=Math.round(v16609*10)/10;if(k16609>min&&k16609<max&&!seen16609.has(k16609)){seen16609.add(k16609);levels.push(k16609);}}
    }else{for(let l=Math.ceil(min/step)*step;l<=max+step*.001;l+=step)levels.push(l);}`);

 const needle=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const repl=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    if(!focusMode&&/texas/i.test(String(q||''))){
      let savedLandAudit16672=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16672=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
      try{
        const allStart16672=performance.now(),tiles16672=[
          {id:'upper',b:[-96.9,28.45,-93.5,31.15]},
          {id:'lower',b:[-99.55,25.82,-96.0,29.15]}
        ],out16672=[];
        const tileResults16672=await Promise.all(tiles16672.map(async tile16672=>{
          const st16672=performance.now(),d16672=await loadDEM(tile16672.b,128,128,6000,'coastal tile '+tile16672.id);
          const g16672=earthlineLandValidityMask16584(d16672,landValidity16584);window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16672;
          const h16672=await hydrology(d16672,g16672.mask);h16672.outsideLandMask16632=g16672.outsideLandMask16632||null;h16672.inlandWaterMask16632=g16672.inlandWaterMask16632||null;
          const channel16672=percentile(h16672.acc,.972),elevs16672=[];
          const nearOut16672=(x16672,y16672,r16672=4)=>{for(let dy16672=-r16672;dy16672<=r16672;dy16672++)for(let dx16672=-r16672;dx16672<=r16672;dx16672++){const xx16672=x16672+dx16672,yy16672=y16672+dy16672;if(xx16672<0||xx16672>=h16672.w||yy16672<0||yy16672>=h16672.h)continue;if(g16672.outsideLandMask16632[yy16672*h16672.w+xx16672])return true;}return false;};
          for(let y16672=1;y16672<h16672.h-1;y16672++)for(let x16672=1;x16672<h16672.w-1;x16672++){const i16672=y16672*h16672.w+x16672;if(g16672.mask[i16672]!==1||!nearOut16672(x16672,y16672,4))continue;const sp16672=Number(h16672.slope[i16672]),ac16672=Number(h16672.acc[i16672]),el16672=Number(h16672.elev[i16672]);if(Number.isFinite(sp16672)&&sp16672>=.20&&sp16672<=13.5&&Number.isFinite(ac16672)&&ac16672<channel16672&&Number.isFinite(el16672))elevs16672.push(el16672);}
          elevs16672.sort((a,b)=>a-b);const levels16672=[],levelSeen16672=new Set();
          if(elevs16672.length){for(const frac16672 of [.05,.12,.22,.34,.47,.60]){const e16672=elevs16672[Math.min(elevs16672.length-1,Math.floor((elevs16672.length-1)*frac16672))],k16672=Math.round(e16672*2)/2;if(!levelSeen16672.has(k16672)){levelSeen16672.add(k16672);levels16672.push(k16672);}}}
          const c16672=await makeContours(h16672,true,levels16672),s16672=await makeSwales(h16672,c16672,false,swaleJurisdictionGeometry16539);window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16672;
          const dist16672=ll16672=>{const gg16672=llGrid(h16672,ll16672);if(!gg16672||!Number.isFinite(gg16672.x)||!Number.isFinite(gg16672.y))return null;const cx16672=Math.max(0,Math.min(h16672.w-1,Math.round(gg16672.x))),cy16672=Math.max(0,Math.min(h16672.h-1,Math.round(gg16672.y)));for(let r16672=0;r16672<=30;r16672++)for(let dy16672=-r16672;dy16672<=r16672;dy16672++)for(let dx16672=-r16672;dx16672<=r16672;dx16672++){if(Math.max(Math.abs(dx16672),Math.abs(dy16672))!==r16672)continue;const xx16672=cx16672+dx16672,yy16672=cy16672+dy16672;if(xx16672<0||xx16672>=h16672.w||yy16672<0||yy16672>=h16672.h)continue;if(g16672.outsideLandMask16632[yy16672*h16672.w+xx16672])return r16672;}return null;};
          const rows16672=(s16672.features||[]).map(f16672=>{const cc16672=f16672.geometry&&f16672.geometry.coordinates||[],m16672=cc16672[Math.floor((cc16672.length-1)/2)]||null,dd16672=m16672?dist16672(m16672):null;return {feature:f16672,mid:m16672,distCells:dd16672,distKm:Number.isFinite(dd16672)?Number((dd16672*Math.max(h16672.cellX,h16672.cellY)/1000).toFixed(1)):null};}).filter(r=>Number.isFinite(r.distCells)).sort((a,b)=>a.distCells-b.distCells);
          return {id:tile16672.id,cellKm:Number((Math.max(h16672.cellX,h16672.cellY)/1000).toFixed(2)),elapsedMs:Math.round(performance.now()-st16672),levels:levels16672,coastalEligibleElevations:elevs16672.length,swales:(s16672.features||[]).length,minKm:rows16672[0]?.distKm??null,within10km:rows16672.filter(r=>r.distKm<=10).length,within20km:rows16672.filter(r=>r.distKm<=20).length,rows:rows16672.slice(0,8).map(r=>({mid:r.mid,distKm:r.distKm,rank:r.feature.properties&&r.feature.properties.rank,score:r.feature.properties&&r.feature.properties.score}))};
        }));
        out16672.push(...tileResults16672);
        window.EARTHLINE_TX_COAST_FAST_TILES_16672={elapsedMs:Math.round(performance.now()-allStart16672),tiles:out16672};
      }catch(e){window.EARTHLINE_TX_COAST_FAST_TILES_16672={error:String(e)};}
      finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16672;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16672;}
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const n=body.split(needle).length-1;patches.tiles=n;if(n!==1)throw new Error('tiles expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_fast_coast_tiles='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:60000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({fast:window.EARTHLINE_TX_COAST_FAST_TILES_16672||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_FAST_COAST_TILES '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.fast?.error||patches.tiles!==1||patches.contourSignature!==1||patches.contourLevels!==1)process.exitCode=1;
