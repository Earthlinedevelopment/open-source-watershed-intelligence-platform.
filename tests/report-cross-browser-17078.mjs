import { chromium, firefox, webkit } from 'playwright';
import { existsSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';

const ENGINE=process.env.EARTHLINE_BROWSER||'chromium';
const BASE='https://earthlinedevelopment.org/';
const OUT=`artifacts/report-cross-browser-17078/${ENGINE}`;
mkdirSync(OUT,{recursive:true});

const CASES=[
  {name:'desktop-1440',w:1440,h:900,mobile:false},
  {name:'tablet-1024',w:1024,h:768,mobile:false},
  {name:'phone-430',w:430,h:932,mobile:true},
  {name:'phone-390',w:390,h:844,mobile:true},
  {name:'phone-360',w:360,h:800,mobile:true},
  {name:'phone-landscape',w:844,h:390,mobile:true}
];

const REGRESSION_CENTER={lng:-73.012909,lat:44.513845};

function mime(p){
  return ({
    '.html':'text/html; charset=utf-8',
    '.js':'text/javascript; charset=utf-8',
    '.css':'text/css; charset=utf-8',
    '.json':'application/json; charset=utf-8',
    '.png':'image/png',
    '.jpg':'image/jpeg',
    '.jpeg':'image/jpeg',
    '.svg':'image/svg+xml',
    '.ico':'image/x-icon'
  })[extname(p).toLowerCase()]||'application/octet-stream';
}

async function installLocalOrigin(page){
  await page.route('https://earthlinedevelopment.org/**', async route=>{
    const u=new URL(route.request().url());
    let rel=decodeURIComponent(u.pathname||'/');
    if(rel==='/'||rel==='')rel='/index.html';
    rel=normalize(rel.replace(/^\/+/, ''));
    if(rel.startsWith('..'))return route.fulfill({status:403,body:'blocked'});
    const p=join(process.cwd(),rel);
    if(!existsSync(p))return route.fulfill({status:404,body:'not found'});
    return route.fulfill({status:200,contentType:mime(p),body:readFileSync(p)});
  });
}

function browserType(){
  if(ENGINE==='firefox')return firefox;
  if(ENGINE==='webkit')return webkit;
  return chromium;
}

const launchOptions={headless:true};
if(ENGINE==='edge')launchOptions.channel='msedge';
const browser=await browserType().launch(launchOptions);

async function buttonAudit(page){
  return await page.evaluate(()=>{
    const el=document.getElementById('earthlineVermontReport16149');
    if(!el)return null;
    const r=el.getBoundingClientRect(),s=getComputedStyle(el);
    const clip=[];
    let p=el.parentElement;
    while(p&&p!==document.body&&clip.length<12){
      const ps=getComputedStyle(p);
      const pr=p.getBoundingClientRect();
      const clips=/(auto|scroll|hidden|clip)/.test(ps.overflow+ps.overflowX+ps.overflowY);
      if(clips||ps.transform!=='none'||ps.position==='fixed'||ps.position==='sticky'){
        clip.push({
          id:p.id||null,cls:String(p.className||'').slice(0,160),tag:p.tagName,
          x:Math.round(pr.x),y:Math.round(pr.y),w:Math.round(pr.width),h:Math.round(pr.height),
          overflow:ps.overflow,overflowX:ps.overflowX,overflowY:ps.overflowY,
          position:ps.position,transform:ps.transform,zIndex:ps.zIndex
        });
      }
      p=p.parentElement;
    }
    return {
      id:el.id,text:String(el.textContent||'').replace(/\s+/g,' ').trim(),
      disabled:!!el.disabled,ready:el.dataset.ready||null,
      x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
      right:Math.round(r.right),bottom:Math.round(r.bottom),
      viewport:{w:innerWidth,h:innerHeight},
      fullyInViewport:r.left>=0&&r.top>=0&&r.right<=innerWidth&&r.bottom<=innerHeight,
      intersectsViewport:r.right>0&&r.bottom>0&&r.left<innerWidth&&r.top<innerHeight,
      display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,
      position:s.position,transform:s.transform,zIndex:s.zIndex,
      clippingAncestors:clip
    };
  });
}

async function reportAudit(page){
  return await page.evaluate(()=>{
    const panel=document.getElementById('earthlineVermontReportPanel16149');
    if(!panel)return null;
    const shell=panel.querySelector('.el49-shell');
    const toolbar=panel.querySelector('.el49-toolbar');
    const report=panel.querySelector('.el49-report');
    const box=e=>{
      if(!e)return null;
      const r=e.getBoundingClientRect(),s=getComputedStyle(e);
      return {
        x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
        scrollH:e.scrollHeight,clientH:e.clientHeight,scrollW:e.scrollWidth,clientW:e.clientWidth,
        overflow:s.overflow,overflowY:s.overflowY,position:s.position,display:s.display,
        zIndex:s.zIndex,maxHeight:s.maxHeight,padding:s.padding
      };
    };
    const pages=[...panel.querySelectorAll('.el49-page')].map((p,index)=>{
      const r=p.getBoundingClientRect(), cs=getComputedStyle(p);
      let maxRight=0,maxBottom=0;
      for(const el of p.querySelectorAll('*')){
        const er=el.getBoundingClientRect();
        if(er.width<1||er.height<1)continue;
        maxRight=Math.max(maxRight,er.right-r.left);
        maxBottom=Math.max(maxBottom,er.bottom-r.top);
      }
      return {
        index:index+1,
        cls:String(p.className||''),
        x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),
        clientW:p.clientWidth,clientH:p.clientHeight,scrollW:p.scrollWidth,scrollH:p.scrollHeight,
        overflow:cs.overflow,overflowX:cs.overflowX,overflowY:cs.overflowY,
        padding:cs.padding,
        maxChildRight:Math.round(maxRight),maxChildBottom:Math.round(maxBottom),
        horizontalClip:maxRight>r.width+2 || p.scrollWidth>p.clientWidth+2,
        verticalClip:maxBottom>r.height+2 || p.scrollHeight>p.clientHeight+2
      };
    });
    const close=panel.querySelector('[data-action="close"]');
    const closeBox=close?box(close):null;
    const closeRect=close?.getBoundingClientRect();
    return {
      open:panel.classList.contains('open'),
      rootOpen:document.documentElement.classList.contains('earthline-report-open-16966'),
      panel:box(panel),shell:box(shell),toolbar:box(toolbar),report:box(report),
      pageCount:pages.length,pages,
      clippedPages:pages.filter(p=>p.horizontalClip||p.verticalClip).map(p=>({index:p.index,horizontalClip:p.horizontalClip,verticalClip:p.verticalClip,scrollW:p.scrollW,clientW:p.clientW,scrollH:p.scrollH,clientH:p.clientH,maxChildRight:p.maxChildRight,maxChildBottom:p.maxChildBottom,w:p.w,h:p.h})),
      closeCount:panel.querySelectorAll('[data-action="close"]').length,
      closeBox,
      closeInViewport:!!(closeRect&&closeRect.left>=0&&closeRect.top>=0&&closeRect.right<=innerWidth&&closeRect.bottom<=innerHeight),
      viewport:{w:innerWidth,h:innerHeight}
    };
  });
}

async function runRegional(page){
  if(!await page.locator('#searchInput').count()||!await page.locator('#runBtn').count())return {ok:false,reason:'controls missing'};
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(250);
  }
  const started=Date.now();
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='Vermont';
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  });
  await page.waitForFunction(()=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    return !!err||/screening published\./i.test(s);
  },{timeout:30000,polling:120}).catch(()=>{});
  return await page.evaluate(started=>({
    wallMs:Date.now()-started,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim()
  }),started);
}

async function runCrosshairProperty(page){
  await page.evaluate(center=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[center.lng,center.lat],zoom:16.2,bearing:0,pitch:0});
  },REGRESSION_CENTER);
  await page.waitForTimeout(500);
  const canvas=page.locator('.mapboxgl-canvas').first();
  const b=await canvas.boundingBox();
  if(!b)return {ok:false,reason:'map canvas missing'};
  const x=b.x+b.width*.55,y=b.y+b.height*.55;
  await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x+24,y+12,{steps:6});await page.mouse.up();
  await page.waitForTimeout(700);
  const target=await page.evaluate(()=>window.EARTHLINE_PROPERTY_TARGET_16201||null);
  const source=String(target?.source||'');
  if(!(source==='crosshair'||source.startsWith('crosshair-user-drag')))return {ok:false,reason:'crosshair target not created',target};
  if(!await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'))){
    await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
    await page.waitForTimeout(250);
  }
  const started=Date.now();
  await page.evaluate(()=>{
    const b=document.getElementById('earthlineDeclareProperty16169');
    if(!b)throw new Error('Property button missing');
    b.click();
  });
  await page.waitForFunction(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return !!(a&&a.settled===true);
  },{timeout:22000,polling:150}).catch(()=>{});
  return await page.evaluate(({started,target})=>({
    wallMs:Date.now()-started,target,
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    safety:(typeof M!=='undefined'&&M)?M.safetyAudit15806||null:null,
    safeSwales:(typeof M!=='undefined'&&M)?Number(M.authoritativeSafeSwales15815?.length||0):0
  }),{started,target});
}

const rows=[];
for(const tc of CASES){
  const context=await browser.newContext({
    viewport:{width:tc.w,height:tc.h},
    isMobile:tc.mobile&&ENGINE!=='firefox',
    hasTouch:tc.mobile,
    ignoreHTTPSErrors:true
  });
  const page=await context.newPage();
  await installLocalOrigin(page);
  const errors=[],consoleErrors=[],httpErrors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('response',r=>{if(r.status()>=400)httpErrors.push({status:r.status(),url:r.url()})});
  const row={engine:ENGINE,case:tc,errors,consoleErrors,httpErrors:[]};
  try{
    await page.goto(BASE+'?reportCrossBrowser17078='+tc.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    await page.waitForTimeout(1200);

    row.regional=await runRegional(page);
    row.property=await runCrosshairProperty(page);
    await page.waitForTimeout(1000);

    // Property intentionally recesses the mobile sheet to return map space.
    // Reproduce the real user path: tap the existing Search Orb to reopen
    // navigation before selecting the existing Bioswale Report control.
    row.panelBeforeReport=await page.evaluate(()=>({
      open:document.documentElement.classList.contains('earthline-panel-open-16188'),
      panel:(()=>{const e=document.getElementById('earthlinePanel16188');if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),transform:cs.transform,pointerEvents:cs.pointerEvents}})()
    }));
    if(!row.panelBeforeReport.open){
      await page.evaluate(()=>document.getElementById('earthlineRailSearch16188')?.click());
      await page.waitForTimeout(350);
    }
    row.panelAfterReopen=await page.evaluate(()=>({
      open:document.documentElement.classList.contains('earthline-panel-open-16188'),
      panel:(()=>{const e=document.getElementById('earthlinePanel16188');if(!e)return null;const r=e.getBoundingClientRect(),cs=getComputedStyle(e);return{x:Math.round(r.x),y:Math.round(r.y),w:Math.round(r.width),h:Math.round(r.height),transform:cs.transform,pointerEvents:cs.pointerEvents}})()
    }));

    row.buttonBefore=await buttonAudit(page);
    row.physicalClick={attempted:false,ok:false,error:null};
    const button=page.locator('#earthlineVermontReport16149');
    if(await button.count() && row.buttonBefore && !row.buttonBefore.disabled){
      row.physicalClick.attempted=true;
      try{
        await button.click({timeout:6000});
        row.physicalClick.ok=true;
      }catch(e){
        row.physicalClick.error=String(e);
      }
      await page.waitForTimeout(400);
      row.reportAfterPhysical=await reportAudit(page);

      // Diagnostic only: if physical click fails, invoke the SAME existing button
      // programmatically to determine whether placement or report ownership is broken.
      if(!row.physicalClick.ok){
        await page.evaluate(()=>document.getElementById('earthlineVermontReport16149')?.click());
        await page.waitForTimeout(400);
        row.reportAfterProgrammatic=await reportAudit(page);
      }

      const open=(row.reportAfterPhysical?.open||row.reportAfterProgrammatic?.open);
      if(open){
        await page.screenshot({path:`${OUT}/${tc.name}-open.png`,fullPage:true});
        row.close={ok:false,error:null};
        try{
          const close=page.locator('#earthlineVermontReportPanel16149 [data-action="close"]');
          await close.click({timeout:5000});
          row.close.ok=true;
        }catch(e){
          row.close.error=String(e);
          await page.evaluate(()=>document.querySelector('#earthlineVermontReportPanel16149 [data-action="close"]')?.click());
        }
        await page.waitForTimeout(250);
        row.afterClose=await reportAudit(page);
      }
    }
    row.httpErrors=httpErrors.slice(0,40);
    row.pass={
      regionalPublished:!row.regional?.error&&/screening published\./i.test(row.regional?.status||''),
      crosshairTarget:/^crosshair/.test(String(row.property?.target?.source||'')),
      reportButtonExists:!!row.buttonBefore,
      panelReopened:row.panelAfterReopen?.open===true,
      reportPhysicalClick:row.physicalClick.ok===true,
      reportOpened:!!(row.reportAfterPhysical?.open||row.reportAfterProgrammatic?.open),
      noClippedReportPages:(row.reportAfterPhysical||row.reportAfterProgrammatic)?.clippedPages?.length===0,
      reportCloseVisible:(row.reportAfterPhysical||row.reportAfterProgrammatic)?.closeInViewport===true,
      reportClosed:row.afterClose?row.afterClose.open===false:false
    };
    row.overall=Object.values(row.pass).every(Boolean);
  }catch(e){row.fatal=String(e);row.overall=false}
  rows.push(row);
  writeFileSync(`${OUT}/${tc.name}.json`,JSON.stringify(row,null,2));
  console.log('EARTHLINE_REPORT_17078 '+JSON.stringify({
    engine:ENGINE,case:tc.name,overall:row.overall,pass:row.pass,
    button:row.buttonBefore?{x:row.buttonBefore.x,y:row.buttonBefore.y,w:row.buttonBefore.w,h:row.buttonBefore.h,bottom:row.buttonBefore.bottom,viewport:row.buttonBefore.viewport,intersects:row.buttonBefore.intersectsViewport}:null,
    physicalClick:row.physicalClick,clippedPages:(row.reportAfterPhysical||row.reportAfterProgrammatic)?.clippedPages||[],fatal:row.fatal||null
  }));
  await context.close();
}
await browser.close();
const summary={
  engine:ENGINE,total:rows.length,pass:rows.filter(r=>r.overall).length,fail:rows.filter(r=>!r.overall).length,
  failed:rows.filter(r=>!r.overall).map(r=>({case:r.case.name,pass:r.pass,button:r.buttonBefore,physicalClick:r.physicalClick,fatal:r.fatal||null}))
};
writeFileSync(`${OUT}/summary.json`,JSON.stringify({summary,rows},null,2));
console.log('EARTHLINE_REPORT_17078_SUMMARY '+JSON.stringify(summary));
if(summary.fail)process.exitCode=1;
