import { chromium } from 'playwright';
import { mkdirSync, writeFileSync, readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/v2-repeat-stability-17140';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();

const ROOT=process.cwd();
const MIME={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml',
  '.txt':'text/plain; charset=utf-8','.py':'text/plain; charset=utf-8'
};
await page.route('https://earthlinedevelopment.org/**', async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,'')) || 'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(!local.startsWith(ROOT))return route.abort();
  if(existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({
      status:200,
      body:readFileSync(local),
      headers:{
        'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream',
        'cache-control':'no-store',
        'x-earthline-v2-preview':'17138'
      }
    });
  }
  return route.continue();
});
const errors=[];
const failures=[];
page.on('pageerror',e=>errors.push(String(e)));

async function shot(name,clip){
  const opts={path:`${OUT}/${name}.png`,animations:'disabled'};
  if(clip)opts.clip=clip;
  await page.screenshot(opts);
}
async function rect(locator){
  const b=await locator.boundingBox();
  return b&&{x:b.x,y:b.y,width:b.width,height:b.height};
}
async function visiblePixelEvidence(locator){
  const b=await locator.boundingBox();
  if(!b)return {ok:false,reason:'no-box'};
  const sample=await page.evaluate(({x,y,width,height})=>{
    const pts=[
      [x+width*.5,y+height*.5],
      [x+width*.25,y+height*.5],
      [x+width*.75,y+height*.5],
      [x+width*.5,y+height*.25],
      [x+width*.5,y+height*.75]
    ];
    return pts.map(([px,py])=>{
      const el=document.elementFromPoint(px,py);
      return {x:px,y:py,tag:el?.tagName||null,id:el?.id||null,cls:typeof el?.className==='string'?el.className:null};
    });
  },b);
  return {ok:true,box:b,sample};
}

await page.goto(BASE+'?v2render17138='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(1200);
await page.waitForFunction(()=>window.EARTHLINE_V2?.build==='17138',{timeout:15000,polling:100});
const v2Bootstrap=await page.evaluate(()=>({
  build:window.EARTHLINE_V2?.build||null,
  state:window.EARTHLINE_V2?.state||null,
  productionMutationAllowed:window.EARTHLINE_V2?.productionMutationAllowed,
  renderedPageIsAcceptanceAuthority:window.EARTHLINE_V2?.renderedPageIsAcceptanceAuthority,
  languageExists:!!document.getElementById('earthlineLanguageWrap16488'),
  origin:location.origin
}));
if(v2Bootstrap.build!=='17138')throw new Error('V2 bootstrap not rendered');
if(v2Bootstrap.origin!=='https://earthlinedevelopment.org')throw new Error('V2 preview is not running under production origin semantics');
if(v2Bootstrap.productionMutationAllowed!==false)throw new Error('V2 bootstrap production mutation lock missing');
if(v2Bootstrap.renderedPageIsAcceptanceAuthority!==true)throw new Error('V2 rendered-page authority lock missing');
if(v2Bootstrap.languageExists)throw new Error('Language control regressed into V2');

await shot('00-initial');

const input=page.locator('#searchInput');
await input.click();
await input.fill('California');
await page.waitForTimeout(900);
await shot('00b-suggestions');
const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
const optionCount=await options.count();
if(!optionCount)throw new Error('No rendered search suggestions after typing California');
const suggestionDump=await options.evaluateAll(els=>els.map(el=>({
  text:String(el.textContent||'').replace(/\s+/g,' ').trim(),
  query:el.getAttribute('data-query')||'',
  box:(()=>{const r=el.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,h:r.height}})()
})));
console.log('EARTHLINE_RENDERED_SUGGESTIONS '+JSON.stringify(suggestionDump));
const suggestion=options.first();
await suggestion.click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000,polling:150});
await page.waitForTimeout(900);
await shot('01-regional');

const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('No rendered Regional swale hit target');
await hit.click({force:true});
await page.waitForTimeout(400);
await shot('02-corridor-detail');

const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Rendered Zoom button missing');
await zoom.click();
await page.waitForTimeout(1400);
await shot('03-after-zoom');

const afterZoomRendered=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  let q=[];
  try{
    const ids=(m?.getStyle?.()?.layers||[]).filter(l=>/swale/i.test(l.id)).map(l=>l.id);
    const c=m?.getCanvas?.(); const r=c?.getBoundingClientRect?.();
    if(r&&ids.length)q=m.queryRenderedFeatures([[20,20],[Math.max(21,r.width-20),Math.max(21,r.height-20)]],{layers:ids});
  }catch(_){}
  return {
    count:q.length,
    byLayer:q.reduce((a,f)=>{const id=f.layer?.id||'unknown';a[id]=(a[id]||0)+1;return a},{}),
    svgHits:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').length,
    svgVisible:(()=>{const e=document.getElementById('earthlineRegionalVectorOverlay16020');if(!e)return null;const cs=getComputedStyle(e),r=e.getBoundingClientRect();return {display:cs.display,visibility:cs.visibility,opacity:cs.opacity,w:r.width,h:r.height}})()
  };
});
if(afterZoomRendered.count<=0 && afterZoomRendered.svgHits<=0)failures.push('No swales visibly available immediately after Zoom: '+JSON.stringify(afterZoomRendered));

const mapCanvas=page.locator('.mapboxgl-canvas').first();
const mapBoxForDrag=await mapCanvas.boundingBox();
if(!mapBoxForDrag)failures.push('Map canvas missing for crosshair move');
let dragState={};
if(mapBoxForDrag){
  dragState.before=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null});
  const safePoint=await page.evaluate(({box})=>{
    const xs=[.82,.68,.54,.40,.26],ys=[.78,.66,.54,.42,.30,.18];
    for(const yf of ys)for(const xf of xs){
      const x=box.x+box.width*xf,y=box.y+box.height*yf,e=document.elementFromPoint(x,y);
      const isMap=!!(e&&(e.matches?.('.mapboxgl-canvas,.mapboxgl-canvas-container')||e.closest?.('.mapboxgl-canvas-container')));
      const isOverlay=!!e?.closest?.('#earthlineRegionalVectorOverlay16020');
      const isControl=!!e?.closest?.('button,a,[role="button"],.mapboxgl-control-container,#earthlinePanel16188,#earthlineRail16188');
      if(isMap&&!isOverlay&&!isControl)return {x,y,hit:{tag:e.tagName,id:e.id||'',class:typeof e.className==='string'?e.className:''}};
    }
    return null;
  },{box:mapBoxForDrag});
  if(!safePoint)failures.push('No unobstructed bare-map drag point was available');
  const sx=safePoint?.x??(mapBoxForDrag.x+mapBoxForDrag.width*0.70);
  const sy=safePoint?.y??(mapBoxForDrag.y+mapBoxForDrag.height*0.62);
  if(safePoint){
    await page.mouse.move(sx,sy);
    await page.mouse.down();
    await page.mouse.move(sx-120,sy+35,{steps:16});
    await page.mouse.up();
  }
  await page.waitForTimeout(900);
  dragState.after=await page.evaluate(()=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);const c=m?.getCenter?.();return c?{lng:c.lng,lat:c.lat}:null});
  dragState.button=await page.evaluate(()=>({
    text:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim(),
    data:document.querySelector('#earthlineDeclareProperty16169 [data-crosshair16247]')?.getAttribute('data-crosshair16247')||null,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null
  }));
  await shot('03c-after-map-drag');
  const moved=dragState.before&&dragState.after&&(Math.abs(dragState.before.lng-dragState.after.lng)>1e-6||Math.abs(dragState.before.lat-dragState.after.lat)>1e-6);
  if(!moved)failures.push('Regional map did not move under a real drag: '+JSON.stringify(dragState));
  if(!/^CROSSHAIR\b/i.test(dragState.button?.text||'')||dragState.button?.data!=='1')failures.push('20-acre Property search did not retarget to CROSSHAIR after real map drag: '+JSON.stringify(dragState.button));
}

const propertyBtn=page.locator('#earthlineDeclareProperty16169');
if(!(await propertyBtn.isVisible()))throw new Error('Rendered Property button missing after Zoom');
const propertyBtnBox=await rect(propertyBtn);
await shot('03b-property-button',propertyBtnBox);

const crosshairVisual=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!b)return {ok:false,reason:'button-missing'};
  const span=b.querySelector('[data-crosshair16247]');
  const rb=b.getBoundingClientRect();
  const rs=span?.getBoundingClientRect();
  const css=span?getComputedStyle(span):null;
  const text=String(b.textContent||'').replace(/\s+/g,' ').trim();
  const data=span?.getAttribute('data-crosshair16247')||null;
  return {
    ok:!!(span&&/^CROSSHAIR\b/i.test(text)&&data==='1'&&rs?.width>0&&rs?.height>0&&css?.display!=='none'&&css?.visibility!=='hidden'),
    text,data,
    button:{x:rb.x,y:rb.y,w:rb.width,h:rb.height},
    span:rs&&{x:rs.x,y:rs.y,w:rs.width,h:rs.height},
    spanDisplay:css?.display||null,
    spanVisibility:css?.visibility||null
  };
});
if(!crosshairVisual.ok)failures.push('Property button did not render CROSSHAIR target state: '+JSON.stringify(crosshairVisual));

await propertyBtn.click();
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:30000,polling:150});
await page.waitForTimeout(18000);
await shot('04-property-final');

const mapBox=await rect(page.locator('#map'));
if(mapBox)await shot('04b-property-map',mapBox);

const rendered=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  if(!m)return {ok:false,reason:'map-missing'};
  const canvas=m.getCanvas?.();
  const cb=canvas?.getBoundingClientRect?.();
  const center=m.getCenter?.();
  let query=[];
  try{
    const pad=40;
    query=m.queryRenderedFeatures([[pad,pad],[Math.max(pad+1,(cb?.width||0)-pad),Math.max(pad+1,(cb?.height||0)-pad)]],
      {layers:(m.getStyle()?.layers||[]).filter(l=>/property.*swale|swale.*property|property-safe|swale-planting/i.test(l.id)).map(l=>l.id)});
  }catch(_){}
  const byLayer={};
  for(const f of query){
    const id=f.layer?.id||'unknown';
    byLayer[id]=(byLayer[id]||0)+1;
  }
  const elderEls=[...document.querySelectorAll('[class*="elder" i],[id*="elder" i]')].filter(el=>{
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.01;
  }).map(el=>({id:el.id||'',class:typeof el.className==='string'?el.className:'',text:String(el.textContent||'').trim().slice(0,80)}));
  return {
    ok:true,
    center:center?{lng:center.lng,lat:center.lat}:null,
    map:{w:cb?.width||0,h:cb?.height||0},
    renderedFeatureCount:query.length,
    renderedByLayer:byLayer,
    elderVisibleElements:elderEls,
    elderLast:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
    propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
  };
});

const swaleRenderedCount=Object.entries(rendered.renderedByLayer||{})
  .filter(([id])=>/swale|property-safe|planting/i.test(id))
  .reduce((n,[,v])=>n+Number(v||0),0);

const elderFresh=rendered.elderLast?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')
  && Number(rendered.elderLast?.featureCount||0)>0
  && Number(rendered.elderLast?.dynamicCandidatePoolCount||0)>0;

if(errors.length)failures.push('Page errors '+JSON.stringify(errors));
if(swaleRenderedCount<=0)failures.push('No Property swale features actually rendered in viewport');
if(!elderFresh)failures.push('No fresh Property Elder pins actually available after Property run');

const repeatRuns=[];
let previousSerial=Number(rendered.propertyAudit?.serial||0);
for(let repeat=2;repeat<=3;repeat++){
  const beforeElderAt=Date.parse(rendered.elderLast?.at||0)||0;
  await propertyBtn.click();
  await page.waitForFunction(prev=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return !!(a&&a.settled===true&&Number(a.serial||0)>Number(prev||0));
  },previousSerial,{timeout:30000,polling:150});
  await page.waitForFunction(before=>{
    const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return !!(e&&Date.parse(e.at||0)>Number(before||0));
  },beforeElderAt,{timeout:30000,polling:200}).catch(()=>{});
  await page.waitForTimeout(2500);

  const state=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    let query=[];
    try{
      const c=m?.getCanvas?.(),r=c?.getBoundingClientRect?.();
      const layers=(m?.getStyle?.()?.layers||[])
        .filter(l=>/property.*swale|swale.*property|property-safe|swale-planting/i.test(l.id))
        .map(l=>l.id);
      if(r&&layers.length)query=m.queryRenderedFeatures(
        [[40,40],[Math.max(41,r.width-40),Math.max(41,r.height-40)]],
        {layers}
      );
    }catch(_){}
    const byLayer={};
    for(const f of query){
      const id=f.layer?.id||'unknown';
      byLayer[id]=(byLayer[id]||0)+1;
    }
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const elder=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
    return {
      audit,
      elder,
      renderedFeatureCount:query.length,
      renderedByLayer:byLayer,
      buttonText:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').replace(/\s+/g,' ').trim(),
      crosshair:document.querySelector('#earthlineDeclareProperty16169 [data-crosshair16247]')?.getAttribute('data-crosshair16247')||null
    };
  });
  previousSerial=Number(state.audit?.serial||previousSerial);
  const fresh=state.elder?.summary?.coverageDatasetIds?.includes('dynamic-property-17130')
    && Number(state.elder?.featureCount||0)>0
    && Number(state.elder?.dynamicCandidatePoolCount||0)>0;
  const repeatOk=state.audit?.result===true
    && state.audit?.scientificResult===true
    && Number(state.audit?.elapsedSeconds||999)<=15
    && state.renderedFeatureCount>0
    && fresh
    && state.crosshair==='1';
  repeatRuns.push({repeat,repeatOk,state});
  await shot('05-repeat-'+repeat);
  if(!repeatOk)failures.push('Repeat Property run '+repeat+' failed rendered stability: '+JSON.stringify(state));
}

const result={previewOrigin:BASE,v2Bootstrap,errors,failures,afterZoomRendered,dragState,crosshairVisual,rendered,swaleRenderedCount,elderFresh,repeatRuns};
writeFileSync(`${OUT}/result.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_V2_REPEAT_STABILITY_17140 '+JSON.stringify(result));

await browser.close();
if(failures.length)throw new Error('Rendered user-path failures: '+JSON.stringify(failures));
