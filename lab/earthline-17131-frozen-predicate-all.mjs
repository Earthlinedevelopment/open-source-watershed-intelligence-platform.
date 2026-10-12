import { chromium } from 'playwright';

const TARGET=process.env.TARGET||'Cambodia';
const BASE='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
let patched=false;

await page.route('**/*', async route=>{
  const req=route.request();
  if(req.resourceType()==='document' && new globalThis.URL(req.url()).hostname==='earthlinedevelopment.org'){
    const resp=await route.fetch();
    let body=await resp.text();
    const needle=`      const frozenClearance16255=(candidate&&vectorVerified&&finalMaskAvailable&&(!filterIndexAvailable||portableEvidence16544))
        ?earthlineFrozenPropertyClearanceAudit16255(candidate):null;
      const frozenClearanceVerified16255=!!(frozenClearance16255&&frozenClearance16255.verified===true);`;
    const repl=`      const frozenClearance16255=(candidate&&vectorVerified&&finalMaskAvailable&&(!filterIndexAvailable||portableEvidence16544))
        ?earthlineFrozenPropertyClearanceAudit16255(candidate):null;
      window.EARTHLINE_DIAG_17130={
        at:new Date().toISOString(),
        candidate:!!candidate,
        candidateCount:candidate&&candidate.features?candidate.features.length:null,
        filterIndexAvailable,
        auditVerified,
        audited:!!audited,
        acceptedIntersections:Number.isFinite(acceptedIntersections)?acceptedIntersections:null,
        vectorVerified,
        finalMaskAvailable,
        portableEvidence16544,
        vectorCoverage:M&&M.vectorNoBuildCoverage?JSON.parse(JSON.stringify(M.vectorNoBuildCoverage)):null,
        provenance:M&&M.noBuildProvenance15843?JSON.parse(JSON.stringify(M.noBuildProvenance15843)):null,
        maskAudit:M&&M.prescriptionMaskAudit15870?JSON.parse(JSON.stringify(M.prescriptionMaskAudit15870)):null,
        frozenClearance16255:frozenClearance16255?JSON.parse(JSON.stringify(frozenClearance16255)):null
      };
      const frozenClearanceVerified16255=!!(frozenClearance16255&&frozenClearance16255.verified===true);`;
    if(!body.includes(needle))throw new Error('17130 patch target not found');
    body=body.replace(needle,repl); patched=true;
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
    return;
  }
  await route.continue();
});

await page.goto(BASE+'?diag17130='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},TARGET);
await page.waitForFunction(expected=>{
  const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  return !!e||String(d?.query||'').trim().toLowerCase()===String(expected).trim().toLowerCase();
},TARGET,{timeout:95000,polling:100});
const regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
if(!regionalError){
  await page.waitForTimeout(400);
  await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('Property button missing');b.click();});
  await page.waitForFunction(()=>{
    const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return r?.settled===true || !!window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220;
  },{timeout:45000,polling:50});
}
const out=await page.evaluate(()=>({
  diag:window.EARTHLINE_DIAG_17130||null,
  status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
  run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
  pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null
}));
console.log('DIAG17130 '+JSON.stringify({TARGET,patched,regionalError,out}));
await browser.close();
