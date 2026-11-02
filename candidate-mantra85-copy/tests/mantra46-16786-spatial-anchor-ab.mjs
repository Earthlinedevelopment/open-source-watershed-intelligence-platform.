import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
mkdirSync('artifacts/mantra46-16786-anchor-ab',{recursive:true});

function patchBody(body){
  const needle=`    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),false);if(c)candidates.push(c);}
    }
    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);`;
  const repl=`    const regionalAnchorAttempts16786=new Map();
    const anchorKey16786=(coords,idx)=>{
      try{
        const g=llGrid(hy,coords[idx]);
        if(!g||!Number.isFinite(Number(g.x))||!Number.isFinite(Number(g.y)))return null;
        const bx=Math.max(0,Math.min(11,Math.floor(Number(g.x)*12/Math.max(1,hy.w))));
        const by=Math.max(0,Math.min(11,Math.floor(Number(g.y)*12/Math.max(1,hy.h))));
        return bx+','+by;
      }catch(_){return null;}
    };
    const noteAnchor16786=(key)=>{if(key)regionalAnchorAttempts16786.set(key,(regionalAnchorAttempts16786.get(key)||0)+1);};
    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;
      const fractions=focusMode?(coords.length>110?[.18,.36,.54,.72,.86]:coords.length>55?[.26,.52,.78]:[.38,.68]):(coords.length>110?[.1,.2,.3,.4,.5,.6,.7,.8,.9]:coords.length>55?[.15,.3,.45,.6,.75,.9]:[.25,.5,.75]);
      for(const frac of fractions){
        const idx=Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac)));
        if(!focusMode)noteAnchor16786(anchorKey16786(coords,idx));
        const c=sampleSegment(coords,idx,false);if(c)candidates.push(c);
      }
    }
    if(!focusMode){
      let supplementalAnchorAttempts16786=0,supplementalAnchorCandidates16786=0;
      for(const f of lines){
        const coords=f.geometry.coordinates;if(coords.length<16)continue;
        const visited16786=new Set();
        for(let idx=3;idx<coords.length-3;idx++){
          const key=anchorKey16786(coords,idx);if(!key||visited16786.has(key))continue;visited16786.add(key);
          if((regionalAnchorAttempts16786.get(key)||0)>=2)continue;
          noteAnchor16786(key);supplementalAnchorAttempts16786++;
          const c=sampleSegment(coords,idx,false);
          if(c){c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;}
        }
      }
      window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786={
        build:'EARTHLINE 16786 A/B',attemptedCells:Array.from(regionalAnchorAttempts16786.keys()).sort(),
        cellAttemptCounts:Object.fromEntries(regionalAnchorAttempts16786),
        supplementalAttempts:supplementalAnchorAttempts16786,supplementalCandidates:supplementalAnchorCandidates16786,
        rule:'preserve existing fixed anchors, then give each 12x12 contour cell up to two total real makeSwales sample attempts; capacity and science gates unchanged',
        at:new Date().toISOString()
      };
    }
    if(!focusMode&&Array.isArray(supplementalCandidates16702)&&supplementalCandidates16702.length)candidates.push(...supplementalCandidates16702);`;
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error('anchor block expected once, found '+n);
  return body.replace(needle,repl);
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();let body=await response.text();body=patchBody(body);
      await route.fulfill({response,body});return;
    }
    await route.continue();
  });
  const started=Date.now();
  try{
    await page.goto(BASE+'?earthline_m46_anchor_ab='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const r=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&r&&String(r.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:45000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}
  const a=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    anchor:window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786||null
  }));
  const row={
    query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,
    coreMs:a?.perf?.totalMs??null,generated:a?.publication?.generated??null,
    visible:a?.display?.swaleLines??a?.publication?.overlaySwaleLines??null,unsafe:a?.flow?.unsafeSegments??null,
    rootPass:a?.root?.pass??null,firstFailedStage:a?.root?.firstFailedStage??null,
    lineage:a?.root?.cellLineage??null,anchor:a?.anchor??null
  };
  results.push(row);console.log('EARTHLINE_M46_ANCHOR_AB '+JSON.stringify(row));
  await context.close();
}
await browser.close();
writeFileSync('artifacts/mantra46-16786-anchor-ab/results.json',JSON.stringify(results,null,2));
if(results.some(r=>r.loadError||r.timedOut||r.pageErrors.length||Number(r.unsafe)!==0||Number(r.generated)!==Number(r.visible)||Number(r.coreMs)>15000))process.exitCode=1;
