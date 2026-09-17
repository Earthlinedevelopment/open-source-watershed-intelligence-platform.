import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const thresholds=[10,8,6,4];
const results=[];

function zoneCount(features,pred){
  let n=0;
  for(const f of features||[]){
    const c=f?.geometry?.coordinates||[];
    if(!Array.isArray(c)||!c.length)continue;
    const m=c[Math.floor((c.length-1)/2)];
    if(Array.isArray(m)&&pred(+m[0],+m[1]))n++;
  }
  return n;
}

for(const threshold of thresholds){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patch1=0,patch2=0;
  if(threshold!==10){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch();
      let text=await resp.text();
      const n1='if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;';
      const r1=`if(segment.length<10||lineLengthPixels(hy,segment)<(focusMode?10:${threshold}))return null;`;
      const n2='if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<10){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}';
      const r2=`if(!segment16539||segment16539.length<2||lineLengthPixels(hy,segment16539)<(focusMode?10:${threshold})){if(candidate16539)jurisdictionScreenCache16592.set(candidate16539,null);return null;}`;
      patch1=text.split(n1).length-1; patch2=text.split(n2).length-1;
      text=text.split(n1).join(r1).split(n2).join(r2);
      return route.fulfill({response:resp,body:text});
    });
  }
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const ct=Array.isArray(v?.contours?.features)?v.contours.features:[];
    const fl=Array.isArray(v?.flows?.features)?v.flows.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=(list,pred)=>list.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const zones={
      panhandleNorth:count(sw,(x,y)=>x>-103.1&&x<-100&&y>35.0&&y<36.6),
      panhandleWestNM:count(sw,(x,y)=>x>-103.2&&x<-102.0&&y>31.8&&y<36.6),
      upperCoast:count(sw,(x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),
      midCoast:count(sw,(x,y)=>x>-99.3&&x<-96.0&&y>27.4&&y<30.2),
      lowerCoast:count(sw,(x,y)=>x>-99.5&&x<-97.0&&y>25.7&&y<28.2),
      eastInterior:count(sw,(x,y)=>x>-96.0&&x<-93.45&&y>30.5&&y<34.3)
    };
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const land=window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16584||window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16583||null;
    return {swales:sw.length,contours:ct.length,flows:fl.length,zones,generation:gen,boundary,land,performance:perf,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
  });
  const row={threshold,patch1,patch2,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,20)};
  results.push(row);
  console.log('EARTHLINE_TX_LENGTH_THRESHOLD '+JSON.stringify(row));
  await page.close();
}

console.log('EARTHLINE_TX_LENGTH_THRESHOLD_SUMMARY '+JSON.stringify(results.map(r=>({threshold:r.threshold,patch1:r.patch1,patch2:r.patch2,timedOut:r.timedOut,swales:r.state.swales,zones:r.state.zones,generated:r.state.generation?.publishedFeatures??null,eligible:r.state.generation?.jurisdictionEligibleCandidates??null,outsideAfterClip:r.state.boundary?.outsideAfterClip??null,unsafe:r.state.land?.unsafeDisplayedSegments??r.state.land?.unsafeSegments??null,totalMs:r.state.performance?.totalMs??null,lastError:r.state.lastError,errors:r.errors.length}))));
await browser.close();
if(results.some(r=>r.timedOut||r.state.lastError||(r.threshold!==10&&(r.patch1<1||r.patch2<1))))process.exitCode=1;
