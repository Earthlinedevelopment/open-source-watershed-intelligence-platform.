import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const engines={chromium,firefox,webkit};
if(!engines[BROWSER])throw new Error('unsupported browser '+BROWSER);
const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=fs.readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
const language=fs.readFileSync('earthline-language-hotfix-16890.js','utf8');
const browser=await engines[BROWSER].launch({headless:HEADLESS});

async function newPage(){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('**/*',async r=>{
    const u=new URL(r.request().url());
    if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
      return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
      return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-elder-worker-17129\.js$/.test(u.pathname))
      return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/tools\/elder_trees\/chmv2_array_detector_17129\.py$/.test(u.pathname))
      return r.fulfill({status:200,body:detector,headers:{'content-type':'text/plain; charset=utf-8','cache-control':'no-store'}});
    if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-language-hotfix-16890\.js$/.test(u.pathname))
      return r.fulfill({status:200,body:language,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
    return r.continue();
  });
  const page=await context.newPage();
  return {context,page};
}

async function waitRegional(page){
  await page.waitForFunction(()=>/published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),null,{timeout:120000,polling:100});
}

async function regional(page,q){
  const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);
  const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  if(!await o.count())throw new Error('no suggestion '+q);
  await o.first().click();await page.waitForTimeout(250);
  const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();
  await waitRegional(page);
}

async function elderFlow(){
  const {context,page}=await newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
    window.__earthlineFinal17541={events:[],lastCommitSig:''};
    const activationSnap=(kind,e)=>{
      if(!e.target?.closest?.('#earthlineDeclareProperty16169'))return;
      try{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        window.__earthlineFinal17541.events.push({kind,t:performance.now(),
          target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||''),code:String(t.code||'')}:null,
          center:c?{lng:+c.lng,lat:+c.lat}:null,moving:!!m?.isMoving?.()});
      }catch(_){}
    };
    document.addEventListener('pointerup',e=>activationSnap('actual-pointerup',e),true);
    document.addEventListener('click',e=>activationSnap('actual-click',e),true);
    const orig=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(msg,...rest){
      try{
        if(msg&&typeof msg==='object'&&String(msg.id||'').startsWith('elder-')&&!msg.warm&&!msg.warmBbox){
          window.__earthlineFinal17541.events.push({kind:'elder-worker-post',id:String(msg.id||''),t:performance.now()});
        }
      }catch(_){}
      return orig.call(this,msg,...rest);
    };
    const watch=()=>{
      try{
        const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
        if(e?.state==='committed'){
          const sig=String(e.propertyRunIdentity||'')+'|'+String(e.at||'');
          if(sig&&sig!==window.__earthlineFinal17541.lastCommitSig){
            window.__earthlineFinal17541.lastCommitSig=sig;
            window.__earthlineFinal17541.events.push({kind:'elder-commit',identity:String(e.propertyRunIdentity||''),at:String(e.at||''),t:performance.now()});
          }
        }
      }catch(_){}
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto('https://earthlinedevelopment.org/?final17541='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const rows=[];
  for(const [label,q] of [['first','Essex Junction, Vermont'],['second','Rutland, Vermont']]){
    await regional(page,q);
    const c=page.locator('#earthlineRegionalVectorOverlay16020 .earthline-swale-label-16149').first();
    await c.waitFor({state:'visible',timeout:30000});await c.click({force:true});
    await page.waitForFunction(()=>!!document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]'),null,{timeout:15000});
    await page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first().click();
    await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
    await page.waitForTimeout(250);
    const before=await page.evaluate(()=>({
      serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
      eventCount:window.__earthlineFinal17541.events.length
    }));
    await page.locator('#earthlineDeclareProperty16169').click();
    await page.waitForFunction(from=>window.__earthlineFinal17541.events.slice(from).some(x=>x.kind==='actual-pointerup'||x.kind==='actual-click'),before.eventCount,{timeout:8000,polling:20});
    const activation=await page.evaluate(from=>{
      const ev=window.__earthlineFinal17541.events.slice(from);
      return ev.find(x=>x.kind==='actual-pointerup')||ev.find(x=>x.kind==='actual-click')||null;
    },before.eventCount);
    const expected=[Number(activation?.target?.lng).toFixed(6),Number(activation?.target?.lat).toFixed(6)].join('|')+'|';
    const elderP=page.waitForFunction(prefix=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      return e?.state==='committed'&&String(e.propertyRunIdentity||'').startsWith(prefix);
    },expected,{timeout:12000,polling:25}).then(()=>true).catch(()=>false);
    const propertyP=page.waitForFunction(s=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>s&&a?.settled===true;
    },before.serial,{timeout:120000,polling:50}).then(()=>true).catch(()=>false);
    const [elderWithin12,propertySettled]=await Promise.all([elderP,propertyP]);
    await page.waitForTimeout(100);
    const out=await page.evaluate(({before,expected,label,q,activation})=>{
      const ev=window.__earthlineFinal17541.events.slice(before.eventCount);
      const commit=ev.find(x=>x.kind==='elder-commit'&&String(x.identity||'').startsWith(expected))||null;
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const sameTarget=!!activation?.target&&!!a?.center&&Math.abs(Number(activation.target.lng)-Number(a.center.lng))<0.0008&&Math.abs(Number(activation.target.lat)-Number(a.center.lat))<0.0008;
      return {label,q,activationKind:activation?.kind||null,activationT:activation?.t??null,activationTarget:activation?.target||null,
        elderCommitT:commit?.t??null,elderMs:activation&&commit?commit.t-activation.t:null,
        serialBefore:before.serial,serialAfter:Number(a?.serial||0),propertySettled:a?.settled===true,propertyResult:a?.result===true,
        sameTarget,elderState:e?.state||null,elderIdentity:e?.propertyRunIdentity||null,workerTimings:e?.workerTimings||null,events:ev};
    },{before,expected,label,q,activation});
    out.elderWithin12=elderWithin12;out.propertySettledObserved=propertySettled;
    out.pass=out.activationT!=null&&out.serialAfter===out.serialBefore+1&&out.propertySettled&&out.propertyResult&&out.sameTarget&&out.elderState==='committed'&&out.elderIdentity?.startsWith(expected)&&elderWithin12&&out.elderMs!=null&&out.elderMs<=12000;
    rows.push(out);
    console.log('EARTHLINE_ELDER_FLOW_17541 '+JSON.stringify({browser:BROWSER,...out}));
  }
  await context.close();
  return {pass:rows.every(r=>r.pass)&&!errors.length,rows,errors};
}

async function swaleSite(site){
  const {context,page}=await newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?swale17541='+BROWSER+'-'+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.locator('#searchInput').fill('Vermont');await page.waitForTimeout(700);
  const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');if(!await opts.count())throw new Error('no Vermont suggestion');
  await opts.first().click();await page.waitForTimeout(250);
  const rb=page.locator('#runBtn');if(await rb.isVisible()&&!await rb.isDisabled())await rb.click();
  await waitRegional(page);
  await page.evaluate(async s=>{
    const o=window.earthlineSelectedSiteFromCenter(M?.loc||null,s.lng,s.lat,20);
    if(!await window.applyLocation(o,null,M.searchGen,{analyzeNow:false,preserveMapView:false}))throw new Error('applyLocation rejected');
    await new Promise(r=>setTimeout(r,500));
    window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'final-17541',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
  },site);
  const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  await page.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());
  await page.waitForFunction(p=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;return Number(a?.serial||0)>p&&a?.settled===true},pre,{timeout:120000,polling:50});
  await page.waitForTimeout(500);
  const out=await page.evaluate(site=>{
    const safe=M?.authoritativeSafeSwales15815?.features||[];
    function centroid(f){const cs=f?.geometry?.coordinates||[];let x=0,y=0,n=0;for(const p of cs){if(Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1])){x+=+p[0];y+=+p[1];n++}}return n?[x/n,y/n]:null}
    function pointSeg(p,a,b){const lat0=(p[1]+a[1]+b[1])/3*Math.PI/180,kx=111320*Math.cos(lat0),ky=110540;const px=p[0]*kx,py=p[1]*ky,ax=a[0]*kx,ay=a[1]*ky,bx=b[0]*kx,by=b[1]*ky,dx=bx-ax,dy=by-ay,q=dx*dx+dy*dy?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/(dx*dx+dy*dy))):0;return Math.hypot(px-(ax+q*dx),py-(ay+q*dy))}
    let nearest=Infinity,within40=0;const quadrants={NW:0,NE:0,SW:0,SE:0};
    for(const f of safe){const cs=f?.geometry?.coordinates||[];let fd=Infinity;for(let i=1;i<cs.length;i++)fd=Math.min(fd,pointSeg([site.lng,site.lat],cs[i-1],cs[i]));nearest=Math.min(nearest,fd);if(fd<=40)within40++;const c=centroid(f);if(c)quadrants[(c[1]>=site.lat?'N':'S')+(c[0]>=site.lng?'E':'W')]++}
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    return {safeCount:safe.length,nearestSwaleM:nearest,within40,quadrants,spacing:M?.spacingStats||null,
      runResult:a?.result===true,publicationAllowed:a?.sourceEvidence?.publicationAllowed===true,authorityIntersections:Number(a?.sourceEvidence?.authorityIntersectionCount||0)};
  },site);
  const maxQ=Math.max(...Object.values(out.quadrants))/(out.safeCount||1);
  const pass=out.runResult&&out.publicationAllowed&&out.authorityIntersections===0&&out.safeCount>=site.minCount&&out.nearestSwaleM<=site.maxNearest&&out.within40>=site.minWithin40&&maxQ<=site.maxQuadrantShare;
  const row={site,out,maxQuadrantShare:maxQ,pass,errors};
  console.log('EARTHLINE_SWALE_FRAME_17541 '+JSON.stringify({browser:BROWSER,...row}));
  await context.close();
  return row;
}

const elder=await elderFlow();
const swales=[];
for(const s of [
  {name:'A',lat:44.06957,lng:-72.27369,maxNearest:15,minWithin40:5,minCount:100,maxQuadrantShare:.48},
  {name:'C',lat:44.07102,lng:-72.27681,maxNearest:15,minWithin40:5,minCount:120,maxQuadrantShare:.36}
]) swales.push(await swaleSite(s));
const pass=elder.pass&&swales.every(r=>r.pass);
console.log('EARTHLINE_FINAL_CROSS_BROWSER_17541 '+JSON.stringify({browser:BROWSER,pass,elder,swales}));
await browser.close();
if(!pass)process.exitCode=1;
