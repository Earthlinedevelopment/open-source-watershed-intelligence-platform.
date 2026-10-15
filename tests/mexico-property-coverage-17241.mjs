import { chromium } from 'playwright';
import { readFileSync,existsSync,statSync,mkdirSync,writeFileSync } from 'node:fs';
import { resolve,extname } from 'node:path';

const MODE=process.env.MODE||'live';
const ROOT=process.cwd(),BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mexico-property-coverage-17241/'+MODE;mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));

if(MODE==='candidate'){
  await page.route(BASE+'**',async route=>{
    const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';
    if(rel.endsWith('/'))rel+='index.html';const local=resolve(ROOT,rel);
    if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile()){
      const ext=extname(local).toLowerCase(),ct=ext==='.html'?'text/html; charset=utf-8':ext==='.js'?'text/javascript; charset=utf-8':ext==='.css'?'text/css; charset=utf-8':ext==='.json'?'application/json':ext==='.geojson'?'application/geo+json':'application/octet-stream';
      return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':ct,'cache-control':'no-store'}});
    }
    return route.continue();
  });
}

await page.goto(BASE+'?mexico17241='+MODE+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('mexico country');
await page.waitForTimeout(1200);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(!(await opts.count()))throw new Error('Mexico suggestion unavailable');
await opts.first().click();await page.waitForTimeout(250);await page.locator('#runBtn').click();
await page.waitForFunction(()=>{const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||!!p;},undefined,{timeout:90000,polling:100});
const regErr=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);if(regErr)throw new Error('Regional failed '+JSON.stringify(regErr));

const coords=[
  ['mx-1',-95.74612,16.68512],
  ['mx-2',-95.75071,16.68748],
  ['mx-3',-97.66181,19.80368],
  ['mx-4',-97.66690,19.80549],
  ['mx-5',-97.67018,19.80606]
];

async function runOne(label,lng,lat){
  const result=await page.evaluate(async ({label,lng,lat})=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const parent=String(d?.runToken||window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
    const target={lng,lat,source:'mexico-coverage-diagnostic-17241',code:'',score:0,parentRunToken:parent,query:'mexico country',at:new Date().toISOString()};
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(target,{openPanel:false});else window.EARTHLINE_PROPERTY_TARGET_16201=target;
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;if(typeof fn!=='function')throw new Error('Property owner unavailable');
    const started=performance.now();let out=false,error=null;
    try{out=await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('Property diagnostic timeout 120s')),120000))]);}catch(e){error=String(e&&e.message||e);}
    const m=typeof M!=='undefined'?M:null,diag=m?.coverageDiagnostic15803||null;
    const zones=(diag?.zones||[]).map(z=>({x:z.x,y:z.y,inParcelCells:Number(z.inParcelCells||0),safeCells:Number(z.safeCells||0),seeds:Number(z.seeds||0),candidates:Number(z.candidates||0),accepted:Number(z.accepted||0),rejections:z.rejections||null}));
    const starved=zones.filter(z=>z.safeCells>0&&z.accepted===0);
    const highSafeStarved=zones.filter(z=>z.safeCells>=Math.max(4,Math.round(z.inParcelCells*.15))&&z.accepted===0);
    const sw=(m?.swales?.features||m?.swales||[]);
    const zoneIndex=(x,y)=>Math.max(0,Math.min(15,Math.floor((Number(y)/Math.max(1,GH))*4)*4+Math.floor((Number(x)/Math.max(1,GW))*4)));
    const preselectionByZone={};
    for(const rec of (diag?.preselectionFate15841?.records||[])){
      const zi=zoneIndex(rec.x,rec.y),key='Z'+(zi+1),reason=String(rec.terminalSelectionReason||'unknown');
      const row=preselectionByZone[key]||(preselectionByZone[key]={records:0,selected:0,reasons:{}});
      row.records++;if(rec.selected)row.selected++;row.reasons[reason]=(row.reasons[reason]||0)+1;
    }
    const seedFateByZone={};
    for(const rec of (diag?.spatial?.seeds||[])){
      const key=String(rec.zone||('Z'+(zoneIndex(rec.x,rec.y)+1))),reason=String(rec.terminalReasonCode15840||rec.terminalStage15840||rec.status||'unknown');
      const row=seedFateByZone[key]||(seedFateByZone[key]={seeds:0,accepted:0,reasons:{}});
      row.seeds++;if(rec.accepted15840)row.accepted++;row.reasons[reason]=(row.reasons[reason]||0)+1;
    }
    const highSafeZoneEvidence=highSafeStarved.map(z=>{
      const idx=zones.indexOf(z),key='Z'+(idx+1);
      const seedDetails=(diag?.spatial?.seeds||[]).filter(r=>String(r.zone||'')===key).map(r=>({
        x:r.x,y:r.y,levelIndex:r.levelIndex,score:r.score,
        traceResult:r.traceResult15840||null,segmentProduced:!!r.segmentProduced15840,
        segmentCount:Number(r.segmentCount15840||0),
        segmentTerminalCodes:Array.isArray(r.segmentTerminalCodes15840)?r.segmentTerminalCodes15840.slice():[],
        terminalStage:r.terminalStage15840||null,terminalReason:r.terminalReasonCode15840||null,
        candidateOutcomes:Array.isArray(r.candidateOutcomes15840)?r.candidateOutcomes15840.map(o=>({
          status:o.status,reason:o.reason,accepted:!!o.accepted,reachedSpacingEvaluation:!!o.reachedSpacingEvaluation
        })):[]
      }));
      return {zone:key,...z,preselection:preselectionByZone[key]||null,seedFate:seedFateByZone[key]||null,seedDetails};
    });
    return {
      label,lng,lat,out,error,elapsedMs:Math.round(performance.now()-started),
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      timing:m?.lastTiming||null,swaleCount:Array.isArray(sw)?sw.length:0,
      termination:diag?.termination||null,caps:diag?.caps||null,totals:diag?.totals||null,
      zones,starvedCount:starved.length,highSafeStarvedCount:highSafeStarved.length,highSafeZoneEvidence,preselectionByZone,seedFateByZone,
      candidateTermination:m?.swaleDiagnostics?.candidateTermination||m?.swaleDiagnostics?.candidateTermination15803||null,
      swaleDiagnostics:m?.swaleDiagnostics||null
    };
  },{label,lng,lat});
  console.log('EARTHLINE_MEXICO_PROPERTY_17241 '+JSON.stringify(result));
  await page.screenshot({path:OUT+'/'+label+'.png',animations:'disabled'});
  return result;
}

const results=[];
for(const row of coords){
  results.push(await runOne(...row));
  await page.waitForTimeout(500);
}
const report={mode:MODE,pageErrors,regional:await page.evaluate(()=>window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null),results};
writeFileSync(OUT+'/result.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_MEXICO_PROPERTY_17241_SUMMARY '+JSON.stringify(report));
await browser.close();
if(pageErrors.length||results.some(r=>r.error||r.out===false||!r.audit?.result||!r.audit?.settled))process.exitCode=1;
