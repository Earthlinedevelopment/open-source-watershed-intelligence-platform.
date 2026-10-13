import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/rendered-user-path-17134';
mkdirSync(OUT,{recursive:true});

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:1});
const page=await context.newPage();
const errors=[];
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

await page.goto(BASE+'?render17134='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForTimeout(1200);
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

const propertyBtn=page.locator('#earthlineDeclareProperty16169');
if(!(await propertyBtn.isVisible()))throw new Error('Rendered Property button missing after Zoom');
const propertyBtnBox=await rect(propertyBtn);
await shot('03b-property-button',propertyBtnBox);

const crosshairVisual=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169');
  if(!b)return {ok:false,reason:'button-missing'};
  const svg=b.querySelector('svg');
  const shell=b.querySelector('.earthline-orb-shell-16244');
  const span=b.querySelector('[data-crosshair16247]');
  const rb=b.getBoundingClientRect();
  const rs=svg?.getBoundingClientRect();
  const ri=shell?.getBoundingClientRect();
  const css=span?getComputedStyle(span):null;
  return {
    ok:!!(svg&&shell&&span&&rs?.width>0&&rs?.height>0&&ri?.width>0&&ri?.height>0),
    button:{x:rb.x,y:rb.y,w:rb.width,h:rb.height},
    svg:rs&&{x:rs.x,y:rs.y,w:rs.width,h:rs.height},
    shell:ri&&{x:ri.x,y:ri.y,w:ri.width,h:ri.height},
    spanDisplay:css?.display||null,
    spanVisibility:css?.visibility||null
  };
});
if(!crosshairVisual.ok)throw new Error('Crosshair/orb is not actually rendered in the Property button '+JSON.stringify(crosshairVisual));

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

const result={errors,crosshairVisual,rendered,swaleRenderedCount,elderFresh};
writeFileSync(`${OUT}/result.json`,JSON.stringify(result,null,2));
console.log('EARTHLINE_RENDERED_17134 '+JSON.stringify(result));

if(errors.length)throw new Error('Page errors '+JSON.stringify(errors));
if(swaleRenderedCount<=0)throw new Error('No Property swale features actually rendered in viewport');
if(!elderFresh)throw new Error('No fresh Property Elder pins actually available after Property run');

await browser.close();
