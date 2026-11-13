// Reproduce the second-Property transition on the live October lineage.
// Read-only browser probe: first run, reposition, second run, compare declaration,
// target, audit generation, published swale source and renderer ownership.
import {chromium} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const url='https://earthlinedevelopment.org/';
const targets=[
  {name:'arizona-first',lat:34.21568,lng:-111.93067},
  {name:'arizona-second',lat:34.21527,lng:-111.93335}
];
mkdirSync('artifacts/property-repeat',{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
const readings=[];
function distanceMeters(a,b){
  if(!a||!b)return null;
  const x=(a.lng-b.lng)*111320*Math.cos(b.lat*Math.PI/180),y=(a.lat-b.lat)*111320;
  return Math.hypot(x,y);
}
try{
  await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#earthlineDeclareProperty16169',{timeout:60000});
  for(const target of targets){
    const prep=await page.evaluate(t=>{
      const md=window.M||(typeof M!=='undefined'?M:null);
      const setter=window.earthlineSetPropertyTarget16201;
      if(!md||typeof setter!=='function')return {ok:false,reason:'model or target setter unavailable'};
      const ok=setter({lng:t.lng,lat:t.lat,source:'repeat-property-test'},{openPanel:false});
      return {ok,searchGen:md.searchGen};
    },target);
    if(!prep.ok)throw Error('target setup '+JSON.stringify(prep));
    await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());
    try{await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:90000});}
    catch(e){errors.push(target.name+': '+String(e))}
    const item=await page.evaluate(()=>{
      const md=window.M||(typeof M!=='undefined'?M:null);
      return {
        chosen:window.EARTHLINE_PROPERTY_TARGET_16201||null,
        declaration:window.EARTHLINE_PROPERTY_DECLARATION_16169||null,
        audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
        displayed:window.EARTHLINE_DISPLAYED_RUN_16151||null,
        generation:md?.searchGen,
        center:{lng:md?.centerLng,lat:md?.centerLat},
        swales:md?.authoritativeSafeSwales15815?.features?.length??null,
        safety:md?.propertyResultLock15815?.safetyVerified??null
      }
    });
    const actual=item.declaration?.center||item.audit?.center||null;
    item.requested=target;
    item.centerErrorM=distanceMeters(actual,target);
    item.errors=[...errors];
    readings.push(item);
    await page.screenshot({path:'artifacts/property-repeat/'+target.name+'.png',fullPage:false}).catch(()=>{});
  }
}catch(e){errors.push(String(e))}
await browser.close();
const report={targets,readings,errors};
writeFileSync('artifacts/property-repeat/results.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_SECOND_PROPERTY_PROBE '+JSON.stringify({results:readings.map(r=>({requested:r.requested,centerErrorM:r.centerErrorM,swales:r.swales,generation:r.generation,serial:r.audit?.serial,settled:r.audit?.settled,safety:r.safety})),errors}));
const pass=readings.length===2&&readings.every(r=>r.centerErrorM!==null&&r.centerErrorM<=5&&r.audit?.settled===true)&&readings[0].audit?.serial!==readings[1].audit?.serial&&errors.length===0;
if(!pass)process.exitCode=1;
