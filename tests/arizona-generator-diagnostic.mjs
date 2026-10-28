import { chromium } from 'playwright';
import { installCandidateOrigin } from './candidate-origin-router.mjs';
const BASE=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1798,height:831}});
await installCandidateOrigin(context);
const page=await context.newPage();
await page.goto(BASE+'?az_gen_diag='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
  await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
  await page.waitForTimeout(200);
}
await page.locator('#searchInput').fill('Arizona');
await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Arizona/i}).first();
if(await opt.count())await opt.click().catch(()=>{});
await page.evaluate(()=>document.getElementById('runBtn')?.click());
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:150});
const target={lng:-111.93331,lat:34.21526};
await page.evaluate(t=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[t.lng,t.lat],zoom:16.59});
  try{m.fire?.('dragend')}catch(_){}
},target);
await page.waitForFunction(t=>{
  const p=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return !!p&&Math.abs(Number(p.lng)-t.lng)<0.00008&&Math.abs(Number(p.lat)-t.lat)<0.00008;
},target,{timeout:15000,polling:100});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.locator('#earthlineDeclareProperty16169').click();
await page.waitForFunction(prev=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true&&Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>prev,before,{timeout:90000,polling:120});
await page.waitForTimeout(800);
const diag=await page.evaluate(()=>{
  const md=(typeof M!=='undefined'&&M)||window.M||{};
  const pick={};
  for(const k of Object.keys(md)){
    if(/swale|safe|flow|candidate|trace|eligible|slope/i.test(k)){
      const v=md[k];
      if(v==null||['string','number','boolean'].includes(typeof v)) pick[k]=v;
      else if(Array.isArray(v)) pick[k]={type:'array',length:v.length,sample:v.slice(0,5)};
      else if(typeof v==='object'){
        try{
          const j=JSON.parse(JSON.stringify(v));
          const raw=JSON.stringify(j);
          pick[k]=raw.length<20000?j:{keys:Object.keys(v),jsonLength:raw.length};
        }catch(_){pick[k]={keys:Object.keys(v)}}
      }
    }
  }
  return {
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    lock:md.propertyResultLock15815||null,
    swaleMeta:md.swaleMeta||null,
    swaleDiagnostics:md.swaleDiagnostics||null,
    flowFirstPlacement15836:md.flowFirstPlacement15836||null,
    traceSafeCache16320:md.earthlineTraceSafeCache16320||null,
    authoritativeProperty:md.authoritativePropertySwales15800||null,
    authoritativeSafe:md.authoritativeSafeSwales15815||null,
    selectedKeys:pick
  };
});
console.log('EARTHLINE_AZ_GENERATOR_DIAG '+JSON.stringify(diag));
await browser.close();
