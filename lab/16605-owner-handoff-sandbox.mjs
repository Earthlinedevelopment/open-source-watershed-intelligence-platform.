import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const source=await (await fetch(URL+'?sandbox-source='+Date.now(),{headers:{'cache-control':'no-cache'}})).text();
if(!source.includes('lineSafe16584(retrySmooth16584)')) throw new Error('16603 public source missing');
if(source.includes('EARTHLINE 16605')) throw new Error('public source unexpectedly contains 16605');

const oldMin=`      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}\n      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}`;
const newMin=`      /* EARTHLINE 16605 SANDBOX — no public mutation */\n      const minSpan16605=pt==='country'?.02:1.8;\n      if(w<minSpan16605){const d=(minSpan16605-w)/2;b[0]-=d;b[2]+=d;}\n      if(h<minSpan16605){const d=(minSpan16605-h)/2;b[1]-=d;b[3]+=d;}`;
const oldCap=`    if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
const newCap=`    if(w>18){const c=pt==='country'&&Number.isFinite(lng)?lng:(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=pt==='country'&&Number.isFinite(lat)?lat:(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}`;
if(!source.includes(oldMin)||!source.includes(oldCap))throw new Error('baseline extent source not found');
let extent=source.replace(oldMin,newMin).replace(oldCap,newCap);
const settleNeedle=`  async function settleRegionalCamera(m,b,runToken){\n    if(!isCurrentRun(runToken))return false;\n    if(!m)return;`;
if(!extent.includes(settleNeedle))throw new Error('settle owner source not found');
const handoff=extent.replace(settleNeedle,`  async function settleRegionalCamera(m,b,runToken){\n    if(!isCurrentRun(runToken))return false;\n    if(!m)return;\n    /* SANDBOX OWNER HANDOFF: Regional camera takes ownership from search framing. */\n    earthlineCancelSearchCameraLock();`);

const TARGETS=[
 {name:'Barbados',type:'country'},
 {name:'Portugal',type:'country'},
 {name:'Peru',type:'country'},
 {name:'Thailand',type:'country'},
 {name:'New Zealand',type:'country'},
 {name:'Tuvalu',type:'country'},
 {name:'Canada',type:'country'},
 {name:'Vermont',type:'region'}
];

const browser=await chromium.launch({headless:true});

async function runOne(variant,name,type,html){
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage();
 await page.route('https://earthlinedevelopment.org/**',async route=>{
   const req=route.request();let u;try{u=new URL(req.url())}catch(_){return route.continue()}
   if(req.resourceType()==='document'&&u.hostname==='earthlinedevelopment.org'&&u.pathname==='/'){
     return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html,headers:{'cache-control':'no-store'}});
   }
   return route.continue();
 });
 let error=null, snap=null;
 try{
   await page.goto(URL+'?candidate='+variant+'-'+encodeURIComponent(name),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:30000});
   await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
   await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
   await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
   const picked=await page.evaluate(({name,type})=>{
     const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
     const want=type==='country'?/country/i:/state|region/i;
     const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
     const b=opts.find(x=>want.test(x.textContent||'')&&(norm(x.dataset.query||'')===norm(name)||norm(x.textContent||'').includes(norm(name))));
     if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
   },{name,type});
   if(!picked)throw new Error('selection missing');
   await page.waitForFunction(()=>{
     const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
     const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
     const busy=document.getElementById('runBtn')?.disabled;
     return /ANALYSIS FAILED|Regional screening published/i.test(s)||(!busy&&/regional/i.test(String(d.tier||d.mode||'')));
   },null,{timeout:50000,polling:200});
   await page.waitForTimeout(1000);
   snap=await page.evaluate(()=>{
     const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
     const canvas=map?.getCanvas?.();const rect=canvas?.getBoundingClientRect?.();
     const style=map?.getStyle?.();const layers=Array.isArray(style?.layers)?style.layers:[];
     let rendered=null;try{rendered=map?.queryRenderedFeatures?.()?.length??null}catch(_){}
     const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
     const rs=d?.renderSettlement||null;
     const ca=window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null;
     const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
     const lg=window.EARTHLINE_LAND_VALIDITY_GRID_16584||null;
     const va=window.EARTHLINE_LAND_VALIDITY_16584||null;
     const loc=(typeof M!=='undefined'&&M.loc)?JSON.parse(JSON.stringify(M.loc)):null;
     let b=null;try{b=typeof analysisBounds==='function'?analysisBounds(M.loc):null}catch(_){}
     const c=map?.getCenter?.();
     return {loc,analysisBounds:b,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),displayed:d,renderSettlement:rs,cameraAudit:ca,flowAudit:fa,landGrid:lg,landValidity:va,map:{exists:!!map,styleLoaded:map?.isStyleLoaded?.()??null,canvas:{w:rect?.width||0,h:rect?.height||0,display:canvas?getComputedStyle(canvas).display:null,visibility:canvas?getComputedStyle(canvas).visibility:null,opacity:canvas?getComputedStyle(canvas).opacity:null},layerCount:layers.length,rendered,center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.()??null}};
   });
 }catch(e){error=String(e);try{snap=await page.evaluate(()=>({status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null}))}catch(_){}}
 const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
 await page.screenshot({path:`/tmp/sandbox-${variant}-${slug}.png`,fullPage:true}).catch(()=>{});
 await context.close();
 const pass=!!(snap&&/Regional screening published/i.test(snap.status||'')&&snap.map?.exists&&snap.map?.canvas?.w>300&&snap.map?.canvas?.h>250&&Number(snap.flowAudit?.unsafeSegments??snap.flowAudit?.unsafeDisplayedSegments??0)===0);
 return {variant,name,type,pass,error,snap};
}

const rows=[];
for(const [variant,html] of [['extent',extent],['handoff',handoff]]){
  for(const t of TARGETS)rows.push(await runOne(variant,t.name,t.type,html));
}
await fs.writeFile('/tmp/earthline-16605-owner-handoff-sandbox.json',JSON.stringify({at:new Date().toISOString(),rows},null,2));
console.log(JSON.stringify(rows.map(r=>({variant:r.variant,name:r.name,pass:r.pass,error:r.error,status:r.snap?.status,camera:r.snap?.cameraAudit,analysisBounds:r.snap?.analysisBounds,map:r.snap?.map,validLand:r.snap?.landGrid?.validLandCellCount})),null,2));
await browser.close();
