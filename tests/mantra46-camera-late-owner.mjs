import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const CASES=['Iowa','Arkansas'];
const OUT='artifacts/mantra46-camera-late-owner';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const all=[];

for(const query of CASES){
  const context=await browser.newContext({viewport:{width:1920,height:1080}});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));

  await page.goto(BASE+'?m46_camera_trace='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});

  const installed=await page.evaluate(()=>{
    const map=window.earthlineMap;
    if(!map) return {ok:false,reason:'earthlineMap missing'};
    window.__M46_CAMERA_CALLS__=[];
    window.__M46_CAMERA_T0__=performance.now();
    const methods=['flyTo','easeTo','jumpTo','setCenter','fitBounds','setZoom'];
    for(const name of methods){
      const orig=map[name];
      if(typeof orig!=='function') continue;
      map[name]=function(...args){
        let safeArgs;
        try{safeArgs=JSON.parse(JSON.stringify(args));}catch(_){safeArgs=args.map(String);}
        window.__M46_CAMERA_CALLS__.push({
          t:Math.round(performance.now()-window.__M46_CAMERA_T0__),
          name,
          args:safeArgs,
          center:(()=>{try{const c=map.getCenter();return {lng:c.lng,lat:c.lat,zoom:map.getZoom()};}catch(_){return null}})(),
          stack:String(new Error('camera-call').stack||'').split('\n').slice(0,10)
        });
        return orig.apply(this,args);
      };
    }
    return {ok:true};
  });

  await page.evaluate(q=>{
    const i=document.getElementById('searchInput');
    const b=document.getElementById('runBtn');
    i.value=q;
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  },query);

  let published=false;
  try{
    await page.waitForFunction(q=>{
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
      return /screening published\./i.test(s)&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
    },query,{timeout:50000,polling:100});
    published=true;
  }catch(_){}

  const samples=[];
  const sample=async label=>{
    const s=await page.evaluate(()=>({
      now:Math.round(performance.now()-(window.__M46_CAMERA_T0__||performance.now())),
      center:(()=>{try{const c=earthlineMap.getCenter();return {lng:c.lng,lat:c.lat,zoom:earthlineMap.getZoom()};}catch(_){return null}})(),
      crosshair:(()=>{try{
        const els=[...document.querySelectorAll('button,div,span')];
        const e=els.find(x=>/CROSSHAIR\s*[·•]/i.test(String(x.textContent||'')));
        return e?String(e.textContent).replace(/\s+/g,' ').trim().slice(0,180):null;
      }catch(_){return null}})(),
      Mloc:window.M?.loc?{lng:M.loc.lng,lat:M.loc.lat,name:M.loc.name,placeType:M.loc.placeType}:null,
      Mcenter:window.M?{centerLng:M.centerLng,centerLat:M.centerLat,viewZoom:M.viewZoom}:null,
      pkg:(()=>{const p=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556;return p?{name:p.identity?.name,center:p.center,location:p.location}:null})(),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').replace(/\s+/g,' ').trim().slice(0,300),
      calls:(window.__M46_CAMERA_CALLS__||[]).slice()
    }));
    samples.push({label,...s});
  };

  await sample('publish');
  await page.screenshot({path:`${OUT}/${query.toLowerCase()}-publish.png`,fullPage:false});
  for(const [ms,label] of [[250,'+250ms'],[250,'+500ms'],[500,'+1s'],[1000,'+2s'],[2000,'+4s'],[3000,'+7s']]){
    await page.waitForTimeout(ms);
    await sample(label);
    if(['+1s','+2s','+4s','+7s'].includes(label)){
      await page.screenshot({path:`${OUT}/${query.toLowerCase()}-${label.replace('+','').replace('s','s')}.png`,fullPage:false});
    }
  }

  const finalCalls=await page.evaluate(()=>window.__M46_CAMERA_CALLS__||[]);
  const row={query,installed,published,pageErrors,samples,finalCalls};
  all.push(row);
  console.log('EARTHLINE_M46_CAMERA_TRACE '+JSON.stringify({
    query,published,pageErrors,
    samples:samples.map(x=>({label:x.label,center:x.center,crosshair:x.crosshair,Mloc:x.Mloc,Mcenter:x.Mcenter,pkg:x.pkg,status:x.status})),
    calls:finalCalls
  }));
  await context.close();
}

await browser.close();
writeFileSync(`${OUT}/trace.json`,JSON.stringify(all,null,2));
