import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});

await page.goto(URL+'?tx_live_closeout='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});

const rows=[];
for(let repeat=1;repeat<=5;repeat++){
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  const started=Date.now();
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Texas'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
  });
  let timedOut=false;
  try{
    await page.waitForFunction(prev=>{
      const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'');
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));
    },prior,{timeout:30000,polling:100});
  }catch(_){timedOut=true;}

  let aquiferTimedOut=false;
  try{
    await page.waitForFunction(()=>{
      const a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
      return !!a&&/Principal Aquifers of the United States/i.test(String(a.source||''));
    },{timeout:12000,polling:100});
  }catch(_){aquiferTimedOut=true;}
  await page.waitForTimeout(300);

  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null;
    const a=window.EARTHLINE_REGIONAL_AQUIFER_AUDIT_16126||null;
    const containment=window.EARTHLINE_OPTIONAL_CONTEXT_CONTAINMENT_16565||null;
    return {
      swales:sw.length,
      visible:d?.swaleLines??null,
      zones:{
        panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),
        panhandleWestNM:count((x,y)=>x>-103.2&&x<-102&&y>31.8&&y<36.6),
        upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),
        midCoast:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),
        lowerCoast:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),
        eastInterior:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)
      },
      candidates:g?.candidates??null,
      eligible:g?.jurisdictionEligibleCandidates??null,
      published:g?.publishedFeatures??null,
      totalMs:p?.totalMs??null,
      phases:p?.phaseTotalsMs??null,
      outside:b?.outsideAfterClip??null,
      aquifer:a,
      containment:containment&&containment['usgs-principal-regional-context']||null,
      lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
    };
  });

  const row={repeat,elapsedMs:Date.now()-started,timedOut,aquiferTimedOut,state};
  rows.push(row);
  console.log('EARTHLINE_TX_LIVE_CLOSEOUT '+JSON.stringify(row));
}
const summary={rows,errors:errors.slice(0,20),pass:rows.every(r=>!r.timedOut&&!r.aquiferTimedOut&&!r.state.lastError&&r.state.swales>0&&r.state.visible===r.state.swales&&Number(r.state.totalMs)<=15000&&/Principal Aquifers of the United States/i.test(String(r.state.aquifer?.source||''))&&Number(r.state.aquifer?.features)>0)};
console.log('EARTHLINE_TX_LIVE_CLOSEOUT_SUMMARY '+JSON.stringify(summary));
await browser.close();
if(!summary.pass)process.exitCode=1;
