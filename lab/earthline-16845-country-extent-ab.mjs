import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const targets=[
  ['Singapore','country'],['Brunei','country'],['Indonesia','country'],['Philippines','country'],['India','country'],['Australia','country'],['Cabo Verde','country'],
  ['Comoros','island'],['Mauritius','island'],['Seychelles','island'],
  ['Vermont','us'],['Arkansas','us'],['Hawaii','us'],['Texas','us']
];
const browser=await chromium.launch({headless:true});
const rows=[];
for(const [target,kind] of targets){
 const page=await browser.newPage({viewport:{width:1600,height:900}}); let harnessError=null;
 try{
  await page.goto(URL+'?ab16845='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},target);
  await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970;const d=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').toLowerCase()===String(q).toLowerCase();},target,{timeout:90000,polling:100});
  await page.waitForTimeout(250);
 }catch(e){harnessError=String(e?.message||e);}
 const row=await page.evaluate(({target,kind,harnessError})=>{
  const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
  const run=window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
  const country=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
  const active=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
  const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  const b=run?.bounds||null, cb=country?.regionalExtent?.bbox||null;
  const span=x=>Array.isArray(x)?[+(x[2]-x[0]).toFixed(4),+(x[3]-x[1]).toFixed(4)]:null;
  const fallbackVisible=pub?.rendered ?? pub?.generated ?? 0;
  return {target,kind,harnessError,error:err&&String(err.error||err.message||err),runBounds:b,countryBounds:cb,runSpan:span(b),countrySpan:span(cb),
    countryPackage:!!country,activeKind:active?.packageKind||'us-state-or-none',boundaryCapability:boundary?.capability||boundary?.source||null,
    generated:Number(pub?.generated||0),visible:Number(pub?.visible ?? fallbackVisible),outside:Number(pub?.outsideJurisdiction??pub?.outside??0),unsafe:Number(pub?.unsafeDisplayedSegments??pub?.unsafe??0),totalMs:Number(perf?.totalMs||0)};
 },{target,kind,harnessError});
 rows.push(row);console.log(JSON.stringify(row)); await page.close();
}
await browser.close();
const usBad=rows.filter(r=>r.kind==='us'&&(r.harnessError||r.error||r.outside!==0||r.unsafe!==0||r.countryPackage));
const countryBad=rows.filter(r=>r.kind==='country'&&(r.harnessError||r.error||!r.countryPackage||r.outside!==0||!r.boundaryCapability));
console.log(JSON.stringify({summary:{rows:rows.length,usBad:usBad.map(r=>r.target),countryBad:countryBad.map(r=>r.target),islandStatus:rows.filter(r=>r.kind==='island').map(r=>({target:r.target,error:r.error,generated:r.generated,span:r.runSpan,countrySpan:r.countrySpan}))}}));
if(usBad.length||countryBad.length)process.exit(1);
