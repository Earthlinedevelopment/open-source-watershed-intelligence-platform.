import { chromium } from 'playwright';
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const states=(process.env.STATES||'Vermont|Texas|New York|Arkansas|Iowa|Colorado|California').split('|');
const browser=await chromium.launch({headless:true});
const results=[];
for(const query of states){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 await page.goto(BASE+'?regional_owner_17501='+encodeURIComponent(query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#searchInput',{timeout:30000});
 await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()},query);
 await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:90000,polling:120});
 await page.waitForTimeout(1000);
 const snap=await page.evaluate(q=>{
   const overlay=document.getElementById('earthlineRegionalVectorOverlay16020');
   const cs=overlay?getComputedStyle(overlay):null;
   const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
   const styleLayers=map?.getStyle?.()?.layers||[];
   const swaleLayers=styleLayers.map(x=>x.id).filter(id=>/regional.*swale|swale.*regional|corridor/i.test(id));
   let mapRendered=0;
   try{if(swaleLayers.length)mapRendered=(map.queryRenderedFeatures?.({layers:swaleLayers})||[]).length}catch(_){}
   const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
   const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
   const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
   const bound=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
   return {
     query,pub,display,flow,bound,
     overlay:{exists:!!overlay,display:cs?.display||null,visibility:cs?.visibility||null,opacity:cs?.opacity||null,inlineDisplay:overlay?.style?.display||'',inlineOpacity:overlay?.style?.opacity||'',paths:overlay?.querySelectorAll?.('path')?.length||0,hits:overlay?.querySelectorAll?.('.earthline-swale-hit-16070')?.length||0,children:overlay?.children?.length||0,htmlLength:overlay?.innerHTML?.length||0},
     map:{swaleLayers,mapRendered},
     status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
   };
 },query);
 const generated=Number(snap.pub?.generated||0);
 const visibleEvidence=Math.max(Number(snap.overlay.paths||0),Number(snap.overlay.hits||0),Number(snap.map.mapRendered||0),Number(snap.display?.swaleLines||0),Number(snap.pub?.overlaySwaleLines||0));
 const unsafe=Number(snap.flow?.unsafeSegments||0);
 const outside=Number(snap.bound?.outsideAfterClip?.swales||0);
 const pass=generated>0&&visibleEvidence>0&&unsafe===0&&outside===0&&errors.length===0;
 const row={query,pass,generated,visibleEvidence,unsafe,outside,snap,errors};
 results.push(row);console.log('EARTHLINE_REGIONAL_OWNER_17501 '+JSON.stringify(row));
 await context.close();
}
await browser.close();
const summary={pass:results.every(r=>r.pass),results};
console.log('EARTHLINE_REGIONAL_OWNER_SUMMARY_17501 '+JSON.stringify(summary));
if(!summary.pass)process.exitCode=1;
