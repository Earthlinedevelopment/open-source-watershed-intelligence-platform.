import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=[
  {query:'Texas',minPublished:40,tag:'tx1'},
  {query:'Texas',minPublished:40,tag:'tx2'},
  {query:'New York',minPublished:70,tag:'ny'},
  {query:'Vermont',minPublished:40,tag:'vt1'},
  {query:'Vermont',minPublished:40,tag:'vt2'},
];

const browser=await chromium.launch({headless:true});
const results=[];

function patchBody(body){
  const patch={};
  const r=(name,needle,repl)=>{
    const n=body.split(needle).length-1;
    patch[name]=n;
    if(n!==1)throw new Error(name+' expected once, found '+n);
    body=body.replace(needle,repl);
  };

  r('spacingPrimary',
    'const chosen=[],primarySpacing=Math.max(6,Math.round(hy.w/31));',
    'const chosen=[],primarySpacing=Math.max(3,Math.round(hy.w/31));');
  r('spacingSecondary',
    'const spacing=chosen.length<20?primarySpacing:Math.max(4,Math.round(primarySpacing*.72));',
    'const spacing=chosen.length<20?primarySpacing:Math.max(2,Math.round(primarySpacing*.72));');

  r('cameraScaleHelper',
    '  async function settleRegionalCamera(m,b,runToken){',
    `  function regionalCameraScale16604(m,b){
    try{
      const sw=m.project([b[0],b[1]]),ne=m.project([b[2],b[3]]),c=m.getContainer&&m.getContainer();
      const cw=Math.max(1,Number(c&&c.clientWidth||0)),ch=Math.max(1,Number(c&&c.clientHeight||0));
      const widthFraction=Math.abs(Number(ne.x)-Number(sw.x))/cw;
      const heightFraction=Math.abs(Number(sw.y)-Number(ne.y))/ch;
      return {widthFraction,heightFraction,ok:Number.isFinite(widthFraction)&&Number.isFinite(heightFraction)&&widthFraction>=.18&&heightFraction>=.22};
    }catch(_){return {widthFraction:0,heightFraction:0,ok:false};}
  }
  async function settleRegionalCamera(m,b,runToken){`);

  r('cameraFrameFunction',
    "    try{const span=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1])),maxZoom=span<.08?14.2:span<.35?12.5:8.4;m.stop&&m.stop();m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:50,duration:0,maxZoom});}catch(_){ }",
    "    const span=Math.max(Math.abs(b[2]-b[0]),Math.abs(b[3]-b[1])),maxZoom=span<.08?14.2:span<.35?12.5:8.4;const frameRegionalCamera16604=()=>{try{m.resize&&m.resize();m.stop&&m.stop();m.fitBounds([[b[0],b[1]],[b[2],b[3]]],{padding:50,duration:0,maxZoom});}catch(_){}};frameRegionalCamera16604();");

  r('cameraRetryClock',
    '    let settled16335=false,lastCoverage16335=0,lastLoaded16335=false;',
    '    let settled16335=false,lastCoverage16335=0,lastLoaded16335=false,lastFrameAttempt16604=Date.now();');

  r('cameraScaleGate',
    '      if(lastCoverage16335>=0.995&&(moved||idle)){',
    '      const cameraScale16604=regionalCameraScale16604(m,b);\n      if(lastCoverage16335>=0.995&&cameraScale16604.ok&&(moved||idle)){');

  r('cameraRetry',
    '      }\n      await wait(100);\n    }\n    try{m.resize&&m.resize();}catch(_){}',
    '      }\n      if(!cameraScale16604.ok&&Date.now()-lastFrameAttempt16604>=350){frameRegionalCamera16604();lastFrameAttempt16604=Date.now();}\n      await wait(100);\n    }\n    try{m.resize&&m.resize();}catch(_){}');

  return {body,patch};
}

function cameraScaleOnPage(){
  try{
    const m=earthlineMap,b=M?.loc?.bbox;
    if(!m||!Array.isArray(b)||b.length!==4)return null;
    const sw=m.project([b[0],b[1]]),ne=m.project([b[2],b[3]]),c=m.getContainer();
    const widthFraction=Math.abs(Number(ne.x)-Number(sw.x))/Math.max(1,c.clientWidth);
    const heightFraction=Math.abs(Number(sw.y)-Number(ne.y))/Math.max(1,c.clientHeight);
    return {widthFraction,heightFraction,ok:widthFraction>=.18&&heightFraction>=.22,zoom:Number(m.getZoom()),center:{lng:Number(m.getCenter().lng),lat:Number(m.getCenter().lat)}};
  }catch(_){return null;}
}

for(const testCase of CASES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  let patch={},loadError=null;

  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
      const response=await route.fetch();
      let body=await response.text();
      const p=patchBody(body);
      patch=p.patch;
      await route.fulfill({response,body:p.body});
      return;
    }
    await route.continue();
  });

  try{
    await page.goto(BASE+'?earthline_minimal_spacing_camera='+testCase.tag+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
  }catch(e){loadError=String(e);}

  const started=Date.now();
  let timedOut=false;
  if(!loadError){
    await page.evaluate(query=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.focus();i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },testCase.query);
    try{
      await page.waitForFunction(()=>{
        if(window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)return true;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020;
      },{timeout:35000,polling:50});
    }catch(_){timedOut=true;}
  }

  const a=loadError?{}:await page.evaluate(cameraScaleOnPage=>{
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const generation=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
    return {perf,generation,pub,display,flow,boundary,status,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,visualSwales:Array.isArray(visual?.swales?.features)?visual.swales.features.length:0,camera:(0,eval)('('+cameraScaleOnPage+')')()};
  },cameraScaleOnPage.toString());

  const row={query:testCase.query,tag:testCase.tag,minPublished:testCase.minPublished,patch,loadError,timedOut,clickToTerminalMs:Date.now()-started,coreMs:a?.perf?.totalMs??null,phases:a?.perf?.phaseTotalsMs??null,candidates:a?.generation?.candidates??null,eligible:a?.generation?.jurisdictionEligibleCandidates??null,chosen:a?.generation?.chosenBeforeTierGate??null,published:a?.pub?.generated??a?.visualSwales??0,visible:a?.display?.swaleLines??a?.visualSwales??0,visualSwales:a?.visualSwales??0,gridW:a?.flow?.gridAudit?.grid?.w??null,gridH:a?.flow?.gridAudit?.grid?.h??null,unsafe:a?.flow?.unsafeSegments??null,outsideAfterClip:a?.boundary?.outsideAfterClip??null,camera:a?.camera||null,lastError:a?.lastError||null,pageErrors,status:a?.status||''};
  results.push(row);
  console.log('EARTHLINE_MINIMAL_SPACING_CAMERA '+JSON.stringify(row));
  await context.close();
}

await browser.close();
writeFileSync('shared-regional-spacing-camera-minimal.json',JSON.stringify(results,null,2));

const failed=results.some(r=>r.loadError||r.timedOut||r.lastError||r.pageErrors.length||Number(r.gridW)!==96||Number(r.gridH)!==96||Number(r.unsafe)!==0||Number(r.published)<Number(r.minPublished)||Number(r.visible)<Number(r.minPublished)||Number(r.clickToTerminalMs)>15000||!r.camera?.ok||Number(r.outsideAfterClip?.contours||0)!==0||Number(r.outsideAfterClip?.flows||0)!==0||Number(r.outsideAfterClip?.swales||0)!==0);
if(failed)process.exitCode=1;
