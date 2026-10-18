import { chromium } from 'playwright';
import fs from 'node:fs';

const browser=await chromium.launch({headless:true});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const VARIANT=process.env.VARIANT||'baseline';
const OUTDIR=process.env.OUTDIR||'/tmp/property17451';
fs.mkdirSync(OUTDIR,{recursive:true});
const sites=[
  {name:'A',lat:44.06957,lng:-72.27369},
  {name:'B',lat:44.08580,lng:-72.28020}
];
const rows=[];

for(const site of sites){
  const page=await browser.newPage({viewport:{width:1800,height:950}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?propertyPrescriber17451='+VARIANT+'-'+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForFunction(()=>typeof window.earthlineSelectedSiteFromCenter==='function'&&typeof window.applyLocation==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:30000,polling:100});
  const started=Date.now();
  const prep=await page.evaluate(async s=>{
    const siteObj=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    const applied=await window.applyLocation(siteObj,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    if(!applied)return {ok:false,reason:'applyLocation rejected'};
    await new Promise(r=>setTimeout(r,800));
    const set=window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'exact-vt-prescriber-17451',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    return {ok:!!set,site:siteObj,center:{lng:M?.centerLng,lat:M?.centerLat},target:window.EARTHLINE_PROPERTY_TARGET_16201||null};
  },site);
  let callResult=false,callError=null;
  if(prep.ok){
    try{
      callResult=await page.evaluate(async()=>await Promise.race([
        Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16169()),
        new Promise((_,rej)=>setTimeout(()=>rej(new Error('Property promise timeout')),120000))
      ]));
    }catch(e){callError=String(e);}
  }
  try{
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running',null,{timeout:120000,polling:100});
  }catch(_){}
  await page.waitForTimeout(800);

  const snap=await page.evaluate(()=>{
    const safe=M?.authoritativeSafeSwales15815?.features||[];
    const raw=Array.isArray(M?.swales)?M.swales:[];
    const cov=M?.coverageDiagnostic15803||null;
    const distribution=window.EARTHLINE_PROPERTY_PRESCRIPTION_DISTRIBUTION_17451||null;
    const pub=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const safeAudit=M?.safetyAudit15806||null;
    const zoneRows=(cov?.zones||[]).map(z=>({
      id:z.id,inParcelCells:z.inParcelCells,safeCells:z.safeCells,contourCells:z.contourCells,
      candidates:z.candidates,flowFirstCandidates:z.flowFirstCandidates,
      contourGeneratedCandidates:z.contourGeneratedCandidates,accepted:z.accepted,
      rejectFinalSpacing:z.rejections?.finalSpacing||0
    }));
    const acceptedZones=zoneRows.filter(z=>Number(z.accepted)>0).length;
    const candidateZones=zoneRows.filter(z=>Number(z.candidates)>0).length;
    const safeZones=zoneRows.filter(z=>Number(z.safeCells)>0).length;
    const acceptedCounts=zoneRows.map(z=>Number(z.accepted||0));
    return {
      rawCount:raw.length,safeCount:safe.length,
      publicationCount:Number(pub?.publicationCount??safe.length),
      spacing:M?.spacingStats||null,
      meta:M?.swaleMeta||null,
      distribution,
      coverage:{acceptedZones,candidateZones,safeZones,zones:zoneRows,
        maxAccepted:acceptedCounts.length?Math.max(...acceptedCounts):0,
        zeroAcceptedWithCandidates:zoneRows.filter(z=>Number(z.candidates)>0&&Number(z.accepted)===0).map(z=>z.id)},
      run:{result:audit?.result,settled:audit?.settled,error:audit?.error||null,corridors:audit?.corridors??null},
      safety:{verified:safeAudit?.verified===true,unsafe:Number(safeAudit?.unsafeCount??safeAudit?.unsafe??0)},
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null
    };
  });
  const elapsedMs=Date.now()-started;
  await page.screenshot({path:`${OUTDIR}/${VARIANT}-${site.name}.png`,fullPage:true});
  const row={variant:VARIANT,site,elapsedMs,prep,callResult,callError,...snap,errors};
  rows.push(row);
  console.log('EARTHLINE_PROPERTY_PRESCRIBER_17451 '+JSON.stringify(row));
  await page.close();
}
await browser.close();
fs.writeFileSync(`${OUTDIR}/${VARIANT}.json`,JSON.stringify(rows,null,2));
const pass=rows.every(r=>r.prep?.ok&&!r.callError&&r.run?.result===true&&r.run?.settled===true&&r.safeCount>0&&r.safety?.verified===true);
console.log('EARTHLINE_PROPERTY_PRESCRIBER_17451_SUMMARY '+JSON.stringify({variant:VARIANT,pass,rows:rows.map(r=>({
  site:r.site,elapsedMs:r.elapsedMs,rawCount:r.rawCount,safeCount:r.safeCount,publicationCount:r.publicationCount,
  spacing:r.spacing,coverage:r.coverage,distribution:r.distribution,run:r.run,safety:r.safety
}))}));
if(!pass)process.exitCode=1;
