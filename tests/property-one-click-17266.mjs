import { chromium } from 'playwright';
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const js=readFileSync('earthline-launch-16872.js');
const browser=await chromium.launch({headless:true,channel:'chrome'});
const out='artifacts/property-one-click-17266';mkdirSync(out,{recursive:true});
const cases=[
 {name:'Australia',query:'australia country',pts:[[135.93355,-32.40049],[135.93767,-32.40028]]},
 {name:'Mexico',query:'mexico country',pts:[[-97.66181,19.80368],[-97.66690,19.80549]]}
];
const rows=[];
for(const c of cases){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',r=>r.fulfill({status:200,body:js,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
 await page.goto(BASE+'?onepress17266='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(c.query);await page.waitForTimeout(1200);
 const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
 if(!(await opts.count()))throw new Error('no suggestion '+c.query);
 await opts.first().click();
 const run=page.locator('#runBtn');
 if(await run.isEnabled())await run.click();
 await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:150000,polling:100});
 for(let i=0;i<c.pts.length;i++){
   const [lng,lat]=c.pts[i];
   await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
   await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{
     const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
     if(!m?.jumpTo)return reject(new Error('map unavailable'));
     let done=false;const f=()=>{if(done)return;done=true;resolve()};
     m.once?.('moveend',f);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(f,1800);
   }),{lng,lat});
   await page.waitForTimeout(250);
   const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
   const clickAt=Date.now();
   await page.locator('#earthlineDeclareProperty16169').click();
   let timedOut=false;
   try{await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true;},before,{timeout:180000,polling:150});}catch(_){timedOut=true}
   const snap=await page.evaluate(()=>({
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      repair:window.EARTHLINE_PROPERTY_ONE_PRESS_17266||null,
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null
   }));
   const targetOk=Math.abs(Number(snap.audit?.center?.lng)-lng)<0.002&&Math.abs(Number(snap.audit?.center?.lat)-lat)<0.002;
   const launched=Number(snap.audit?.serial||0)>before;
   const pass=launched&&!timedOut&&snap.audit?.settled===true&&snap.audit?.result===true&&targetOk;
   const row={country:c.name,index:i+1,pass,launched,timedOut,targetOk,elapsedMs:Date.now()-clickAt,...snap,errors:[...errors]};
   rows.push(row);console.log('EARTHLINE_ONE_PRESS_17266 '+JSON.stringify(row));
 }
 await context.close();
}
await browser.close();
const summary={total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.country+'-'+r.index)};
writeFileSync(out+'/results.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_ONE_PRESS_17266_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
