import { webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const STATES=(process.env.STATES||'Texas|Vermont').split('|');
mkdirSync('artifacts/browser-profile-17276',{recursive:true});
const browser=await webkit.launch({headless:true});
const rows=[];
for(const query of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:950}});
  const t0=Date.now(),errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  await page.goto(BASE+'?profile17276='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);
  await page.waitForFunction(q=>{
    const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return /screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&!!root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
  },query,{timeout:90000,polling:100});
  const a=await page.evaluate(()=>({
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,
    supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null,
    fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16782||null,
    pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
    boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null
  }));
  const row={query,wallMs:Date.now()-t0,coreMs:a.perf?.totalMs??null,phaseTotalsMs:a.perf?.phaseTotalsMs??null,refinementTiming:a.root?.refinementTiming??null,refinementFlags:a.root?.refinementFlags??null,supertile:a.supertile?{elapsedMs:a.supertile.elapsedMs,gaps:a.supertile.gaps,groups:a.supertile.groups,added:a.supertile.added,failed:a.supertile.failed}:null,generated:a.pub?.generated??null,visible:a.display?.swaleLines??a.pub?.overlaySwaleLines??null,unsafe:a.flow?.unsafeSegments??null,outside:a.boundary?.outsideAfterClip??null,pageErrors:errors};
  rows.push(row); console.log('EARTHLINE_BROWSER_PROFILE_17276 '+JSON.stringify(row));
  await page.close();
}
await browser.close();
writeFileSync('artifacts/browser-profile-17276/webkit.json',JSON.stringify(rows,null,2));
