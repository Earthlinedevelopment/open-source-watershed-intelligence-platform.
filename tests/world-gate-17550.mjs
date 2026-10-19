import { chromium } from 'playwright';
import fs from 'node:fs';

const QUERY=process.env.QUERY||'';
const MODE=process.env.MODE||'country';
if(!QUERY)throw new Error('QUERY required');
const index=fs.readFileSync('index.html','utf8');
const launch=fs.readFileSync('earthline-launch-16872.js','utf8');
const worker=fs.readFileSync('earthline-elder-worker-js-17527.js','utf8');
const language=fs.readFileSync('earthline-language-hotfix-16890.js','utf8');
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1600,height:900}});
await context.route('**/*',async r=>{
  const u=new URL(r.request().url());
  if(r.request().resourceType()==='document'&&/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&u.pathname==='/')
    return r.fulfill({status:200,body:index,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-launch-16872\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:launch,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-elder-worker-js-17527\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:worker,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  if(/^(?:www\.)?earthlinedevelopment\.org$/i.test(u.hostname)&&/\/earthline-language-hotfix-16890\.js$/.test(u.pathname))
    return r.fulfill({status:200,body:language,headers:{'content-type':'text/javascript; charset=utf-8','cache-control':'no-store'}});
  return r.continue();
});
const page=await context.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
let loadError=null,timedOut=false,property=null;
const started=Date.now();
try{
  await page.goto('https://earthlinedevelopment.org/?world17550='+encodeURIComponent(QUERY)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const input=page.locator('#searchInput');
  await input.fill(QUERY);
  await page.waitForTimeout(650);
  const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
  const n=await options.count();
  if(n){
    let hit=0;
    for(let k=0;k<n;k++){
      const tx=String(await options.nth(k).textContent()||'').toLowerCase();
      if(tx.includes(QUERY.toLowerCase())){hit=k;break}
    }
    await options.nth(hit).click();
  }
  const b=page.locator('#runBtn');
  if(await b.isVisible()&&!await b.isDisabled())await b.click();
  try{
    await page.waitForFunction(()=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return !!err||/published\./i.test(s);
    },null,{timeout:60000,polling:100});
  }catch(_){timedOut=true}
  if(MODE==='state'&&!timedOut&&!await page.evaluate(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970)){
    const targets=await page.evaluate(q=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      return sw.filter(f=>f?.geometry?.type==='LineString'&&f.geometry.coordinates?.length).slice(0,8).map(f=>{
        const cs=f.geometry.coordinates,c=cs[Math.floor((cs.length-1)/2)];
        return {lng:+c[0],lat:+c[1],source:'world-gate-17550',code:String(f.properties?.display_code||''),score:+(f.properties?.score||0),query:q,at:new Date().toISOString()};
      });
    },QUERY);
    let chosen=null,attempts=[];
    for(const target of targets.slice(0,6)){
      const a=await page.evaluate(async t=>{
        try{
          window.EARTHLINE_PROPERTY_TARGET_16201=t;
          window.earthlineSetPropertyTarget16201?.(t);
          const fn=window.earthlineDeclarePropertyAtCrosshair16173;
          if(typeof fn!=='function')return {ok:false,error:'owner unavailable'};
          const out=await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property timeout')),55000))]);
          const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
          return {ok:out!==false&&audit?.settled===true&&audit?.result===true,audit,water:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null};
        }catch(e){return {ok:false,error:String(e?.message||e),water:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null}}
      },target);
      attempts.push({target,ok:a.ok,error:a.error||null,water:a.water||null});
      if(a.ok){chosen=target;break}
    }
    property=await page.evaluate(({chosen,attempts})=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
      return {chosen,attempts,settled:a?.settled===true,result:a?.result===true,timedOut:a?.timedOut===true,corridors:Number(a?.corridors??p?.publicationCount??0),published:p?.published===true,safeVisible:s?.visible===true,safeCount:Number(s?.count||0),renderVerified:a?.renderVerified===true,error:a?.error||null};
    },{chosen,attempts});
  }
}catch(e){loadError=String(e?.message||e)}

const snap=loadError?{}:await page.evaluate(()=>({
  status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),
  perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
  pub:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
  display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
  flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,
  boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
  lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
}));
const generated=Number(snap.pub?.generated??0),visible=Number(snap.display?.swaleLines??snap.pub?.overlaySwaleLines??0);
const unsafe=Number(snap.flow?.unsafeSegments??0),outside=Number(snap.boundary?.outsideAfterClip?.swales??0),coreMs=Number(snap.perf?.totalMs??0);
const regionalPass=!loadError&&!timedOut&&!errors.length&&!snap.lastError&&/published\./i.test(snap.status)&&generated>0&&visible===generated&&unsafe===0&&outside===0&&coreMs<=15000;
const propertyPass=MODE!=='state'||!!(property?.chosen&&property.settled&&property.result&&!property.timedOut&&property.published&&property.renderVerified&&(property.corridors===0||property.safeVisible));
const result={query:QUERY,mode:MODE,pass:regionalPass&&propertyPass,regionalPass,propertyPass,loadError,timedOut,errors,elapsedMs:Date.now()-started,coreMs,generated,visible,unsafe,outside,status:snap.status||'',lastError:snap.lastError||null,property};
console.log('EARTHLINE_WORLD_GATE_17550 '+JSON.stringify(result));
await context.close();await browser.close();
if(!result.pass)process.exitCode=1;
