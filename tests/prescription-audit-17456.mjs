import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const queries=['Vermont','Alabama','Texas'];
const rows=[];
for(const query of queries){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  const page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?prescriptionAudit17456='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill(query);await page.waitForTimeout(800);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(await opts.count())await opts.first().click();
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
  const label=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
  await label.waitFor({state:'visible',timeout:30000});await label.click({force:true});
  await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000,polling:100});
  await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
  await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000,polling:100});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,before,{timeout:5000,polling:50});
  await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'},before,{timeout:120000,polling:100});
  await page.waitForTimeout(600);
  const snap=await page.evaluate(()=>{
    const m=(typeof M!=='undefined'?M:null);
    const safe=m?.authoritativeSafeSwales15815?.features||[];
    const raw=Array.isArray(m?.swales)?m.swales:[];
    const props=safe.slice(0,5).map(f=>f?.properties||{});
    return {
      run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      rawCount:raw.length,
      safeCount:safe.length,
      safety:m?.safetyAudit15806||null,
      publication:m?.propertyPublication15816||window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      spacing:m?.spacingStats||null,
      swaleMeta:m?.swaleMeta||null,
      coverage:m?.coverageDiagnostic15803||null,
      supportedCapacity:window.EARTHLINE_SUPPORTED_CAPACITY_16843||null,
      featurePropertySamples:props
    };
  });
  const unsafe=Number(snap.safety?.unsafeCount??snap.safety?.unsafeSegments??snap.safety?.unsafe??0);
  const verified=snap.safety?.verified===true;
  const pass=snap.run?.result===true&&snap.run?.settled===true&&snap.safeCount>0&&verified&&unsafe===0&&!errors.length;
  const row={query,pass,...snap,errors};rows.push(row);
  console.log('EARTHLINE_PRESCRIPTION_AUDIT_17456 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/prescription-audit-17456.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_PRESCRIPTION_AUDIT_17456_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
