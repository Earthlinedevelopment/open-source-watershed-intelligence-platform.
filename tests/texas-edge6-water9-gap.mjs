import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
const patches={};
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const apply=(name,n,r)=>{patches[name]=body.split(n).length-1;body=body.split(n).join(r);};
 apply('sampleSignature','function sampleSegment(coords,center,relaxed){','function sampleSegment(coords,center,relaxed,minLinePixels16621=10){');
 apply('sampleLength','const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;','const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<minLinePixels16621)return null;');
 apply('sampleReturn',"return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred'};","return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred',minLinePixels16621};");
 apply('screenLength','if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}','if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePixels16621)||10))){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}');
 const loop=`    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
    }`;
 const repl=`    const gapAttempts16621=[];
    const coarseGapPass16621=!focusMode&&Math.max(Number(hy.cellX)||0,Number(hy.cellY)||0)>10000;
    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68];
      for(const frac of fractions){
        const center16621=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac)));
        const c=sampleSegment(coords,center16621,false);
        if(c)candidates.push(c);else if(coarseGapPass16621)gapAttempts16621.push([coords,center16621]);
      }
    }
    let gapAdded16621=0;
    if(coarseGapPass16621&&gapAttempts16621.length){
      const covered16621=[];
      for(const c16621 of candidates){const s16621=screenJurisdictionCandidate16539(c16621);if(s16621)covered16621.push(s16621);}
      let gapEvaluated16621=0;
      for(const attempt16621 of gapAttempts16621){
        if(gapAdded16621>=12)break;
        const p16621=attempt16621[0][attempt16621[1]],g16621=llGrid(hy,p16621);
        if(!g16621||!Number.isFinite(g16621.x)||!Number.isFinite(g16621.y))continue;
        const edgeDistance16625=Math.min(Number(g16621.x),Number(g16621.y),Math.max(0,(Number(hy.w)-1)-Number(g16621.x)),Math.max(0,(Number(hy.h)-1)-Number(g16621.y)));
        if(edgeDistance16625>6)continue;
        if(covered16621.some(q16621=>Math.hypot(Number(q16621.x)-Number(g16621.x),Number(q16621.y)-Number(g16621.y))<8))continue;
        gapEvaluated16621++;
        const c16621=sampleSegment(attempt16621[0],attempt16621[1],false,4);if(!c16621)continue;
        const s16621=screenJurisdictionCandidate16539(c16621);if(!s16621)continue;
        if(covered16621.some(q16621=>Math.hypot(Number(q16621.x)-Number(s16621.x),Number(q16621.y)-Number(s16621.y))<8))continue;
        candidates.push(c16621);covered16621.push(s16621);gapAdded16621++;
      }
      window.EARTHLINE_GAP_FALLBACK_EVALUATED_16622=gapEvaluated16621;
    }
    let waterEdgeAdded16626=0,waterEdgeEvaluated16626=0;
    function nearInvalidWater16626(g16626){
      const mask16626=hy&&hy.validityMask16584;if(!mask16626)return false;
      const cx16626=Math.max(0,Math.min(hy.w-1,Math.round(Number(g16626.x)))),cy16626=Math.max(0,Math.min(hy.h-1,Math.round(Number(g16626.y))));
      for(let dy16626=-9;dy16626<=9;dy16626++)for(let dx16626=-9;dx16626<=9;dx16626++){
        const x16626=cx16626+dx16626,y16626=cy16626+dy16626;
        if(x16626<0||x16626>=hy.w||y16626<0||y16626>=hy.h)continue;
        if(!mask16626[y16626*hy.w+x16626])return true;
      }
      return false;
    }
    if(coarseGapPass16621&&hy&&hy.validityMask16584){
      for(const attempt16626 of gapAttempts16621){
        if(waterEdgeAdded16626>=16)break;
        const p16626=attempt16626[0][attempt16626[1]],g16626=llGrid(hy,p16626);
        if(!g16626||!Number.isFinite(g16626.x)||!Number.isFinite(g16626.y)||!nearInvalidWater16626(g16626))continue;
        waterEdgeEvaluated16626++;
        const c16626=sampleSegment(attempt16626[0],attempt16626[1],false,4);if(!c16626)continue;
        const s16626=screenJurisdictionCandidate16539(c16626);if(!s16626)continue;
        if(candidates.some(q16626=>Math.hypot(Number(q16626.x)-Number(s16626.x),Number(q16626.y)-Number(s16626.y))<3))continue;
        candidates.push(c16626);waterEdgeAdded16626++;
      }
    }
    window.EARTHLINE_WATER_EDGE_FALLBACK_16626={enabled:coarseGapPass16621&&!!(hy&&hy.validityMask16584),evaluated:waterEdgeEvaluated16626,added:waterEdgeAdded16626,radiusCells:9};
        window.EARTHLINE_GAP_FALLBACK_16621={enabled:coarseGapPass16621,attempts:gapAttempts16621.length,added:gapAdded16621,edgeOnly:true,edgeCells:6};`;
 apply('preferredLoop',loop,repl);
 apply('preResize','    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);','    try{m.resize&&m.resize();}catch(_){}\n    const cameraSettle16310=Promise.resolve(settleRegionalCamera(m,b,runToken)).catch(()=>false);');
 apply('noLateResize',"const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;try{map.resize&&map.resize();}catch(_){}}","const resizeRunToken16020=String(lastData&&lastData.runToken||'');if(resizeRunToken16020&&resizeRunToken16020!==lastResizeRunToken16020){lastResizeRunToken16020=resizeRunToken16020;}");
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_local_gap='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));const started=Date.now();
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(350);
 const state=await page.evaluate(()=>{
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
  const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
  const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
  return {gap:Object.assign({},window.EARTHLINE_GAP_FALLBACK_16621||{},{evaluated:window.EARTHLINE_GAP_FALLBACK_EVALUATED_16622||0,waterEdge:window.EARTHLINE_WATER_EDGE_FALLBACK_16626||null}),swales:sw.length,visible:d?.swaleLines??null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),panhandleWestNM:count((x,y)=>x>-103.2&&x<-102&&y>31.8&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)},candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_LOCAL_GAP '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_LOCAL_GAP_SUMMARY '+JSON.stringify({patches,rows,errors:errors.slice(0,20)}));
await browser.close();
