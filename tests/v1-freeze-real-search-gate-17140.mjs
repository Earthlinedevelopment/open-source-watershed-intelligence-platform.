import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/v1-freeze-real-search-17140';
mkdirSync(OUT,{recursive:true});

const local={
  '/':readFileSync('index.html','utf8'),
  '/index.html':readFileSync('index.html','utf8'),
  '/earthline-launch-16872.js':readFileSync('earthline-launch-16872.js','utf8'),
  '/earthline-launch-16872.css':readFileSync('earthline-launch-16872.css','utf8'),
  '/earthline-language-hotfix-16890.js':readFileSync('earthline-language-hotfix-16890.js','utf8')
};

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:900},deviceScaleFactor:1});
const page=await context.newPage();
const failures=[],pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  const key=u.pathname==='/'?'/':u.pathname;
  if(Object.prototype.hasOwnProperty.call(local,key)){
    const type=key.endsWith('.js')?'application/javascript; charset=utf-8':key.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8';
    return route.fulfill({status:200,contentType:type,body:local[key]});
  }
  return route.continue();
});

async function shot(name){await page.screenshot({path:`${OUT}/${name}.png`,animations:'disabled'});}
async function mapState(label){
  return await page.evaluate(label=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const c=m?.getCenter?.();
    let rendered=[];
    try{
      const ids=(m?.getStyle?.()?.layers||[]).filter(l=>/swale/i.test(l.id)).map(l=>l.id);
      const r=m?.getCanvas?.()?.getBoundingClientRect?.();
      if(r&&ids.length)rendered=m.queryRenderedFeatures([[20,20],[Math.max(21,r.width-20),Math.max(21,r.height-20)]],{layers:ids});
    }catch(_){}
    const byLayer={};for(const f of rendered){const id=f.layer?.id||'unknown';byLayer[id]=(byLayer[id]||0)+1}
    const b=document.getElementById('earthlineDeclareProperty16169'),span=b?.querySelector('[data-crosshair16247]');
    return {
      label,
      center:c?{lng:c.lng,lat:c.lat}:null,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||''),
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').replace(/\s+/g,' ').trim(),
      regionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      propertyButton:b?{
        text:String(b.textContent||'').replace(/\s+/g,' ').trim(),
        crosshair:span?.getAttribute('data-crosshair16247')||null,
        disabled:!!b.disabled,
        visible:(()=>{const r=b.getBoundingClientRect(),s=getComputedStyle(b);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'})()
      }:null,
      propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      renderedSwales:rendered.length,
      renderedByLayer:byLayer,
      regionalHits:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').length
    };
  },label);
}
async function waitRegional(){
  await page.waitForFunction(()=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return !!err||/screening published\./i.test(s);
  },{timeout:50000,polling:150});
  await page.waitForTimeout(800);
}
async function searchByRun(text,label){
  const input=page.locator('#searchInput');
  await input.click();
  await input.fill(text);
  await page.waitForTimeout(850);

  const menu=page.locator('#earthlineSearchSuggestions15970');
  const run=page.locator('#runBtn');
  const mb=await menu.boundingBox(),rb=await run.boundingBox();
  const overlap=!!(mb&&rb&&!(mb.x+mb.width<=rb.x||rb.x+rb.width<=mb.x||mb.y+mb.height<=rb.y||rb.y+rb.height<=mb.y));
  console.log('V1_SEARCH_GEOMETRY '+JSON.stringify({label,text,mb,rb,overlap}));
  if(overlap)failures.push(`${label}: suggestion menu overlaps Run Analysis`);

  // This is intentionally a real click on Run while suggestions are open.
  await run.click({timeout:10000});
  await waitRegional();
  const s=await mapState(label);
  console.log('V1_SEARCH_STATE '+JSON.stringify(s));
  if(s.regionalError)failures.push(`${label}: regional error ${JSON.stringify(s.regionalError)}`);
  if(!/regional/i.test(s.tier))failures.push(`${label}: did not publish Regional tier`);
  if(s.regionalHits<=0)failures.push(`${label}: no rendered Regional corridor hit targets`);
  await shot(label);
  return s;
}

await page.goto(BASE+'?v1freeze17140='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(1000);
await shot('00-initial');

// 1. State / Region search with suggestions open and direct Run click.
await searchByRun('California','01-california-regional');

// 2. Corridor -> Zoom -> CROSSHAIR handoff.
const hit=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-hit-16070').first();
if(!(await hit.count()))throw new Error('California corridor hit unavailable');
await hit.click({force:true});
await page.waitForTimeout(350);
const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
if(!(await zoom.count()))throw new Error('Zoom to this location missing');
await zoom.click();
await page.waitForTimeout(1200);
await shot('02-after-zoom');
const afterZoom=await mapState('after-zoom');
console.log('V1_AFTER_ZOOM '+JSON.stringify(afterZoom));
if(!/^CROSSHAIR\b/i.test(afterZoom.propertyButton?.text||'')||afterZoom.propertyButton?.crosshair!=='1')failures.push('Regional Zoom did not hand Property search to CROSSHAIR');
if(afterZoom.propertyTarget?.code)failures.push('Regional corridor code remained authoritative after Zoom');

// 3. Real user drag from an unobstructed map point.
const db=await page.locator('.mapboxgl-canvas-container').first().boundingBox();
if(!db)throw new Error('No rendered map drag target');
const before=afterZoom.center;
const safe=await page.evaluate(({db})=>{
  const xs=[.84,.72,.60,.48,.36,.24],ys=[.82,.70,.58,.46,.34,.22];
  for(const yf of ys)for(const xf of xs){
    const x=db.x+db.width*xf,y=db.y+db.height*yf,e=document.elementFromPoint(x,y);
    if(!e)continue;
    const inMap=!!e.closest?.('.mapboxgl-canvas-container');
    const blocked=!!e.closest?.('#earthlineRegionalVectorOverlay16020,button,a,[role="button"],#earthlinePanel16188,#earthlineRail16188,.mapboxgl-control-container');
    if(inMap&&!blocked)return{x,y,tag:e.tagName,id:e.id||'',cls:typeof e.className==='string'?e.className:''};
  }
  return null;
},{db});
if(!safe)throw new Error('No unobstructed bare-map drag point');
const sx=safe.x,sy=safe.y;
await page.mouse.move(sx,sy);
await page.mouse.down();
await page.mouse.move(sx-115,sy+30,{steps:18});
await page.mouse.up();
await page.waitForTimeout(1100);
const afterDrag=await mapState('after-drag');
console.log('V1_AFTER_DRAG '+JSON.stringify(afterDrag));
await shot('03-after-real-drag');
const moved=!!(before&&afterDrag.center&&(Math.abs(before.lng-afterDrag.center.lng)>1e-6||Math.abs(before.lat-afterDrag.center.lat)>1e-6));
if(!moved)failures.push('Map did not move under a real mouse drag');
if(!/^CROSSHAIR\b/i.test(afterDrag.propertyButton?.text||'')||afterDrag.propertyButton?.crosshair!=='1')failures.push('Property search lost CROSSHAIR state after map drag');
if(afterDrag.propertyTarget&&afterDrag.center&&(Math.abs(Number(afterDrag.propertyTarget.lng)-afterDrag.center.lng)>.001||Math.abs(Number(afterDrag.propertyTarget.lat)-afterDrag.center.lat)>.001))failures.push('Property target did not follow dragged map center');

// 4. Real 20-acre Property search.
const prop=page.locator('#earthlineDeclareProperty16169');
if(!(await prop.isVisible())||await prop.isDisabled())failures.push('20-acre Property search button is not usable');
else{
  await prop.click();
  await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:35000,polling:150});
  await page.waitForTimeout(1800);
  const property=await mapState('property');
  console.log('V1_PROPERTY '+JSON.stringify(property));
  await shot('04-property-final');
  if(property.propertyAudit?.result!==true)failures.push('20-acre Property search did not settle successfully');
  if(Number(property.propertyAudit?.corridors||0)<=0)failures.push('20-acre Property search produced no corridors');
  if(property.renderedSwales<=0)failures.push('20-acre Property result has no swales actually rendered in viewport');
}

// 5. Fresh search after Property: city/place.
await searchByRun('Rutland, Vermont','05-rutland-regional');

// 6. Fresh international city search.
await searchByRun('Bangkok, Thailand','06-bangkok-regional');

if(pageErrors.length)failures.push('Page errors: '+JSON.stringify(pageErrors));
const final={failures,pageErrors,at:new Date().toISOString()};
writeFileSync(`${OUT}/result.json`,JSON.stringify(final,null,2));
console.log('EARTHLINE_V1_FREEZE_17140 '+JSON.stringify(final));
await browser.close();
if(failures.length)throw new Error('V1 freeze failures: '+JSON.stringify(failures));
