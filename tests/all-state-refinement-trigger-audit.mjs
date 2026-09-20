import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const STATES=String(process.env.STATES||'').split('|').map(s=>s.trim()).filter(Boolean);
if(!STATES.length)throw new Error('STATES empty');
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL+'?trigger_audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(const state of STATES){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!e||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:40000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(250);
 const snap=await page.evaluate(()=>{const t=window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,f=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {trigger:t,totalMs:p?.totalMs??null,swales:g?.publishedFeatures??null,visible:d?.swaleLines??null,unsafe:f?.unsafeSegments??null,outside:b?.outsideAfterClip?.swales??null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
 const row={state,elapsedMs:Date.now()-started,timedOut,snap};rows.push(row);console.log('EARTHLINE_TRIGGER_AUDIT '+JSON.stringify(row));
}
console.log('EARTHLINE_TRIGGER_AUDIT_SUMMARY '+JSON.stringify(rows));
await browser.close();
