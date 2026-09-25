import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const TARGETS=(process.env.TARGETS||'').split('|').map(s=>s.trim()).filter(Boolean);
const BATCH=process.env.BATCH||'batch';
const OUTDIR=process.env.OUTDIR||`out-16844-property-${BATCH}`;
if(!TARGETS.length)throw new Error('TARGETS required');
fs.mkdirSync(OUTDIR,{recursive:true});
const safeName=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const browser=await chromium.launch({headless:true});
const rows=[];
for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1800,height:900}});
  let regionalError=null,propertyError=null,wallMs=null;const started=Date.now();
  try{
    await page.goto(URL+`?property-global-16844=${encodeURIComponent(target)}-${Date.now()}`,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY'));
    if(!marker)throw new Error('public page is not 16844');
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},target);
    await page.waitForFunction(expected=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||(String(d?.query||'').trim().toLowerCase()===String(expected).trim().toLowerCase()&&String(d?.tier||d?.mode||'').toLowerCase()==='regional');},target,{timeout:95000,polling:100});
    regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regionalError)throw new Error('regional precursor failed: '+JSON.stringify(regionalError));
    await page.waitForTimeout(400);
    const propStart=Date.now();
    await page.evaluate(()=>{window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220=null;const b=document.getElementById('earthlineDeclareProperty16169');if(!b)throw new Error('Property button missing');b.click();});
    try{
      await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||null;return (a&&a.published===true&&String(d?.tier||d?.mode||'').toLowerCase()==='property')||(a&&a.published===false);},{timeout:45000,polling:100});
    }catch(e){propertyError=String(e?.message||e);}
    wallMs=Date.now()-propStart;
  }catch(e){regionalError=regionalError||String(e?.message||e);}
  const snap=await page.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16149||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const decl=window.EARTHLINE_PROPERTY_DECLARATION_16169||{};
    const target=window.EARTHLINE_PROPERTY_TARGET_16201||{};
    const evidence=(typeof window.earthlineGetExclusionEvidence16516==='function'?window.earthlineGetExclusionEvidence16516():null)||{};
    const status=document.getElementById('earthlineVermontStatus16147')?.textContent||'';
    const regionalBoxes=[...document.querySelectorAll('body *')].filter(el=>{const t=(el.textContent||'').trim();return t&&t.length<250&&/regional opportunity/i.test(t)&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden';}).length;
    const pp=d?.propertyPublication||{};
    return {published:a.published===true,reason:String(a.reason||''),tier:String(d?.tier||d?.mode||''),query:String(d?.query||''),engineCount:Number(a.engineCount??NaN),safeCount:Number(a.safeCount??NaN),publicationCount:Number(a.publicationCount??NaN),safetyVerified:pp.safetyVerified===true,committed:pp.committed===true,displayedSwales:Number(d?.derived?.swaleOpportunityLines??NaN),center:d?.center||null,declarationCenter:decl?.center||null,targetCenter:(Number.isFinite(Number(target?.lng))&&Number.isFinite(Number(target?.lat)))?{lng:Number(target.lng),lat:Number(target.lat)}:null,exclusionLabel:String(evidence?.label||''),exclusionSourceTier:String(evidence?.sourceTier||''),status,regionalBoxes,propertyRunState:String(document.documentElement.dataset.earthlinePropertyRunState||''),analysisTier:String(document.documentElement.dataset.earthlineAnalysisTier||'')};
  }).catch(()=>({}));
  const failures=[];
  if(regionalError)failures.push('regional precursor');
  if(propertyError)failures.push('property timeout/error');
  if(!snap.published)failures.push('property not published');
  if(Number.isFinite(wallMs)&&wallMs>15000)failures.push('property >15s');
  if(snap.tier!=='property')failures.push('canonical tier not property');
  if(snap.committed!==true||snap.safetyVerified!==true)failures.push('property safety/commit');
  if(Number.isFinite(snap.safeCount)&&Number.isFinite(snap.publicationCount)&&snap.safeCount!==snap.publicationCount)failures.push('safe/publication mismatch');
  if(Number.isFinite(snap.displayedSwales)&&Number.isFinite(snap.publicationCount)&&snap.displayedSwales!==snap.publicationCount)failures.push('display/publication mismatch');
  if(snap.regionalBoxes>0)failures.push('regional opportunity UI leakage');
  try{await page.screenshot({path:path.join(OUTDIR,`${safeName(target)}-property.jpg`),type:'jpeg',quality:45,fullPage:false});}catch{}
  const row={target,totalElapsedMs:Date.now()-started,propertyWallMs:wallMs,regionalError,propertyError,snap,failures,pass:failures.length===0};rows.push(row);console.log(JSON.stringify(row));await page.close();
}
await browser.close();
const failed=rows.filter(r=>!r.pass).map(r=>({target:r.target,failures:r.failures,propertyWallMs:r.propertyWallMs,reason:r.snap?.reason||r.propertyError||r.regionalError||null}));
const summary={at:new Date().toISOString(),batch:BATCH,url:URL,build:'EARTHLINE 16844',pass:failed.length===0,failed,rows};fs.writeFileSync(path.join(OUTDIR,'audit.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify({batch:BATCH,pass:summary.pass,failed,targets:rows.length}));if(failed.length)process.exitCode=1;
