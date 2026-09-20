import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=['Texas','Louisiana','Florida','New York','Colorado','California'];
const tests={
  Texas:p=>p.lng>-99.7&&p.lat<31.3,
  Louisiana:p=>p.lat<30.9,
  Florida:p=>p.lat<28.8,
  'New York':p=>p.lat<42.45,
  Colorado:p=>p.lng>-104.75,
  California:p=>p.lng>-123.3&&p.lng<-121.0&&p.lat>36.7&&p.lat<39.5
};
const browser=await chromium.launch({headless:true});const rows=[];
for(const state of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let error=null;
  try{
    await page.goto(URL+'?reported16734='+encodeURIComponent(state)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||''),pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      return String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase()&&!!pub?.runToken&&/screening published\./i.test(status);
    },state,{timeout:60000,polling:100});
  }catch(e){error=String(e&&e.message||e);}
  const snap=await page.evaluate(()=>{
    const fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    return {points:fs.map(f=>{const c=f?.geometry?.coordinates||[],m=c[Math.floor((c.length-1)/2)]||[NaN,NaN];return {lng:+m[0],lat:+m[1],grade:String(f?.properties?.grade||''),rank:+(f?.properties?.rank||0),score:+(f?.properties?.score||0)};}).filter(p=>Number.isFinite(p.lng)&&Number.isFinite(p.lat)),coverage:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,refine:window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null};
  });
  const inRegion=snap.points.filter(tests[state]);rows.push({state,error,total:snap.points.length,reportedRegionCount:inRegion.length,reportedRegion:inRegion,coverage:snap.coverage,refine:snap.refine,totalMs:snap.perf?.totalMs??null});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows};fs.writeFileSync(process.env.OUT||'reported-regions.json',JSON.stringify(out,null,2));console.log(JSON.stringify(out));
