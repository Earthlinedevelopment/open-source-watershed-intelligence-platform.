import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const grids=[96,112,128,144];
const results=[];

for(const grid of grids){
  const page=await browser.newPage({viewport:{width:1600,height:1000}});
  const errors=[]; page.on('pageerror',e=>errors.push(String(e))); page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  let patch=0;
  if(grid!==96){
    await page.route('**/*',async route=>{
      if(route.request().resourceType()!=='document')return route.continue();
      const resp=await route.fetch(); let text=await resp.text();
      const needle='const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:96;';
      const repl=`const openGrid16201=focusMode?220:${grid},mapGrid16201=focusMode?180:${grid};`;
      patch=text.split(needle).length-1;
      text=text.split(needle).join(repl);
      return route.fulfill({response:resp,body:text});
    });
  }
  const started=Date.now();
  await page.goto(URL+'?tx_grid='+grid+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;
  try{await page.waitForFunction(()=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(/screening published\./i.test(s)&&!!window.EARTHLINE_SWALE_GENERATION_AUDIT_16167);},{timeout:32000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const state=await page.evaluate(()=>{
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null, sw=Array.isArray(v?.swales?.features)?v.swales.features:[];
    const mid=f=>{const c=f?.geometry?.coordinates||[];return Array.isArray(c)&&c.length?c[Math.floor((c.length-1)/2)]:null;};
    const count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0);
    const g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,t=window.EARTHLINE_TERRAIN_PRODUCTS_AUDIT_16157||null;
    return {swales:sw.length,visible:d?.swaleLines??null,grid:t?.terrain?.grid??null,zones:{
      panhandleNorth:count((x,y)=>x>-103.1&&x<-100&&y>35.0&&y<36.6),
      panhandleWestNM:count((x,y)=>x>-103.2&&x<-102.0&&y>31.8&&y<36.6),
      upperCoast:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),
      midCoast:count((x,y)=>x>-99.3&&x<-96.0&&y>27.4&&y<30.2),
      lowerCoast:count((x,y)=>x>-99.5&&x<-97.0&&y>25.7&&y<28.2),
      eastInterior:count((x,y)=>x>-96.0&&x<-93.45&&y>30.5&&y<34.3)
    },candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,phases:p?.phaseTotalsMs??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()};
  });
  const row={grid,patch,elapsedMs:Date.now()-started,timedOut,state,errors:errors.slice(0,12)};
  results.push(row); console.log('EARTHLINE_TX_GRID_SWEEP '+JSON.stringify(row)); await page.close();
}
console.log('EARTHLINE_TX_GRID_SWEEP_SUMMARY '+JSON.stringify(results.map(r=>({grid:r.grid,patch:r.patch,timedOut:r.timedOut,swales:r.state.swales,visible:r.state.visible,gridActual:r.state.grid,zones:r.state.zones,candidates:r.state.candidates,eligible:r.state.eligible,published:r.state.published,totalMs:r.state.totalMs,outside:r.state.outside,lastError:r.state.lastError,errors:r.errors.length}))));
await browser.close();
if(results.some(r=>r.timedOut||r.state.lastError||(r.grid!==96&&r.patch!==1)))process.exitCode=1;
