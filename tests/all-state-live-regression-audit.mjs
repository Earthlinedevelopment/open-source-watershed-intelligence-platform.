import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
if(!STATES.length) throw new Error('STATES is empty');

const candidateHtml=await fs.readFile(process.env.EARTHLINE_INDEX||'index.html','utf8');
const snapshot=JSON.parse(await fs.readFile('earthline-current-50-state-snapshot.json','utf8'));
const manualBaseline=JSON.parse(await fs.readFile('earthline-state-regression-baseline.json','utf8'));
const snapshotMap=new Map((snapshot.states||[]).map(r=>[r.state,r]));
const manualMap=manualBaseline.states||{};

const vetoStatuses=new Set([
  'FAIL_LOCKED',
  'FAIL_CURRENT_MANUAL',
  'CANONICAL_CONTROL_CURRENT_FAIL',
  'CURRENT_AUTOMATION_FAIL'
]);
const reviewStatuses=new Set([
  'HISTORICAL_ISSUE',
  'HISTORICAL_PASS_WITH_RENDER_WATCH',
  'CONTROL_NOT_ACCEPTED'
]);

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const rows=[];

page.on('pageerror',e=>console.log('PAGEERROR '+String(e)));

const origin=new globalThis.URL(BASE_URL).origin;
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.resourceType()==='document'){
    try{
      const u=new URL(req.url());
      if(u.origin===origin){
        const resp=await route.fetch();
        return route.fulfill({response:resp,body:candidateHtml});
      }
    }catch(_){}
  }
  return route.continue();
});

await page.goto(BASE_URL+'?candidate_state_regression='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

function bboxSpan(b){
  if(!Array.isArray(b)||b.length<4)return null;
  return {x:Math.max(0,Number(b[2])-Number(b[0])),y:Math.max(0,Number(b[3])-Number(b[1]))};
}

for(const stateName of STATES){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  },stateName);

  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const t=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||'');
      const busy=document.getElementById('runBtn')?.getAttribute('aria-busy')==='true';
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||t!==prev)&&!!t&&!busy);
    },prior,{timeout:35000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);

  const snap=await page.evaluate(q=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const contours=Array.isArray(v?.contours?.features)?v.contours.features:[];
    const flows=Array.isArray(v?.flows?.features)?v.flows.features:[];
    const mids=sw.map(f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;}).filter(Array.isArray);
    const xs=mids.map(p=>+p[0]).filter(Number.isFinite),ys=mids.map(p=>+p[1]).filter(Number.isFinite);
    const bbox=xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:null;
    let occ=null;
    if(bbox&&mids.length){
      const dx=Math.max(1e-9,bbox[2]-bbox[0]),dy=Math.max(1e-9,bbox[3]-bbox[1]);
      const cells=new Set();
      for(const p of mids){
        const ix=Math.max(0,Math.min(3,Math.floor(4*(p[0]-bbox[0])/dx)));
        const iy=Math.max(0,Math.min(3,Math.floor(4*(p[1]-bbox[1])/dy)));
        cells.add(ix+','+iy);
      }
      occ=cells.size;
    }
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const aq=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    const lv=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    return {
      query:q,
      swaleBBox:bbox,
      occupancy4x4:occ,
      swales:sw.length,
      contours:contours.length,
      flows:flows.length,
      visible:d?.swaleLines??null,
      published:g?.publishedFeatures??null,
      candidates:g?.candidates??null,
      eligible:g?.jurisdictionEligibleCandidates??null,
      rejected:g?.jurisdictionRejectedCandidates??null,
      totalMs:p?.totalMs??null,
      unsafe:flow?.unsafeSegments??null,
      grid:lv?{w:lv.w??lv.grid?.w??null,h:lv.h??lv.grid?.h??null,valid:lv.validLandCellCount??null,ocean:lv.outsideLandCellCount??null,inland:lv.inlandWaterCellCount??null}:null,
      outside:b?.outsideAfterClip??null,
      aquifer:aq?{source:aq.source||null,features:aq.features??null}:null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
    };
  },stateName);

  const baseRow=snapshotMap.get(stateName)||null;
  const base=baseRow?.snap||null;
  const manual=manualMap[stateName]||{status:'UNVERIFIED',reason:'No recovered manual baseline'};
  const failReasons=[];

  if(timedOut)failReasons.push('timeout');
  if(snap.lastError)failReasons.push('live-error');
  if(!(Number(snap.totalMs)<=15000))failReasons.push('core>15s-or-missing');
  if(Number(snap.visible)!==Number(snap.published))failReasons.push('visible!=published');
  if(Number(snap.published||0)<=0)failReasons.push('no-published-swales');
  if(Number(snap.outside?.swales||0)!==0)failReasons.push('outside-swales');
  if(Number(snap.unsafe||0)!==0)failReasons.push('unsafe-water');

  if(base){
    const bp=Number(base.published||0),cp=Number(snap.published||0);
    if(bp>=10&&cp<Math.floor(bp*.80))failReasons.push('published-regression>20%');

    const bo=Number(base.occupancy4x4||0),co=Number(snap.occupancy4x4||0);
    if(bo>=8&&co<bo-3)failReasons.push('distribution-occupancy-regression');

    const be=Number(base.eligible||0),ce=Number(snap.eligible||0);
    if(be>=20&&ce<Math.floor(be*.60))failReasons.push('eligible-candidate-regression>40%');

    const bc=Number(base.contours||0),cc=Number(snap.contours||0);
    if(bc>=20&&cc<Math.floor(bc*.60))failReasons.push('contour-regression>40%');

    const bf=Number(base.flows||0),cf=Number(snap.flows||0);
    if(bf>=20&&cf<Math.floor(bf*.60))failReasons.push('water-path-regression>40%');

    const bs=bboxSpan(base.swaleBBox),cs=bboxSpan(snap.swaleBBox);
    if(bs&&cs&&bs.x>0&&bs.y>0){
      if(cs.x<bs.x*.70)failReasons.push('swale-longitude-extent-regression');
      if(cs.y<bs.y*.70)failReasons.push('swale-latitude-extent-regression');
    }
  }

  if(vetoStatuses.has(manual.status))failReasons.push('manual-baseline-veto:'+manual.status);

  const reviewRequired=reviewStatuses.has(manual.status);
  const row={
    state:stateName,
    elapsedMs:Date.now()-started,
    timedOut,
    manual,
    reviewRequired,
    baseline:base?{
      published:base.published,occupancy4x4:base.occupancy4x4,eligible:base.eligible,
      contours:base.contours,flows:base.flows,swaleBBox:base.swaleBBox,totalMs:base.totalMs
    }:null,
    snap,
    failReasons,
    pass:failReasons.length===0
  };
  rows.push(row);
  console.log('EARTHLINE_CANDIDATE_STATE '+JSON.stringify(row));
}

const summary={
  states:rows.length,
  pass:rows.filter(r=>r.pass).length,
  fail:rows.filter(r=>!r.pass).length,
  manualReview:rows.filter(r=>r.reviewRequired).map(r=>r.state),
  failed:rows.filter(r=>!r.pass).map(r=>({state:r.state,reasons:r.failReasons}))
};
console.log('EARTHLINE_CANDIDATE_STATE_SUMMARY '+JSON.stringify(summary));
await browser.close();

if(rows.some(r=>!r.pass)||rows.some(r=>r.reviewRequired))process.exitCode=1;
