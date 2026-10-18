import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const cases=[
 {name:'Alabama',lng:-86.20674479,lat:34.86885128,expect:[]},
 {name:'Vermont',lng:-73.195,lat:44.4825,expect:['vermont']},
 {name:'Thailand',lng:101.43,lat:14.3475,expect:['thailand']}
];
const rows=[];
for(const c of cases){
 const context=await browser.newContext({viewport:{width:1400,height:850}});
 const page=await context.newPage();
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'?elderUnit17475='+BROWSER+'-'+c.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097&&!!(window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null)),null,{timeout:30000});
 await page.evaluate(c=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
   m?.jumpTo?.({center:[c.lng,c.lat],zoom:8,bearing:0,pitch:0});
   document.documentElement.dataset.earthlineAnalysisTier='regional';
   const b=[c.lng-1,c.lat-1,c.lng+1,c.lat+1],token='elder-unit-'+c.name.toLowerCase();
   window.EARTHLINE_ACTIVE_RUN_TOKEN_16151=token;
   window.EARTHLINE_DISPLAYED_RUN_16151={runToken:token,query:c.name,tier:'regional',bounds:b};
   window.EARTHLINE_REGIONAL_VISUAL_DATA_16020={query:c.name,bounds:b};
   window.__ELDER_FETCHES_17475=[];
   const original=window.fetch.bind(window);
   window.fetch=(input,init)=>{
     const u=String(typeof input==='string'?input:input?.url||'');
     if(/data\/elder-trees\/v2\//.test(u))window.__ELDER_FETCHES_17475.push(u);
     return original(input,init);
   };
 },c);
 await page.waitForTimeout(120);
 const start=Date.now();
 let result=null,thrown=null;
 try{result=await page.evaluate(async()=>await window.EARTHLINE_ELDER_TREES_V1_17097.refresh())}catch(e){thrown=String(e)}
 const elapsedMs=Date.now()-start;
 const snap=await page.evaluate(()=>({
   last:window.EARTHLINE_ELDER_TREE_LAST_17097||null,
   fetches:window.__ELDER_FETCHES_17475||[]
 }));
 const ids=snap.last?.summary?.coverageDatasetIds||[];
 const datasetFetches=snap.fetches.filter(u=>/\.geojson(?:\?|$)/.test(u));
 const expectedOk=c.expect.every(id=>ids.includes(id));
 const exactCoverage=ids.length===c.expect.length&&ids.every(id=>c.expect.includes(id));
 const expectedFiles=c.expect.map(id=>'data/elder-trees/v2/'+id+'.geojson');
 const exactFetches=datasetFetches.length===expectedFiles.length&&datasetFetches.every(u=>expectedFiles.some(f=>u.endsWith(f)));
 const alabamaNoStatic=c.name!=='Alabama'||datasetFetches.length===0;
 const pass=!thrown&&elapsedMs<=3000&&expectedOk&&exactCoverage&&exactFetches&&alabamaNoStatic&&!errors.length;
 const row={browser:BROWSER,name:c.name,pass,elapsedMs,expectedOk,exactCoverage,exactFetches,alabamaNoStatic,ids,datasetFetches,fetches:snap.fetches,last:snap.last,errors,thrown};
 rows.push(row);console.log('EARTHLINE_ELDER_UNIT_17475 '+JSON.stringify(row));
 await context.close();
}
await browser.close();
const summary={browser:BROWSER,total:rows.length,pass:rows.filter(r=>r.pass).length,fail:rows.filter(r=>!r.pass).length,rows};
mkdirSync('artifacts/elder-unit-17475',{recursive:true});writeFileSync('artifacts/elder-unit-17475/'+BROWSER+'.json',JSON.stringify(summary,null,2));
console.log('EARTHLINE_ELDER_UNIT_17475_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
