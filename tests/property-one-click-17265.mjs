import { chromium, firefox, webkit } from 'playwright';
import { readFileSync,existsSync,statSync,mkdirSync,writeFileSync } from 'node:fs';
import { resolve,extname } from 'node:path';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const ROOT=process.cwd(),BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/property-one-click-17265/'+BROWSER;mkdirSync(OUT,{recursive:true});
const type=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const browser=await type.launch({headless:HEADLESS});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const errs=[];page.on('pageerror',e=>errs.push(String(e)));

await page.route(BASE+'**',async route=>{
  const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    const ext=extname(local).toLowerCase(),ct=ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':ext==='.json'?'application/json':ext==='.geojson'?'application/geo+json':'application/octet-stream';
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':ct,'cache-control':'no-store'}});
  }
  return route.continue();
});

async function regional(q){
  await page.goto(BASE+'?oneclick17265='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE_PROPERTY_ONE_CLICK_17265'));
  if(!marker)throw new Error('one-click candidate marker unavailable');
  await page.locator('#searchInput').fill(q);await page.waitForTimeout(1200);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(!(await opts.count()))throw new Error('no suggestion '+q);
  await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
  await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,undefined,{timeout:120000,polling:100});
  const e=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);if(e)throw new Error('regional '+JSON.stringify(e));
  try{const g=page.getByRole('button',{name:/got it|dismiss/i});if(await g.count())await g.first().click({timeout:1000})}catch(_){}
}
async function move(lng,lat){
  await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
  await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!m?.jumpTo)return reject(new Error('map unavailable'));
    let done=false;const f=()=>{if(done)return;done=true;resolve(true)};try{m.once?.('moveend',f);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(f,1800)}catch(e){reject(e)}
  }),{lng,lat});
  await page.waitForTimeout(250);
}
async function oneClick(label,lng,lat){
  await move(lng,lat);
  const before=await page.evaluate(()=>({serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
  const btn=page.locator('#earthlineDeclareProperty16169');
  await btn.waitFor({state:'visible',timeout:15000});
  if(await btn.isDisabled())throw new Error(label+' Property button disabled before click');
  const t0=Date.now();
  await btn.click(); // exactly one physical click
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before.serial,{timeout:180000,polling:150});
  const after=await page.evaluate(()=>({
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    oneClick:window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17265||null,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
  }));
  const targetOk=Math.abs(Number(after.target?.lng)-lng)<0.002&&Math.abs(Number(after.target?.lat)-lat)<0.002;
  const serialAdvanced=Number(after.audit?.serial||0)===before.serial+1;
  const pass=serialAdvanced&&after.audit?.settled===true&&after.audit?.result===true&&targetOk&&after.oneClick?.result===true;
  console.log('EARTHLINE_PROPERTY_ONE_CLICK_17265 '+JSON.stringify({label,lng,lat,pass,elapsedMs:Date.now()-t0,before,after,targetOk,serialAdvanced}));
  await page.screenshot({path:OUT+'/'+label+'.png',animations:'disabled'});
  if(!pass)throw new Error(label+' one-click failed');
  return {label,pass,elapsedMs:Date.now()-t0,targetOk,serialAdvanced,audit:after.audit,oneClick:after.oneClick};
}

await regional('mexico country');
const rows=[];
for(const [label,lng,lat] of [
  ['mx1',-97.66181,19.80368],
  ['mx2',-97.66690,19.80549],
  ['mx3',-97.67018,19.80606]
]) rows.push(await oneClick(label,lng,lat));

writeFileSync(OUT+'/results.json',JSON.stringify({browser:BROWSER,rows,errs},null,2));
console.log('EARTHLINE_PROPERTY_ONE_CLICK_17265_SUMMARY '+JSON.stringify({browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,errs}));
await browser.close();
if(errs.length)process.exitCode=1;
