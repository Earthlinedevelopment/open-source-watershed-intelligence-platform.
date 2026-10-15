import { chromium, firefox, webkit } from 'playwright';

const BROWSER=(process.env.BROWSER||'webkit').toLowerCase();
const TYPE=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const QUERY=process.env.QUERY||'Arizona';
const browser=await TYPE.launch({headless:false});
const context=await browser.newContext({viewport:{width:1600,height:900}});
const page=await context.newPage();
const events=[];
page.on('pageerror',e=>events.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(['error','warning'].includes(m.type()))events.push({type:m.type(),message:m.text().slice(0,1000)});});
page.on('requestfailed',r=>events.push({type:'requestfailed',url:r.url(),failure:r.failure()?.errorText||''}));

await page.goto(URL+'?crossbrowser17238='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});

const pre=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');
  let webgl=false,webgl2=false;
  try{webgl=!!(canvas.getContext('webgl')||canvas.getContext('experimental-webgl'))}catch(_){}
  try{webgl2=!!canvas.getContext('webgl2')}catch(_){}
  const m=window.earthlineMap||null;
  return {
    ua:navigator.userAgent,
    webgl,webgl2,
    mapboxPresent:!!window.mapboxgl,
    mapboxVersion:window.mapboxgl?.version||null,
    mapboxSupported:typeof window.mapboxgl?.supported==='function'?window.mapboxgl.supported():null,
    earthlineMapPresent:!!m,
    mapReady:!!window.earthlineMapReady,
    loaded:m&&typeof m.loaded==='function'?m.loaded():null,
    styleLoaded:m&&typeof m.isStyleLoaded==='function'?m.isStyleLoaded():null,
    splash:window.earthlineStartupSplashAudit16171?.()||null
  };
});
console.log('PRE '+JSON.stringify(pre));

await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},QUERY);

for(const ms of [5000,15000,30000,60000]){
  await page.waitForTimeout(ms-(globalThis.__last||0)); globalThis.__last=ms;
  const s=await page.evaluate(()=>{
    const M0=typeof M!=='undefined'?M:null;
    const m=window.earthlineMap||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    return {
      loc:M0?.loc||null,searchGen:M0?.searchGen||null,
      displayed:d,
      regional:window.earthlineRegional15778||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      pub,disp,
      coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
      atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null,
      mapReady:!!window.earthlineMapReady,
      mapLoadError:window.earthlineMapLoadError,
      mapLoaded:m&&typeof m.loaded==='function'?m.loaded():null,
      styleLoaded:m&&typeof m.isStyleLoaded==='function'?m.isStyleLoaded():null,
      splash:window.earthlineStartupSplashAudit16171?.()||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
    };
  });
  console.log('SNAP '+ms+' '+JSON.stringify(s));
}
console.log('EVENTS '+JSON.stringify(events.slice(0,100)));
await browser.close();
