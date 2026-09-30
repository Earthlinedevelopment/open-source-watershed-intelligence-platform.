import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='http://127.0.0.1:8787/';
const OUT='artifacts/mantra50-two-repair'; mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

async function load(){await page.goto(BASE+'?m50candidate='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});}
async function start(q){await page.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.focus();i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);}
async function waitPublished(q,timeout=65000){await page.waitForFunction(query=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(e)return true;const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const name=String(d?.query||d?.name||d?.label||'').toLowerCase();return /screening published\./i.test(s)&&name.includes(String(query).toLowerCase());},q,{timeout,polling:100});}
async function staleSnap(label){return page.evaluate(label=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,o=document.getElementById('earthlineRegionalVectorOverlay16020'),tabs=document.getElementById('earthlineRegionalCorridorTabs16323');return {label,visualQuery:String(v?.query||''),visualToken:String(v?.runToken||''),overlayChildren:o?.childElementCount??-1,tabs:!!tabs,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'')};},label);}

await load();
await start('New Mexico'); await waitPublished('new mexico');
const nm=await staleSnap('nm-published');
await start('Texas');
const transition=[];
for(const delay of [0,25,75,150,300,600,1000]){if(delay)await page.waitForTimeout(delay-transition.reduce((a,x)=>a+x.waited,0));transition.push({...await staleSnap('tx+'+delay),waited:delay});}
await waitPublished('texas');
const tx=await staleSnap('tx-published');
const staleFailures=transition.filter(x=>/new mexico/i.test(x.visualQuery)||x.overlayChildren>0||x.tabs);

await page.reload({waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
await start('Alaska'); await waitPublished('alaska',90000);
const ak=await page.evaluate(()=>{
  const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,p=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
  const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
  const pts=[];
  for(const f of v?.swales?.features||[]){for(const c of f?.geometry?.coordinates||[]){if(Array.isArray(c)&&Number.isFinite(+c[0])&&Number.isFinite(+c[1]))pts.push([+c[0],+c[1]]);}}
  let swaleBounds=null,lonCoverage=0,latCoverage=0;
  if(pts.length&&Array.isArray(v?.bounds)&&v.bounds.length===4){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);swaleBounds=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];const w=Math.max(1e-9,v.bounds[2]-v.bounds[0]),h=Math.max(1e-9,v.bounds[3]-v.bounds[1]);lonCoverage=(swaleBounds[2]-swaleBounds[0])/w;latCoverage=(swaleBounds[3]-swaleBounds[1])/h;}
  return {visualBounds:v?.bounds||null,packageBounds:p?.regionalExtent?.bbox||p?.location?.bbox||null,profileId:p?.profileId||null,grid:flow?.gridAudit?.grid||null,unsafe:flow?.unsafeSegments??null,published:pub?.generated??null,visible:disp?.swaleLines??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,swaleBounds,lonCoverage,latCoverage};
});
await page.screenshot({path:OUT+'/alaska-candidate.png',fullPage:true});
const close=(a,b,t=.03)=>Array.isArray(a)&&Array.isArray(b)&&a.length===4&&b.length===4&&a.every((x,i)=>Math.abs(Number(x)-Number(b[i]))<=t);
const alaskaPass=ak.profileId==='us-ak'&&close(ak.visualBounds,ak.packageBounds)&&Number(ak.grid?.w)===96&&Number(ak.grid?.h)===96&&Number(ak.unsafe)===0&&!ak.lastError&&Number(ak.published)>0&&Number(ak.visible)>0&&Number(ak.lonCoverage)>=0.75&&Number(ak.latCoverage)>=0.75;
const report={nm,transition,tx,staleFailures,ak,alaskaPass,errors};
writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));
console.log('MANTRA50_TWO_REPAIR '+JSON.stringify(report));
await browser.close();
if(staleFailures.length||!alaskaPass||errors.length)process.exitCode=1;
