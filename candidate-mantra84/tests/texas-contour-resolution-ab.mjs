import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

async function run(label,patch){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patchCount=0;
  if(patch){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch(),text=await resp.text();
      const needle='step=niceInterval(range,20),levels=[];';
      patchCount=text.split(needle).length-1;
      return route.fulfill({response:resp,body:text.split(needle).join('step=niceInterval(range,40),levels=[];')});
    });
  }
  const started=Date.now();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_VISUAL_DATA_16020&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);},{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(350);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[],ct=Array.isArray(v?.contours?.features)?v.contours.features:[];
    function mid(f){const c=f?.geometry?.coordinates||[];if(!c.length)return null;const x=c[Math.floor((c.length-1)/2)];return Array.isArray(x)&&Number.isFinite(+x[0])&&Number.isFinite(+x[1])?[+x[0],+x[1]]:null;}
    const countRegion=(list,pred)=>list.reduce((n,f)=>{const m=mid(f);return n+(m&&pred(m[0],m[1])?1:0);},0);
    const elevs=[...new Set(ct.map(f=>Number(f?.properties?.elevation_m??f?.properties?.elevation??NaN)).filter(Number.isFinite))].sort((a,b)=>a-b);
    const land=window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16584||window.EARTHLINE_REGIONAL_LAND_VALIDITY_AUDIT_16583||null;
    return {
      totalMs:Number(p?.totalMs||NaN),generation:g,
      swales:{count:sw.length,eastTexas:countRegion(sw,(x,y)=>x>-96&&x<-93.45&&y>28.7&&y<33.1),eastOf96:countRegion(sw,x=>x>-96)},
      contours:{count:ct.length,eastTexas:countRegion(ct,(x,y)=>x>-96&&x<-93.45&&y>28.7&&y<33.1),uniqueElevationCount:elevs.length,elevations:elevs.slice(0,60)},
      land,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    };
  });
  const result={label,patchCount,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,20)};
  console.log('EARTHLINE_TX_CONTOUR_AB '+JSON.stringify(result));
  await page.close();return result;
}

const baseline=await run('baseline-20',false);
const finer=await run('finer-40',true);
await browser.close();
if(baseline.timedOut||finer.timedOut||finer.patchCount<1||baseline.state.lastError||finer.state.lastError)process.exitCode=1;
