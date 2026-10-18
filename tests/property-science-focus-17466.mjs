import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const browser=await chromium.launch({headless:true});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const sites=[
 {state:'Vermont',name:'VT-A',lat:44.06957,lng:-72.27369},
 {state:'Vermont',name:'VT-B',lat:44.08580,lng:-72.28020},
 {state:'Alabama',name:'AL-A',lat:34.86885128,lng:-86.20674479}
];
const rows=[];
for(const site of sites){
 const page=await browser.newPage({viewport:{width:1800,height:950}});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'?scienceFocus17466='+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(site.state);
 await page.waitForTimeout(600);
 const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
 let clicked=false;
 for(let i=0;i<await opts.count();i++){
   const o=opts.nth(i),q=await o.getAttribute('data-query'),txt=String(await o.textContent()||'');
   if(q===site.state || txt.includes(site.state+' — State / Region')){await o.click();clicked=true;break;}
 }
 if(!clicked){const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();}
 await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
 let focusOk=false,focusError=null;
 try{
  const r=await page.evaluate(async s=>{
   if(typeof window.earthlineFocusRunEngine16158!=='function')throw new Error('focus engine unavailable');
   return await window.earthlineFocusRunEngine16158({center:{lng:s.lng,lat:s.lat},sizeM:3000,label:'Prescription control '+s.name});
  },site);
  focusOk=r!==false;
  await page.waitForFunction(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{}).tier||'').toLowerCase()==='focus',null,{timeout:120000,polling:100});
 }catch(e){focusError=String(e);}
 if(focusOk){
  await page.evaluate(s=>new Promise(resolve=>{
    const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!mp?.jumpTo)return resolve();
    let done=false;const finish=()=>{if(done)return;done=true;resolve()};
    mp.once?.('moveend',finish);mp.jumpTo({center:[s.lng,s.lat],zoom:16.4,bearing:0,pitch:0});setTimeout(finish,1400);
  }),site);
  await page.evaluate(s=>window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'science-focus-17466',code:'',score:0,at:new Date().toISOString()},{openPanel:false}),site);
  await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled&&getComputedStyle(b).display!=='none'},null,{timeout:20000,polling:100});
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(pre=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)>pre,before,{timeout:5000,polling:50}).catch(()=>{});
  await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running'},before,{timeout:120000,polling:100}).catch(()=>{});
 }
 const snap=await page.evaluate(()=>{
  const m=(typeof M!=='undefined'?M:null),safe=m?.authoritativeSafeSwales15815?.features||[],raw=Array.isArray(m?.swales)?m.swales:[];
  const safety=m?.safetyAudit15806||null,cov=m?.coverageDiagnostic15803||null,spacing=m?.spacingStats||null;
  return {
   run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
   rawCount:raw.length,safeCount:safe.length,safety,spacing,
   coverage:cov?{zones:(cov.zones||[]).map(z=>({id:z.id,candidates:z.candidates,accepted:z.accepted,safeCells:z.safeCells,contourCells:z.contourCells})),build:cov.build||null}:null,
   samples:safe.slice(0,10).map(f=>f?.properties||{})
  };
 });
 const unsafe=Number(snap.safety?.unsafeCount??snap.safety?.unsafeSegments??snap.safety?.unsafe??0);
 const pass=focusOk&&snap.run?.result===true&&snap.run?.settled===true&&snap.safeCount>0&&snap.safety?.verified===true&&unsafe===0&&!errors.length;
 rows.push({site,pass,focusOk,focusError,...snap,errors});
 console.log('EARTHLINE_SCIENCE_FOCUS_17466 '+JSON.stringify(rows.at(-1)));
 await page.close();
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts',{recursive:true});writeFileSync('artifacts/science-focus-17466.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_SCIENCE_FOCUS_17466_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
