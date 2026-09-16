import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e),stack:String(e?.stack||'').slice(0,2500)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text().slice(0,2500)});});
const started=Date.now();
let loadError=null,timedOut=false;
try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw new Error('search controls unavailable');
    i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  try{
    await page.waitForFunction(()=>{
      const m=typeof M!=='undefined'&&M?M:null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const identity=/texas/i.test(String(m?.loc?.name||''))||/texas/i.test(String(m?.loc?.fullName||''));
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(identity&&/screening published\./i.test(status)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
    },{timeout:30000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(300);
}catch(e){loadError=String(e);}
let after=null;
try{
  after=await page.evaluate(()=>{
    const m=typeof M!=='undefined'&&M?M:null;
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
    const lastPkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    let profile=null;
    try{profile=typeof earthlineJurisdictionProfile16549==='function'?earthlineJurisdictionProfile16549('Texas'):null;}catch(_){}
    return {
      now:new Date().toISOString(),
      loc:m?.loc||null,
      profile:profile?{id:profile.id,query:profile.query,abbr:profile.abbr,supportTier:profile.supportTier}:null,
      activePackage:pkg?{profileId:pkg.profileId,appliedAtomically:pkg.appliedAtomically,resolvedAt:pkg.resolvedAt,boundaryLabel:pkg.boundary?.label,boundaryCode:pkg.boundary?.code}:null,
      lastAtomicPackage:lastPkg?{profileId:lastPkg.profileId,appliedAtomically:lastPkg.appliedAtomically,resolvedAt:lastPkg.resolvedAt,boundaryLabel:lastPkg.boundary?.label}:null,
      jurisdictionAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
      landValidity:window.EARTHLINE_LAND_VALIDITY_16584||null,
      generationAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
      products:window.EARTHLINE_ORB_RESPONSIVENESS_16245||null,
      preflight:window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null,
      labelAudit:window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
    };
  });
}catch(e){loadError=loadError||String(e);}
const result={query:'Texas',elapsedMs:Date.now()-started,timedOut,loadError,after,errors:errors.slice(0,20)};
console.log('EARTHLINE_TEXAS_BOUNDARY_TIMING '+JSON.stringify(result));
writeFileSync('texas-production-diagnostic-results.json',JSON.stringify(result,null,2));
if(loadError||timedOut||after?.lastError||Number(after?.perf?.totalMs||Infinity)>15000)process.exitCode=1;
await browser.close();
