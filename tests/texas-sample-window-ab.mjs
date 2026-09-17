import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(label,wide){
  const page=await browser.newPage({viewport:{width:1700,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patchCount=0;
  if(wide){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch(),text=await resp.text();
      const needle='const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18)))';
      patchCount=text.split(needle).length-1;
      return route.fulfill({response:resp,body:patchCount?text.split(needle).join('const half=Math.max(10,Math.min(52,Math.floor(coords.length*.50)))'):text});
    });
  }
  const start=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020);},{timeout:35000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||{},sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const regions={
      panhandleNorth:(x,y)=>x>=-103.05&&x<=-100&&y>=35.4&&y<=36.55,
      panhandleWestNM:(x,y)=>x>=-103.15&&x<=-102.45&&y>=34&&y<=36.55,
      upperCoast:(x,y)=>x>-96.2&&x<-93.45&&y>28.4&&y<30.7,
      midCoast:(x,y)=>x>-98.2&&x<=-96.2&&y>26.6&&y<29.7,
      lowerCoast:(x,y)=>x>-98.8&&x<-96.5&&y>25.75&&y<=27.6,
      eastInterior:(x,y)=>x>-96&&x<-93.45&&y>=30.7&&y<33.1
    };
    const midpoint=f=>{const c=f?.geometry?.coordinates||[];if(!c.length)return null;const p=c[Math.floor((c.length-1)/2)];return Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])?[+p[0],+p[1]]:null;};
    const counts={};for(const [k,pred] of Object.entries(regions))counts[k]=sw.reduce((n,f)=>{const p=midpoint(f);return n+(p&&pred(p[0],p[1])?1:0);},0);
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    return {swales:sw.length,counts,generation:g?{candidates:g.candidates,preferredEligible:g.preferredJurisdictionEligibleCandidates,eligible:g.jurisdictionEligibleCandidates,rejected:g.jurisdictionRejectedCandidates,chosen:g.chosenBeforeTierGate,published:g.publishedFeatures}:null,boundary:b?{before:b.before,after:b.after,outsideAfterClip:b.outsideAfterClip,removed:b.removed}:null,performance:p,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
  });
  const result={label,wide,patchCount,elapsedMs:Date.now()-start,timedOut,state,errors:errors.slice(0,20)};
  console.log('EARTHLINE_TX_WINDOW_AB '+JSON.stringify(result));
  await page.close();return result;
}

const baseline=await run('baseline-18pct',false);
const wide=await run('wide-50pct',true);
console.log('EARTHLINE_TX_WINDOW_AB_SUMMARY '+JSON.stringify({baseline:{elapsedMs:baseline.elapsedMs,state:baseline.state},wide:{elapsedMs:wide.elapsedMs,state:wide.state},patchCount:wide.patchCount}));
await browser.close();
if(baseline.timedOut||wide.timedOut||wide.patchCount!==1||baseline.state.lastError||wide.state.lastError)process.exitCode=1;
