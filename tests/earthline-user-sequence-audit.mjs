// Reproduces the founder's exact click path on the REAL public site and measures what is DRAWN (queryRenderedFeatures), not just what is computed.
// S0 control:  Property only on a fresh page.
// S1 finished: search "NEW YORK state" -> Run Analysis -> wait until Regional finishes -> move crosshair -> Property.
// S2 midrun:   search "NEW YORK state" -> Run Analysis -> after 15 s (Regional still running) -> move crosshair -> Property.
// Output: user-sequence-audit/<scenario>.json + .png, one summary line per scenario, results branch user-sequence-results.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const CROSS=(process.env.EARTHLINE_CROSSHAIR||'-75.76995,42.78781').split(',').map(Number); // lng,lat
const QUERY=process.env.EARTHLINE_QUERY||'NEW YORK state';
const out='user-sequence-audit';mkdirSync(out,{recursive:true});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const browser=await chromium.launch({headless:true});
const results=[];

async function open(){
  const ctx=await browser.newContext({viewport:{width:1908,height:882}});
  const page=await ctx.newPage();const errors=[];
  page.on('pageerror',e=>errors.push('PAGE:'+String(e).slice(0,300)));
  page.on('console',m=>{if(m.type()==='error')errors.push('CONSOLE:'+m.text().slice(0,200));});
  await page.goto(URL+'?seq='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
  await page.waitForFunction(()=>Boolean(window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap)),{timeout:30000});
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
  await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap);window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;m.jumpTo({center:c,zoom:16.42});m.fire('dragend');},CROSS);
  await sleep(5000);
}
async function pressProperty(page){
  const end=Date.now()+45000;
  while(Date.now()<end){
    const ok=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1;});
    if(ok){try{await page.click('#earthlineDeclareProperty16169',{timeout:5000});return 'real click';}catch(_){await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169').click());return 'scripted click';}}
    await sleep(500);
  }
  return 'button never offered';
}
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
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),de=document.documentElement;
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const layers=(map.getStyle().layers||[]);
    const rows=layers.filter(l=>/swale|bioswale|corridor/i.test(l.id)).map(l=>{
      let vis=null,rendered=null;try{vis=map.getLayoutProperty(l.id,'visibility')||'visible';}catch(e){vis='err'}
      try{rendered=map.queryRenderedFeatures({layers:[l.id]}).length;}catch(e){rendered='err'}
      return {id:l.id,visibility:vis,rendered};
    });
    const eng=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600?.result?.()||null;
    const panel=[...document.querySelectorAll('#sidebar *, .sidebar *, aside *')].map(e=>e.children.length?'':(e.textContent||'').trim()).filter(t=>/swale|qualifying|unavailable|try again|exclusion|road and water|screening/i.test(t)).slice(0,12);
    return {
      tier:de.dataset.earthlineAnalysisTier||null,runState:de.dataset.earthlineRunState||null,propertyRunState:de.dataset.earthlinePropertyRunState||null,
      locName:m&&m.loc?String(m.loc.name||''):null,locZones:m&&m.loc?m.loc.zones||null:null,zone:m?m.zone:null,
      analysisReady:!!(m&&m.analysisReady),center:m?{lat:m.centerLat,lng:m.centerLng}:null,
      internalSwales:m&&Array.isArray(m.swales)?m.swales.length:null,
      layerSwalesOn:!!(m&&m.layers&&m.layers.swales&&m.layers.swales.on),
      engine:eng?{verified:eng.verified,code:eng.code||null,detail:eng.detail||null,engineSwales:eng.engineSwales,publishedSwales:eng.publishedSwales,message:eng.message||null,hash:eng.determinismHash||null}:null,
      halt:m?(m.prescriptionHalt15870||null):null,zeroReason:m?m.prescriptionZeroReason15870||null:null,propertyFailure:m?m.propertyRunFailure16539||null:null,
      renderedSwaleFeaturesTotal:rows.reduce((a,r)=>a+(typeof r.rendered==='number'?r.rendered:0),0),swaleLayers:rows,panelLines:panel
    };
  });
}
async function scenario(name,fn){
  const row={scenario:name,url:URL,crosshair:CROSS,query:QUERY};const t0=Date.now();let h=null;
  try{h=await open();row.steps=await fn(h.page);
    row.final=await measure(h.page);await h.page.screenshot({path:out+'/'+name+'.png'});}
  catch(e){row.error=String(e).slice(0,400);try{if(h)await h.page.screenshot({path:out+'/'+name+'-error.png'});}catch(_){}}
  row.pageErrors=h?h.errors.slice(0,15):[];row.seconds=Math.round((Date.now()-t0)/1000);
  const f=row.final||{};
  row.verdict=(f.internalSwales>0&&f.renderedSwaleFeaturesTotal>0)?'SWALES DRAWN':(f.internalSwales>0?'COMPUTED BUT NOT DRAWN':(row.error?'COULD NOT RUN':'NO SWALES COMPUTED'));
  writeFileSync(out+'/'+name+'.json',JSON.stringify(row,null,2));results.push(row);
  console.log('EARTHLINE_USER_SEQUENCE '+JSON.stringify({scenario:name,verdict:row.verdict,tier:f.tier,loc:f.locName,internalSwales:f.internalSwales,rendered:f.renderedSwaleFeaturesTotal,layerSwalesOn:f.layerSwalesOn,
    engine:f.engine,halt:f.halt&&(f.halt.code||f.halt),zeroReason:f.zeroReason,steps:row.steps,error:row.error,panel:f.panelLines,errors:row.pageErrors.slice(0,3)}).slice(0,6000));
  if(h)await h.ctx.close().catch(()=>{});
}
try{
  await scenario('S0-control-property-only',async page=>{const s={};await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S1-regional-finished-then-property',async page=>{const s={};await typeAndRun(page,QUERY);s.regionalFinished=await regionalDone(page,150000);await sleep(2000);
    await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,90000);await sleep(3500);return s;});
  await scenario('S2-regional-midrun-then-property',async page=>{const s={};await typeAndRun(page,QUERY);await sleep(15000);
    await moveCrosshair(page);s.press=await pressProperty(page);s.ready=await waitProperty(page,120000);await sleep(3500);return s;});
}finally{await browser.close();}
writeFileSync(out+'/summary.json',JSON.stringify(results.map(r=>({scenario:r.scenario,verdict:r.verdict,steps:r.steps,error:r.error,final:r.final&&{tier:r.final.tier,loc:r.final.locName,internalSwales:r.final.internalSwales,rendered:r.final.renderedSwaleFeaturesTotal,engine:r.final.engine,halt:r.final.halt,panel:r.final.panelLines}})),null,2));
const bad=results.filter(r=>r.verdict!=='SWALES DRAWN');
if(bad.length){console.error('FAIL: '+bad.map(r=>r.scenario+' = '+r.verdict).join('; '));process.exit(1);}
console.log('PASS: swales drawn in every scenario');
