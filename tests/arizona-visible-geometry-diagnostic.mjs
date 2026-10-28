import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(BASE+'?az_visible_diag='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click()); await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona'); await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const target={lng:-111.93331,lat:34.21526};
await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.59});try{m.fire?.('dragend')}catch(_){}},target);
await page.waitForFunction(t=>{const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008},target,{timeout:15000,polling:100});
await page.evaluate(()=>{
  window.__earthlineConversionRejects=[];
  const original=window.earthlineSwaleFromPts;
  if(typeof original==='function'){
    window.earthlineSwaleFromPts=function(pts,bandIndex,chanThr,isSite,maxS,totalBands){
      const result=original.apply(this,arguments);
      if(!result&&Array.isArray(pts)&&pts.length){
        let slopeSum=0,slopeN=0,minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
        for(const p of pts){
          const x=Math.max(0,Math.min(GW-1,Math.round(Number(p[0])))),y=Math.max(0,Math.min(GH-1,Math.round(Number(p[1]))));
          const sp=Number(slopePct(x,y));
          if(Number.isFinite(sp)){slopeSum+=sp;slopeN++;}
          minX=Math.min(minX,Number(p[0]));maxX=Math.max(maxX,Number(p[0]));minY=Math.min(minY,Number(p[1]));maxY=Math.max(maxY,Number(p[1]));
        }
        const lenM=earthlineSegmentLengthM(pts);
        const a=pts[0],b=pts[pts.length-1],gapM=Math.hypot(Number(a[0])-Number(b[0]),Number(a[1])-Number(b[1]))*M.cellM;
        const diagM=Math.hypot(maxX-minX,maxY-minY)*M.cellM;
        const tort=earthlineSegmentTortuosityM76(pts);
        const minLen=earthlineMinimumSwaleLengthM15768();
        window.__earthlineConversionRejects.push({
          bandIndex,isSite:!!isSite,maxS:Number(maxS),points:pts.length,lenM,avgSlope:slopeN?slopeSum/slopeN:null,
          minLen,gapM,diagM,tortuosity:tort,lenDiag:lenM/Math.max(1,diagM),
          loopish:gapM<Math.max(8,lenM*0.12)
        });
      }
      return result;
    };
  }
});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
await page.waitForFunction(()=>String(window.EARTHLINE_ELDER_TREE_LAST_17097?.state||'')==='committed',{timeout:45000,polling:120}).catch(()=>{});
await page.waitForTimeout(1200);
const d=await page.evaluate(()=>{
 const md=(typeof M!=='undefined'&&M)||window.M||{}, map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 const src=map?.getSource?.('earthline-elder-trees-17097'); const data=src&&(src._data||src._options?.data);
 const elderFeatures=Array.isArray(data?.features)?data.features.map(f=>({geometry:f.geometry,properties:f.properties})): [];
 const sw=Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features:[];
 const swales=sw.map(f=>({geometry:f.geometry,properties:f.properties}));
 const b=window.EARTHLINE_PROPERTY_DECLARATION_16169?.boundary||null;
 const elderLayer=map?.getLayer?.('earthline-elder-tree-points-17097');
 const elderPaint={};
 for(const k of ['circle-radius','circle-opacity','circle-color','circle-stroke-width','circle-stroke-opacity']){
   try{elderPaint[k]=elderLayer?map.getPaintProperty('earthline-elder-tree-points-17097',k):null}catch(_){elderPaint[k]=null}
 }
 let elderRendered=0;try{const c=map?.getCanvas?.();const box=c?[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]]:null;elderRendered=box&&elderLayer?(map.queryRenderedFeatures(box,{layers:['earthline-elder-tree-points-17097']})||[]).length:0}catch(_){}
 return {
   conversionRejects:window.__earthlineConversionRejects||[],
   cellM:Number(md.cellM), safeCells:Number(md?.earthlineTraceSafeCache16320?.safeCells||0),
   meta:md.swaleMeta||null, swales, boundary:b,
   elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null, elderFeatures, elderRendered,
   elderVisibility:(()=>{try{return elderLayer?map.getLayoutProperty('earthline-elder-tree-points-17097','visibility'):null}catch(_){return null}})(),
   elderPaint,
   mapCenter:map?.getCenter?.()?.toArray?.()||null,zoom:map?.getZoom?.()
 };
});
console.log('EARTHLINE_AZ_VISIBLE_DIAG '+JSON.stringify(d));
await browser.close();
