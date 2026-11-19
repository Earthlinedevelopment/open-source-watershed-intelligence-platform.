import {chromium,webkit,devices} from 'playwright';
import {mkdirSync,writeFileSync} from 'node:fs';
const URL='https://earthlinedevelopment.org/?repeat_owner_diagnostic=1';
const profiles=[
 ['chrome',chromium,{viewport:{width:1440,height:900}}],
 ['android',chromium,{...devices['Pixel 7']}],
 ['safari',webkit,{viewport:{width:1440,height:900}}]
];
mkdirSync('artifacts/property-repeat-owner',{recursive:true});
const all=[];
for(const [name,engine,options] of profiles){
 let browser,context,page;
 const result={profile:name,attempts:[],errors:[]};
 try{
  browser=await engine.launch({headless:true});
  context=await browser.newContext(options);
  page=await context.newPage();
  page.on('pageerror',e=>result.errors.push('pageerror: '+String(e).slice(0,240)));
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForTimeout(6000);
  for(let run=1;run<=2;run++){
   await page.evaluate(()=>{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     if(!map)throw Error('map unavailable');
     map.jumpTo({center:[-111.93073,34.21572],zoom:17});
   });
   await page.waitForTimeout(5000);
   const before=await page.evaluate(snapshot);
   const btn=page.locator('#earthlineDeclareProperty16169');
   await btn.waitFor({state:'attached',timeout:15000});
   await btn.click({timeout:15000,force:true});
   const during=[];
   for(let i=0;i<120;i++){
     await page.waitForTimeout(500);
     const s=await page.evaluate(snapshot);
     if(i%4===0||s.audit?.settled)during.push(s);
     if(s.audit?.settled && s.tier==='property' && s.propertyState!=='running' && i>7)break;
   }
   await page.waitForTimeout(2500);
   const after=await page.evaluate(snapshot);
   result.attempts.push({run,before,after,during});
   console.log('EARTHLINE_REPEAT_OWNER '+JSON.stringify({profile:name,run,before,after}));
   await page.screenshot({path:'artifacts/property-repeat-owner/'+name+'-run'+run+'.png'}).catch(()=>{});
  }
 }catch(e){result.error=String(e);console.log('EARTHLINE_REPEAT_OWNER_ERROR '+JSON.stringify({profile:name,error:result.error}));}
 finally{await context?.close().catch(()=>{});await browser?.close().catch(()=>{});}
 all.push(result);
}
writeFileSync('artifacts/property-repeat-owner/results.json',JSON.stringify(all,null,2));
function snapshot(){
 const md=(typeof M!=='undefined'&&M)||window.M||null;
 const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
 let source=null;
 try{const s=map?.getSource?.('el-live-swales-15970');const d=s?._data||s?.serialize?.()?.data;source=d?.features?.length??null;}catch(_){}
 const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
 const data={tier:document.documentElement.dataset.earthlineAnalysisTier||null,propertyState:document.documentElement.dataset.earthlinePropertyRunState||null,
 runState:document.documentElement.dataset.earthlineRunState||null,source,
 swales:Array.isArray(md?.swales)?md.swales.length:null,ready:!!md?.analysisReady,
 loc:md?.loc?.name||null,center:map?.getCenter?.()?.toArray?.()||null,
 audit:audit?{settled:audit.settled,result:audit.result,error:audit.error?String(audit.error):null}:null,
 status:document.getElementById('earthlineVermontStatus16147')?.textContent?.trim().slice(0,160)||null};
 for(const [key,val] of Object.entries(window)){
  if(/^EARTHLINE_/.test(key)&&/PROPERTY|EXCLUSION|RUN_TOKEN|LAND_VALIDITY|CORRIDOR|ATOMIC|OWNER|WATER_SIDECAR/i.test(key)){
   if(val&&typeof val==='object'){
    let o={};for(const k of Object.keys(val).slice(0,45)){
     const v=val[k];if(typeof v==='number'||typeof v==='boolean'||typeof v==='string'||v==null)o[k]=v;
     else if(Array.isArray(v))o[k]='array:'+v.length;
    }data[key]=o;
   }
  }
 }
 return data;
}
