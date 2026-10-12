import { chromium } from 'playwright';

const TARGET=process.env.TARGET;
const BASE='https://earthlinedevelopment.org/';
if(!TARGET) throw new Error('TARGET required');

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
let patched=false;

await page.route('**/*', async route=>{
  const req=route.request();
  let host='';
  try{host=(new globalThis.URL(req.url())).hostname}catch{}
  if(req.resourceType()==='document' && host==='earthlinedevelopment.org'){
    const resp=await route.fetch();
    let body=await resp.text();
    const old1=`      const frozenClearance16255=(candidate&&vectorVerified&&finalMaskAvailable&&(!filterIndexAvailable||portableEvidence16544))
        ?earthlineFrozenPropertyClearanceAudit16255(candidate):null;
      const frozenClearanceVerified16255=!!(frozenClearance16255&&frozenClearance16255.verified===true);`;
    const neu1=`      let frozenCandidate16255=candidate;
      let frozenRejected16255=0;
      let frozenClearance16255=null;
      if(candidate&&vectorVerified&&finalMaskAvailable&&(!filterIndexAvailable||portableEvidence16544)){
        const kept16255=[];
        for(const feature16255 of candidate.features){
          const single16255={type:"FeatureCollection",features:[feature16255]};
          const oneAudit16255=earthlineFrozenPropertyClearanceAudit16255(single16255);
          if(oneAudit16255&&oneAudit16255.verified===true)kept16255.push(feature16255);
          else frozenRejected16255++;
        }
        frozenCandidate16255={type:"FeatureCollection",features:kept16255};
        frozenClearance16255=earthlineFrozenPropertyClearanceAudit16255(frozenCandidate16255);
        if(frozenClearance16255)frozenClearance16255.rejectedUnsafeCorridors17132=frozenRejected16255;
      }
      window.EARTHLINE_DIAG_17132={candidateCount:candidate?.features?.length||0,keptCount:frozenCandidate16255?.features?.length||0,rejectedUnsafeCorridors:frozenRejected16255};
      const frozenClearanceVerified16255=!!(frozenClearance16255&&frozenClearance16255.verified===true);`;
    const old2=`        collection=JSON.parse(JSON.stringify(frozenClearanceVerified16255?candidate:audited));`;
    const neu2=`        collection=JSON.parse(JSON.stringify(frozenClearanceVerified16255?(frozenCandidate16255||candidate):audited));`;
    if(!body.includes(old1)||!body.includes(old2))throw new Error('17132 patch target not found');
    body=body.replace(old1,neu1).replace(old2,neu2);
    patched=true;
    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
    return;
  }
  await route.continue();
});

await page.goto(BASE+'?repair17132='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},TARGET);
await page.waitForFunction(q=>{
  const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();
},TARGET,{timeout:95000,polling:100});
const regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
let propertyWaitError=null;
if(!regionalError){
  await page.waitForTimeout(400);
  await page.evaluate(()=>{window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('Property button missing');b.click();});
  try{
    await page.waitForFunction(()=>{
      const r=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
      const s=document.getElementById('earthlineVermontStatus16147')?.textContent||'';
      return !!p||r?.settled===true||/PROPERTY ANALYSIS (STOPPED|FAILED|BLOCKED)/i.test(s);
    },{timeout:45000,polling:50});
  }catch(e){propertyWaitError=String(e?.message||e)}
}
const out=await page.evaluate(()=>({
  diag:window.EARTHLINE_DIAG_17132||null,
  status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
  run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
  block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
  safety:(window.M&&window.M.safetyAudit15806)||null
}));
console.log('REPAIR17132 '+JSON.stringify({TARGET,patched,regionalError,propertyWaitError,out}));
const pass=!!(out.pub?.published===true && out.run?.result===true && Number(out.pub?.publicationCount||0)>0 && out.safety?.verified===true);
await browser.close();
if(!pass)process.exitCode=1;
