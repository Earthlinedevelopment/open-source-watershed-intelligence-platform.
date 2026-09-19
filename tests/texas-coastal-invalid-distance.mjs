import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const needle=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const repl=`    let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);
    if(!focusMode&&/texas/i.test(String(q||''))){
      try{
        const savedLandAudit16671=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584,savedGen16671=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167;
        const tiles16671=[
          {id:'upper',b:[-96.9,28.45,-93.5,31.15]},
          {id:'lower',b:[-99.55,25.82,-96.0,29.15]}
        ],out16671=[];
        for(const tile16671 of tiles16671){
          const st16671=performance.now(),d16671=await loadDEM(tile16671.b,96,96,6000,'coastal tile '+tile16671.id);
          const g16671=earthlineLandValidityMask16584(d16671,landValidity16584);
          window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16671;
          const h16671=await hydrology(d16671,g16671.mask);
          h16671.waterParts16584=Array.isArray(landValidity16584.waterParts)?landValidity16584.waterParts:[];
          h16671.outsideLandMask16632=g16671.outsideLandMask16632||null;h16671.inlandWaterMask16632=g16671.inlandWaterMask16632||null;
          const c16671=await makeContours(h16671,true),s16671=await makeSwales(h16671,c16671,false,swaleJurisdictionGeometry16539);
          window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16671;
          const dist16671=ll16671=>{const gg16671=llGrid(h16671,ll16671);if(!gg16671||!Number.isFinite(gg16671.x)||!Number.isFinite(gg16671.y))return null;const cx16671=Math.max(0,Math.min(h16671.w-1,Math.round(gg16671.x))),cy16671=Math.max(0,Math.min(h16671.h-1,Math.round(gg16671.y)));for(let r16671=0;r16671<=30;r16671++)for(let dy16671=-r16671;dy16671<=r16671;dy16671++)for(let dx16671=-r16671;dx16671<=r16671;dx16671++){if(Math.max(Math.abs(dx16671),Math.abs(dy16671))!==r16671)continue;const xx16671=cx16671+dx16671,yy16671=cy16671+dy16671;if(xx16671<0||xx16671>=h16671.w||yy16671<0||yy16671>=h16671.h)continue;if(g16671.outsideLandMask16632[yy16671*h16671.w+xx16671])return r16671;}return null;};
          const rows16671=(s16671.features||[]).map(f16671=>{const cc16671=f16671.geometry&&f16671.geometry.coordinates||[],m16671=cc16671[Math.floor((cc16671.length-1)/2)]||null,dd16671=m16671?dist16671(m16671):null;return {rank:f16671.properties&&f16671.properties.rank,score:f16671.properties&&f16671.properties.score,mid:m16671,distCells:dd16671,distKm:Number.isFinite(dd16671)?Number((dd16671*Math.max(h16671.cellX,h16671.cellY)/1000).toFixed(1)):null};}).filter(r=>Number.isFinite(r.distCells)).sort((a,b)=>a.distCells-b.distCells);
          out16671.push({id:tile16671.id,bounds:tile16671.b,cellKm:Number((Math.max(h16671.cellX,h16671.cellY)/1000).toFixed(2)),elapsedMs:Math.round(performance.now()-st16671),swales:(s16671.features||[]).length,minKm:rows16671[0]?.distKm??null,within5km:rows16671.filter(r=>r.distKm<=5).length,within10km:rows16671.filter(r=>r.distKm<=10).length,within20km:rows16671.filter(r=>r.distKm<=20).length,rows:rows16671.slice(0,20)});
        }
        window.EARTHLINE_TX_COAST_TILES_16671=out16671;
      }catch(e){window.EARTHLINE_TX_COAST_TILES_16671={error:String(e)};}
      
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const n=body.split(needle).length-1;patches.tiles=n;if(n!==1)throw new Error('tiles expected 1, found '+n);body=body.replace(needle,repl);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_coast_tiles='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const prev=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prev,{timeout:60000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(300);
const state=await page.evaluate(()=>({tiles:window.EARTHLINE_TX_COAST_TILES_16671||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
console.log('EARTHLINE_TX_COAST_TILES '+JSON.stringify({patches,elapsedMs:Date.now()-started,timedOut,state}));
await browser.close();
if(timedOut||state.tiles?.error||patches.tiles!==1)process.exitCode=1;
