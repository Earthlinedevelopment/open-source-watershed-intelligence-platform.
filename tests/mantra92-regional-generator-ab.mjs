import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
// M92 controlled generator A/B. Browser uses identical production origin, data,
// build and all other components. No production file or renderer is changed.
const BASE='https://earthlinedevelopment.org/';
const base=readFileSync('index.html','utf8');
const conditional='if(focusMode||preferredEligibleCount16539<36){';
const conditionalOld='if(!focusMode||preferredEligibleCount16539<36){';
const cap='if(leftM+d>8000)break;';
const capRight='if(rightM+d>8000)break;';
for(const [needle,n] of [[conditional,1],[cap,1],[capRight,1]]){
  const count=base.split(needle).length-1;
  if(count!==n)throw Error('Non-unique generator owner '+needle+': '+count+' hits');
}
const metricClip=String.raw`
      const capM92=2000;
      function sectionM92(dir){
        let cursorM92=rawCenter,totalM92=0;
        const ptsM92=[raw[rawCenter]];
        while(cursorM92+dir>=0&&cursorM92+dir<raw.length&&totalM92<capM92){
          const aM92=raw[cursorM92],bM92=raw[cursorM92+dir],dM92=distM(aM92,bM92);
          if(!Number.isFinite(dM92)||dM92<=0){cursorM92+=dir;continue;}
          const remainingM92=capM92-totalM92;
          if(dM92<=remainingM92){ptsM92.push(bM92);totalM92+=dM92;cursorM92+=dir;continue;}
          const tM92=remainingM92/dM92;
          ptsM92.push([Number(aM92[0])+(Number(bM92[0])-Number(aM92[0]))*tM92,
            Number(aM92[1])+(Number(bM92[1])-Number(aM92[1]))*tM92]);
          break;
        }
        return ptsM92;
      }
      const leftM92=sectionM92(-1),rightM92=sectionM92(1);
      const segment=leftM92.reverse().slice(0,-1).concat(rightM92);
      if(segment.length<2)return null;
`;
const cutRegex=/let left=rawCenter,right=rawCenter,leftM=0,rightM=0;[\s\S]*?const segment=raw\.slice\(left,right\+1\);if\(segment\.length<2\)return null;/;
if(!cutRegex.test(base))throw Error('Cannot identify current Regional locality implementation');
if(base.split('let minLinePx16632=focusMode?10:2;').length!==2)throw Error('Expected one pixel-length gate');
const screenPrefix='const minimumScreenPx16737=';
const candidateTag="confidence:relaxed?'screening':'preferred',minLinePx16632};";
function metricCandidate(regionalContourFallback=false){
  let result=base.replace(cutRegex,metricClip)
    .replace('let minLinePx16632=focusMode?10:2;','let minLinePx16632=focusMode?10:0;');
  if(result.split(candidateTag).length!==2)throw Error('Missing unique candidate output owner');
  result=result.replace(candidateTag,
    "confidence:relaxed?'screening':'preferred',minLinePx16632,m92MetricValidated:!focusMode};");
  const start=result.indexOf(screenPrefix),end=result.indexOf('const mid16539=',start);
  const original=result.slice(start,end);
  if(start<0||end<start||!original.includes('lineLengthPixels(hy,segment16539)<minimumScreenPx16737'))
    throw Error('Missing exact jurisdiction screen owner');
  const guard=String.raw`
    const minimumScreenPx16737=candidate16539&&candidate16539.coverageGap16731
      ?0.75
      :Math.max(4,Math.min(10,Number(candidate16539&&candidate16539.minLinePx16632)||10));
    const metricLocalM92=!focusMode&&candidate16539?.m92MetricValidated===true;
    let metricLengthM92=0;
    if(metricLocalM92&&Array.isArray(segment16539))for(let iM92=1;iM92<segment16539.length;iM92++){
      const aM92=segment16539[iM92-1],bM92=segment16539[iM92],R=6371008.8,rad=Math.PI/180;
      const p1M92=Number(aM92[1])*rad,p2M92=Number(bM92[1])*rad;
      const dpM92=(Number(bM92[1])-Number(aM92[1]))*rad,dlM92=(Number(bM92[0])-Number(aM92[0]))*rad;
      const hM92=Math.sin(dpM92/2)**2+Math.cos(p1M92)*Math.cos(p2M92)*Math.sin(dlM92/2)**2;
      metricLengthM92+=2*R*Math.asin(Math.min(1,Math.sqrt(hM92)));
    }
    if(!segment16539||segment16539.length<2||
      (metricLocalM92?!(metricLengthM92>=250&&metricLengthM92<=4005)
        :lineLengthPixels(hy,segment16539)<minimumScreenPx16737)){
      if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);
      return null;
    }
  `;
  result=result.slice(0,start)+guard+result.slice(end);
  if(regionalContourFallback)result=result.replace(conditional,conditionalOld);
  return result;
}
const modes=[
 {name:'current',html:base},
 {name:'metric-safe',html:metricCandidate(false)},
 {name:'metric-with-coverage',html:metricCandidate(true)}
];
const queries=['Alaska','Arizona'];
const browser=await chromium.launch({headless:true});
const rows=[];
mkdirSync('artifacts/mantra92/generator-ab',{recursive:true});
for(const m of modes)for(const query of queries){
  const ctx=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await ctx.newPage(),errs=[],http=[];
  page.on('pageerror',x=>errs.push(String(x)));
  page.on('response',r=>{if(r.status()>=400)http.push({code:r.status(),url:r.url()})});
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE))
      return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:m.html});
    return route.continue();
  });
  let failure=null,start=Date.now();
  try{
    await page.goto(BASE+'?m92ab='+m.name+'-'+query+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:15000});
    await page.evaluate(q=>{const e=document.getElementById('searchInput');e.value=q;
      e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}));
      document.getElementById('runBtn').click()},query);
    await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
      !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  }catch(e){failure=String(e)}
  const snap=await page.evaluate(()=>{
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const geom=window.EARTHLINE_REGIONAL_GEOMETRY_M84||null;
    const model=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const generation=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    let src=null;
    try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      const s=map?.getSource?.('el-live-swales-15970');
      src=s?._data||s?.serialize?.()?.data||null;
    }catch{}
    const fs=src?.features||[];
    const slopes=fs.map(f=>Number(f?.properties?.slope_pct)).filter(Number.isFinite);
    const lineLenM92=(coords)=>{
      if(!Array.isArray(coords))return 0;
      const R=6371008.8,rad=Math.PI/180;let total=0;
      for(let i=1;i<coords.length;i++){
        const a=coords[i-1],b=coords[i];
        if(!Array.isArray(a)||!Array.isArray(b)||a.length<2||b.length<2)continue;
        const p1=Number(a[1])*rad,p2=Number(b[1])*rad;
        const dp=(Number(b[1])-Number(a[1]))*rad,dl=(Number(b[0])-Number(a[0]))*rad;
        const h=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
        total+=2*R*Math.asin(Math.min(1,Math.sqrt(h)));
      }
      return total;
    };
    const lengths=fs.map(f=>lineLenM92(f?.geometry?.coordinates)).filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b);
    const stage=window.EARTHLINE_M92_STAGE_TIMINGS||null;
    return {profileId:model?.profileId||null,coreMs:perf?.phaseTotalsMs?.coreTotalMs||null,
      waterPaths:perf?.waterPaths||null,pub:pub?{generated:pub.generated,source:pub.sourceFeatures,overlay:pub.overlaySwaleLines}:null,
      swaleGeometry:geom?{accepted:geom.accepted,maxLengthM:geom.maxLengthM,p95LengthM:geom.p95LengthM}:null,
      maxSlope:slopes.length?Math.max(...slopes):null,sourceCount:fs.length,maxSourceLengthM:lengths.length?lengths.at(-1):null,p95SourceLengthM:lengths.length?lengths[Math.floor(.95*(lengths.length-1))]:null,
      generation:generation?{generated:generation.generated,publishedFeatures:generation.publishedFeatures,
        candidatesBeforeJurisdiction:generation.candidatesBeforeJurisdiction,eligible:generation.eligible}:null,
      stage:stage?Object.fromEntries(Object.entries(stage).map(([k,v])=>[k,{calls:v.length,sumMs:v.reduce((a,s)=>a+s.ms,0)}])):null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  }).catch(e=>({evaluationError:String(e)}));
  const row={mode:m.name,query,sha:'67de444b7048fc9a8ef5282dd3f4fb5961681779',elapsedMs:Date.now()-start,failure,snap,errs,http:http.slice(-8)};
  rows.push(row);
  console.log('M92_GENERATOR_AB '+JSON.stringify(row));
  await page.screenshot({path:'artifacts/mantra92/generator-ab/'+m.name+'-'+query.toLowerCase()+'.png'}).catch(()=>{});
  await ctx.close();
}
await browser.close();
writeFileSync('artifacts/mantra92/generator-ab/matrix.json',JSON.stringify(rows,null,2));
console.log('M92_GENERATOR_AB_SUMMARY '+JSON.stringify(rows.map(r=>({mode:r.mode,query:r.query,core:r.snap?.coreMs,swales:r.snap?.pub?.generated,
 maxLen:r.snap?.maxSourceLengthM,slope:r.snap?.maxSlope,errors:r.errs.length,failure:r.failure}))));
if(rows.some(r=>r.failure||r.snap?.error||r.snap?.evaluationError||r.errs.length))process.exitCode=1;
