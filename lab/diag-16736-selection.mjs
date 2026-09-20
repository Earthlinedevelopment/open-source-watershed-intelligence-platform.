import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Louisiana|New York|Colorado').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});const rows=[];
for(const state of STATES){
 const page=await browser.newPage({viewport:{width:1600,height:900}});let error=null;
 try{
  await page.goto(URL+'?diag16736='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
  await page.waitForFunction(expected=>{const p=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;return String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase()&&!!p?.runToken&&/screening published\./i.test(s);},state,{timeout:60000,polling:100});
 }catch(e){error=String(e&&e.message||e);}
 const snap=await page.evaluate(()=>{
   const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,fs=v?.swales?.features||[];
   const b=v?.bounds||null;
   return {
    selection:window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713||null,
    refined:window.EARTHLINE_REFINED_SELECTION_16702||null,
    gap:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,
    coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    generation:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    swales:fs.map(f=>{const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[NaN,NaN],p=f?.properties||{};return {lng:+m[0],lat:+m[1],rank:+p.rank,score:+p.score,grade:p.grade,slope:+p.slope_pct};}),
    bounds:b
   };
 });
 rows.push({state,error,snap});await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),rows};fs.writeFileSync(process.env.OUT||'selection16736.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
