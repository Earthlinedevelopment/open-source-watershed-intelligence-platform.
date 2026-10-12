import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGET=process.env.TARGET;
if(!TARGET) throw new Error('TARGET required');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
let regionalError=null,propertyWaitError=null;
try{
  await page.goto(URL+'?ownerdiag17124='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },TARGET);
  await page.waitForFunction(expected=>{
    const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    return !!e||(String(d?.query||'').trim().toLowerCase()===String(expected).trim().toLowerCase()&&String(d?.tier||d?.mode||'').toLowerCase()==='regional');
  },TARGET,{timeout:95000,polling:100});
  regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  if(!regionalError){
    await page.waitForTimeout(500);
    await page.evaluate(()=>{
      window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;
      const b=document.getElementById('earthlineDeclareProperty16169');
      if(!b)throw new Error('Property button missing');
      b.click();
    });
    try{
      await page.waitForFunction(()=>{
        const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
        const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        const status=document.getElementById('earthlineVermontStatus16147')?.textContent||'';
        return !!a || r?.settled===true || /PROPERTY ANALYSIS (STOPPED|FAILED|BLOCKED)/i.test(status);
      },{timeout:38000,polling:100});
    }catch(e){propertyWaitError=String(e?.message||e);}
  }
}catch(e){regionalError=regionalError||String(e?.message||e);}

const snap=await page.evaluate(()=>{
  const m=window.M||((typeof M!=='undefined')?M:null)||{};
  const small=(v)=>{try{return JSON.parse(JSON.stringify(v));}catch(_){return null}};
  return {
    target: document.getElementById('searchInput')?.value||'',
    status: document.getElementById('earthlineVermontStatus16147')?.textContent||'',
    analysisTier: document.documentElement.dataset.earthlineAnalysisTier||'',
    propertyRunState: document.documentElement.dataset.earthlinePropertyRunState||'',
    propertyTarget: small(window.EARTHLINE_PROPERTY_TARGET_16201||null),
    waterGate: small(window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null),
    handoff: small(window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null),
    publicationAudit: small(window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null),
    runAudit: small(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null),
    publicationBlock: small(window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||m.propertyPublicationBlock16176||null),
    vectorCoverage: small(m.vectorNoBuildCoverage||null),
    provenance: small(m.noBuildProvenance15843||null),
    maskAudit: small(m.prescriptionMaskAudit15870||null),
    frozenClearance: small(m.safetyAudit15806?.frozenClearance16255||m.propertyResultLock15815?.frozenClearance16255||null),
    safetyAudit: small(m.safetyAudit15806||null),
    propertyLock: small(m.propertyResultLock15815||null),
    locationIntegrity: small(m.lastLocationIntegrity15801||window.EARTHLINE_LOCATION_INTEGRITY_15801||null),
    propertyRunFailure: small(m.propertyRunFailure16539||null),
    runtimeLockSource: typeof window.earthlineLockPropertyResult15815==='function'?String(window.earthlineLockPropertyResult15815):null,
    runtimeFilterSource: typeof window.earthlineFilterCorridors15788==='function'?String(window.earthlineFilterCorridors15788):null,
    runtimeAuditSource: typeof window.earthlineAuditCorridorClearance15806==='function'?String(window.earthlineAuditCorridorClearance15806):null
  };
});
console.log(JSON.stringify({TARGET,regionalError,propertyWaitError,pageErrors:errors,snap},null,2));
await browser.close();
