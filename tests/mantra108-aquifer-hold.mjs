import {chromium} from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Diagnostic only. Candidate assets are served from the exact PR checkout.
const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const html=readFileSync(path.join(ROOT,'index.html'));
const hash=createHash('sha256').update(html).digest('hex');
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1600,height:950}});
const page=await ctx.newPage();
const errors=[],rows=[];
page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.origin!==new URL(BASE).origin)return route.continue();
  let rel;
  try{rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
  const local=path.resolve(ROOT,rel);
  if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
  if(!existsSync(local)||!statSync(local).isFile())return route.abort();
  const ext=path.extname(local).toLowerCase();
  const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.css':'text/css'};
  return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(local)});
});
try{
  await page.goto(BASE+'?m108_hold='+Date.now(),{waitUntil:'domcontentloaded',timeout:55000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,null,{timeout:55000,polling:200});
  for(let run=1;run<=2;run++){
    const prepared=await page.evaluate(async target=>{
      const site=window.earthlineSelectedSiteFromCenter?.(M?.loc||null,target.lng,target.lat,20);
      if(!site)return {ok:false,reason:'site not resolved'};
      const applied=await window.applyLocation?.(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
      if(!applied)return {ok:false,reason:'applyLocation failed'};
      await new Promise(resolve=>setTimeout(resolve,750));
      const set=window.earthlineSetPropertyTarget16201?.({lng:target.lng,lat:target.lat,source:'mantra108-control'},{openPanel:false});
      return {ok:!!set,searchGen:Number(M?.searchGen||0)};
    },TARGET);
    if(!prepared?.ok){rows.push({run,prepared,pass:false});break}
    let runError=null;
    try{await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169?.())}catch(e){runError=String(e)}
    try{
      await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&document.documentElement.dataset.earthlinePropertyRunState!=='running',null,{timeout:50000,polling:150});
    }catch(e){runError=String(runError||e)}
    const samples=await page.evaluate(async ()=>{
      const snap=()=>{
        const overlay=document.getElementById('earthlineAquiferTopText16501');
        const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
        const ids=['earthline-aquifers-label','earthline-aquifer-label-points-layer-15788','earthline-aquifer-evidence-label-16398'];
        const native=Object.fromEntries(ids.map(id=>{
          try{return [id,map?.getLayer?.(id)?map.getLayoutProperty(id,'visibility')||'visible':'missing']}catch(e){return [id,'error']}
        }));
        const published=M?.propertyPublication15816||{};
        const state=window.earthlineRegional15778||{};
        const summary=M?.vtGroundwaterSummaryPoint16398;
        let projected=null;
        try{
          const pt=summary&&map?.project?.([Number(summary.lng),Number(summary.lat)]);
          if(pt)projected={x:pt.x,y:pt.y};
        }catch(_){}
        const host=document.querySelector('.map-area');
        return {
          display:overlay?.style.display||'',computed:overlay?getComputedStyle(overlay).display:null,
          children:overlay?.childElementCount||0,
          evidence:!!(summary||(M?.usgsAquifers||[]).length),
          committed:published.committed===true,rawSegments:Number(published.rawGeographicSegments||0),
          hold:!!state.propertyAquiferHold16359,validationView:state.validationView15806,
          aquiferLayerOn:M?.layers?.usgsAquifer?.on,mapLoaded:map?.loaded?.(),
          cameraMoving:map?.isMoving?.(),zoom:map?.getZoom?.(),
          screen:{w:host?.clientWidth,h:host?.clientHeight},projected,
          modelMode:String(state.mode||''),
          native
        };
      };
      const series=[snap()];
      for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,150));series.push(snap())}
      return series;
    });
    const eligible=samples.every(s=>s.committed&&!s.hold&&s.modelMode==='property'&&s.evidence);
    const flicker=samples.some(s=>s.display!=='block'||s.computed!=='block'||s.children<1);
    const nativeOn=samples.some(s=>Object.values(s.native).some(v=>v==='visible'));
    const first=samples[0],last=samples.at(-1);
    const row={run,prepared,runError,eligible,flicker,nativeOn,first,last,
      transitions:samples.filter((s,i)=>i>0&&(s.display!==samples[i-1].display||s.children!==samples[i-1].children)).map(s=>({display:s.display,children:s.children,committed:s.committed,hold:s.hold})),
      pass:!runError&&eligible&&!flicker&&!nativeOn};
    rows.push(row);
    console.log('EARTHLINE_M108_AQUIFER_HOLD '+JSON.stringify(row));
    await page.screenshot({path:'artifacts/mantra108-aquifer/property-'+run+'.png'}).catch(()=>{});
  }
}catch(error){errors.push(String(error))}
await ctx.close();await browser.close();
const result={hash,rows,errors,pass:rows.length===2&&rows.every(r=>r.pass)&&errors.length===0};
mkdirSync('artifacts/mantra108-aquifer',{recursive:true});
writeFileSync('artifacts/mantra108-aquifer/results.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_M108_SUMMARY '+JSON.stringify({hash,pass:result.pass,errors,rows:rows.map(x=>({run:x.run,pass:x.pass,eligible:x.eligible,flicker:x.flicker,nativeOn:x.nativeOn,runError:x.runError,first:x.first,last:x.last}))}));
if(!result.pass)process.exitCode=1;
