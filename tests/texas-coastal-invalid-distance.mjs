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
          const selected16673=[];
          const km16673=(a16673,b16673)=>{const lat16673=((a16673[1]+b16673[1])*.5)*Math.PI/180,dx16673=(a16673[0]-b16673[0])*111.32*Math.cos(lat16673),dy16673=(a16673[1]-b16673[1])*110.57;return Math.hypot(dx16673,dy16673);};
          for(const r16673 of rows16672){if(!Number.isFinite(r16673.distKm)||r16673.distKm>10||!Array.isArray(r16673.mid))continue;if(selected16673.some(q16673=>km16673(q16673.mid,r16673.mid)<24))continue;selected16673.push(r16673);if(selected16673.length>=4)break;}
          return {id:tile16672.id,cellKm:Number((Math.max(h16672.cellX,h16672.cellY)/1000).toFixed(2)),elapsedMs:Math.round(performance.now()-st16672),levels:levels16672,coastalEligibleElevations:elevs16672.length,swales:(s16672.features||[]).length,minKm:rows16672[0]?.distKm??null,within10km:rows16672.filter(r=>r.distKm<=10).length,within20km:rows16672.filter(r=>r.distKm<=20).length,selectedFeatures:selected16673.map(r=>({feature:r.feature,mid:r.mid,distKm:r.distKm})),rows:rows16672.slice(0,8).map(r=>({mid:r.mid,distKm:r.distKm,rank:r.feature.properties&&r.feature.properties.rank,score:r.feature.properties&&r.feature.properties.score}))};
        }));
        out16672.push(...tileResults16672);
        const base16673=Array.isArray(swales&&swales.features)?swales.features.slice():[],added16673=[];
        const midpoint16673=f16673=>{const cc16673=f16673&&f16673.geometry&&f16673.geometry.coordinates||[];return cc16673.length?cc16673[Math.floor((cc16673.length-1)/2)]:null;};
        const km16673=(a16673,b16673)=>{const lat16673=((a16673[1]+b16673[1])*.5)*Math.PI/180,dx16673=(a16673[0]-b16673[0])*111.32*Math.cos(lat16673),dy16673=(a16673[1]-b16673[1])*110.57;return Math.hypot(dx16673,dy16673);};
        const existingMids16673=base16673.map(midpoint16673).filter(Array.isArray);
        for(const tile16673 of tileResults16672){
          for(const row16673 of (tile16673.selectedFeatures||[])){
            const m16673=row16673.mid;if(!Array.isArray(m16673))continue;
            if(existingMids16673.some(p16673=>km16673(p16673,m16673)<18))continue;
            if(added16673.some(f16673=>{const p16673=midpoint16673(f16673);return p16673&&km16673(p16673,m16673)<24;}))continue;
            const f16673=JSON.parse(JSON.stringify(row16673.feature));f16673.properties=Object.assign({},f16673.properties||{},{coastal_refinement_16673:true,coastal_tile_16673:tile16673.id,coastal_distance_km_16673:row16673.distKm});
            added16673.push(f16673);existingMids16673.push(m16673);
          }
        }
        swales={type:'FeatureCollection',features:base16673.concat(added16673)};
        if(savedGen16672){savedGen16672.publishedFeatures=swales.features.length;savedGen16672.chosenBeforeTierGate=swales.features.length;savedGen16672.coastalRefinementAdded16673=added16673.length;}
        window.EARTHLINE_TX_COAST_FAST_TILES_16672={elapsedMs:Math.round(performance.now()-allStart16672),tiles:out16672.map(t16673=>Object.assign({},t16673,{selectedFeatures:undefined,selectedCount:(t16673.selectedFeatures||[]).length})),mergedAdded:added16673.length,mergedTotal:swales.features.length,mergedRows:added16673.map(f16673=>({mid:midpoint16673(f16673),tile:f16673.properties&&f16673.properties.coastal_tile_16673,distKm:f16673.properties&&f16673.properties.coastal_distance_km_16673,score:f16673.properties&&f16673.properties.score}))};
      }catch(e){window.EARTHLINE_TX_COAST_FAST_TILES_16672={error:String(e)};}
      finally{window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584=savedLandAudit16672;window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=savedGen16672;}
    }
    noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);`;
 const n=body.split(needle).length-1;patches.tiles=n;if(n!==1)throw new Error('tiles expected 1, found '+n);body=body.replace(needle,repl);
 apply('cameraGuard',
`    const cameraReady16334=await cameraSettle16310;
    phase16198.cameraReadyBeforePublishMs=Math.round(performance.now()-cameraFinalStarted16329);`,
`    let cameraReady16334=await cameraSettle16310;
    let cameraReasserted16674=false,cameraSpanRatio16674=null;
    try{
      const cb16674=m.getBounds&&m.getBounds(),currentSpan16674=cb16674?Math.abs(Number(cb16674.getEast())-Number(cb16674.getWest())):null,targetSpan16674=Math.abs(Number(b[2])-Number(b[0]));
      cameraSpanRatio16674=Number.isFinite(currentSpan16674)&&targetSpan16674>0?currentSpan16674/targetSpan16674:null;
      if(Number.isFinite(cameraSpanRatio16674)&&(cameraSpanRatio16674>4||cameraSpanRatio16674<.25)){cameraReady16334=await settleRegionalCamera(m,b,runToken);cameraReasserted16674=true;}
      window.EARTHLINE_REGIONAL_CAMERA_GUARD_16674={runToken,ratio:cameraSpanRatio16674,reasserted:cameraReasserted16674,at:new Date().toISOString()};
    }catch(_){}
    phase16198.cameraReadyBeforePublishMs=Math.round(performance.now()-cameraFinalStarted16329);`);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_fast_coast_tiles='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prev=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const token=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||token!==prev)&&!!token);},prev,{timeout:30000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(500);
 const state=await page.evaluate(()=>{
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
   const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
   const mid=f=>{const c=f&&f.geometry&&f.geometry.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;};
   const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(+m[0],+m[1])?1:0);},0);
   return {fast:window.EARTHLINE_TX_COAST_FAST_TILES_16672||null,camera:window.EARTHLINE_REGIONAL_CAMERA_GUARD_16674||null,swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
 });
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_COAST_MERGE '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_COAST_MERGE_SUMMARY '+JSON.stringify({patches,rows}));
await browser.close();
const good=rows.filter(r=>!r.timedOut&&!r.state.lastError&&r.state.visible===r.state.published&&r.state.swales===r.state.visible);
const bad=good.some(r=>!(r.state.totalMs<=15000)||Number(r.state.unsafe)!==0||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10||Number(r.state.fast?.mergedAdded||0)<4||Number(r.state.fast?.mergedTotal||0)<=66);
if(good.length<3||bad)process.exitCode=1;
