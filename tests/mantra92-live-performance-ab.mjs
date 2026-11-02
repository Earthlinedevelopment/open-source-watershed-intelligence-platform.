import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const html=readFileSync('artifacts/mantra92-hotpath/baseline.html','utf8');
const tokens=['(++yieldCount16661%12)===0','(++finalScreenYield16661%12)===0'];
for(const t of tokens)if(html.split(t).length!==2)throw Error('M92 unsafe or changed owner: '+t);
const variants=[
  {label:'baseline12',content:html},
  {label:'yield384',content:tokens.reduce((s,t)=>s.replace(t,t.replace('%12','%384')),html)}
];
const url='https://earthlinedevelopment.org/';
mkdirSync('artifacts/mantra92-hotpath/results',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
for(const state of ['Arizona','Alaska'])for(const variant of variants){
 const ctx=await browser.newContext({viewport:{width:1800,height:832}}),page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{
  if(route.request().isNavigationRequest()&&route.request().resourceType()==='document'&&route.request().url().startsWith(url))
    return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:variant.content});
  return route.continue();
 });
 let failure=null;const t=Date.now();
 try{
  await page.goto(url+'?m92yield='+variant.label+'-'+state+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:15000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.value=q;
   i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));
   document.getElementById('runBtn').click();},state);
  await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
   !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
  await page.waitForTimeout(500);
 }catch(e){failure=String(e)}
 const snap=await page.evaluate(()=>{
  const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||{},pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||{};
  const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||{};
  let source=null;
  try{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    source=map?.getSource?.('el-live-swales-15970')?._data||null;}catch{}
  const fs=source?.features||[];
  const group=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
  const paths=[...(group?.querySelectorAll(':scope > path')||[])];
  const dark=paths.filter(x=>x.getAttribute('stroke')==='rgba(8,18,13,.96)');
  const darkDots=dark.filter(x=>{
   const w=parseFloat(getComputedStyle(x).strokeWidth)||0;let l=0;try{l=x.getTotalLength()}catch{}
   return w>l&&w>5;
  });
  return {coreMs:p.phaseTotalsMs?.coreTotalMs??null,phases:p.phaseTotalsMs||{},swales:pub.generated??null,
   sourceCount:fs.length,visible:pub.overlaySwaleLines??null,waterPaths:p.waterPaths??null,
   profile:pkg.profileId||null,source:fs.map(f=>({coords:f.geometry?.coordinates||[],slope:f.properties?.slope_pct,grade:f.properties?.grade,score:f.properties?.score})),
   blackDots:darkDots.length,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const hash=createHash('sha256').update(JSON.stringify(snap.source)).digest('hex');
 const row={state,variant:variant.label,ms:snap.coreMs,wall:Date.now()-t,phases:snap.phases,
  swales:snap.swales,sourceCount:snap.sourceCount,visible:snap.visible,water:snap.waterPaths,profile:snap.profile,
  blackDots:snap.blackDots,scienceHash:hash,failure,errors,error:snap.error};
 rows.push(row);console.log('M92_YIELD_COMPARE '+JSON.stringify(row));
 await ctx.close();
}
await browser.close();
const failures=[];
for(const state of ['Arizona','Alaska']){
 const [a,b]=rows.filter(x=>x.state===state);
 if(!a||!b||a.failure||b.failure||a.errors.length||b.errors.length||a.error||b.error)failures.push(state+' runtime');
 if(!(a.swales>0&&a.swales===b.swales&&a.sourceCount===b.sourceCount&&a.visible===b.visible&&a.water===b.water))
  failures.push(state+' science count changed');
 if(a.scienceHash!==b.scienceHash)failures.push(state+' science geometry changed');
 if(!(b.blackDots===0))failures.push(state+' black dots still present');
 if(!(b.ms<=a.ms*1.20+1000))failures.push(state+' candidate slower than reference');
}
writeFileSync('artifacts/mantra92-hotpath/results/compare.json',JSON.stringify({rows,failures},null,2));
console.log('M92_YIELD_GATE '+JSON.stringify({pass:failures.length===0,failures,rows:rows.map(x=>({state:x.state,variant:x.variant,core:x.ms,swales:x.swales,water:x.water,hash:x.scienceHash}))}));
if(failures.length)process.exitCode=1;
