import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});

const sourceEvidence=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;
  const snippets=needle=>{const out=[];let at=0;while((at=src.indexOf(needle,at))>=0&&out.length<8){out.push(src.slice(Math.max(0,at-2200),Math.min(src.length,at+2600)));at+=needle.length;}return out;};
  return {
    verifierZero:snippets('corridor rendering incomplete:'),
    verifierLabel:snippets('regional corridor-label publication incomplete:'),
    mappedAquifer:snippets('MAPPED AQUIFER'),
    sanLuis:snippets('San Luis'),
    drawAquifer:typeof window.drawUSGSAquifers==='function'?String(window.drawUSGSAquifers).slice(0,16000):null,
    fetchAquifer:typeof window.fetchUSGSAquifersLegacy16397==='function'?String(window.fetchUSGSAquifersLegacy16397).slice(0,18000):null,
    inheritAquifer:typeof window.earthlineInheritRegionalAquiferContext16334==='function'?String(window.earthlineInheritRegionalAquiferContext16334).slice(0,12000):null
  };
});

await page.evaluate(()=>{
  window.__TX_STACK=[];
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const cam=()=>{const c=mp?.getCenter?.();return {z:Number(mp?.getZoom?.()||0),c:c?{lng:Number(c.lng),lat:Number(c.lat)}:null};};
  for(const method of ['jumpTo','fitBounds','flyTo','easeTo']){const base=mp?.[method];if(typeof base!=='function')continue;mp[method]=function(...args){window.__TX_STACK.push({method,t:performance.now(),before:cam(),args:JSON.stringify(args).slice(0,900),stack:String(new Error().stack||'').slice(0,2600)});return base.apply(this,args)};}
});
const t0=Date.now();await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
try{await page.waitForFunction(()=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,a=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329;return !!e||a?.passed===true;},null,{timeout:38000,polling:200});}catch(_){}
await page.waitForTimeout(1200);
const result=await page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),m=(typeof M!=='undefined'&&M)||null,c=mp?.getCenter?.();
  const polys=(m?.usgsAquifers||[]).map((p,i)=>{const pts=(p?.lngLatPts||[]).filter(x=>Array.isArray(x)&&Number.isFinite(+x[0])&&Number.isFinite(+x[1]));let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const q of pts){minX=Math.min(minX,+q[0]);maxX=Math.max(maxX,+q[0]);minY=Math.min(minY,+q[1]);maxY=Math.max(maxY,+q[1]);}return {i,name:String(p?.name||''),source:String(p?.source||''),aquiferType:String(p?.aquiferType||''),points:pts.length,bbox:Number.isFinite(minX)?[minX,minY,maxX,maxY]:null};});
  const src=mp?.getSource?.('earthline-aquifers');let native=[];try{native=(src?._data?.features||[]).map(f=>({name:String(f?.properties?.name||''),kind:String(f?.properties?.featureKind||''),type:f?.geometry?.type||''}));}catch(_){}
  return {elapsedMs:Date.now()-performance.timeOrigin,center:c?{lng:+c.lng,lat:+c.lat}:null,zoom:+(mp?.getZoom?.()||0),runError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,corridorAudit:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,stack:window.__TX_STACK||[],usgsAquifers:polys,nativeAquiferFeatures:native,atomic:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556?{profileId:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556.profileId,bbox:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556.bbox,center:window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556.center}:null};
});
console.log('MANTRA38_TEXAS_CALLSITES '+JSON.stringify({wallMs:Date.now()-t0,sourceEvidence,result,errors:errors.slice(0,20)}));
await browser.close();
