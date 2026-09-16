import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const ATTEMPTS=4;
const browser=await chromium.launch({headless:true});
const results=[];
const errors=[];

for(let attempt=1;attempt<=ATTEMPTS;attempt++){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  page.on('pageerror',e=>errors.push({attempt,type:'pageerror',message:String(e)}));
  page.on('console',m=>{if(m.type()==='error')errors.push({attempt,type:'console',message:m.text()})});
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timeout=false;
  try{
    await page.waitForFunction(()=>{
      const r=window.earthlineRegional15778||{},p=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||{},e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const tx=String(p.query||'').toLowerCase().includes('texas');
      return tx&&(!r.active||!!e)&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
    },null,{timeout:28000,polling:150});
  }catch(_){timeout=true;}
  await page.waitForTimeout(1800);
  const snap=await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'&&M)||{},r=window.earthlineRegional15778||{};
    const c=mp?.getCenter?.();
    const aq=(m.usgsAquifers||[]).map((p,i)=>{const pts=(p?.lngLatPts||[]).filter(q=>Array.isArray(q)&&Number.isFinite(+q[0])&&Number.isFinite(+q[1]));let w=Infinity,s=Infinity,e=-Infinity,n=-Infinity;for(const q of pts){w=Math.min(w,+q[0]);e=Math.max(e,+q[0]);s=Math.min(s,+q[1]);n=Math.max(n,+q[1]);}return {i,name:String(p?.name||''),type:String(p?.aquiferType||''),bbox:Number.isFinite(w)?[w,s,e,n]:null};});
    const dom=[...document.querySelectorAll('.earthline-aquifer-top-label-16501')].map(el=>({text:String(el.textContent||'').trim(),display:getComputedStyle(el).display,box:(()=>{const b=el.getBoundingClientRect();return {x:b.x,y:b.y,w:b.width,h:b.height}})()}));
    const labelLayers=(mp?.getStyle?.()?.layers||[]).filter(l=>/aquifer.*label|label.*aquifer/i.test(String(l.id||''))).map(l=>({id:l.id,source:l.source,visibility:l.layout?.visibility||'visible'}));
    const rendered=[];for(const l of labelLayers){let fs=[];try{fs=mp.queryRenderedFeatures(undefined,{layers:[l.id]})||[]}catch(_){}if(fs.length)rendered.push({id:l.id,count:fs.length,examples:fs.slice(0,20).map(f=>({text:String(f.properties?.label||f.properties?.name||''),coords:f.geometry?.type==='Point'?f.geometry.coordinates:null,props:f.properties||{}}))});}
    const statePackage=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const mBoundaryKeys={};for(const k of Object.keys(m)){if(!/bound|juris|state|admin|region|profile/i.test(k))continue;const v=m[k];try{mBoundaryKeys[k]=typeof v==='object'?JSON.parse(JSON.stringify(v)):v}catch(_){}if(Object.keys(mBoundaryKeys).length>=40)break;}
    const wBoundaryKeys={};for(const k of Object.keys(window)){if(!/bound|juris|state.*165|atomic.*state|profile.*165/i.test(k))continue;const v=window[k];if(typeof v==='function')continue;try{wBoundaryKeys[k]=typeof v==='object'?JSON.parse(JSON.stringify(v)):v}catch(_){}if(Object.keys(wBoundaryKeys).length>=50)break;}
    return {
      loc:{name:String(m?.loc?.name||''),fullName:String(m?.loc?.fullName||'')},
      center:c?{lng:+c.lng,lat:+c.lat}:null,zoom:+(mp?.getZoom?.()||0),regionalActive:!!r.active,
      preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,
      cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,
      runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
      corridor:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      aquifers:aq,domAquiferLabels:dom,labelLayers,renderedAquiferLabels:rendered,
      statePackage,statePackageKeys:statePackage?Object.keys(statePackage):[],mBoundaryKeys,wBoundaryKeys
    };
  });
  const elapsedMs=Date.now()-started;
  const obviousOutside=(snap.aquifers||[]).filter(a=>a.bbox&&(a.bbox[3]>36.6||a.bbox[0]<-106.75||a.bbox[2]>-93.45||a.bbox[1]<25.7));
  const badNamed=[...(snap.domAquiferLabels||[]).map(x=>x.text),...(snap.renderedAquiferLabels||[]).flatMap(x=>x.examples.map(e=>e.text))].filter(t=>/san luis|two buttes/i.test(t));
  const cameraOk=!!snap.center&&snap.center.lng<-93&&snap.center.lng>-108&&snap.center.lat>24&&snap.center.lat<38&&snap.zoom>4;
  const renderOk=Number(snap.display?.swaleLines||0)>0&&Number(snap.display?.swaleGradeLabels||0)>0&&!snap.runError;
  results.push({attempt,elapsedMs,timeout,cameraOk,renderOk,obviousOutside,badNamed,snap});
  await page.close();
}

const cameraPass=results.every(r=>r.cameraOk);
const rendererPass=results.every(r=>r.renderOk);
const leakFree=results.every(r=>r.obviousOutside.length===0&&r.badNamed.length===0);
const report={test:'Texas staged owner repairs',url:URL,attempts:ATTEMPTS,cameraPass,rendererPass,leakFree,pass:cameraPass&&rendererPass&&leakFree,results,errors:errors.slice(0,40)};
console.log('MANTRA38_TEXAS_CANDIDATE '+JSON.stringify(report));
await browser.close();
if(!report.pass)process.exitCode=1;
