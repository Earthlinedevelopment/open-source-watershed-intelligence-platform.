import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const h={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers:h});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await page.goto('http://127.0.0.1:8787/?iowa-regional-candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});
const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
const started=Date.now();
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
         document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:120000,polling:200});
await page.waitForTimeout(1200);
const diag=await page.evaluate(()=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const style=mp?.getStyle?.()||{};
  const ids=(style.layers||[]).filter(l=>/regional|swale|corridor/i.test(String(l.id||''))&&l.type==='line').map(l=>l.id);
  const visible=ids.filter(id=>{try{return (mp.getLayoutProperty(id,'visibility')||'visible')!=='none'}catch(_){return false}});
  const cv=mp?.getCanvas?.(); const w=cv?.clientWidth||cv?.width||0,h=cv?.clientHeight||cv?.height||0;
  let feats=[]; try{if(w&&h&&visible.length)feats=mp.queryRenderedFeatures([[0,0],[w,h]],{layers:visible})||[]}catch(_){}
  const q=[0,0,0,0];
  for(const f of feats){
    try{
      const g=f.geometry;
      const arr=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:[];
      for(const line of arr){
        if(!line?.length)continue;
        const p=line[Math.floor(line.length/2)];
        const px=mp.project({lng:p[0],lat:p[1]});
        const qi=(px.x>=w/2?1:0)+(px.y>=h/2?2:0);
        q[qi]++;
      }
    }catch(_){}
  }
  const treeLayers=(style.layers||[]).filter(l=>/tree|forest|canopy|vegetation/i.test(String(l.id||''))).map(l=>({
    id:l.id,visibility:(()=>{try{return mp.getLayoutProperty(l.id,'visibility')||'visible'}catch(_){return null}})()
  }));
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const m=(typeof M!=='undefined'?M:null);
  return {
    tier:d?.tier||d?.mode||null,
    layerIds:visible,
    renderedFeatures:feats.length,
    quadrants:q,
    regionalDiagnostics:m?.swaleDiagnostics||null,
    treeLayers,
    status:document.getElementById('status')?.textContent||'',
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')
  };
});
diag.elapsedMs=Date.now()-started;
diag.errors=errors;
fs.writeFileSync('iowa-regional-candidate.json',JSON.stringify(diag,null,2));
await page.screenshot({path:'iowa-regional-candidate.png',fullPage:false});
console.log('EARTHLINE_IOWA_REGIONAL_CANDIDATE '+JSON.stringify(diag));
await browser.close();