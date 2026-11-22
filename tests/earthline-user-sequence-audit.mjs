// Reproduces the founder's exact click path on the REAL public site and measures what is DRAWN (queryRenderedFeatures), not just what is computed.
// S0 control:  Property only on a fresh page.
// S1 finished: search "NEW YORK state" -> Run Analysis -> wait until Regional finishes -> move crosshair -> Property.
// S2 midrun:   search "NEW YORK state" -> Run Analysis -> after 15 s (Regional still running) -> move crosshair -> Property.
// Output: user-sequence-audit/<scenario>.json + .png, one summary line per scenario, results branch user-sequence-results.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync,readFileSync,existsSync} from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const CROSS=(process.env.EARTHLINE_CROSSHAIR||'-75.76995,42.78781').split(',').map(Number); // lng,lat
const QUERY=process.env.EARTHLINE_QUERY||'NEW YORK state';
const out='user-sequence-audit';mkdirSync(out,{recursive:true});
// Optional: test a CANDIDATE page before it goes live. EARTHLINE_INDEX_FILE=path/to/candidate/index.html is served in place of the live index.html (everything else stays real).
const INDEX_FILE=process.env.EARTHLINE_INDEX_FILE||'';
const CANDIDATE_HTML=INDEX_FILE&&existsSync(INDEX_FILE)?readFileSync(INDEX_FILE):null;
const ENGINE_FILE=process.env.EARTHLINE_ENGINE_FILE||'';   // optional: candidate earthline-property-swales.js served in place of the live one
const CANDIDATE_ENGINE=ENGINE_FILE&&existsSync(ENGINE_FILE)?readFileSync(ENGINE_FILE):null;
const EXPECT_R15=process.env.EARTHLINE_EXPECT_R15==='1';
if(INDEX_FILE&&!CANDIDATE_HTML){console.error('EARTHLINE_INDEX_FILE not found: '+INDEX_FILE);process.exit(2);}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({headless:true});
const results=[];

async function open(){
  const ctx=await browser.newContext({viewport:{width:1908,height:882}});
  if(CANDIDATE_HTML||CANDIDATE_ENGINE)await ctx.route('**/*',route=>{let u;try{u=new URL(route.request().url())}catch(_){return route.continue()}
    if(CANDIDATE_HTML&&u.origin===new URL(URL).origin&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')
      return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:CANDIDATE_HTML});
    if(CANDIDATE_ENGINE&&u.origin===new URL(URL).origin&&u.pathname.endsWith('/earthline-property-swales.js'))
      return route.fulfill({status:200,contentType:'application/javascript; charset=utf-8',body:CANDIDATE_ENGINE});
    return route.continue();});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push('PAGE:'+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE:'+m.text().slice(0,200));});
  await page.goto(URL+'?seq='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  await page.waitForFunction(()=>Boolean((typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap),null,{timeout:30000});
  await sleep(8000);
  return {ctx,page,errors};
}
async function typeAndRun(page,q){
  await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw Error('search box or Run button missing');
    i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
}
async function regionalDone(page,ms){const end=Date.now()+ms;
  while(Date.now()<end){const ok=await page.evaluate(()=>{const b=document.getElementById('runBtn');return !!b&&!/deriving|loading|running|analy/i.test(b.textContent||'');});if(ok)return true;await sleep(1000);}return false;}
async function moveCrosshair(page){
  await page.evaluate(c=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;m.jumpTo({center:c,zoom:16.42});m.fire('dragend');},CROSS);
  await sleep(5000);
}
async function pressProperty(page){
  const end=Date.now()+45000;
  while(Date.now()<end){
    const ok=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1;});
    if(ok){
      const at=await page.evaluate(()=>{const m=window.earthlineMap,c=m.getCenter(),b=document.getElementById('earthlineDeclareProperty16169');return {lat:c.lat,lng:c.lng,zoom:m.getZoom(),label:(b.textContent||'').replace(/\s+/g,' ').trim()};});
      let kind;try{await page.click('#earthlineDeclareProperty16169',{timeout:5000});kind='real click';}catch(_){await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169').click());kind='scripted click';}
      return {kind,atPress:at};
    }
    await sleep(500);
  }
  return {kind:'button never offered'};
}
// A real mouse drag on the map (fires the page's real dragstart/dragend), not a scripted jump.
async function realDrag(page){
  const box=await page.evaluate(()=>{const r=document.getElementById('mapboxBase')?.getBoundingClientRect()||document.querySelector('.mapboxgl-canvas').getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height};});
  const cx=box.x+box.w*0.7,cy=box.y+box.h*0.5;
  await page.mouse.move(cx,cy);await page.mouse.down();
  for(let i=1;i<=12;i++){await page.mouse.move(cx+i*3,cy+i*2);await sleep(25);}
  await page.mouse.up();await sleep(4000);
}
function distM(a,b){const R=6371000,t=Math.PI/180,dl=(b.lat-a.lat)*t,dn=(b.lng-a.lng)*t,x=Math.sin(dl/2)**2+Math.cos(a.lat*t)*Math.cos(b.lat*t)*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x));}
async function waitProperty(page,ms){
  const end=Date.now()+ms;
  while(Date.now()<end){
    const r=await page.evaluate(()=>{const de=document.documentElement;return {ready:!!(typeof M!=='undefined'&&M&&M.analysisReady&&de.dataset.earthlineAnalysisTier==='property'),state:String(de.dataset.earthlinePropertyRunState||'')};});
    if(r.ready&&r.state!=='running')return true;await sleep(1000);
  }
  return false;
}
async function measure(page){
  return await page.evaluate(()=>{
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap,de=document.documentElement;
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const layers=(map.getStyle().layers||[]);
    const rows=layers.filter(l=>/swale|bioswale|corridor|property-safe/i.test(l.id)).map(l=>{
      let vis=null,rendered=null;try{vis=map.getLayoutProperty(l.id,'visibility')||'visible';}catch(e){vis='err'}
      try{rendered=map.queryRenderedFeatures({layers:[l.id]}).length;}catch(e){rendered='err'}
      return {id:l.id,visibility:vis,rendered};
    });
    const eng=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600?.result?.()||null;
    let canopy=null;try{const feats=(eng&&Array.isArray(eng.features))?eng.features:[];let inC=0,tot=0;
      if(typeof canopyAt==='function'&&typeof earthlineLngLatToGrid==='function'){for(const f of feats)for(const c of (f.geometry&&f.geometry.coordinates)||[]){const g=earthlineLngLatToGrid(c[0],c[1]);tot++;if(canopyAt(g[0],g[1])>0.40)inC++;}}
      canopy={engineVersion:eng&&eng.engineVersion||null,points:tot,pointsInCanopy:inC,shareInCanopy:tot?+(inC/tot).toFixed(3):null,engineCanopy:eng&&eng.evidence&&eng.evidence.canopy||null};}catch(e){canopy={error:String(e).slice(0,120)};}
    const panel=[...document.querySelectorAll('#sidebar *, .sidebar *, aside *')].map(e=>e.children.length?'':(e.textContent||'').trim()).filter(t=>/swale|qualifying|unavailable|try again|exclusion|road and water|screening/i.test(t)).slice(0,12);
    return {
      tier:de.dataset.earthlineAnalysisTier||null,runState:de.dataset.earthlineRunState||null,propertyRunState:de.dataset.earthlinePropertyRunState||null,
      locName:m&&m.loc?String(m.loc.name||''):null,locZones:m&&m.loc?m.loc.zones||null:null,zone:m?m.zone:null,
      analysisReady:!!(m&&m.analysisReady),center:m?{lat:m.centerLat,lng:m.centerLng}:null,
      internalSwales:m&&Array.isArray(m.swales)?m.swales.length:null,
      layerSwalesOn:!!(m&&m.layers&&m.layers.swales&&m.layers.swales.on),
      engine:eng?{verified:eng.verified,code:eng.code||null,detail:eng.detail||null,engineSwales:eng.engineSwales,publishedSwales:eng.publishedSwales,message:eng.message||null,hash:eng.determinismHash||null,canopyEvidence:eng.evidence?.canopy||null}:null,
      halt:m?(m.prescriptionHalt15870||null):null,zeroReason:m?m.prescriptionZeroReason15870||null:null,propertyFailure:m?m.propertyRunFailure16539||null:null,
      canopy,renderedSwaleFeaturesTotal:rows.reduce((a,r)=>a+(typeof r.rendered==='number'?r.rendered:0),0),swaleLayers:rows,panelLines:panel
    };
  });
}
async function scenario(name,fn){
  const row={scenario:name,url:URL,crosshair:CROSS,query:QUERY,candidateIndex:INDEX_FILE||null,candidateEngine:ENGINE_FILE||null,expectR15:EXPECT_R15};const t0=Date.now();let h=null;
  try{h=await open();row.steps=await fn(h.page);
    row.final=await measure(h.page);await h.page.screenshot({path:out+'/'+name+'.png'});}
  catch(e){row.error=String(e).slice(0,400);try{if(h)await h.page.screenshot({path:out+'/'+name+'-error.png'});}catch(_){}}
  row.pageErrors=h?h.errors.slice(0,15):[];row.seconds=Math.round((Date.now()-t0)/1000);
  const f=row.final||{};
  const st=row.steps||{},ap=(st.press&&st.press.atPress)||(st.press2&&st.press2.atPress)||null;
  row.placeOffsetM=(ap&&f.center&&Number.isFinite(f.center.lat))?Math.round(distM({lat:ap.lat,lng:ap.lng},f.center)):null;
  const wrongPlace=row.placeOffsetM!=null&&row.placeOffsetM>200;
  const canopyEvidence=f.engine?.canopyEvidence;
  const maskMissing=EXPECT_R15&&f.tier==='property'&&f.analysisReady&&(!canopyEvidence?.applied||!(canopyEvidence.flaggedCells>0));
  const inCanopy=EXPECT_R15&&f.canopy&&f.canopy.shareInCanopy!=null&&f.canopy.shareInCanopy>=0.05;
  row.verdict=maskMissing?'R15 MASK NOT AVAILABLE':inCanopy?'SWALES IN TREE CANOPY ('+Math.round(f.canopy.shareInCanopy*100)+'% of swale points)':wrongPlace?'WRONG PLACE ('+row.placeOffsetM+' m from the crosshair at click)':(f.internalSwales>0&&f.renderedSwaleFeaturesTotal>0)?'SWALES DRAWN':(EXPECT_R15&&f.internalSwales===0&&f.engine&&f.engine.verified&&/R15|tree canopy/.test(String(f.engine.message||'')))?'NO SWALES, REASON SHOWN (R15)':(f.internalSwales>0?'COMPUTED BUT NOT DRAWN':(row.error?'COULD NOT RUN':'NO SWALES COMPUTED'));
  writeFileSync(out+'/'+name+'.json',JSON.stringify(row,null,2));results.push(row);
  console.log('EARTHLINE_USER_SEQUENCE '+JSON.stringify({scenario:name,verdict:row.verdict,placeOffsetM:row.placeOffsetM,tier:f.tier,loc:f.locName,internalSwales:f.internalSwales,rendered:f.renderedSwaleFeaturesTotal,layerSwalesOn:f.layerSwalesOn,
    engine:f.engine,halt:f.halt&&(f.halt.code||f.halt),zeroReason:f.zeroReason,steps:row.steps,error:row.error,panel:f.panelLines,errors:row.pageErrors.slice(0,3)}).slice(0,6000));
  if(h)await h.ctx.close().catch(()=>{});
}
try{
  await scenario('S3-real-mouse-drag-then-property',async page=>{const s={};
    await page.evaluate(c=>{const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;m.jumpTo({center:c,zoom:16.42});},CROSS);await sleep(3000);
    await realDrag(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S4-typed-address-no-drag-then-property',async page=>{const s={};await typeAndRun(page,process.env.EARTHLINE_ADDRESS||'Earlville, New York');s.regionalFinished=await regionalDone(page,150000);await sleep(4000);
    s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S0-control-property-only',async page=>{const s={};await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S0b-property-twice-same-page',async page=>{const s={};await moveCrosshair(page);s.press1=await pressProperty(page);s.ready1=await waitProperty(page,90000);await sleep(3000);
    s.first=await measure(page);await moveCrosshair(page);s.press2=await pressProperty(page);s.ready2=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S1-regional-finished-then-property',async page=>{const s={};await typeAndRun(page,QUERY);s.regionalFinished=await regionalDone(page,150000);await sleep(2000);
    await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S2-regional-midrun-then-property',async page=>{const s={};await typeAndRun(page,QUERY);await sleep(15000);
    await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,120000);await sleep(3500);return s;});
}finally{await browser.close();}
writeFileSync(out+'/summary.json',JSON.stringify(results.map(r=>({scenario:r.scenario,verdict:r.verdict,steps:r.steps,error:r.error,final:r.final&&{tier:r.final.tier,loc:r.final.locName,internalSwales:r.final.internalSwales,rendered:r.final.renderedSwaleFeaturesTotal,engine:r.final.engine,halt:r.final.halt,panel:r.final.panelLines}})),null,2));
const bad=results.filter(r=>!/^(SWALES DRAWN|NO SWALES, REASON SHOWN)/.test(r.verdict));
if(bad.length){console.error('FAIL: '+bad.map(r=>r.scenario+' = '+r.verdict).join('; '));process.exit(1);}
console.log('PASS: swales drawn in every scenario');
