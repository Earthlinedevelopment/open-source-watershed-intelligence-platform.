import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const BASE_URL='https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
const candidateHtml=await fs.readFile('index.html','utf8');
const acceptedHtml=await fs.readFile('accepted16584/index.html','utf8');
const browser=await chromium.launch({headless:true});

async function makePage(body,label){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const origin=new globalThis.URL(BASE_URL).origin;
  await page.route('**/*',async route=>{
    const req=route.request();
    if(req.resourceType()==='document'){
      try{
        const u=new URL(req.url());
        if(u.origin===origin){
          const resp=await route.fetch();
          return route.fulfill({response:resp,body});
        }
      }catch(_){}
    }
    return route.continue();
  });
  await page.goto(BASE_URL+'?historical_diff='+label+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  return page;
}

async function runState(page,state){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },state);
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const p=String(window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const busy=document.getElementById('runBtn')?.getAttribute('aria-busy')==='true';
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||p!==prev)&&!!p&&!busy);
    },prior,{timeout:35000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(500);
  const snap=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mids=sw.map(f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;}).filter(Array.isArray);
    const xs=mids.map(p=>+p[0]).filter(Number.isFinite),ys=mids.map(p=>+p[1]).filter(Number.isFinite);
    const bbox=xs.length?[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)]:null;
    let occupancy=null;
    if(bbox&&mids.length){
      const dx=Math.max(1e-9,bbox[2]-bbox[0]),dy=Math.max(1e-9,bbox[3]-bbox[1]),cells=new Set();
      for(const p of mids){
        const ix=Math.max(0,Math.min(3,Math.floor(4*(p[0]-bbox[0])/dx))),iy=Math.max(0,Math.min(3,Math.floor(4*(p[1]-bbox[1])/dy)));
        cells.add(ix+','+iy);
      }
      occupancy=cells.size;
    }
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??sw.length,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,occupancy4x4:occupancy,swaleBBox:bbox,totalMs:p?.totalMs??null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  return {elapsedMs:Date.now()-started,timedOut,snap};
}

function span(b){
  if(!Array.isArray(b)||b.length<4)return null;
  return {x:Number(b[2])-Number(b[0]),y:Number(b[3])-Number(b[1])};
}

const candidate=await makePage(candidateHtml,'candidate');
const accepted=await makePage(acceptedHtml,'accepted16584');
const rows=[];

for(const state of STATES){
  const [cur,old]=await Promise.all([runState(candidate,state),runState(accepted,state)]);
  const reasons=[];
  const oldUsable=!old.timedOut&&!old.snap.lastError&&Number(old.snap.published||0)>0;
  const curUsable=!cur.timedOut&&!cur.snap.lastError&&Number(cur.snap.published||0)>0;

  if(oldUsable&&!curUsable)reasons.push('accepted-worked-candidate-failed');
  if(oldUsable&&curUsable){
    const op=Number(old.snap.published||0),cp=Number(cur.snap.published||0);
    if(op>=10&&cp<Math.floor(op*.60))reasons.push('published<60%-accepted');

    const oo=Number(old.snap.occupancy4x4||0),co=Number(cur.snap.occupancy4x4||0);
    if(oo>=8&&co<oo-4)reasons.push('distribution-occupancy-loss-vs-accepted');

    const os=span(old.snap.swaleBBox),cs=span(cur.snap.swaleBBox);
    if(os&&cs&&os.x>0&&os.y>0){
      if(cs.x<os.x*.65)reasons.push('longitude-extent-loss-vs-accepted');
      if(cs.y<os.y*.65)reasons.push('latitude-extent-loss-vs-accepted');
    }
  }

  const row={state,accepted:old,candidate:cur,acceptedUsable:oldUsable,candidateUsable:curUsable,reasons,regression:reasons.length>0};
  rows.push(row);
  console.log('EARTHLINE_16584_DIFF '+JSON.stringify(row));
}

console.log('EARTHLINE_16584_DIFF_SUMMARY '+JSON.stringify({
  states:rows.length,
  acceptedUsable:rows.filter(r=>r.acceptedUsable).length,
  regressions:rows.filter(r=>r.regression).map(r=>({state:r.state,reasons:r.reasons})),
  acceptedInconclusive:rows.filter(r=>!r.acceptedUsable).map(r=>r.state)
}));
await browser.close();
if(rows.some(r=>r.regression))process.exitCode=1;
