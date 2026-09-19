import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.goto(URL+'?tx_live_final='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const served=await page.content();if(!served.includes('earthlineCooperativeYield16661'))throw new Error('responsive Regional repair is not yet served');if(!served.includes('EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705'))throw new Error('coastal starvation refinement repair is not yet served');
for(let repeat=1;repeat<=3;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(1200);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:b?.outsideAfterClip??null,unsafe:flow?.unsafeSegments??null,trigger:window.EARTHLINE_SCALE_REFINEMENT_TRIGGER_16705||null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={repeat,elapsedMs:Date.now()-started,timedOut,state};rows.push(row);console.log('EARTHLINE_TX_LIVE_FINAL '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_LIVE_FINAL_SUMMARY '+JSON.stringify(rows));
await browser.close();
const bad=rows.some(r=>r.timedOut||r.state.lastError||r.state.swales!==77||r.state.visible!==77||r.state.published!==77||!(r.state.totalMs<=15000)||Number(r.state.unsafe||0)!==0||Number(r.state.outside?.swales||0)!==0||r.state.trigger?.triggered!==true||Number(r.state.trigger?.screenPassRatio??1)>.02||Number(r.state.input?.input||0)!==20||Number(r.state.selection?.chosenRefined||0)!==10||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<13||r.state.zones.lowerCoast<6||r.state.zones.eastInterior<10);
const principal=rows.every(r=>/Principal Aquifers/i.test(String(r.state.aquifer?.source||''))&&Number(r.state.aquifer?.features||0)===83);
if(bad||!principal)process.exitCode=1;
