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
    window.__earthlineFinal17545={events:[],lastCommitSig:'',lastSerial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0)};
    const activationSnap=(kind,e)=>{
      try{window.__earthlineFinal17545.events.push({kind:'raw-'+kind,t:performance.now(),targetId:String(e.target?.id||''),targetTag:String(e.target?.tagName||''),closestProperty:!!e.target?.closest?.('#earthlineDeclareProperty16169')})}catch(_){}
      if(!e.target?.closest?.('#earthlineDeclareProperty16169'))return;
      try{
        const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),c=m?.getCenter?.(),t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
        window.__earthlineFinal17545.events.push({kind,t:performance.now(),
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
          window.__earthlineFinal17545.events.push({kind:'elder-worker-post',id:String(msg.id||''),t:performance.now()});
        }
      }catch(_){}
      return orig.call(this,msg,...rest);
    };
    const watch=()=>{
      try{
        const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
        const serial=Number(audit?.serial||0);
        if(serial!==window.__earthlineFinal17545.lastSerial){window.__earthlineFinal17545.lastSerial=serial;window.__earthlineFinal17545.events.push({kind:'property-serial',serial,t:performance.now()});}
        const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
        if(e?.state==='committed'){
          const sig=String(e.propertyRunIdentity||'')+'|'+String(e.at||'');
          if(sig&&sig!==window.__earthlineFinal17545.lastCommitSig){
            window.__earthlineFinal17545.lastCommitSig=sig;
            window.__earthlineFinal17545.events.push({kind:'elder-commit',identity:String(e.propertyRunIdentity||''),at:String(e.at||''),t:performance.now()});
          }
        }
      }catch(_){}
      requestAnimationFrame(watch);
    };
    requestAnimationFrame(watch);
  });
  await page.goto('https://earthlinedevelopment.org/?final17545='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
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
      eventCount:window.__earthlineFinal17545.events.length
    }));
    await page.locator('#earthlineDeclareProperty16169').click();
    const activation=await page.evaluate(from=>{
      const ev=window.__earthlineFinal17545.events.slice(from);
      return ev.find(x=>x.kind==='actual-pointerup')||ev.find(x=>x.kind==='actual-click')||null;
    },before.eventCount);
    if(!activation){
      const debug=await page.evaluate(before=>({before,afterSerial:Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0),button:(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b)return null;const r=b.getBoundingClientRect();return {disabled:b.disabled,aria:b.getAttribute('aria-disabled'),busy:b.dataset.busy||'',owner:b.dataset.earthlinePropertyClickOwner16546||'',press:b.dataset.earthlinePressAccepted17494||'',pointerLaunch:b.dataset.earthlinePointerLaunch17444||'',rect:{x:r.x,y:r.y,width:r.width,height:r.height},connected:b.isConnected}})(),target:window.EARTHLINE_PROPERTY_TARGET_16201||null,runState:document.documentElement.dataset.earthlinePropertyRunState||'',events:window.__earthlineFinal17545.events.slice(before.eventCount)}),before);
      console.log('EARTHLINE_ACTIVATION_MISS_17545 '+JSON.stringify({browser:BROWSER,label,q,debug}));
      rows.push({label,q,activationObserved:false,debug,pass:false});
      continue;
    }
    const expected=[Number(activation?.target?.lng).toFixed(6),Number(activation?.target?.lat).toFixed(6)].join('|')+'|';
    const elderP=page.waitForFunction(prefix=>{
      const e=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      return e?.state==='committed'&&String(e.propertyRunIdentity||'').startsWith(prefix);
    },expected,{timeout:25000,polling:25}).then(()=>true).catch(()=>false);
    const propertyP=page.waitForFunction(s=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      return Number(a?.serial||0)>s&&a?.settled===true;
    },before.serial,{timeout:120000,polling:50}).then(()=>true).catch(()=>false);
    const [elderCommittedWithin25,propertySettled]=await Promise.all([elderP,propertyP]);
    await page.waitForTimeout(100);
    const out=await page.evaluate(({before,expected,label,q,activation})=>{
      const ev=window.__earthlineFinal17545.events.slice(before.eventCount);
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
    out.elderCommittedWithin25=elderCommittedWithin25;
    out.elderWithin12=out.elderMs!=null&&out.elderMs<=12000;
    out.propertySettledObserved=propertySettled;
    out.launchPass=out.activationT!=null&&out.serialAfter===out.serialBefore+1&&out.serialTransitions===1&&out.serialMs!=null&&out.serialMs<=2000&&out.propertySettled&&out.propertyResult&&out.sameTarget&&out.elderState==='committed'&&out.elderIdentity?.startsWith(expected)&&out.elderWithin12;
    out.pass=out.activationT!=null&&out.serialAfter===out.serialBefore+1&&out.serialTransitions===1&&out.serialMs!=null&&out.serialMs<=2000&&out.propertySettled&&out.propertyResult&&out.sameTarget&&out.elderState==='committed'&&out.elderIdentity?.startsWith(expected)&&elderCommittedWithin25;
    rows.push(out);
    console.log('EARTHLINE_ELDER_FLOW_17545 '+JSON.stringify({browser:BROWSER,...out}));
  }
  await context.close();
  return {pass:rows.every(r=>r.pass)&&!errors.length,rows,errors};
}

const elder=await elderFlow();
const diagnosticPass=elder.rows.length===2&&elder.rows.every(r=>r.pass)&&!elder.errors.length;
const launchPass=elder.rows.length===2&&elder.rows.every(r=>r.launchPass)&&!elder.errors.length;
console.log('EARTHLINE_FIREFOX_ELDER_EXTENDED_17545 '+JSON.stringify({browser:BROWSER,candidateSha:process.env.CANDIDATE_SHA||null,diagnosticPass,launchPass,elder}));
await browser.close();
if(!diagnosticPass)process.exitCode=1;
