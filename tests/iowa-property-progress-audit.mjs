import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGET={lat:41.95715,lng:-93.38977};
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?iowa-property-progress='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(850);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(200);
await page.locator('#runBtn').click({force:true});
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:90000,polling:200});

await page.evaluate(({lat,lng})=>{
  const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(typeof M!=='undefined'&&M){
    M.centerLat=lat;M.centerLng=lng;
    M.loc=Object.assign({},M.loc||{},{name:'Iowa Property Progress',lat,lng,countryCode:'us',query:'Iowa'});
  }
  try{mp?.jumpTo?.({center:[lng,lat],zoom:17});}catch(_){}
},TARGET);
await page.waitForTimeout(900);

const btn=page.locator('#earthlineDeclareProperty16169');
const start=Date.now();
if(await btn.count()) await btn.click({force:true});
else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

async function sample(){
  return await page.evaluate(()=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const md=(typeof M!=='undefined'?M:null);
    const style=mp?.getStyle?.()||{};
    const relevant=(style.layers||[]).map(l=>l.id).filter(id=>/tree|elder|plant|canopy|forest|swale|safe/i.test(String(id||'')));
    const layerRows=relevant.map(id=>{
      let visibility=null,rendered=null,source=null;
      try{
        const l=mp.getLayer(id); source=l?.source||null;
        visibility=mp.getLayoutProperty(id,'visibility')||'visible';
        const cv=mp.getCanvas?.(),box=cv&&[[0,0],[cv.clientWidth||cv.width,cv.clientHeight||cv.height]];
        rendered=box?(mp.queryRenderedFeatures(box,{layers:[id]})||[]).length:null;
      }catch(_){}
      return {id,source,visibility,rendered};
    });
    const sources={};
    for(const id of [...new Set(layerRows.map(x=>x.source).filter(Boolean))]){
      try{
        const src=mp.getSource(id),data=src&&(src._data||src._options?.data);
        sources[id]=Array.isArray(data?.features)?data.features.length:null;
      }catch(_){sources[id]=null}
    }
    const shallow=(v)=>{
      if(!v||typeof v!=='object')return v;
      try{return JSON.parse(JSON.stringify(v))}catch(_){return null}
    };
    return {
      runState:document.documentElement.dataset.earthlinePropertyRunState||'',
      htmlRunning:document.documentElement.classList.contains('earthline-property-running-16233'),
      declareBusy:document.getElementById('earthlineDeclareProperty16169')?.getAttribute('aria-busy')||null,
      audit:shallow(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null),
      phaseTrace:shallow(window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null),
      publication:shallow(window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null),
      safeVisibility:shallow(window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null),
      elder:shallow(window.EARTHLINE_ELDER_AUDIT_17097||window.EARTHLINE_ELDER_RENDER_AUDIT_17097||null),
      currentStage:md?.currentStage||window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178?.stage||null,
      swaleSubstage:shallow(md?.swaleSubstage16321||null),
      terrainHandoff:shallow(md?.terrainHandoff15791||null),
      swaleStage:shallow(md?.swaleDiagnostics?.stage||null),
      flowFirst:shallow(md?.flowFirstAudit15836||null),
      swaleCount:Array.isArray(md?.swales)?md.swales.length:null,
      authoritativeCount:Array.isArray(md?.authoritativeSafeSwales15815?.features)?md.authoritativeSafeSwales15815.features.length:
        (Array.isArray(md?.authoritativeSafeSwales15806?.features)?md.authoritativeSafeSwales15806.features.length:null),
      layerRows,sources,
      domTrees:document.querySelectorAll('.earthline-swale-tree-crown-16174').length,
      domCanopy:document.querySelectorAll('.earthline-swale-canopy-16174').length
    };
  });
}

const samples=[];
for(let i=0;i<=15;i++){
  const row=await sample();
  samples.push({tMs:Date.now()-start,...row});
  if(row.audit?.settled===true&&row.audit?.renderVerified===true)break;
  await page.waitForTimeout(2000);
}
await page.screenshot({path:'iowa-property-progress-audit.png',fullPage:false});
const out={target:TARGET,elapsedMs:Date.now()-start,samples,errors};
fs.writeFileSync('iowa-property-progress-audit.json',JSON.stringify(out,null,2));
console.log('EARTHLINE_IOWA_PROPERTY_PROGRESS '+JSON.stringify(out));
await browser.close();