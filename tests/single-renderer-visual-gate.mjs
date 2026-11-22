import {chromium,webkit} from 'playwright';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
const profile=process.env.EARTHLINE_PROFILE||'chrome';
const browser=await (profile==='safari'?webkit:chromium).launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1440,height:900}});
const page=await ctx.newPage();
const html=readFileSync('index.html');
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
await ctx.route('**/*', route=>{
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
 for(let run=1;run<=2;run++){
   await page.evaluate(()=>{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     window.EARTHLINE_COUNTRY_TARGET_LOCK_16845=false;
     map.jumpTo({center:[-75.76996,42.78781],zoom:17});
     map.fire?.('dragend');
   });
   await sleep(5000);
   await page.click('#earthlineDeclareProperty16169',{timeout:25000});
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
     return {tier:document.documentElement.dataset.earthlineAnalysisTier,ready:!!m?.analysisReady,modelSwales:m?.swales?.length,engineVerified:r?.verified,engineSwales:r?.engineSwales,engineHash:r?.determinismHash,
       propertyRenderMode:audit.renderMode||null,safe:safe.map(info),natural:natural.map(info),sourceCount:map.getSource('earthline-property-safe-visible-16221')?._data?.features?.length||null};
   });
   rows.push(row);
   await page.screenshot({path:out+'/run'+run+'.png'});
   console.log('EARTHLINE_SINGLE_RENDERER_RUN '+JSON.stringify({profile,run,...row}));
 }
 writeFileSync(out+'/results.json',JSON.stringify({profile,rows,errors},null,2));
 const a=rows[0],b=rows[1];
 const verified=a?.engineVerified&&b?.engineVerified&&a?.modelSwales===23&&b?.modelSwales===23&&a?.engineHash&&a.engineHash===b.engineHash;
 const displayGood=rows.every(x=>x.safe.length===4&&x.safe.every(l=>l.present&&l.visibility!=='none'&&Number(l.opacity)>=0.9&&l.rendered>0)&&x.natural.every(l=>!l.present||l.visibility==='none'));
 if(!verified||!displayGood||errors.length)throw Error('VISUAL RELEASE GATE FAIL '+JSON.stringify({verified,displayGood,errors}));
 console.log('EARTHLINE_SINGLE_RENDERER_VISUAL_GATE_PASS');
} finally {await browser.close()}
