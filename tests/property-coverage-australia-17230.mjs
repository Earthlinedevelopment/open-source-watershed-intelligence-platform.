import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname } from 'node:path';

const ROOT=process.cwd(), BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/property-coverage-australia-17230'; mkdirSync(OUT,{recursive:true});
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.svg':'image/svg+xml'};

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:832}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());
  let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
  if(rel.endsWith('/'))rel+='index.html';
  const local=resolve(ROOT,rel);
  if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
    return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local).toLowerCase()]||'application/octet-stream','cache-control':'no-store'}});
  }
  return route.continue();
});

await page.goto(BASE+'?coverage17230='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('australia country');
await page.waitForTimeout(1200);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('No Australia suggestion');
await opts.first().click();
await page.waitForTimeout(250);
await page.locator('#runBtn').click();
await page.waitForFunction(
  ()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),
  undefined,{timeout:90000,polling:200}
);
const got=page.locator('#earthlineCrosshairMoveHint17093').getByRole('button',{name:/got it|dismiss/i});
if(await got.count())await got.click();

async function setCrosshair(lng,lat){
  await page.evaluate(()=>{window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;});
  await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return reject(new Error('earthlineMap unavailable'));
    let done=false; const finish=()=>{if(done)return;done=true;resolve(true)};
    try{m.once?.('moveend',finish);m.jumpTo({center:[lng,lat],zoom:16.65,bearing:0,pitch:0});setTimeout(finish,1800)}catch(e){reject(e)}
  }),{lng,lat});
  await page.waitForFunction(({lng,lat})=>{
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    return t?.source==='crosshair'&&Math.abs(Number(t.lng)-lng)<0.001&&Math.abs(Number(t.lat)-lat)<0.001;
  },{lng,lat},{timeout:15000,polling:100});
}

async function runProperty(label,lng,lat){
  await setCrosshair(lng,lat);
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true&&a?.result===true;
  },pre,{timeout:300000,polling:250});
  const elapsed=Date.now()-t0;
  const result=await page.evaluate(()=>{
    const m=typeof M!=='undefined'?M:null;
    const diag=m?.coverageDiagnostic15803||null;
    const zones=(diag?.zones||[]).map(z=>({
      x:z.x,y:z.y,inParcelCells:z.inParcelCells,safeCells:z.safeCells,seeds:z.seeds,
      candidates:z.candidates,accepted:z.accepted,rejections:z.rejections
    }));
    let inP=0;if(m?.inP)for(const v of m.inP)if(v)inP++;
    return {
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      swales:Number(m?.swales?.length||0),
      inPCells:inP,
      coverage:{
        caps:diag?.caps||null,totals:diag?.totals||null,termination:diag?.termination||null,
        zones
      },
      swaleDiagnostics:m?.swaleDiagnostics||null
    };
  });
  await page.screenshot({path:OUT+'/'+label+'.png',animations:'disabled'});
  console.log('COVERAGE_'+label.toUpperCase()+' '+JSON.stringify({elapsed,...result}));
  return {label,lng,lat,elapsed,...result};
}

const first=await runProperty('first-good',120.82015,-30.38019);
const suspect=await runProperty('third-suspect',120.81100,-30.38085);
const report={first,suspect,errors};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_PROPERTY_COVERAGE_17230 '+JSON.stringify(report));
await browser.close();
if(errors.length)throw new Error('Page errors '+JSON.stringify(errors));
