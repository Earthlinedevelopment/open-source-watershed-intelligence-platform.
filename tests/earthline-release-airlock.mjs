import {chromium} from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';

// Pinned checkout: every Earthline same-origin asset that exists in the candidate
// is served from THAT checkout, never silently substituted with current live JS.
// Mapbox and scientific upstream hosts still use the public Earthline HTTPS origin.
const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
const html=readFileSync(path.join(ROOT,'index.html'));
const sha256=createHash('sha256').update(html).digest('hex');
const critical=['Arizona','New Mexico','Colorado','Texas','California','Vermont','New York'];
const extended=['Arkansas','Iowa','Nebraska','Oklahoma','Alaska'];
const cases=process.env.EARTHLINE_EXTENDED==='1'?critical.concat(extended):critical;
const ids={Arizona:'us-az','New Mexico':'us-nm',Colorado:'us-co',Texas:'us-tx',California:'us-ca',Vermont:'us-vt','New York':'us-ny',Arkansas:'us-ar',Iowa:'us-ia',Nebraska:'us-ne',Oklahoma:'us-ok',Alaska:'us-ak'};
mkdirSync('artifacts/release-airlock',{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];
function haversine(a,b){
 const R=6371008.8,rad=Math.PI/180,p1=Number(a[1])*rad,p2=Number(b[1])*rad,
 dp=(Number(b[1])-Number(a[1]))*rad,dl=(Number(b[0])-Number(a[0]))*rad;
 const q=Math.sin(dp/2)**2+Math.cos(p1)*Math.cos(p2)*Math.sin(dl/2)**2;
 return 2*R*Math.asin(Math.min(1,Math.sqrt(q)));
}
async function pinnedPage(){
 const ctx=await browser.newContext({viewport:{width:1600,height:950}});
 const page=await ctx.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{
   const req=route.request(),url=new URL(req.url());
   if(url.origin!==new URL(BASE).origin)return route.continue();
   let rel;
   try{rel=decodeURIComponent(url.pathname).replace(/^\/+/, '')}catch{return route.abort()}
   if(!rel)rel='index.html';
   const local=path.resolve(ROOT,rel);
   if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
   if(existsSync(local)&&statSync(local).isFile()){
     const ext=path.extname(local).toLowerCase();
     const mime={'.js':'application/javascript','.mjs':'application/javascript','.json':'application/json',
       '.geojson':'application/geo+json','.html':'text/html; charset=utf-8','.css':'text/css',
       '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml'};
     return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:readFileSync(local)});
   }
   return route.continue();
 });
 return {ctx,page,errors};
}
async function region(query){
 const {ctx,page,errors}=await pinnedPage();let error=null;
 const t=Date.now();
 try{
   await page.goto(BASE+'?earthline_airlock='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
   await page.waitForSelector('#searchInput',{timeout:15000});
   await page.evaluate(q=>{
     const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
     if(!i||!b)throw Error('Run Analysis UI unavailable');
     i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));
     i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
   },query);
   await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||
     !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:90000,polling:200});
 }catch(e){error=String(e)}
 const snap=await page.evaluate(()=>{
   const p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
   const u=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
   const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
   const a=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
   const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
   const overlay=document.querySelector('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"]');
   const paths=[...(overlay?.querySelectorAll(':scope > path')||[])];
   const dark=paths.filter(el=>el.getAttribute('stroke')==='rgba(8,18,13,.96)');
   const blackDots=dark.filter(el=>{
     let len=Infinity;try{len=el.getTotalLength()}catch{}
     return len<3&&(parseFloat(getComputedStyle(el).strokeWidth)||0)>=10;
   }).length;
   const blackMaxWidth=Math.max(0,...dark.map(el=>parseFloat(getComputedStyle(el).strokeWidth)||0));
   const coreCount=paths.filter(el=>(el.getAttribute('class')||'').includes('earthline-swale-core-16168')).length;
   let fc=null;
   try{
     const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
     const s=map?.getSource?.('el-live-swales-15970');
     fc=s?._data||s?.serialize?.()?.data||null;
   }catch{}
   return {profileId:pkg?.profileId||null,coreMs:p?.phaseTotalsMs?.coreTotalMs??null,
     swales:u?.generated??null,sourceFeatures:u?.sourceFeatures??null,
     visible:u?.overlaySwaleLines??null,flowPaths:p?.waterPaths??null,
     unsafe:a?.unsafeSegments??null,outside:b?.outsideAfterClip?.swales??null,
     blackDots,blackMaxWidth,coreCount,overlayPresent:!!overlay,
     features:Array.isArray(fc?.features)?fc.features.map(f=>({
       coords:f?.geometry?.coordinates||null,slope:Number(f?.properties?.slope_pct)
     })):null,
     tier:document.documentElement.dataset.earthlineAnalysisTier||null,
     failure:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
 });
 const features=snap.features||[];
 const lengths=features.map(f=>Array.isArray(f.coords)?
   f.coords.reduce((m,v,i)=>m+(i?haversine(f.coords[i-1],v):0),0):NaN);
 const maxLength=lengths.length?Math.max(...lengths):null;
 const slopes=features.map(f=>f.slope),maxSlope=slopes.length?Math.max(...slopes):null;
 const fails=[];
 if(error||snap.failure)fails.push('engine failed: '+String(error||snap.failure).slice(0,140));
 if(errors.length)fails.push('uncaught JavaScript error');
 if(snap.tier!=='regional'||snap.profileId!==ids[query])fails.push('wrong run tier/target');
 if(!Number.isFinite(snap.coreMs)||snap.coreMs>15000)fails.push('core exceeds 15-second ceiling');
 if(!Number.isInteger(snap.swales)||snap.swales<=0||
    snap.swales!==snap.sourceFeatures||snap.swales!==snap.visible||snap.swales!==features.length)
   fails.push('no swales or publication/source/display disagreement');
 if(!Number.isFinite(maxLength)||maxLength>4005)fails.push('invalid or overlong source corridor');
 if(!Number.isFinite(maxSlope)||maxSlope>4.0001||slopes.some(x=>!Number.isFinite(x)||x<0))
   fails.push('slope >4% or unverified');
 if(snap.unsafe!==0)fails.push('unsafe segments or missing independent safety proof');
 if(!Number.isInteger(snap.flowPaths)||snap.flowPaths<=0)fails.push('mapped directional water paths absent');
 if(!snap.overlayPresent||snap.blackDots!==0||snap.blackMaxWidth>=10)
   fails.push('black swale dot/overwide casing regression');
 if(snap.coreCount!==snap.swales)fails.push('SVG corridor render parity mismatch');
 if(snap.outside!==null&&snap.outside!==0)fails.push('out-of-jurisdiction swale');
 const row={query,sha256,runWallMs:Date.now()-t,coreMs:snap.coreMs,waterPaths:snap.flowPaths,
   count:snap.swales,maxLengthM:maxLength,maxSlope,unsafe:snap.unsafe,outside:snap.outside,
   blackDots:snap.blackDots,blackMaxWidth:snap.blackMaxWidth,coreCount:snap.coreCount,
   errors:errors.slice(-5),fails,pass:fails.length===0};
 rows.push(row);console.log('EARTHLINE_RELEASE_AIRLOCK '+JSON.stringify(row));
 await page.screenshot({path:'artifacts/release-airlock/'+query.toLowerCase().replace(/\s+/g,'-')+'.png'}).catch(()=>{});
 await ctx.close();
}
for(const q of cases)await region(q);
await browser.close();
const result={sha256,commit:process.env.GITHUB_SHA||null,critical:cases,passed:rows.filter(r=>r.pass).length,
 failed:rows.filter(r=>!r.pass).map(r=>r.query),rows};
writeFileSync('artifacts/release-airlock/results.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_RELEASE_AIRLOCK_SUMMARY '+JSON.stringify({
 sha256,resultTotal:rows.length,passed:result.passed,failed:result.failed}));
if(result.failed.length)process.exitCode=1;
