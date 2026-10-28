import { chromium } from 'playwright';
import { existsSync } from 'node:fs';
import { resolve,extname } from 'node:path';
const root=process.cwd(),origin='https://earthlinedevelopment.org';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.geojson':'application/geo+json; charset=utf-8','.py':'text/plain; charset=utf-8'};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2,serviceWorkers:'block'});
await context.route(origin+'/**',async route=>{
  const u=new URL(route.request().url());const p=decodeURIComponent(u.pathname).replace(/^\/+/, '')||'index.html';const f=resolve(root,p);
  if(f.startsWith(root)&&existsSync(f))return route.fulfill({status:200,path:f,contentType:mime[extname(f)]||'application/octet-stream',headers:{'cache-control':'no-store'}});
  return route.continue();
});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(origin+'/?mobileUser17603='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{state:'attached',timeout:30000});
await page.locator('#searchInput').fill('Arizona');await page.waitForTimeout(650);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();if(await opt.count())await opt.click();
const run=page.locator('#runBtn');if(await run.isVisible()&&!await run.evaluate(b=>b.dataset.busy==='1'||b.disabled))await run.click();
await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,null,{timeout:120000,polling:150});

const ctl={lng:-111.93067,lat:34.21568};
await page.evaluate(ctl=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  m.jumpTo({center:[ctl.lng,ctl.lat],zoom:17,bearing:0,pitch:0});
  try{m.fire('dragend')}catch(_){}
},ctl);
await page.waitForFunction(ctl=>{
  const t=window.EARTHLINE_PROPERTY_TARGET_16201||null;
  return !!t&&Math.abs(Number(t.lng)-ctl.lng)<.00008&&Math.abs(Number(t.lat)-ctl.lat)<.00008;
},ctl,{timeout:15000,polling:80});
await page.waitForFunction(()=>!!document.getElementById('earthlineMobilePropertyAction17004'),null,{timeout:10000});
await page.waitForFunction(()=> {
  const b=document.getElementById('earthlineMobilePropertyAction17004');if(!b)return false;const cs=getComputedStyle(b),r=b.getBoundingClientRect();
  return cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>0&&r.height>0;
},null,{timeout:10000,polling:80});
const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
const actionBefore=await page.evaluate(()=>({
  target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
  panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
  actionText:document.getElementById('earthlineMobilePropertyAction17004')?.textContent?.trim()||'',
  actionRect:document.getElementById('earthlineMobilePropertyAction17004')?.getBoundingClientRect()?.toJSON?.()||null
}));
await page.locator('#earthlineMobilePropertyAction17004').tap({timeout:15000});
await page.waitForFunction(before=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return !!a&&Number(a.serial||0)>before&&a.settled===true},before,{timeout:150000,polling:120});
await page.waitForTimeout(1800);
const out=await page.evaluate(({before,ctl})=>{
 const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,e=window.EARTHLINE_ELDER_TREE_LAST_17097||null,m=(typeof M!=='undefined'?M:null),mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
 let maxSlope=0,unsafeSlope=0,unsafeNoBuild=0,unsafePond=0,unsafeChannel=0,points=0;let threshold=null;try{threshold=Number(streamThreshold()*3.2)}catch(_){}
 for(const sw of (m?.swales||[]))for(const p of (sw?.pts||[])){const x=Math.max(0,Math.min(GW-1,Math.round(Number(p[0])))),y=Math.max(0,Math.min(GH-1,Math.round(Number(p[1])))),i=y*GW+x;points++;let sp=Infinity;try{sp=Number(slopePct(x,y))}catch(_){};if(Number.isFinite(sp))maxSlope=Math.max(maxSlope,sp);if(!Number.isFinite(sp)||sp>4.000001)unsafeSlope++;if(m?.noBuildMask?.[i])unsafeNoBuild++;if(m?.pond?.[i])unsafePond++;if(Number.isFinite(threshold)&&Number(m?.acc?.[i]||0)>=threshold)unsafeChannel++;}
 const natural=['earthline-property-swale-footprint-16174','earthline-property-swale-natural-casing-16174','earthline-property-swale-natural-up-16174','earthline-property-swale-natural-flip-16174','earthline-property-swale-neutral-16177','earthline-swale-planting-shadow-15806','earthline-swale-planting-layer-15806'];
 const naturalHidden=natural.filter(id=>mp?.getLayer?.(id)).every(id=>mp.getLayoutProperty(id,'visibility')==='none');
 const elderTiles=Array.isArray(e?.workerTimings?.tiles)?e.workerTimings.tiles:[];
 const water=Array.isArray(m?.authoritativeWaterPaths15824?.features)?m.authoritativeWaterPaths15824.features.length:0;
 const target=window.EARTHLINE_PROPERTY_TARGET_16201||null;
 return {audit:a,safe:s,elder:e,serialDelta:Number(a?.serial||0)-Number(before),maxSlope,unsafeSlope,unsafeNoBuild,unsafePond,unsafeChannel,points,naturalHidden,water,target,
 elderPass:e?.state==='committed'&&e?.summary?.coverageKnown===true&&!e?.dynamicError&&elderTiles.some(Boolean),recharge:Number(m?.rechZones?.length||0),aquifer:String(m?.usgsAquiferStatus||'')};
},{before,ctl});
const targetOk=Math.abs(Number(out.target?.lng)-ctl.lng)<.00008&&Math.abs(Number(out.target?.lat)-ctl.lat)<.00008;
const pass=targetOk&&out.audit?.result===true&&out.serialDelta===1&&out.points>0&&out.unsafeSlope===0&&out.unsafeNoBuild===0&&out.unsafePond===0&&out.unsafeChannel===0&&out.safe?.visible===true&&out.naturalHidden&&out.elderPass&&out.water>0&&!errors.length;
console.log('EARTHLINE_MOBILE_USER_17603 '+JSON.stringify({pass,errors,actionBefore,...out}));
await page.screenshot({path:'/tmp/mobile-user-17603.png',fullPage:true});
await browser.close();
if(!pass)process.exitCode=1;
