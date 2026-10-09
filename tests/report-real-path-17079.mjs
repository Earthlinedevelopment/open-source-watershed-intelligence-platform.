import { chromium, webkit } from 'playwright';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ENGINE=process.env.EARTHLINE_BROWSER||'chromium';
const BASE='https://earthlinedevelopment.org/';
const OUT=`artifacts/report-real-path-17079/${ENGINE}`;
mkdirSync(OUT,{recursive:true});
const CASES=[
 {name:'desktop-1440',w:1440,h:900,mobile:false},
 {name:'tablet-1024',w:1024,h:768,mobile:false},
 {name:'phone-430',w:430,h:932,mobile:true},
 {name:'phone-390',w:390,h:844,mobile:true},
 {name:'phone-360',w:360,h:800,mobile:true},
 {name:'phone-landscape',w:844,h:390,mobile:true}
];
const CENTER={lng:-73.012909,lat:44.513845};

function mime(p){return ({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'})[extname(p).toLowerCase()]||'application/octet-stream'}
async function localize(page){
 await page.route('https://earthlinedevelopment.org/**',async route=>{
  const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname||'/');
  if(rel==='/'||rel==='')rel='/index.html';rel=normalize(rel.replace(/^\/+/,''));if(rel.startsWith('..'))return route.fulfill({status:403,body:'blocked'});
  const p=join(process.cwd(),rel);if(!existsSync(p))return route.fulfill({status:404,body:'not found'});
  return route.fulfill({status:200,contentType:mime(p),body:readFileSync(p)});
 });
}
function browserType(){return ENGINE==='webkit'?webkit:chromium}
const opts={headless:true};if(ENGINE==='edge')opts.channel='msedge';
const browser=await browserType().launch(opts);

async function runRegional(page){
 if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250)}
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()});
 await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:30000,polling:120}).catch(()=>{});
 return page.evaluate(()=>({error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')}));
}
async function runProperty(page){
 await page.evaluate(c=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);if(!m)throw new Error('map unavailable');m.jumpTo({center:[c.lng,c.lat],zoom:16.2,bearing:0,pitch:0})},CENTER);
 await page.waitForTimeout(500);
 const canvas=page.locator('.mapboxgl-canvas').first(),b=await canvas.boundingBox();if(!b)throw new Error('map canvas missing');
 const x=b.x+b.width*.55,y=b.y+b.height*.55;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+24,y+12,{steps:6});await page.mouse.up();await page.waitForTimeout(700);
 if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(250)}
 await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
 await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,{timeout:22000,polling:150}).catch(()=>{});
 return page.evaluate(()=>({target:window.EARTHLINE_PROPERTY_TARGET_16201||null,run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188')}));
}
async function reportState(page){
 return page.evaluate(()=>{
  const p=document.getElementById('earthlineVermontReportPanel16149'),b=document.getElementById('earthlineVermontReport16149'),body=document.getElementById('earthlinePanelBody16188');
  const box=e=>{if(!e)return null;const r=e.getBoundingClientRect(),s=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),bottom:Math.round(r.bottom),display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,transform:s.transform}};
  return {panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),button:box(b),body:box(body),reportOpen:p?.classList.contains('open')||false,rootReportOpen:document.documentElement.classList.contains('earthline-report-open-16966'),scrollTop:body?.scrollTop||0};
 });
}

const rows=[];
for(const tc of CASES){
 const context=await browser.newContext({viewport:{width:tc.w,height:tc.h},isMobile:tc.mobile,hasTouch:tc.mobile,ignoreHTTPSErrors:true});
 const page=await context.newPage();await localize(page);const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const row={engine:ENGINE,case:tc,errors};
 try{
  await page.goto(BASE+'?reportRealPath17079='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:20000});await page.waitForTimeout(1200);
  row.regional=await runRegional(page);row.property=await runProperty(page);await page.waitForTimeout(500);
  row.afterProperty=await reportState(page);

  if(tc.mobile && !row.afterProperty.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(350)}
  row.afterReopen=await reportState(page);

  const btn=page.locator('#earthlineVermontReport16149');
  if(await btn.count()){
    await btn.scrollIntoViewIfNeeded().catch(()=>{});
    await page.waitForTimeout(200);
    row.afterScroll=await reportState(page);
    row.open={ok:false,error:null};
    try{await btn.click({timeout:7000});row.open.ok=true}catch(e){row.open.error=String(e)}
    await page.waitForTimeout(400);row.afterOpen=await reportState(page);
    if(row.afterOpen.reportOpen){
      row.close={ok:false,error:null};try{await page.locator('#earthlineVermontReportPanel16149 [data-action="close"]').click({timeout:5000});row.close.ok=true}catch(e){row.close.error=String(e)}
      await page.waitForTimeout(250);row.afterClose=await reportState(page);
      if(tc.mobile && !row.afterClose.panelOpen){await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());await page.waitForTimeout(300)}
      await btn.scrollIntoViewIfNeeded().catch(()=>{});await page.waitForTimeout(150);
      row.reopen={ok:false,error:null};try{await btn.click({timeout:7000});row.reopen.ok=true}catch(e){row.reopen.error=String(e)}
      await page.waitForTimeout(300);row.afterReopenReport=await reportState(page);
    }
  }
  row.pass={
    regional:!row.regional?.error&&/screening published\./i.test(row.regional?.status||''),
    crosshair:/^crosshair/.test(String(row.property?.target?.source||'')),
    panelReopened:!tc.mobile||row.afterReopen?.panelOpen===true,
    buttonInteractive:row.afterScroll?.button?.pointerEvents==='auto',
    open:row.open?.ok===true&&row.afterOpen?.reportOpen===true,
    close:row.close?.ok===true&&row.afterClose?.reportOpen===false,
    reopen:row.reopen?.ok===true&&row.afterReopenReport?.reportOpen===true
  };
  row.overall=Object.values(row.pass).every(Boolean);
 }catch(e){row.fatal=String(e);row.overall=false}
 rows.push(row);writeFileSync(`${OUT}/${tc.name}.json`,JSON.stringify(row,null,2));
 console.log('EARTHLINE_REPORT_REAL_17079 '+JSON.stringify({engine:ENGINE,case:tc.name,overall:row.overall,pass:row.pass,afterProperty:row.afterProperty,afterReopen:row.afterReopen,afterScroll:row.afterScroll,open:row.open,close:row.close,reopen:row.reopen,fatal:row.fatal||null}));
 await context.close();
}
await browser.close();
const summary={engine:ENGINE,total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length,failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,fatal:r.fatal||null,open:r.open,reopen:r.reopen,afterReopen:r.afterReopen,afterScroll:r.afterScroll}))};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));console.log('EARTHLINE_REPORT_REAL_17079_SUMMARY '+JSON.stringify(summary));if(summary.fail)process.exitCode=1;
