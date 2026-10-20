import { chromium, firefox, webkit } from 'playwright';
import fs from 'node:fs';

function havMeters17570(a,b){
  const R=6371008.8,p1=Number(a?.lat)*Math.PI/180,p2=Number(b?.lat)*Math.PI/180;
  const dp=(Number(b?.lat)-Number(a?.lat))*Math.PI/180,dl=(Number(b?.lng)-Number(a?.lng))*Math.PI/180;
  if(![p1,p2,dp,dl].every(Number.isFinite))return Infinity;
  const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
  return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));
}

const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const HEADLESS=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const engines={chromium,firefox,webkit};
if(!engines[BROWSER])throw new Error('unsupported browser '+BROWSER);
const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const worker=fs.readFileSync('earthline-elder-worker-17129.js','utf8');
const detector=fs.readFileSync('tools/elder_trees/chmv2_array_detector_17129.py','utf8');
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
    return r.continue();
  });
  const page=await context.newPage();
  return {context,page};
}

async function waitRegional(page,priorToken=''){
  await page.waitForFunction(prior=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const token=String(d?.runToken||window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||'');
    const published=String(document.documentElement.dataset.earthlineRunState||'')==='published';
    return !!token&&token!==String(prior||'')&&published;
  },priorToken,{timeout:120000,polling:100});
}

async function regional(page,q){
  const i=page.locator('#searchInput');await i.fill('');await i.fill(q);await page.waitForTimeout(700);
  const o=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  const count=await o.count();if(!count)throw new Error('no suggestion '+q);
  const parts=q.split(',').map(x=>x.trim().toLowerCase()).filter(Boolean),wanted=parts[0]||'',region=parts[1]||'';
  let pick=-1,labels=[];
  for(let n=0;n<count;n++){
    const txt=String(await o.nth(n).innerText()).replace(/\s+/g,' ').trim(),low=txt.toLowerCase();
    labels.push(txt);
    const cityOk=!!wanted&&low.includes(wanted);
    const regionOk=!region||(region==='vermont'?/(^|[\s,])(vermont|vt)([\s,]|$)/i.test(txt):low.includes(region));
    if(pick<0&&cityOk&&regionOk)pick=n;
  }
  if(pick<0)throw new Error('no deterministic city+region suggestion '+q+' options='+JSON.stringify(labels));
  await o.nth(pick).click();await page.waitForTimeout(250);
  const priorToken=await page.evaluate(()=>String(window.EARTHLINE_ACTIVE_RUN_TOKEN_16151||''));
  const b=page.locator('#runBtn');if(await b.isVisible()&&!await b.isDisabled())await b.click();
  await waitRegional(page,priorToken);
}

async function elderFlow(){
  const {context,page}=await newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.addInitScript(()=>{
    window.__earthlineFinal17540={events:[],lastCommitSig:'',lastSerial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)};
    const activationSnap=(kind,e)=>{
      if(!e.target?.closest?.('#earthlineDeclareProperty16169'))return;
      try{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        window.__earthlineFinal17540.events.push({kind,t:performance.now(),
          target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||''),code:String(t.code||'')}:null,
          center:c?{lng:+c.lng,lat:+c.lat}:null,moving:!!m?.isMoving?.()});
      }catch(_){}
    };
    document.addEventListener('pointerdown',e=>activationSnap('actual-pointerdown',e),true);
    document.addEventListener('pointerup',e=>activationSnap('actual-pointerup',e),true);
    document.addEventListener('mousedown',e=>activationSnap('actual-mousedown',e),true);
    document.addEventListener('mouseup',e=>activationSnap('actual-mouseup',e),true);
    document.addEventListener('click',e=>activationSnap('actual-click',e),true);
    const orig=Worker.prototype.postMessage;
    Worker.prototype.postMessage=function(msg,...rest){
      try{
        if(msg&&typeof msg==='object'&&String(msg.id||'').startsWith('elder-')&&!msg.warm&&!msg.warmBbox){
          window.__earthlineFinal17540.events.push({kind:'elder-worker-post',id:String(msg.id||''),t:performance.now()});
        }
      }catch(_){}
      return orig.call(this,msg,...rest);
    };
    const watch=()=>{
      try{
        const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        const serial=Number(audit?.serial||0);
        if(serial!==window.__earthlineFinal17540.lastSerial){window.__earthlineFinal17540.lastSerial=serial;window.__earthlineFinal17540.events.push({kind:'property-serial',serial,t:performance.now()});}
        const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
        if(e?.state==='committed'){
          const sig=String(e.propertyRunIdentity||'')+'|'+String(e.at||'');
          if(sig&&sig!==window.__earthlineFinal17540.lastCommitSig){
            window.__earthlineFinal17540.lastCommitSig=sig;
            window.__earthlineFinal17540.events.push({kind:'elder-commit',identity:String(e.propertyRunIdentity||''),at:String(e.at||''),t:performance.now()});
          }
        }
      }catch(_){}
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto('https://earthlinedevelopment.org/?final17540='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const rows=[];
  for(const site of [
    {label:'first',q:'Essex exact Property',lng:-73.11125100000007,lat:44.53397998171303},
    {label:'second',q:'Rutland exact Property',lng:-73.1,lat:43.60831190199366}
  ]){
    const {label,q}=site;
    await page.waitForFunction(()=>typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16173==='function',null,{timeout:30000});
    const setup=await page.evaluate(s=>{
      const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      try{m?.stop?.();m?.jumpTo?.({center:[s.lng,s.lat],zoom:17,bearing:0,pitch:0})}catch(_){}
      window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'crosshair',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
      try{window.earthlineReconcilePanel16188?.()}catch(_){}
      const z=document.createElement('button');z.type='button';z.dataset.action='zoom';z.style.position='fixed';z.style.left='-10000px';z.style.top='-10000px';document.body.appendChild(z);z.click();z.remove();
      const t=window.EARTHLINE_PROPERTY_TARGET_16201||null,c=m?.getCenter?.()||null;
      return {target:t?{lng:+t.lng,lat:+t.lat,source:String(t.source||'')}:null,mapCenter:c?{lng:+c.lng,lat:+c.lat}:null};
    },site);
    const targetDriftM=havMeters17570(site,setup.target),mapCenterDriftM=havMeters17570(site,setup.mapCenter);
    if(targetDriftM>5||mapCenterDriftM>500)throw new Error('exact Property setup drift '+label+' target='+targetDriftM.toFixed(1)+'m map='+mapCenterDriftM.toFixed(1)+'m');
    await page.waitForFunction(()=>{const t=window.EARTHLINE_PROPERTY_TARGET_16201,b=document.getElementById('earthlineDeclareProperty16169');return !!t&&!!b&&!b.disabled},null,{timeout:30000});
    await page.waitForTimeout(250);
    const before=await page.evaluate(()=>({
      serial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),
      eventCount:window.__earthlineFinal17540.events.length
    }));
    const buttonBefore=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169'),r=b?.getBoundingClientRect?.();return b?{connected:b.isConnected,disabled:b.disabled,busy:b.dataset.busy||'',display:getComputedStyle(b).display,pointerEvents:getComputedStyle(b).pointerEvents,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,html:b.outerHTML.slice(0,900)}:null});
    let clickError=null;
    try{await page.locator('#earthlineDeclareProperty16169').click();}catch(e){clickError=String(e);}
    const activationDiag=await page.evaluate(from=>{const b=document.getElementById('earthlineDeclareProperty16169'),r=b?.getBoundingClientRect?.(),ev=window.__earthlineFinal17540.events.slice(from),a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,t=window.EARTHLINE_PROPERTY_TARGET_16201||null;return {events:ev,serial:Number(a?.serial||0),audit:a,target:t,button:b?{connected:b.isConnected,disabled:b.disabled,busy:b.dataset.busy||'',display:getComputedStyle(b).display,pointerEvents:getComputedStyle(b).pointerEvents,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null}:null};},before.eventCount);
    const activationObserved=activationDiag.events.some(x=>x.kind==='actual-pointerup'||x.kind==='actual-click');
    if(!activationObserved){
      console.log('EARTHLINE_ACTIVATION_DIAG_17555 '+JSON.stringify({browser:BROWSER,label,q,clickError,buttonBefore,diag:activationDiag}));
      throw new Error('physical activation not observed '+label);
    }
    const activation=await page.evaluate(from=>{
      const ev=window.__earthlineFinal17540.events.slice(from);
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
      const ev=window.__earthlineFinal17540.events.slice(before.eventCount);
      const commit=ev.find(x=>x.kind==='elder-commit'&&String(x.identity||'').startsWith(expected))||null;
      const serialEvents=ev.filter(x=>x.kind==='property-serial'&&Number(x.serial)===before.serial+1);
      const serialEvent=serialEvents[0]||null;
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      const sameTarget=!!activation?.target&&!!a?.center&&Math.abs(Number(activation.target.lng)-Number(a.center.lng))<0.0008&&Math.abs(Number(activation.target.lat)-Number(a.center.lat))<0.0008;
      return {label,q,activationKind:activation?.kind||null,activationT:activation?.t??null,activationTarget:activation?.target||null,
        elderCommitT:commit?.t??null,elderMs:activation&&commit?commit.t-activation.t:null,
        serialTransitionT:serialEvent?.t??null,serialMs:activation&&serialEvent?serialEvent.t-activation.t:null,serialTransitions:serialEvents.length,
        serialBefore:before.serial,serialAfter:Number(a?.serial||0),propertySettled:a?.settled===true,propertyResult:a?.result===true,
        sameTarget,elderState:e?.state||null,elderIdentity:e?.propertyRunIdentity||null,workerTimings:e?.workerTimings||null,events:ev};
    },{before,expected,label,q,activation});
    out.setup=setup;out.targetDriftM=targetDriftM;out.mapCenterDriftM=mapCenterDriftM;
    out.elderWithin12=elderWithin12;out.propertySettledObserved=propertySettled;
    out.pass=targetDriftM<=5&&mapCenterDriftM<=500&&out.activationT!=null&&out.serialAfter===out.serialBefore+1&&out.serialTransitions===1&&out.serialMs!=null&&out.serialMs<=2000&&out.propertySettled&&out.propertyResult&&out.sameTarget&&out.elderState==='committed'&&out.elderIdentity?.startsWith(expected)&&elderWithin12&&out.elderMs!=null&&out.elderMs<=12000;
    rows.push(out);
    console.log('EARTHLINE_ELDER_FLOW_17540 '+JSON.stringify({browser:BROWSER,...out}));
  }
  await context.close();
  return {pass:rows.every(r=>r.pass)&&!errors.length,rows,errors};
}

async function swaleSite(site){
  const {context,page}=await newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.goto('https://earthlinedevelopment.org/?swale17540='+BROWSER+'-'+site.name+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>typeof window.earthlineSetPropertyTarget16201==='function'&&typeof window.earthlineDeclarePropertyAtCrosshair16169==='function',null,{timeout:30000});
  const setup=await page.evaluate(s=>{
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    try{map?.stop?.();map?.jumpTo?.({center:[s.lng,s.lat],zoom:17,bearing:0,pitch:0})}catch(_){}
    window.earthlineSetPropertyTarget16201({lng:s.lng,lat:s.lat,source:'final-17572',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
    try{window.earthlineReconcilePanel16188?.()}catch(_){}
    const t=window.EARTHLINE_PROPERTY_TARGET_16201||null,c=map?.getCenter?.()||null;
    return {target:t?{lng:+t.lng,lat:+t.lat}:null,mapCenter:c?{lng:+c.lng,lat:+c.lat}:null};
  },site);
  const targetDriftM=havMeters17570(site,setup.target),mapCenterDriftM=havMeters17570(site,setup.mapCenter);
  if(targetDriftM>5||mapCenterDriftM>500){
    console.log('EARTHLINE_FRAME_SETUP_DRIFT_17570 '+JSON.stringify({browser:BROWSER,site,setup,targetDriftM,mapCenterDriftM}));
    throw new Error('frozen frame setup drift '+site.name+' target='+targetDriftM.toFixed(1)+'m map='+mapCenterDriftM.toFixed(1)+'m');
  }
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
    const boundary=(Array.isArray(M?.analysisBoundaryLngLat)?M.analysisBoundaryLngLat:[]).filter(p=>Array.isArray(p)&&Number.isFinite(+p[0])&&Number.isFinite(+p[1]));
    const boundaryCenter=boundary.length?{lng:boundary.reduce((v,p)=>v+(+p[0]),0)/boundary.length,lat:boundary.reduce((v,p)=>v+(+p[1]),0)/boundary.length}:null;
    return {safeCount:safe.length,nearestSwaleM:nearest,within40,quadrants,spacing:M?.spacingStats||null,
      auditCenter:a?.center&&Number.isFinite(+a.center.lng)&&Number.isFinite(+a.center.lat)?{lng:+a.center.lng,lat:+a.center.lat}:null,boundaryCenter,
      runResult:a?.result===true,publicationAllowed:a?.sourceEvidence?.publicationAllowed===true,authorityIntersections:Number(a?.sourceEvidence?.authorityIntersectionCount||0)};
  },site);
  const maxQ=Math.max(...Object.values(out.quadrants))/(out.safeCount||1);
  const auditCenterDriftM=havMeters17570(site,out.auditCenter),boundaryCenterDriftM=havMeters17570(site,out.boundaryCenter);
  const pass=out.runResult&&out.publicationAllowed&&out.authorityIntersections===0&&auditCenterDriftM<=5&&boundaryCenterDriftM<=20&&out.safeCount>=site.minCount&&out.nearestSwaleM<=site.maxNearest&&out.within40>=site.minWithin40&&maxQ<=site.maxQuadrantShare;
  const row={site,setup,targetDriftM,mapCenterDriftM,out,auditCenterDriftM,boundaryCenterDriftM,maxQuadrantShare:maxQ,pass,errors};
  console.log('EARTHLINE_SWALE_FRAME_17540 '+JSON.stringify({browser:BROWSER,...row}));
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
console.log('EARTHLINE_FINAL_CROSS_BROWSER_17540 '+JSON.stringify({browser:BROWSER,candidateSha:process.env.CANDIDATE_SHA||null,pass,elder,swales}));
await browser.close();
if(!pass)process.exitCode=1;
