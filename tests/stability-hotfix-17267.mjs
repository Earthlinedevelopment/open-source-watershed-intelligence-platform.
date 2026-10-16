import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const BASE='http://127.0.0.1:8787/';
const type=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const browser=await type.launch({headless:HEADLESS});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const OUT='artifacts/stability-hotfix-17267/'+BROWSER;mkdirSync(OUT,{recursive:true});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));

async function dismiss(){
  try{const g=page.getByRole('button',{name:/got it|dismiss|close/i});if(await g.count())await g.first().click({timeout:1000})}catch(_){}
}

await page.goto(BASE+'?stability17267='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const marker=await page.evaluate(()=>document.documentElement.outerHTML.includes('EARTHLINE_STABILITY_HOTFIX_17267'));
if(!marker)throw new Error('17267 candidate marker unavailable');

await page.locator('#searchInput').fill('mexico country');
await page.waitForTimeout(1200);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('Mexico suggestion unavailable');
await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191||!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,undefined,{timeout:120000,polling:100});
const reg=await page.evaluate(()=>({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
if(reg.error)throw new Error('Regional failed '+JSON.stringify(reg.error));
await dismiss();

const points=[
  ['mx-user-1',-95.74632,16.68473],
  ['mx-user-2',-95.76005,16.68099],
  ['mx-user-3',-95.76891,16.68505]
];

async function move(lng,lat){
  await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
  await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m?.jumpTo)return reject(new Error('map unavailable'));
    let done=false;const finish=()=>{if(done)return;done=true;resolve(true)};
    try{m.once?.('moveend',finish);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(finish,1800)}catch(e){reject(e)}
  }),{lng,lat});
  await page.waitForTimeout(350);await dismiss();
}

async function runProperty(label,lng,lat){
  await move(lng,lat);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const btn=page.locator('#earthlineDeclareProperty16169');
  await btn.waitFor({state:'visible',timeout:15000});
  if(await btn.isDisabled())throw new Error(label+' button disabled');
  const t0=Date.now();
  await btn.click(); // EXACTLY ONE CLICK
  await page.waitForFunction(pre=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return Number(a?.serial||0)>pre&&a?.settled===true;
  },before,{timeout:180000,polling:150});
  const prop=await page.evaluate(({lng,lat})=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
    const m=typeof M!=='undefined'?M:null;
    const diag=m?.coverageDiagnostic15803||null;
    const zones=(diag?.zones||[]).map((z,i)=>({zone:i+1,inParcelCells:Number(z.inParcelCells||0),safeCells:Number(z.safeCells||0),seeds:Number(z.seeds||0),candidates:Number(z.candidates||0),accepted:Number(z.accepted||0)}));
    const meaningful=zones.filter(z=>z.safeCells>=Math.max(4,Math.round(z.inParcelCells*.15)));
    const starved=meaningful.filter(z=>z.accepted===0);
    const sw=(m?.swales?.features||m?.swales||[]);
    return {
      audit:a,target:t,targetOk:!!t&&Math.abs(Number(t.lng)-lng)<0.002&&Math.abs(Number(t.lat)-lat)<0.002,
      oneClick:window.EARTHLINE_PROPERTY_ONE_CLICK_AUDIT_17267||null,
      swaleCount:Array.isArray(sw)?sw.length:0,
      caps:diag?.caps||null,termination:diag?.termination||null,totals:diag?.totals||null,
      meaningfulZones:meaningful.length,starvedZones:starved,
      elder:window.EARTHLINE_ELDER_TREE_LAST_17097||null
    };
  },{lng,lat});

  // Elder computation is asynchronous but must attach to the same current Property identity.
  try{
    await page.waitForFunction(({lng,lat})=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null,t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
      return e?.state==='committed'&&!!t&&Math.abs(Number(t.lng)-lng)<0.002&&Math.abs(Number(t.lat)-lat)<0.002;
    },{lng,lat},{timeout:90000,polling:250});
  }catch(_){}
  const elder=await page.evaluate(()=>window.EARTHLINE_ELDER_TREE_LAST_17097||null);

  const serialAdvanced=Number(prop.audit?.serial||0)===before+1;
  const propertyPass=serialAdvanced&&prop.audit?.result===true&&prop.audit?.renderVerified===true&&prop.targetOk&&prop.oneClick?.result===true;
  const elderPass=elder?.state==='committed'&&elder?.propertyRunIdentity&&elder?.dynamicError==null;
  const coveragePass=prop.meaningfulZones===0||prop.starvedZones.length===0;
  const row={label,lng,lat,elapsedMs:Date.now()-t0,propertyPass,elderPass,coveragePass,serialAdvanced,...prop,elderFinal:elder};
  console.log('EARTHLINE_STABILITY_17267 '+JSON.stringify(row));
  await page.screenshot({path:OUT+'/'+label+'.png',animations:'disabled'});
  return row;
}

const rows=[];
for(const p of points)rows.push(await runProperty(...p));

const summary={
  browser:BROWSER,
  regionalCoreMs:Number(reg.perf?.totalMs||0),
  propertyPass:rows.every(r=>r.propertyPass),
  elderPass:rows.every(r=>r.elderPass),
  coveragePass:rows.every(r=>r.coveragePass),
  allPass:rows.every(r=>r.propertyPass&&r.elderPass&&r.coveragePass),
  counts:rows.map(r=>({label:r.label,swales:r.swaleCount,trees:Number(r.elderFinal?.featureCount||0),treePool:Number(r.elderFinal?.dynamicCandidatePoolCount||0),starved:r.starvedZones.length})),
  pageErrors
};
writeFileSync(OUT+'/result.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_STABILITY_17267_SUMMARY '+JSON.stringify(summary));
await browser.close();
if(!summary.allPass||pageErrors.length)process.exitCode=1;
