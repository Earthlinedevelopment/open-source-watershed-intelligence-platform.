import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGET=process.env.TARGET;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
let regionalError=null,propertyWaitError=null;
await page.goto(URL+'?safetycompare17126='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},TARGET);
await page.waitForFunction(expected=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||(String(d?.query||'').trim().toLowerCase()===String(expected).trim().toLowerCase()&&String(d?.tier||d?.mode||'').toLowerCase()==='regional');},TARGET,{timeout:95000,polling:100});
regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
if(!regionalError){
  await page.waitForTimeout(500);
  await page.evaluate(()=>{window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('Property button missing');b.click();});
  try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,s=document.getElementById('earthlineVermontStatus16147')?.textContent||'';return !!a||r?.settled===true||/PROPERTY ANALYSIS (STOPPED|FAILED|BLOCKED)/i.test(s);},{timeout:38000,polling:100});}catch(e){propertyWaitError=String(e?.message||e)}
}
const out=await page.evaluate(()=>{
  const m=window.M||{};
  const prim=o=>Object.fromEntries(Object.entries(o||{}).filter(([k,v])=>v==null||['string','number','boolean'].includes(typeof v)));
  const audit=m.safetyAudit15806||{};
  const lock=m.propertyResultLock15815||{};
  const clear=audit.clearance||{};
  const prov=m.noBuildProvenance15843||{};
  const cov=m.vectorNoBuildCoverage||{};
  return {
    status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
    run:prim(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{}),
    publication:prim(window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{}),
    safetyAudit:prim(audit),
    propertyLock:prim(lock),
    clearance:prim(clear),
    provenance:prim(prov),
    vectorCoverage:prim(cov),
    frozenClearance:audit.frozenClearance16255||lock.frozenClearance16255||null,
    maskAudit:prim(m.prescriptionMaskAudit15870||{}),
    propertyFailure:prim(m.propertyRunFailure16539||{}),
    exclusionEvidence:typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null
  };
});
console.log('SAFETY_COMPARE_17126 '+JSON.stringify({TARGET,regionalError,propertyWaitError,out}));
await browser.close();
