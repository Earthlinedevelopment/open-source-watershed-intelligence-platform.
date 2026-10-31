import {chromium,webkit} from 'playwright';

const engine=process.env.ENGINE||'webkit';
const browserType=engine==='chromium'?chromium:webkit;

function transform(body){
  const endExact=`      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;
    }
    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(screenJurisdictionCandidate16539(candidate16539))count16539++;if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }`;
  const newEnd=`      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;
    }
    function earthlineFastJurisdictionCandidate16901(candidate16539){
      if(focusMode||!jurisdictionGeometry16539)return candidate16539;
      const seg16901=Array.isArray(candidate16539&&candidate16539.segment)?candidate16539.segment:[];
      if(seg16901.length<2)return null;
      const idxs16901=[0,Math.floor((seg16901.length-1)*.25),Math.floor((seg16901.length-1)*.5),Math.floor((seg16901.length-1)*.75),seg16901.length-1];
      let inside16901=null;
      for(const idx16901 of idxs16901){const p16901=seg16901[idx16901];if(p16901&&earthlinePointInJurisdiction16539(p16901,jurisdictionGeometry16539)){inside16901=p16901;break;}}
      if(!inside16901)return null;
      const grid16901=llGrid(hy,inside16901);
      if(!grid16901||!Number.isFinite(grid16901.x)||!Number.isFinite(grid16901.y))return null;
      return Object.assign({},candidate16539,{x:Math.max(1,Math.min(hy.w-2,Math.round(grid16901.x))),y:Math.max(1,Math.min(hy.h-2,Math.round(grid16901.y))),jurisdiction_prescreened_16901:true});
    }
    async function jurisdictionEligibleCount16539(list16539){
      if(focusMode||!jurisdictionGeometry16539)return list16539.length;
      let count16539=0,yieldCount16661=0;
      for(const candidate16539 of list16539){if(earthlineFastJurisdictionCandidate16901(candidate16539))count16539++;if((++yieldCount16661%48)===0)await earthlineCooperativeYield16661();}
      return count16539;
    }`;
  if(!body.includes(endExact))throw new Error('eligible-count block not found');
  body=body.replace(endExact,newEnd);

  const finalOld=`        const screened16539=screenJurisdictionCandidate16539(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();`;
  const finalNew=`        const screened16539=earthlineFastJurisdictionCandidate16901(candidate16539);
        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;
        if((++finalScreenYield16661%48)===0)await earthlineCooperativeYield16661();`;
  if(!body.includes(finalOld))throw new Error('final preselection block not found');
  body=body.replace(finalOld,finalNew);

  const auditOld=`    const auditedCandidates=chosen.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`;
  const auditNew=`    const exactChosen16901=(!focusMode&&jurisdictionGeometry16539)?chosen.map(c=>screenJurisdictionCandidate16539(c)).filter(Boolean):chosen;
    const auditedCandidates=exactChosen16901.map(c=>Object.assign(c,{contourAudit16166:contourAudit16166(c)}));`;
  if(!body.includes(auditOld))throw new Error('auditedCandidates block not found');
  body=body.replace(auditOld,auditNew);
  return body;
}

const browser=await browserType.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('https://earthlinedevelopment.org/',async route=>{
  const res=await route.fetch();let body=await res.text();body=transform(body);await route.fulfill({response:res,body});
});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(1400);
await page.locator('#searchInput').fill('Vermont');
const t0=Date.now();
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 return !!d&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},null,{timeout:60000});
await page.waitForTimeout(400);
const out=await page.evaluate(t0=>{
 const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;
 const audit=window.EARTHLINE_VERMONT_PRODUCT_BOUNDARY_AUDIT_16178||null;
 const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{};
 const fs=v.swales?.features||[];
 let maxSlope=-Infinity;
 for(const f of fs){const n=Number(f?.properties?.slope_pct);if(Number.isFinite(n))maxSlope=Math.max(maxSlope,n);}
 return {
  ms:Date.now()-t0,
  swales:Number(d?.derived?.swaleOpportunityLines||0),
  water:Number(d?.derived?.waterPaths||0),
  contours:Number(d?.derived?.contours||0),
  rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,
  maxSlope:Number.isFinite(maxSlope)?maxSlope:null,
  boundaryAudit:audit,
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
 };
},t0);
console.log('M83_FAST_BOUNDARY_CANDIDATE '+JSON.stringify({engine,out,errors}));
if(out.swales<=0||out.rendered<=0||(out.maxSlope!==null&&out.maxSlope>4))process.exitCode=2;
if(out.boundaryAudit?.outsideAfterClip && Object.values(out.boundaryAudit.outsideAfterClip).some(Number))process.exitCode=3;
await browser.close();
