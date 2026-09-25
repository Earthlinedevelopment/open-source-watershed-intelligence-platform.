import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const fixtures={
  Singapore:{countryCode:'sg',lat:1.3521,lng:103.8198},
  Brunei:{countryCode:'bn',lat:4.5353,lng:114.7277},
  Indonesia:{countryCode:'id',lat:-2.5489,lng:118.0149},
  Philippines:{countryCode:'ph',lat:12.8797,lng:121.7740},
  India:{countryCode:'in',lat:20.5937,lng:78.9629},
  Australia:{countryCode:'au',lat:-25.2744,lng:133.7751},
  'Cabo Verde':{countryCode:'cv',lat:16.5388,lng:-23.0418},
  Comoros:{countryCode:'km',lat:-11.6455,lng:43.3333},
  Mauritius:{countryCode:'mu',lat:-20.3484,lng:57.5522},
  Seychelles:{countryCode:'sc',lat:-4.6796,lng:55.4920}
};
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
  const fixture=fixtures[target]?{name:target,fullName:target,placeType:'country',query:target,...fixtures[target]}:null;
  await page.evaluate(({q,fixture})=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_TEST_LOCATION_16845=fixture;const i=document.getElementById('searchInput');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn').click();},{q:target,fixture});
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
const countryBad=rows.filter(r=>r.kind==='country'&&(r.harnessError||r.error||!r.countryPackage||r.outside!==0||!r.boundaryCapability||!r.runSpan||!r.countrySpan||Math.abs(r.runSpan[0]-r.countrySpan[0])>.02||Math.abs(r.runSpan[1]-r.countrySpan[1])>.02));
console.log(JSON.stringify({summary:{rows:rows.length,usBad:usBad.map(r=>r.target),countryBad:countryBad.map(r=>r.target),islandStatus:rows.filter(r=>r.kind==='island').map(r=>({target:r.target,error:r.error,generated:r.generated,span:r.runSpan,countrySpan:r.countrySpan}))}}));
if(usBad.length||countryBad.length)process.exit(1);
