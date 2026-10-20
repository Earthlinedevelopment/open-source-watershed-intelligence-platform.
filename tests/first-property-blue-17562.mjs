import { chromium } from 'playwright';

const BASE=process.env.BASE_URL||'http://127.0.0.1:8787';
const SITE={lng:-96.39479,lat:35.80761};
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('console',m=>{ if(m.type()==='error') errors.push('console:'+m.text()); });

await page.addInitScript(()=>{
  window.__EARTHLINE_BLUE_FIRST_PROPERTY_17562={precommitBlue:[],samples:0};
  const watch=()=>{
    try{
      const box=window.__EARTHLINE_BLUE_FIRST_PROPERTY_17562;
      const svg=document.getElementById('earthlinePropertyWaterOverlay15824');
      const m=(typeof M!=='undefined'?M:null);
      const publication=m?.propertyPublication15816||null;
      const committed=publication?.committed===true;
      if(svg){
        const cs=getComputedStyle(svg);
        const visible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&svg.childElementCount>0;
        if(visible&&!committed&&box.precommitBlue.length<20){
          box.precommitBlue.push({
            t:performance.now(),
            display:cs.display,
            children:svg.childElementCount,
            searchGen:Number(m?.searchGen||0),
            publication:publication?{committed:publication.committed===true,searchGen:Number(publication.searchGen||0),safetyVerified:publication.safetyVerified===true}:null
          });
        }
      }
      box.samples++;
    }catch(_){}
    requestAnimationFrame(watch);
  };
  requestAnimationFrame(watch);
});

await page.goto(BASE+'/?blue17562='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.locator('#searchInput').fill('Oklahoma');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
const n=await opts.count();
if(!n) throw new Error('No Oklahoma search suggestion');
let pick=0;
for(let i=0;i<n;i++){
  const t=(await opts.nth(i).innerText()).replace(/\s+/g,' ').trim().toLowerCase();
  if(t.includes('oklahoma')){pick=i;break;}
}
await opts.nth(pick).click();
await page.waitForTimeout(250);
const run=page.locator('#runBtn');
if(await run.isVisible()&&!await run.isDisabled()) await run.click();
await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const tier=String(d?.tier||d?.mode||'').toLowerCase();
  return tier==='regional'&&String(document.documentElement.dataset.earthlineRunState||'')==='published';
},null,{timeout:150000,polling:100});

await page.evaluate(async site=>{
  const m=(typeof M!=='undefined'?M:null);
  const o=window.earthlineSelectedSiteFromCenter(m?.loc||null,site.lng,site.lat,20);
  if(!o) throw new Error('selected site object unavailable');
  const ok=await window.applyLocation(o,null,m.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!ok) throw new Error('applyLocation rejected target');
  await new Promise(r=>setTimeout(r,500));
  if(typeof window.earthlineSetPropertyTarget16201!=='function') throw new Error('Property target owner unavailable');
  window.earthlineSetPropertyTarget16201({lng:site.lng,lat:site.lat,source:'blue-test-17562',code:'',score:0,at:new Date().toISOString()},{openPanel:false});
},SITE);

const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
await page.evaluate(async()=>{
  if(typeof window.earthlineDeclarePropertyAtCrosshair16169!=='function') throw new Error('Property run owner unavailable');
  return await window.earthlineDeclarePropertyAtCrosshair16169();
});
await page.waitForFunction(p=>{
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  return Number(a?.serial||0)>p&&a?.settled===true;
},pre,{timeout:180000,polling:100});
await page.waitForTimeout(800);

const out=await page.evaluate(site=>{
  const box=window.__EARTHLINE_BLUE_FIRST_PROPERTY_17562||{};
  const m=(typeof M!=='undefined'?M:{});
  const pub=m.propertyPublication15816||null;
  const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const water=m.authoritativeWaterPaths15824||{features:[]};
  const boundary=Array.isArray(m.analysisBoundaryLngLat)?m.analysisBoundaryLngLat:[];
  let minLng=Infinity,maxLng=-Infinity,minLat=Infinity,maxLat=-Infinity;
  for(const p of boundary){
    if(!Array.isArray(p)||p.length<2) continue;
    minLng=Math.min(minLng,Number(p[0]));maxLng=Math.max(maxLng,Number(p[0]));
    minLat=Math.min(minLat,Number(p[1]));maxLat=Math.max(maxLat,Number(p[1]));
  }
  const hasBounds=[minLng,maxLng,minLat,maxLat].every(Number.isFinite);
  let coordCount=0,outsideCount=0,maxCenterM=0;
  for(const f of water.features||[]){
    const cs=f?.geometry?.type==='LineString'?f.geometry.coordinates:[];
    for(const p of cs){
      if(!Array.isArray(p)||p.length<2) continue;
      const lng=Number(p[0]),lat=Number(p[1]); if(!Number.isFinite(lng)||!Number.isFinite(lat)) continue;
      coordCount++;
      if(hasBounds&&(lng<minLng-1e-7||lng>maxLng+1e-7||lat<minLat-1e-7||lat>maxLat+1e-7)) outsideCount++;
      const dx=(lng-site.lng)*111320*Math.cos(site.lat*Math.PI/180),dy=(lat-site.lat)*111320;
      maxCenterM=Math.max(maxCenterM,Math.hypot(dx,dy));
    }
  }
  const svg=document.getElementById('earthlinePropertyWaterOverlay15824');
  const cs=svg?getComputedStyle(svg):null;
  const renderer=m.directWaterRenderer15824||null;
  return {
    site,
    precommitBlue:box.precommitBlue||[],
    watcherSamples:Number(box.samples||0),
    publication:pub,
    propertyAudit:{serial:audit?.serial,settled:audit?.settled,result:audit?.result,corridors:audit?.corridors},
    water:{features:Number(water.features?.length||0),coordCount,outsideCount,maxCenterM:+maxCenterM.toFixed(2),method:m.waterPathGeneration15824?.method||null},
    renderer,
    overlay:{display:cs?.display||null,children:svg?.childElementCount||0},
    boundary:{points:boundary.length,minLng,maxLng,minLat,maxLat}
  };
},SITE);

const pass=
  out.precommitBlue.length===0&&
  out.publication?.committed===true&&
  Number(out.publication?.searchGen)===Number(await page.evaluate(()=>{const m=(typeof M!=='undefined'?M:null);return m?.searchGen;}))&&
  out.propertyAudit?.settled===true&&
  out.propertyAudit?.result===true&&
  out.water.outsideCount===0;

console.log('EARTHLINE_FIRST_PROPERTY_BLUE_17562 '+JSON.stringify({...out,errors,pass}));
await browser.close();
if(!pass) process.exit(1);
