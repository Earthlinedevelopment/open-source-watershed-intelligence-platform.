import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const WAIT_MS=Math.max(60000,Number(process.env.WAIT_MS||120000));
const browserType=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const launchOptions={headless:HEADLESS};
if(BROWSER==='chrome')launchOptions.channel='chrome';
if(BROWSER==='edge'||BROWSER==='msedge')launchOptions.channel='msedge';

const REGIONS=[
  {name:'Mexico',query:'mexico country',points:[[-97.66181,19.80368],[-97.66690,19.80549]]},
  {name:'Australia',query:'australia country',points:[[135.93767,-32.40028],[135.93355,-32.40049]]},
  {name:'India',query:'india country',points:[[75.7210,26.9250],[75.7350,26.9180]]},
  {name:'South Africa',query:'south africa country',points:[[28.1640,-25.6450],[28.1780,-25.6530]]},
  {name:'Kenya',query:'kenya country',points:[[36.7050,-1.1670],[36.7190,-1.1750]]},
  {name:'Namibia',query:'namibia country',points:[[17.0200,-22.4700],[17.0350,-22.4800]]}
];

const OUT='artifacts/global-readiness-17263/'+BROWSER;
mkdirSync(OUT,{recursive:true});
const browser=await browserType.launch(launchOptions);
const results=[];

async function dismissHints(page){
  for(const sel of [
    '#earthlineCrosshairMoveHint17093 button',
    '#earthlineRegionalOnboarding16147 button',
    '#earthlineRegionalOpportunityOnboarding16147 button'
  ]){
    try{const b=page.locator(sel).filter({visible:true});if(await b.count())await b.first().click({timeout:1200});}catch(_){}
  }
  try{
    const got=page.getByRole('button',{name:/got it|dismiss|close/i});
    if(await got.count())await got.first().click({timeout:1200});
  }catch(_){}
}

async function runRegion(region){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now();
  let loadError=null,regionalTimedOut=false;
  try{
    await page.goto(BASE+'?global17263='+encodeURIComponent(region.name)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill(region.query);
    await page.waitForTimeout(1300);
    const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
    if(!(await opts.count()))throw new Error('No search suggestion for '+region.query);
    await opts.first().click();
    await page.waitForTimeout(250);
    await page.locator('#runBtn').click();
    try{
      await page.waitForFunction(q=>{
        const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
        const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return !!p&&/screening published\./i.test(s);
      },region.query,{timeout:WAIT_MS,polling:100});
    }catch(_){regionalTimedOut=true;}
    await dismissHints(page);
  }catch(e){loadError=String(e);}

  const regional=loadError?{}:await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }));

  const property=[];
  if(!loadError&&!regionalTimedOut&&!regional.lastError){
    for(let pi=0;pi<region.points.length;pi++){
      const [lng,lat]=region.points[pi];
      let propError=null,propTimedOut=false;
      try{
        // User-like move: interaction first, then camera move, then exactly ONE Property click.
        await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
        await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
          const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
          if(!m?.jumpTo)return reject(new Error('map unavailable'));
          let done=false;const finish=()=>{if(done)return;done=true;resolve(true)};
          try{m.once?.('moveend',finish);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(finish,2000)}catch(e){reject(e)}
        }),{lng,lat});
        await page.waitForTimeout(300);
        await dismissHints(page);
        await page.waitForFunction(({lng,lat})=>{
          const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
          return t?.source==='crosshair'&&Math.abs(Number(t.lng)-lng)<0.002&&Math.abs(Number(t.lat)-lat)<0.002;
        },{lng,lat},{timeout:15000,polling:100});
        const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
        await page.locator('#earthlineDeclareProperty16169').click();
        try{
          await page.waitForFunction(pre=>{
            const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
            return Number(a?.serial||0)>pre&&a?.settled===true;
          },before,{timeout:180000,polling:200});
        }catch(_){propTimedOut=true;}
      }catch(e){propError=String(e);}
      const snap=await page.evaluate(()=>({
        audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
        publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
        integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
        target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
        displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
        swales:Array.isArray(M?.swales?.features)?M.swales.features.length:Array.isArray(M?.swales)?M.swales.length:null,
        coverage:M?.coverageDiagnostic15803||null
      }));
      const targetOk=!!snap.target&&Math.abs(Number(snap.target.lng)-lng)<0.002&&Math.abs(Number(snap.target.lat)-lat)<0.002;
      const pass=!propError&&!propTimedOut&&snap.audit?.settled===true&&snap.audit?.result===true&&snap.audit?.renderVerified===true&&targetOk;
      property.push({index:pi+1,lng,lat,pass,propError,propTimedOut,targetOk,...snap});
      try{await page.screenshot({path:`${OUT}/${region.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-p${pi+1}.png`,animations:'disabled'});}catch(_){}
      await page.waitForTimeout(400);
    }
  }

  const coreMs=regional?.perf?.totalMs??null;
  const generated=regional?.publication?.generated??null;
  const visible=regional?.display?.swaleLines??regional?.publication?.overlaySwaleLines??null;
  const unsafe=regional?.flow?.unsafeSegments??null;
  const outside=regional?.boundary?.outsideAfterClip??null;
  const ignorableErrors=pageErrors.filter(e=>!/earthline-telemetry|supabase\.co\/functions\/v1\/earthline-telemetry/i.test(e));
  const regionalPass=!loadError&&!regionalTimedOut&&!regional?.lastError&&Number(coreMs)<=15000&&Number(generated)===Number(visible)&&Number(unsafe)===0&&Number(outside?.swales||0)===0&&!ignorableErrors.length;
  const pass=regionalPass&&property.length===region.points.length&&property.every(p=>p.pass);
  const row={region:region.name,query:region.query,browser:BROWSER,headless:HEADLESS,pass,regionalPass,loadError,regionalTimedOut,pageErrors,ignorableErrors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outsideAfterClip:outside,status:regional?.status||'',property};
  results.push(row);
  console.log('EARTHLINE_GLOBAL_READINESS_17263 '+JSON.stringify(row));
  await context.close();
}

for(const region of REGIONS)await runRegion(region);
await browser.close();

const summary={
  browser:BROWSER,total:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,
  failed:results.filter(r=>!r.pass).map(r=>r.region),
  regionalOver15:results.filter(r=>Number(r.coreMs)>15000).map(r=>({region:r.region,coreMs:r.coreMs})),
  propertyFailed:results.flatMap(r=>r.property.filter(p=>!p.pass).map(p=>({region:r.region,index:p.index,error:p.propError,timedOut:p.propTimedOut,targetOk:p.targetOk,auditResult:p.audit?.result??null,renderVerified:p.audit?.renderVerified??null})))
};
writeFileSync(OUT+'/results.json',JSON.stringify({summary,results},null,2));
console.log('EARTHLINE_GLOBAL_READINESS_17263_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
