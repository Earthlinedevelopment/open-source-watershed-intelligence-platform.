import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const STATES=['Texas','Colorado','New Mexico','New York','Vermont'];
const browser=await chromium.launch({headless:true});
const results=[];

async function run(state,mode){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patchCount=0;
  if(mode==='finer40'){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch(), text=await resp.text();
      const needle='step=niceInterval(range,20),levels=[];';
      patchCount=text.split(needle).length-1;
      return route.fulfill({response:resp,body:text.split(needle).join('step=niceInterval(range,40),levels=[];')});
    });
  }
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(state=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=state;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
  let timedOut=false;
  try{await page.waitForFunction(state=>{const m=typeof M!=='undefined'?M:null;const ident=String(m?.loc?.name||'')+' '+String(m?.loc?.fullName||'');const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(new RegExp(state.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i').test(ident)&&/screening published\./i.test(status)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},state,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  const snap=await page.evaluate(state=>{
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const q=c[Math.floor((c.length-1)/2)];return Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1])?[+q[0],+q[1]]:null;};
    const eastTexas=state==='Texas'?sw.reduce((n,f)=>{const m=mid(f);return n+(m&&m[0]>-96&&m[0]<-93.45&&m[1]>28.7&&m[1]<33.1?1:0);},0):null;
    return {loc:String(M?.loc?.name||''),grid:window.EARTHLINE_REGIONAL_TERRAIN_AUDIT_16191||window.EARTHLINE_REGIONAL_TERRAIN_AUDIT_16167||null,totalMs:Number(p?.totalMs||NaN),generation:g,boundary:b,visibleSwales:sw.length,eastTexas,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()};
  },state);
  const out={state,mode,patchCount,elapsedMs:Date.now()-started,timedOut,snap,errors:errors.slice(0,12)};
  console.log('EARTHLINE_SHARED_CONTOUR_MATRIX '+JSON.stringify(out));
  await page.close();return out;
}

for(const state of STATES){
  results.push(await run(state,'baseline20'));
  results.push(await run(state,'finer40'));
}
await browser.close();
const bad=results.some(r=>r.timedOut||r.snap?.lastError||(r.mode==='finer40'&&r.patchCount<1)||Number(r.snap?.boundary?.outsideAfterClip?.swales||0)!==0);
if(bad)process.exitCode=1;
