import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';

const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831},deviceScaleFactor:1});
if(process.env.EARTHLINE_CANDIDATE_ORIGIN==='1')await installCandidateOrigin(context);
const page=await context.newPage();
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(BASE+'?coverage_science='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(250);
}
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click({timeout:10000}).catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
await page.waitForTimeout(700);

await page.evaluate(()=>{
  window.EARTHLINE_SPLIT_DIAG_CAPTURE={calls:[],pointRejects:{}};
  const basePoint=window.earthlinePathPointUsable||earthlinePathPointUsable;
  const baseSplit=window.earthlineSplitUsableSegments||earthlineSplitUsableSegments;
  const reason=(px,py,maxS)=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const gx=Math.round(px),gy=Math.round(py);
    if(gx<1||gy<1||gx>=GW-1||gy>=GH-1)return 'bounds';
    const i=idx(gx,gy);
    if(!md.inP?.[i])return 'outside-property';
    if(md.pond?.[i])return 'pond';
    if(slopePct(gx,gy)>maxS)return 'slope';
    try{if(earthlineNoBuildBuffered(gx,gy))return 'no-build-buffer';}catch(_){}
    const channelThreshold=streamThreshold()*3.2;
    const radius=Math.max(1,Math.ceil(4/Math.max(0.5,md.cellM||1)));
    for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
      const x=gx+ox,y=gy+oy;
      if(x<0||y<0||x>=GW||y>=GH)continue;
      const propertyExact=!!(md&&md.earthlinePropertyChannelBuffer17485===true);
      if(propertyExact&&Math.hypot(ox,oy)*Math.max(0.5,Number(md.cellM||1))>4.000001)continue;
      if(md.acc&&md.acc[idx(x,y)]>=channelThreshold)return 'channel-buffer';
    }
    return 'unknown';
  };
  const pointWrap=function(px,py,maxS){
    const ok=basePoint(px,py,maxS);
    if(!ok){
      const r=reason(px,py,maxS);
      window.EARTHLINE_SPLIT_DIAG_CAPTURE.pointRejects[r]=(window.EARTHLINE_SPLIT_DIAG_CAPTURE.pointRejects[r]||0)+1;
    }
    return ok;
  };
  window.earthlinePathPointUsable=pointWrap;
  try{earthlinePathPointUsable=pointWrap}catch(_){}
  const splitWrap=function(pts,maxS){
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const minM=earthlineMinimumSwaleLengthM15768();
    const cellM=Math.max(.001,Number(md.cellM||1));
    let totalM=0,maxSafeRunM=0,currentM=0,safeVertices=0,unsafeVertices=0;
    let prev=null,prevOk=false;
    const reasons={};
    for(const p of (pts||[])){
      const ok=basePoint(p[0],p[1],maxS);
      if(ok)safeVertices++;else{unsafeVertices++;const r=reason(p[0],p[1],maxS);reasons[r]=(reasons[r]||0)+1;}
      if(prev){
        const d=Math.hypot(Number(p[0])-Number(prev[0]),Number(p[1])-Number(prev[1]))*cellM;
        totalM+=d;
        if(ok&&prevOk){currentM+=d;maxSafeRunM=Math.max(maxSafeRunM,currentM);}else currentM=0;
      }
      prev=p;prevOk=ok;
    }
    const out=baseSplit(pts,maxS);
    window.EARTHLINE_SPLIT_DIAG_CAPTURE.calls.push({
      points:Array.isArray(pts)?pts.length:0,totalM:+totalM.toFixed(2),minM:+minM.toFixed(2),
      safeVertices,unsafeVertices,maxSafeRunM:+maxSafeRunM.toFixed(2),
      outputCount:Array.isArray(out)?out.length:0,
      outputLengths:(out||[]).map(seg=>+earthlineSegmentLengthM(seg).toFixed(2)),
      reasons
    });
    return out;
  };
  window.earthlineSplitUsableSegments=splitWrap;
  try{earthlineSplitUsableSegments=splitWrap}catch(_){}
});

async function runControl(lng,lat,label){
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(({lng,lat})=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[lng,lat],zoom:16.59});
    try{m.fire?.('dragend')}catch(_){}
  },{lng,lat});
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return !!t&&Math.abs(Number(t.lng)-lng)<=0.00008&&Math.abs(Number(t.lat)-lat)<=0.00008;
  },{lng,lat},{timeout:15000,polling:100});
  const btn=page.locator('#earthlineDeclareProperty16169');
  await btn.waitFor({state:'visible',timeout:15000});
  if(await btn.isDisabled())throw new Error(label+' Property button disabled');
  await btn.click({timeout:10000});
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;
    return !!a&&Number(a.serial||0)>prev&&a.settled===true;
  },before,{timeout:90000,polling:120});
  await page.waitForFunction(()=> {
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097;
    return !!e&&(e.state==='committed'||e.state==='failed'||e.state==='property-pending');
  },null,{timeout:30000,polling:120}).catch(()=>{});
  await page.waitForTimeout(800);

  return page.evaluate(({lng,lat,label})=>{
    const md=(typeof M!=='undefined'&&M)||window.M||{};
    const inP=md.inP||[], h=md.h||[], pond=md.pond||[], noBuild=md.noBuildMask||[], acc=md.acc||[];
    const GW=Number(window.GW||210), GH=Number(window.GH||146), cellM=Math.max(.001,Number(md.cellM||1));
    const idx=(x,y)=>y*GW+x;
    let chanThr=Number(md?.swaleDiagnostics?.levelGenerator?.channelThreshold);
    if(!Number.isFinite(chanThr)){
      try{chanThr=Number(streamThreshold())*3.2}catch(_){chanThr=Infinity}
    }
    const safe=[];
    const slopes=[];
    for(let y=2;y<GH-2;y++)for(let x=2;x<GW-2;x++){
      const i=idx(x,y);
      if(!inP[i]||!Number.isFinite(Number(h[i])))continue;
      let sp=Infinity;
      try{sp=Number(slopePct(x,y))}catch(_){}
      if(Number.isFinite(sp))slopes.push(sp);
      if(pond[i]||noBuild[i]||Number(acc[i]||0)>=chanThr||!(sp<=4))continue;
      safe.push([x,y]);
    }

    const swales=Array.isArray(md.swales)?md.swales:[];
    const cover=new Uint8Array(GW*GH);
    const radiusCells=7.62/cellM;
    const rr=Math.ceil(radiusCells);
    const mark=(x,y)=>{
      const minX=Math.max(0,Math.floor(x-rr)),maxX=Math.min(GW-1,Math.ceil(x+rr));
      const minY=Math.max(0,Math.floor(y-rr)),maxY=Math.min(GH-1,Math.ceil(y+rr));
      for(let yy=minY;yy<=maxY;yy++)for(let xx=minX;xx<=maxX;xx++){
        if(Math.hypot(xx-x,yy-y)<=radiusCells)cover[idx(xx,yy)]=1;
      }
    };
    for(const sw of swales){
      const pts=Array.isArray(sw?.pts)?sw.pts:[];
      for(let p=1;p<pts.length;p++){
        const a=pts[p-1],b=pts[p];
        const steps=Math.max(1,Math.ceil(Math.hypot(Number(b[0])-Number(a[0]),Number(b[1])-Number(a[1]))*2));
        for(let k=0;k<=steps;k++){
          const q=k/steps;
          mark(Number(a[0])+(Number(b[0])-Number(a[0]))*q,Number(a[1])+(Number(b[1])-Number(a[1]))*q);
        }
      }
    }
    let covered=0;
    for(const [x,y] of safe)if(cover[idx(x,y)])covered++;
    slopes.sort((a,b)=>a-b);
    const q=p=>slopes.length?slopes[Math.min(slopes.length-1,Math.floor((slopes.length-1)*p))]:null;
    const flow=md.flowFirstPlacement15836||{};
    const reasons={};
    for(const u of Array.isArray(flow.unserved)?flow.unserved:[]){
      const k=String(u?.reason||'unknown');reasons[k]=(reasons[k]||0)+1;
    }
    const diag=md.coverageDiagnostic15803||{};
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      label,requested:{lng,lat},
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      slope:{cellM,samples:slopes.length,q10:q(.1),q25:q(.25),median:q(.5),q75:q(.75),q90:q(.9),safePct:Number(md?.swaleDiagnostics?.slopeSafePct),usablePct:Number(md?.swaleDiagnostics?.usablePct)},
      coverage:{safeCells:safe.length,coveredWithin25ft:covered,uncoveredWithin25ft:safe.length-covered,coveragePct:safe.length?+(100*covered/safe.length).toFixed(1):100,acceptedSwales:swales.length},
      flow:{eligiblePaths:Number(flow.eligiblePaths||0),pathsEvaluated:Number(flow.pathsEvaluated||0),pathsServed:Number(flow.pathsServed||0),unservedCount:Array.isArray(flow.unserved)?flow.unserved.length:0,reasons},
      prescriber:{meta:md.swaleMeta||null,diagnosticStage:md.swaleDiagnostics?.stage||null,termination:diag.termination||null,coverage:diag.coverage||null,zones:Array.isArray(diag.zones)?diag.zones.map(z=>({id:z.id,safeCells:z.safeCells,contourCells:z.contourCells,seeds:z.seeds,candidates:z.candidates,accepted:z.accepted,rejections:z.rejections})):[]},
      elder:{state:String(elder?.state||''),featureCount:Number(elder?.featureCount||0),summary:elder?.summary||null,identity:String(elder?.propertyRunIdentity||'')},
      splitDiagnostic:window.EARTHLINE_SPLIT_DIAG_CAPTURE||null,
      pageErrors:[...window.__coverageScienceErrors||[]]
    };
  },{lng,lat,label});
}

await page.evaluate(()=>{window.__coverageScienceErrors=[];window.addEventListener('error',e=>window.__coverageScienceErrors.push(String(e.error||e.message||e)))});
const controls=[
  {label:'SCREENSHOT-1',lng:-111.93066,lat:34.21568},
  {label:'SCREENSHOT-2',lng:-111.93331,lat:34.21526}
];
const rows=[];
for(const c of controls)rows.push(await runControl(c.lng,c.lat,c.label));
console.log('EARTHLINE_ARIZONA_COVERAGE_SCIENCE '+JSON.stringify({rows,pageErrors}));
await page.screenshot({path:'/tmp/earthline-arizona-coverage-science.png',fullPage:true});
await browser.close();
