import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra47-16836-opportunity-balance-gate';
const STATES=['Iowa','Arkansas','Oklahoma','Nebraska','Vermont','Texas','Florida','Louisiana','California','New York','Maryland','Colorado'];
mkdirSync(OUT,{recursive:true});

function patchBalance6(body){
  const capture='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';
  if(body.split(capture).length-1!==1) throw new Error('16836 capture occurrence mismatch');
  const patch=`/* EARTHLINE 16836 DIAGNOSTIC — STRICT COUNT-NEUTRAL OPPORTUNITY BALANCE */\n(()=>{\n  if(focusMode||!chosen.length||!candidates.length)return;\n  const N16836=12,maxSwaps16836=6,minGain16836=.15;\n  const point16836=c=>{const gx=Number.isFinite(Number(c&&c.coverageGX16775))?Number(c.coverageGX16775):Number(c&&c.x),gy=Number.isFinite(Number(c&&c.coverageGY16775))?Number(c.coverageGY16775):Number(c&&c.y);if(!Number.isFinite(gx)||!Number.isFinite(gy))return null;const fx=Math.max(0,Math.min(N16836-1,Math.floor(gx*N16836/Math.max(1,hy.w)))),fy=Math.max(0,Math.min(N16836-1,Math.floor(gy*N16836/Math.max(1,hy.h))));return {fx,fy,cell:fx+','+fy,parent:Math.floor(fx/2)+','+Math.floor(fy/2)};};\n  const opportunityCache16836=new Map();\n  const opportunity16836=p=>{if(!p)return 0;if(opportunityCache16836.has(p.cell))return opportunityCache16836.get(p.cell);const x0=Math.floor(p.fx*hy.w/N16836),x1=Math.min(hy.w,Math.ceil((p.fx+1)*hy.w/N16836)),y0=Math.floor(p.fy*hy.h/N16836),y1=Math.min(hy.h,Math.ceil((p.fy+1)*hy.h/N16836));let valid=0,opp=0,pref=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;valid++;const sp=Number(hy.slope[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4){opp++;if(sp>=.25&&sp<=3.5)pref++;}}const v=valid?(.35*(opp/valid)+.65*(pref/valid)):0;opportunityCache16836.set(p.cell,v);return v;};\n  const candByCell16836=new Map();for(const c of candidates){const p=point16836(c);if(!p)continue;let a=candByCell16836.get(p.cell);if(!a)candByCell16836.set(p.cell,a=[]);a.push({c,p});}for(const a of candByCell16836.values())a.sort((u,v)=>(Number(v.c.score)||0)-(Number(u.c.score)||0));\n  const rows=[];let swaps=0;\n  while(swaps<maxSwaps16836){const cellCount=new Map(),parentCount=new Map();for(const c of chosen){const p=point16836(c);if(!p)continue;cellCount.set(p.cell,(cellCount.get(p.cell)||0)+1);parentCount.set(p.parent,(parentCount.get(p.parent)||0)+1);}\n    const targets=[];for(const [cell,a] of candByCell16836){if((cellCount.get(cell)||0)!==0||!a.length)continue;const p=a[0].p,op=opportunity16836(p);targets.push({cell,p,op,c:a[0].c});}targets.sort((a,b)=>b.op-a.op||(Number(b.c.score)||0)-(Number(a.c.score)||0));\n    let best=null;for(const t of targets){for(let i=0;i<chosen.length;i++){const d=chosen[i],p=point16836(d);if(!p||(cellCount.get(p.cell)||0)!==1)continue;const cross=p.parent!==t.p.parent;if(cross&&((parentCount.get(p.parent)||0)<=3||(parentCount.get(t.p.parent)||0)>=3))continue;const dop=opportunity16836(p),gain=t.op-dop;if(gain<minGain16836)continue;const metric=gain*10+(Number(t.c.score)||0)-(Number(d.score)||0)*.25;if(!best||metric>best.metric)best={i,t,d,p,dop,gain,metric};}}if(!best)break;chosen[best.i]=best.t.c;rows.push({fromCell:best.p.cell,toCell:best.t.cell,fromParent:best.p.parent,toParent:best.t.p.parent,fromOpportunity:best.dop,toOpportunity:best.t.op,gain:best.gain,fromScore:Number(best.d.score)||0,toScore:Number(best.t.c.score)||0});swaps++;}\n  const finalParentCount=new Map();for(const c of chosen){const p=point16836(c);if(p)finalParentCount.set(p.parent,(finalParentCount.get(p.parent)||0)+1);}\n  window.EARTHLINE_OPPORTUNITY_BALANCE_16836={build:'EARTHLINE 16836 DIAGNOSTIC',maxSwaps:maxSwaps16836,minGain:minGain16836,swaps,rows,chosenCount:chosen.length,maxParentCount:Math.max(0,...finalParentCount.values()),rule:'replace unique low-opportunity occupied 12x12 cell with empty materially higher-opportunity candidate cell; preserve total count, occupied-cell count, and cross-parent max-3 cap'};\n})();\n`;
  return body.replace(capture,patch+'window.__EARTHLINE_M47_16836={hy,candidates,chosen};'+capture);
}

const browser=await chromium.launch({headless:true});
const results=[];
for(const state of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document') return route.continue();
    const resp=await route.fetch(); let body=await resp.text(); body=patchBalance6(body);
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });
  const page=await context.newPage(); const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false; const started=Date.now();
  try{
    await page.goto(BASE+`?m47_16836=${encodeURIComponent(state)}_${Date.now()}`,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(S=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=S;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return /screening published\./i.test(s)&&!!window.__EARTHLINE_M47_16836;},null,{timeout:65000,polling:100});}catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}
  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M47_16836,N=12;
    const cellOf=c=>{const gx=Number.isFinite(Number(c?.coverageGX16775))?Number(c.coverageGX16775):Number(c?.x),gy=Number.isFinite(Number(c?.coverageGY16775))?Number(c.coverageGY16775):Number(c?.y);if(!Number.isFinite(gx)||!Number.isFinite(gy))return null;return [Math.max(0,Math.min(N-1,Math.floor(gx*N/Math.max(1,hy.w)))),Math.max(0,Math.min(N-1,Math.floor(gy*N/Math.max(1,hy.h))))];};
    const cand=new Map(),sel=new Map();for(const c of candidates){const p=cellOf(c);if(p){const k=p.join(',');cand.set(k,(cand.get(k)||0)+1);}}for(const c of chosen){const p=cellOf(c);if(p){const k=p.join(',');sel.set(k,(sel.get(k)||0)+1);}}
    let highEmpty=0;for(let by=0;by<N;by++)for(let bx=0;bx<N;bx++){let valid=0,opp=0,pref=0;const x0=Math.floor(bx*hy.w/N),x1=Math.min(hy.w,Math.ceil((bx+1)*hy.w/N)),y0=Math.floor(by*hy.h/N),y1=Math.min(hy.h,Math.ceil((by+1)*hy.h/N));for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;valid++;const sp=Number(hy.slope[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4){opp++;if(sp>=.25&&sp<=3.5)pref++;}}const k=bx+','+by,opportunity=valid?(.35*(opp/valid)+.65*(pref/valid)):0;if((cand.get(k)||0)>0&&(sel.get(k)||0)===0&&opportunity>=.55)highEmpty++;}
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    return {totalCandidates:candidates.length,totalChosen:chosen.length,generated:pub?.generated??null,visible:disp?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip?.swales??null,coreMs:perf?.totalMs??null,highEmpty,balance:window.EARTHLINE_OPPORTUNITY_BALANCE_16836||null};
  });
  const containmentOK=!!audit&&(audit.outside===0||audit.outside==null);
  const arSpatialOK=state!=='Arkansas'||audit?.highEmpty===0;
  const gate=!!audit&&!loadError&&!timedOut&&pageErrors.length===0&&audit.generated===audit.visible&&audit.unsafe===0&&containmentOK&&Number(audit.coreMs)<=15000&&audit.balance?.maxParentCount<=3&&arSpatialOK;
  const result={state,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,gate}; results.push(result);
  console.log('EARTHLINE_M47_16836 '+JSON.stringify(result));
  try{if(state==='Arkansas'||state==='Texas')await page.screenshot({path:`${OUT}/${state.toLowerCase()}.png`,fullPage:false});}catch(_){}
  await context.close();
}
writeFileSync(`${OUT}/results.json`,JSON.stringify(results,null,2));
writeFileSync(`${OUT}/summary.json`,JSON.stringify({passed:results.filter(r=>r.gate).length,failed:results.filter(r=>!r.gate).map(r=>r.state),maxCoreMs:Math.max(...results.map(r=>Number(r.audit?.coreMs)||0)),arkansas:results.find(r=>r.state==='Arkansas')||null,states:results.map(r=>({state:r.state,gate:r.gate,coreMs:r.audit?.coreMs,generated:r.audit?.generated,visible:r.audit?.visible,unsafe:r.audit?.unsafe,outside:r.audit?.outside,highEmpty:r.audit?.highEmpty,swaps:r.audit?.balance?.swaps,maxParentCount:r.audit?.balance?.maxParentCount,pageErrors:r.pageErrors.length}))},null,2));
await browser.close();
if(results.some(r=>!r.gate))process.exitCode=1;
