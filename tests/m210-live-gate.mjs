// Read-only connected browser acceptance for M210. Never changes the deployed site.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const locations=[
  {id:'Arizona',lat:34.21527,lng:-111.93335},
  {id:'Iowa',lat:42.13000,lng:-93.68000}
];
mkdirSync('artifacts/m210-live',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const results=[];
for(const loc of locations){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(180000);
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  let data={location:loc,finished:false,swales:null,reason:null};
  try{
    await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForFunction(()=>typeof window.earthlineSetPropertyTarget16201==='function' &&
      typeof window.earthlineDeclarePropertyAtCrosshair16173==='function' &&
      !!window.earthlineMap?.getStyle?.(),null,{timeout:90000});
    data=await page.evaluate(async(t)=>{
      const toNum=v=>Number(v);
      const map=window.earthlineMap;
      map.jumpTo({center:[t.lng,t.lat],zoom:17});
      const target={lng:t.lng,lat:t.lat,source:'connected-m210-browser-gate',at:new Date().toISOString()};
      window.earthlineSetPropertyTarget16201(target,{openPanel:false});
      const result=await Promise.resolve(window.earthlineDeclarePropertyAtCrosshair16173());
      const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
      const published=window.EARTHLINE_DISPLAYED_RUN_16151||{};
      const m=window.M||(typeof M!=='undefined'?M:null);
      const safe=m?.authoritativeSafeSwales15815?.features;
      return {location:t,finished:true,result,audit:{
        settled:audit.settled,result:audit.result,error:audit.error,serial:audit.serial,
        corridors:audit.corridors,center:audit.center,
        sourceEvidence:audit.sourceEvidence,renderMode:audit.renderMode
      },published:{tier:published.tier,center:published.center},
      swales:Array.isArray(safe)?safe.length:null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null};
    },loc,{timeout:180000});
  }catch(e){data.reason=String(e?.message||e)}
  data.consoleErrors=errors;
  try{await page.screenshot({path:'artifacts/m210-live/'+loc.id.toLowerCase()+'.png',fullPage:false,timeout:15000})}catch(e){}
  results.push(data);
  await page.close();
}
await browser.close();
const summary={commit:'a9d4e04e1c00ca74f6fac1c762b0c370c57ef1fc',
  checkedAt:new Date().toISOString(),results,
  hasZeroSwales:results.some(r=>r.swales===0),
  hasPageErrors:results.some(r=>r.consoleErrors?.length),
  incomplete:results.some(r=>!r.finished||r.audit?.settled!==true||r.swales===null)};
writeFileSync('artifacts/m210-live/report.json',JSON.stringify(summary,null,2));
console.log('M210_CONNECT_BROWSER_SUMMARY '+JSON.stringify(summary));
if(summary.hasZeroSwales||summary.hasPageErrors||summary.incomplete)process.exitCode=1;
