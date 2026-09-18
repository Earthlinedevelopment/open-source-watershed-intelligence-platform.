import { chromium } from 'playwright';
const URL='http://127.0.0.1:8787/index.html';
const browser=await chromium.launch({headless:true});
const results=[];

async function run(page,query,repeat,label){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(q=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },query);
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));
    },prior,{timeout:30000,polling:100});
  }catch(_){timedOut=true;}
  await page.waitForTimeout(1200);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,outside:b?.outsideAfterClip??null,aquifer:a,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};
  });
  const row={label,query,repeat,elapsedMs:Date.now()-started,timedOut,state};
  results.push(row);console.log('EARTHLINE_TEXAS_PRODUCT_GATE '+JSON.stringify(row));
  return row;
}

{
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto(URL+'?gate=texas_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  for(let r=1;r<=3;r++)await run(page,'Texas',r,'Texas');
  await page.close();
}
for(const [label,q] of [['New York','New York'],['Colorado','Colorado'],['New Mexico','New Mexico']]){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto(URL+'?gate='+encodeURIComponent(label)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await run(page,q,1,label);
  await page.close();
}
console.log('EARTHLINE_TEXAS_PRODUCT_GATE_SUMMARY '+JSON.stringify(results));
await browser.close();

const texas=results.filter(r=>r.label==='Texas');
const control=results.filter(r=>r.label!=='Texas');
const badTexas=texas.some(r=>r.timedOut||r.state.lastError||!(r.state.visible>0)||!(r.state.totalMs<=15000)||Number(r.state.outside?.swales||0)!==0||r.state.zones.panhandleNorth<3||r.state.zones.upperCoast<8||r.state.zones.lowerCoast<5||r.state.zones.eastInterior<10||!/Principal Aquifers/i.test(String(r.state.aquifer?.source||'')));
const badControl=control.some(r=>r.timedOut||r.state.lastError||!(r.state.visible>0)||!(r.state.totalMs<=15000)||Number(r.state.outside?.swales||0)!==0);
if(badTexas||badControl)process.exitCode=1;
