import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Vermont','Massachusetts'];
function replaceOnce(body,name,needle,repl){
  const n=body.split(needle).length-1;
  if(n!==1)throw new Error(name+' expected once, found '+n);
  return body.replace(needle,repl);
}

function patchBody(body){
  body=replaceOnce(body,'audit-decl',
`  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){
    const lines=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');`,
`  async function makeSwales(hy,contours,focusMode=false,jurisdictionGeometry16539=null,supplementalCandidates16702=null){
    const audit16786={build:'EARTHLINE 16786 DIAGNOSTIC',cells:{},totals:{},focusMode,at:new Date().toISOString()};
    const auditKey16786=(coords,center)=>{
      try{
        if(!Array.isArray(coords)||!coords.length)return null;
        const p=coords[Math.max(0,Math.min(coords.length-1,Math.round(Number(center)||0)))],g=llGrid(hy,p);
        if(!g||!Number.isFinite(Number(g.x))||!Number.isFinite(Number(g.y)))return null;
        const bx=Math.max(0,Math.min(11,Math.floor(Number(g.x)*12/Math.max(1,hy.w))));
        const by=Math.max(0,Math.min(11,Math.floor(Number(g.y)*12/Math.max(1,hy.h))));
        return bx+','+by;
      }catch(_){return null;}
    };
    const auditGate16786=(key,gate,extra={})=>{
      key=key||'unknown';
      const row=audit16786.cells[key]||(audit16786.cells[key]={attempts:0,gates:{},samples:[]});
      row.attempts++;row.gates[gate]=(row.gates[gate]||0)+1;
      audit16786.totals[gate]=(audit16786.totals[gate]||0)+1;
      if(row.samples.length<12)row.samples.push(Object.assign({gate},extra||{}));
      window.EARTHLINE_CANDIDATE_GATE_AUDIT_16786=audit16786;
    };
    window.EARTHLINE_CANDIDATE_GATE_AUDIT_16786=audit16786;
    const lines=(contours&&contours.features||[]).filter(f=>f&&f.properties&&f.properties.feature_type==='contour'&&f.geometry&&f.geometry.type==='LineString');`);

  body=replaceOnce(body,'sample-start',
`    function sampleSegment(coords,center,relaxed){
      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10)return null;`,
`    function sampleSegment(coords,center,relaxed){
      const auditCell16786=auditKey16786(coords,center);auditGate16786(auditCell16786,'sample-attempt',{relaxed:!!relaxed,coordLen:coords.length});
      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10){auditGate16786(auditCell16786,'raw-vertices<10',{rawLen:raw.length});return null;}
      const segment=chaikin(raw,2,false);if(segment.length<10){auditGate16786(auditCell16786,'smoothed-vertices<10',{segmentLen:segment.length});return null;}`);

  body=replaceOnce(body,'line-floor',
`      if(linePx16632<minLinePx16632)return null;
      const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null;`,
`      if(linePx16632<minLinePx16632){auditGate16786(auditCell16786,'line-pixels-below-floor',{linePx:Number(linePx16632),floor:Number(minLinePx16632)});return null;}
      const stride=Math.max(1,Math.floor(segment.length/22));let valid=0,sumSlope=0,sumAcc=0,maxAcc=0,anchor=null,low16786=0,high16786=0,channel16786=0,nonfinite16786=0;`);

  body=replaceOnce(body,'slope-flow-loop',
`        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?18:13.5;
        if(!Number.isFinite(slope)||slope<minSlope||slope>maxSlope||acc>=channel)continue;
        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};
      }
      if(valid<(relaxed?1:2)||!anchor)return null;`,
`        const slope=hy.slope[i],acc=hy.acc[i],minSlope=relaxed?.05:.20,maxSlope=relaxed?18:13.5;
        if(!Number.isFinite(slope)){nonfinite16786++;continue;}
        if(slope<minSlope){low16786++;continue;}
        if(slope>maxSlope){high16786++;continue;}
        if(acc>=channel){channel16786++;continue;}
        valid++;sumSlope+=slope;sumAcc+=acc;maxAcc=Math.max(maxAcc,acc);if(!anchor)anchor={x,y};
      }
      if(valid<(relaxed?1:2)||!anchor){
        if(nonfinite16786)auditGate16786(auditCell16786,'slope-nonfinite',{count:nonfinite16786,relaxed:!!relaxed});
        if(low16786)auditGate16786(auditCell16786,'slope-below-min',{count:low16786,relaxed:!!relaxed});
        if(high16786)auditGate16786(auditCell16786,'slope-above-max',{count:high16786,relaxed:!!relaxed});
        if(channel16786)auditGate16786(auditCell16786,'flow-channel-reject',{count:channel16786,relaxed:!!relaxed});
        auditGate16786(auditCell16786,'insufficient-valid-samples',{valid,required:relaxed?1:2,low:low16786,high:high16786,channel:channel16786,nonfinite:nonfinite16786});
        return null;
      }`);

  body=replaceOnce(body,'candidate-return',
`      return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred',minLinePx16632};`,
`      auditGate16786(auditCell16786,'candidate-produced',{valid,relaxed:!!relaxed,linePx:Number(linePx16632),meanSlope:Number(meanSlope),meanAcc:Number(meanAcc)});
      return {segment,x:anchor.x,y:anchor.y,slope:meanSlope,acc:meanAcc,maxAcc,score:slopeScore*.56+flowScore*.28+lengthScore*.16,confidence:relaxed?'screening':'preferred',minLinePx16632,auditCell16786};`);

  body=replaceOnce(body,'jurisdiction-no-run',
`      if(!runs16539.length){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      if(!runs16539.length){auditGate16786(candidate16539&&candidate16539.auditCell16786,'jurisdiction-no-run');if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  body=replaceOnce(body,'jurisdiction-short',
`      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<minimumScreenPx16737){auditGate16786(candidate16539&&candidate16539.auditCell16786,'jurisdiction-short-after-clip',{linePx:segment16539?Number(lineLengthPixels(hy,segment16539)):null,floor:Number(minimumScreenPx16737)});if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  body=replaceOnce(body,'jurisdiction-bad-grid',
`      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`,
`      if(!grid16539||!Number.isFinite(grid16539.x)||!Number.isFinite(grid16539.y)){auditGate16786(candidate16539&&candidate16539.auditCell16786,'jurisdiction-bad-grid');if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`);

  body=replaceOnce(body,'jurisdiction-pass',
`      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;`,
`      auditGate16786(candidate16539&&candidate16539.auditCell16786,'jurisdiction-pass');
      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,screenedCandidate16592);
      return screenedCandidate16592;`);

  body=replaceOnce(body,'primary-short-contour',
`    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16)continue;`,
`    for(const f of lines){
      const coords=f.geometry.coordinates;if(coords.length<16){auditGate16786(auditKey16786(coords,Math.floor((coords.length-1)/2)),'contour-vertices<16-primary',{coordLen:coords.length});continue;}`);

  body=replaceOnce(body,'relaxed-short-contour',
`      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12)continue;for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}`,
`      for(const f of lines){const coords=f.geometry.coordinates;if(coords.length<12){auditGate16786(auditKey16786(coords,Math.floor((coords.length-1)/2)),'contour-vertices<12-relaxed',{coordLen:coords.length});continue;}for(const frac of [.28,.56,.82]){const c=sampleSegment(coords,Math.max(3,Math.min(coords.length-4,Math.round((coords.length-1)*frac))),true);if(c)candidates.push(c);}}`);

  return body;
}



const browser=await chromium.launch({headless:true});
for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1798,height:831}});
  const page=await context.newPage();
  const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let patchError=null;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();
      let body=await response.text();
      try{body=patchBody(body);}catch(e){patchError=String(e);}
      await route.fulfill({response,body});
      return;
    }
    await route.continue();
  });
  let error=null,target=null;
  try{
    await page.goto(BASE+'?property-gate-diag='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    if(patchError)throw new Error(patchError);
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(query);
    await page.waitForTimeout(700);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:query}).first();
    await opt.waitFor({state:'visible',timeout:8000}).catch(()=>{});
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,{timeout:90000,polling:100});
    const regErr=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regErr)throw new Error('regional '+JSON.stringify(regErr));
    target=await page.evaluate(q=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      const parent=String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||'');
      const f=sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
        .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))[0];
      if(!f)return null;
      const cc=f.geometry.coordinates,c=cc[Math.floor((cc.length-1)/2)];
      return {lng:Number(c[0]),lat:Number(c[1]),source:'zero-gate-diagnostic',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,parentRunToken:parent,at:new Date().toISOString()};
    },query);
    if(!target)throw new Error('no A1 target');
    await page.evaluate(async t=>{
      window.EARTHLINE_PROPERTY_TARGET_16201=t;
      if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')throw new Error('property owner unavailable');
      await fn();
    },target);
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:90000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){error=String(e&&e.message||e)}
  const data=await page.evaluate(()=>({
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
    candidateGates:window.EARTHLINE_CANDIDATE_GATE_AUDIT_16786||null,
    safety:M?.safetyAudit15806||null,
    lock:M?.propertyResultLock15815||null,
    swaleCount:Number(M?.swales?.length||0),
    safeSwaleCount:Number(M?.authoritativeSafeSwales15815?.length||0),
    waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
    boundary:window.EARTHLINE_PROPERTY_BOUNDARY_AUDIT_16178||null,
    exclusion:M?.vectorNoBuildCoverage||null
  })).catch(e=>({captureError:String(e)}));
  console.log('EARTHLINE_PROPERTY_GATE_DIAG '+JSON.stringify({query,target,error,patchError,pageErrors,data}));
  await context.close();
}
await browser.close();
