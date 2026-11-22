import {chromium,webkit} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE||'chrome';
const browser=await (profile==='safari'?webkit:chromium).launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
const html=readFileSync('index.html');
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
if(process.env.EARTHLINE_LIVE!=='1')await ctx.route('**/*', route=>{
 let u;try{u=new URL(route.request().url())}catch(_){return route.continue()}
 if(u.origin==='https://earthlinedevelopment.org'&&(u.pathname==='/'||u.pathname==='/index.html')&&route.request().resourceType()==='document')
   return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html});
 return route.continue();
});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const out='single-renderer-results/'+profile;mkdirSync(out,{recursive:true});
const rows=[];
try {
 await page.goto('https://earthlinedevelopment.org/?single_renderer_trial=20261122',{waitUntil:'domcontentloaded',timeout:60000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.waitForFunction(()=>Boolean((typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap),null,{timeout:45000});
 await sleep(7000);
 const scenario=process.env.EARTHLINE_REGION_SCENARIO||'finished';
 await page.evaluate(()=>{
   const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
   if(!i||!b)throw Error('Missing New York regional search controls');
   i.value='NEW YORK state';
   i.dispatchEvent(new Event('input',{bubbles:true}));
   i.dispatchEvent(new Event('change',{bubbles:true}));
   b.click();
 });
 if(scenario==='finished'){
   let ready=false;const start=Date.now();
   while(Date.now()-start<90000){
     ready=await page.evaluate(()=>{
       const b=document.getElementById('runBtn'),de=document.documentElement;
       return !!b&&!/running|deriving|loading|analy/i.test(String(b.textContent||''))&&
          !/running/i.test(String(de.dataset.earthlineRunState||''));
     });
     if(ready&&Date.now()-start>8000)break;
     await sleep(750);
   }
   if(!ready)throw Error('New York regional search did not settle');
   await sleep(2000);
 }else if(scenario==='midrun'){
   await sleep(15000);
 }else throw Error('unknown regional scenario '+scenario);
 console.log('EARTHLINE_SEARCH_SEQUENCE_PRE_PROPERTY '+JSON.stringify({profile,scenario,region:await page.evaluate(()=>{
   const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
   const d=document.documentElement;return {center:m?.getCenter?.(),tier:d.dataset.earthlineAnalysisTier,runState:d.dataset.earthlineRunState}
 })}));
 for(let run=1;run<=2;run++){
   await page.evaluate(()=>{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
     map.jumpTo({center:[-75.76996,42.78781],zoom:17});
     map.fire?.('dragend');
   });
   await sleep(5000);
   const pre=await page.evaluate(()=>{
     const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
     const c=m?.getCenter?.();
     return {camera:c?{lng:c.lng,lat:c.lat}:null,target:t?{lng:t.lng,lat:t.lat,source:t.source}:null,
       zoom:m?.getZoom?.(),projection:m?.getProjection?.()?.name||null};
   });
   console.log('EARTHLINE_BEFORE_PROPERTY_CLICK '+JSON.stringify({profile,run,pre}));
   // Mirror the proven connected test: wait for actual Property declaration readiness before a real click.
   let pressed=false;const started=Date.now();
   while(Date.now()-started<45000&&!pressed){
     const state=await page.evaluate(()=>{
       const b=document.getElementById('earthlineDeclareProperty16169'),de=document.documentElement;
       return {button:!!b&&getComputedStyle(b).display!=='none'&&!b.disabled&&b.getBoundingClientRect().width>1,
         readyClass:de.classList.contains('earthline-property-ready-16188'),tier:de.dataset.earthlineAnalysisTier,
         propertyState:de.dataset.earthlinePropertyRunState};
     });
     if(state.button&&(state.readyClass||Date.now()-started>20000)){
       await page.click('#earthlineDeclareProperty16169',{timeout:5000});
       pressed=true;break;
     }
     await sleep(350);
   }
   if(!pressed)throw Error('Property button did not become available');
   await page.waitForFunction(()=>{const m=(typeof M!=='undefined'&&M)||window.M;return !!m?.analysisReady&&document.documentElement.dataset.earthlineAnalysisTier==='property';},null,{timeout:90000});
   await sleep(3500);
   const row=await page.evaluate(()=>{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     const m=(typeof M!=='undefined'&&M)||window.M;
     const safe=['earthline-property-safe-casing-16221','earthline-property-safe-earth-16221','earthline-property-safe-life-16221','earthline-property-safe-water-16221'];
     const natural=['earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177'];
     const info=id=>{const l=map.getLayer(id);if(!l)return {id,present:false};let rendered=null;try{rendered=map.queryRenderedFeatures({layers:[id]}).length}catch(e){rendered=-1}return {id,present:true,visibility:map.getLayoutProperty(id,'visibility')||'visible',opacity:map.getPaintProperty(id,'line-opacity'),rendered};};
     const r=window.__EARTHLINE_SWALE_ENGINE_HOOK_16600?.result?.();
     const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
     return {center:map.getCenter(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,tier:document.documentElement.dataset.earthlineAnalysisTier,ready:!!m?.analysisReady,modelSwales:m?.swales?.length,engineVerified:r?.verified,engineSwales:r?.engineSwales,engineHash:r?.determinismHash,
       propertyRenderMode:audit.renderMode||null,sourceStateFingerprint:audit.sourceEvidence?.sourceStateFingerprint||null,scientificInputFingerprint:audit.sourceEvidence?.scientificInputFingerprint||null,sourceHashes:audit.sourceEvidence?.sourceHashes||null,terrainStamp:m?.terrainStamp||null,terrainReady:m?.terrainReady,demReady:m?.demReady,cellM:m?.cellM,safe:safe.map(info),natural:natural.map(info),sourceCount:map.getSource('earthline-property-safe-visible-16221')?._data?.features?.length||null};
   });
   rows.push(row);
   await page.screenshot({path:out+'/run'+run+'.png'});
   console.log('EARTHLINE_SINGLE_RENDERER_RUN '+JSON.stringify({profile,run,...row}));
 }
 writeFileSync(out+'/results.json',JSON.stringify({profile,rows,errors},null,2));
 const a=rows[0],b=rows[1];
 const atNY=x=>Math.abs(x?.center?.lat-42.78781)<0.001&&Math.abs(x?.center?.lng+75.76996)<0.001&&Math.abs(x?.target?.lat-42.78781)<0.001&&Math.abs(x?.target?.lng+75.76996)<0.001;
 const verified=a?.engineVerified&&b?.engineVerified&&a?.modelSwales===23&&b?.modelSwales===23&&a?.engineHash&&a.engineHash===b.engineHash&&atNY(a)&&atNY(b);
 const displayGood=rows.every(x=>x.safe.length===4&&x.safe.every(l=>l.present&&l.visibility!=='none'&&Number(l.opacity)>=0.9&&l.rendered>0)&&x.natural.every(l=>!l.present||l.visibility==='none'));
 if(!verified||!displayGood||errors.length)throw Error('VISUAL RELEASE GATE FAIL '+JSON.stringify({verified,displayGood,errors}));
 console.log('EARTHLINE_SINGLE_RENDERER_VISUAL_GATE_PASS');
} catch(error) {
  try{
    const state=await page.evaluate(()=>{
      const m=(typeof M!=='undefined'&&M)||window.M;
      const b=document.getElementById('earthlineDeclareProperty16169');
      const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
      return {tier:document.documentElement.dataset.earthlineAnalysisTier,
        runState:document.documentElement.dataset.earthlinePropertyRunState,
        analysisReady:m?.analysisReady,swales:m?.swales?.length,
        pageError:m?.propertyRunFailure16539||null,
        center:map?.getCenter?.(),propertyButton:!!b,propertyButtonVisible:b?getComputedStyle(b).display:null,
        propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null};
    });
    console.error('EARTHLINE_SAFARI_FIRST_RUN_DIAGNOSTIC '+JSON.stringify({state,errors,reason:String(error)}));
    writeFileSync(out+'/failure.json',JSON.stringify({state,errors,reason:String(error)},null,2));
    await page.screenshot({path:out+'/failure.png'});
  }catch(_){}
  throw error;
} finally {await browser.close()}
