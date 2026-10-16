import { chromium,firefox,webkit } from 'playwright';
import { readFileSync,mkdirSync,writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=!/^(0|false|no)$/i.test(String(process.env.HEADLESS||'true'));
const browserType=BROWSER==='firefox'?firefox:BROWSER==='webkit'?webkit:chromium;
const launch={headless:HEADLESS};if(BROWSER==='chrome')launch.channel='chrome';if(BROWSER==='edge'||BROWSER==='msedge')launch.channel='msedge';
const js=readFileSync('earthline-launch-16872.js');
const browser=await browserType.launch(launch);
const out='artifacts/property-first-click-17265/'+BROWSER;mkdirSync(out,{recursive:true});
const cases=[
 {name:'Mexico',query:'mexico country',pts:[[-97.66181,19.80368],[-97.66690,19.80549]]},
 {name:'Australia',query:'australia country',pts:[[135.93355,-32.40049],[135.93767,-32.40028]]}
];
const rows=[];
for(const c of cases){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.route('https://earthlinedevelopment.org/earthline-launch-16872.js*',r=>r.fulfill({status:200,body:js,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}}));
 await page.goto(BASE+'?firstclick17265='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.locator('#searchInput').fill(c.query);await page.waitForTimeout(1200);
 const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!(await opts.count()))throw new Error('no suggestion '+c.query);
 await opts.first().click();await page.locator('#runBtn').click();
 await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
 for(let i=0;i<c.pts.length;i++){
   const [lng,lat]=c.pts[i];
   await page.locator('#map').dispatchEvent('pointerdown',{bubbles:true,clientX:900,clientY:420,pointerType:'mouse',button:0});
   await page.evaluate(({lng,lat})=>new Promise((resolve,reject)=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!m?.jumpTo)return reject(new Error('map unavailable'));let done=false;const f=()=>{if(done)return;done=true;resolve()};m.once?.('moveend',f);m.jumpTo({center:[lng,lat],zoom:16.78,bearing:0,pitch:0});setTimeout(f,1800)}),{lng,lat});
   await page.waitForTimeout(250);
   const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
   const clickAt=Date.now();
   await page.locator('#earthlineDeclareProperty16169').click();
   let timedOut=false;
   try{await page.waitForFunction(pre=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>pre&&a?.settled===true;},before,{timeout:180000,polling:150});}catch(_){timedOut=true}
   const snap=await page.evaluate(()=>({
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      preflight:window.EARTHLINE_PROPERTY_FIRST_CLICK_17265||null,
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      swales:Array.isArray(M?.swales?.features)?M.swales.features.length:Array.isArray(M?.swales)?M.swales.length:null
   }));
   const targetOk=Math.abs(Number(snap.target?.lng)-lng)<0.002&&Math.abs(Number(snap.target?.lat)-lat)<0.002;
   const pass=!timedOut&&snap.audit?.settled===true&&snap.audit?.result===true&&snap.audit?.renderVerified===true&&targetOk;
   const row={country:c.name,index:i+1,browser:BROWSER,pass,timedOut,elapsedMs:Date.now()-clickAt,targetOk,...snap,errors:[...errors]};
   rows.push(row);console.log('EARTHLINE_FIRST_CLICK_17265 '+JSON.stringify(row));
   await page.screenshot({path:`${out}/${c.name.toLowerCase()}-${i+1}.png`,animations:'disabled'});
   await page.waitForTimeout(400);
 }
 await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>r.country+'-'+r.index)};
writeFileSync(out+'/results.json',JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_FIRST_CLICK_17265_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
