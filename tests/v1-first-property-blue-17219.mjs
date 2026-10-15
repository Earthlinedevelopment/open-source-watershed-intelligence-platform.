import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT=process.cwd();
const BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/v1-first-property-blue-17219';
mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json','.png':'image/png','.svg':'image/svg+xml','.py':'text/plain; charset=utf-8'};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:832}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));

await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{
      'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store',
      'x-earthline-first-blue':'17219'
    }});
  }
  return route.continue();
});

await page.goto(BASE+'?firstblue17219='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');
await input.fill('australia country');
await page.waitForTimeout(1100);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No Australia suggestion');
await opts.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(
  ()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),
  undefined,{timeout:60000,polling:150}
);
const got=page.locator('#earthlineCrosshairMoveHint17093').getByRole('button',{name:/got it|dismiss/i});
if(await got.count())await got.click();

async function setCrosshair(lng,lat){
  await page.evaluate(()=>{window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;});
  await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return reject(new Error('earthlineMap unavailable'));
    let done=false;
    const finish=()=>{if(done)return;done=true;resolve(true)};
    try{
      m.once?.('moveend',finish);
      m.jumpTo({center:[lng,lat],zoom:17.2});
      setTimeout(finish,1500);
    }catch(e){reject(e)}
  }),{lng,lat});
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    if(!t||t.source!=='crosshair')return false;
    return Math.abs(Number(t.lng)-lng)<0.0007&&Math.abs(Number(t.lat)-lat)<0.0007;
  },{lng,lat},{timeout:10000,polling:100});
}

async function runProperty(label,lng,lat){
  await setCrosshair(lng,lat);
  const btn=page.locator('#earthlineDeclareProperty16169');
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await btn.click();
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true&&a?.result===true;
  },pre,{timeout:60000,polling:150});
  const settledMs=Date.now()-t0;
  await page.waitForTimeout(2500);

  const snap=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const canvas=m?.getCanvas?.();
    const box=canvas&&[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]];
    const count=id=>{
      try{return box&&m?.getLayer?.(id)?m.queryRenderedFeatures(box,{layers:[id]}).length:0}catch(_){return 0}
    };
    const paint=(id,key)=>{try{return m?.getLayer?.(id)?m.getPaintProperty(id,key):null}catch(_){return null}};
    return {
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      texture:typeof window.earthlinePropertyTextureAudit16169==='function'?window.earthlinePropertyTextureAudit16169():null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      neutralRendered:count('earthline-property-swale-neutral-16177'),
      upRendered:count('earthline-property-swale-natural-up-16174'),
      flipRendered:count('earthline-property-swale-natural-flip-16174'),
      safeWaterRendered:count('earthline-property-safe-water-16221'),
      neutralColor:paint('earthline-property-swale-neutral-16177','line-color'),
      neutralOpacity:paint('earthline-property-swale-neutral-16177','line-opacity'),
      safeWaterOpacity:paint('earthline-property-safe-water-16221','line-opacity'),
      safeWaterVisibility:(()=>{try{return m?.getLayer?.('earthline-property-safe-water-16221')?m.getLayoutProperty('earthline-property-safe-water-16221','visibility'):null}catch(_){return null}})(),
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      elderRendered:count('earthline-elder-tree-points-17097')
    };
  });

  if(Number(snap.audit?.corridors||0)<=0)throw new Error(label+' returned no corridors: '+JSON.stringify(snap));
  if(snap.neutralRendered>0 && String(snap.neutralColor).toLowerCase()!=='#25c8ff'){
    throw new Error(label+' indeterminate swales are not blue: '+JSON.stringify(snap));
  }
  if((snap.neutralRendered+snap.upRendered+snap.flipRendered)<=0 && snap.safeWaterRendered<=0){
    throw new Error(label+' has corridors but no rendered swale presentation: '+JSON.stringify(snap));
  }

  await page.waitForTimeout(4000);
  const later=await page.evaluate(()=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),canvas=m?.getCanvas?.();
    const box=canvas&&[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]];
    const count=id=>{try{return box&&m?.getLayer?.(id)?m.queryRenderedFeatures(box,{layers:[id]}).length:0}catch(_){return 0}};
    const paint=(id,key)=>{try{return m?.getLayer?.(id)?m.getPaintProperty(id,key):null}catch(_){return null}};
    return {
      neutralRendered:count('earthline-property-swale-neutral-16177'),
      upRendered:count('earthline-property-swale-natural-up-16174'),
      flipRendered:count('earthline-property-swale-natural-flip-16174'),
      safeWaterRendered:count('earthline-property-safe-water-16221'),
      neutralColor:paint('earthline-property-swale-neutral-16177','line-color'),
      neutralOpacity:paint('earthline-property-swale-neutral-16177','line-opacity'),
      safeWaterOpacity:paint('earthline-property-safe-water-16221','line-opacity'),
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
      elderRendered:count('earthline-elder-tree-points-17097')
    };
  });
  if(snap.neutralRendered>0 && later.neutralRendered<=0){
    throw new Error(label+' blue neutral swales disappeared after handoff: '+JSON.stringify({snap,later}));
  }
  if(later.neutralRendered>0 && String(later.neutralColor).toLowerCase()!=='#25c8ff'){
    throw new Error(label+' later neutral swales changed away from blue: '+JSON.stringify({snap,later}));
  }

  await page.screenshot({path:OUT+'/'+label+'.png',animations:'disabled'});
  return {label,lng,lat,settledMs,snap,later};
}

const first=await runProperty('first',135.93355,-32.40049);
const second=await runProperty('second',135.93767,-32.40028);

await page.waitForFunction(()=>{
  const x=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
  return x?.state==='committed'&&Number(x?.featureCount||0)>0;
},undefined,{timeout:90000,polling:250});
const elderFinal=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null);

const report={first,second,elderFinal,errors};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_FIRST_PROPERTY_BLUE_17219 '+JSON.stringify(report));
await browser.close();
if(errors.length)throw new Error('Page errors '+JSON.stringify(errors));
