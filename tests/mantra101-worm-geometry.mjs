import {chromium} from 'playwright';
import {readFileSync,writeFileSync,mkdirSync,existsSync,statSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
const ROOT=process.cwd(),BASE='https://earthlinedevelopment.org/';
const OUT='artifacts/mantra101-worm';
mkdirSync(OUT,{recursive:true});
const sha=createHash('sha256').update(readFileSync(path.join(ROOT,'index.html'))).digest('hex');
const browser=await chromium.launch({headless:true});
const RAD=Math.PI/180;
function distance(a,b){const p=Number(a[1])*RAD,q=Number(b[1])*RAD,d=(q-p),e=(Number(b[0])-Number(a[0]))*RAD;
 const v=Math.sin(d/2)**2+Math.cos(p)*Math.cos(q)*Math.sin(e/2)**2;return 12742017.6*Math.asin(Math.min(1,Math.sqrt(Math.max(0,v))));}
function inspectLine(coords){
 if(!Array.isArray(coords)||coords.length<2)return {invalid:true,reason:'no points'};
 let lengthM=0,turns=0,nonfinite=false;
 for(let k=1;k<coords.length;k++){const p=coords[k-1],q=coords[k];if(!p||!q||!p.every(Number.isFinite)||!q.every(Number.isFinite)){nonfinite=true;continue}lengthM+=distance(p,q);}
 for(let k=2;k<coords.length;k++){const a=coords[k-2],b=coords[k-1],c=coords[k],lat=b[1]*RAD;const scale=Math.cos(lat);
 const u=[(b[0]-a[0])*scale,b[1]-a[1]],v=[(c[0]-b[0])*scale,c[1]-b[1]],m=Math.hypot(...u)*Math.hypot(...v);
 if(m>1e-15)turns+=Math.acos(Math.max(-1,Math.min(1,(u[0]*v[0]+u[1]*v[1])/m)));
 }
 const chord=distance(coords[0],coords.at(-1)),tortuosity=lengthM/Math.max(1,chord);
 const loopish=lengthM>100&&chord<Math.max(10,lengthM*.12);
 const wormish=(lengthM>150&&tortuosity>3.2)||(lengthM>150&&turns>6*Math.PI);
 return {points:coords.length,lengthM:+lengthM.toFixed(1),chordM:+chord.toFixed(1),tortuosity:+tortuosity.toFixed(2),totalTurnRad:+turns.toFixed(2),loopish,wormish,invalid:nonfinite||!Number.isFinite(lengthM)||!Number.isFinite(tortuosity)};
}
const results=[];
for(const query of ['Vermont','Arizona']){
 const context=await browser.newContext({viewport:{width:1500,height:900}}),page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e)));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.origin!==new URL(BASE).origin)return route.continue();
 let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\\/+/, '')||'index.html'}catch{return route.abort()}
 const local=path.resolve(ROOT,rel);if(local!==ROOT&&!local.startsWith(ROOT+path.sep))return route.abort();
 if(existsSync(local)&&statSync(local).isFile()){
  const ext=path.extname(local).toLowerCase(),types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.css':'text/css','.svg':'image/svg+xml'};
  return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(local)});
 }
 return route.continue();
 });
 let error=null;
 try{
  await page.goto(BASE+'?mantra101='+query+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:20000});
  await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click()},query);
  await page.waitForFunction(()=>{const a=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;return !!e||(Number(a?.generated||0)>0&&!!p?.runToken)},null,{timeout:95000,polling:250});
 }catch(e){error=String(e)}
 let data=await page.evaluate(()=>{
  const audit=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
  let f=[];try{const mp=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap,s=mp?.getSource?.('el-live-swales-15970');const d=s?._data||s?.serialize?.()?.data||null;f=(d?.features||[]).filter(x=>x.geometry?.type==='LineString').map(x=>({coords:x.geometry.coordinates,slope:x.properties?.slope_pct}))}catch{}
  return {tier:document.documentElement.dataset.earthlineAnalysisTier,generated:audit?.generated??null,source:audit?.sourceFeatures??null,runToken:p?.runToken??null,coreMs:p?.phaseTotalsMs?.coreTotalMs??null,failure:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,features:f};
 });
 let inspected=data.features.map(f=>({slope:f.slope,...inspectLine(f.coords)}));
 let bad=inspected.filter(x=>x.invalid||x.loopish||x.wormish||Number(x.slope)>4);
 const result={query,sha256:sha,source:'el-live-swales-15970',error,uiErrors:errors.slice(0,4),tier:data.tier,generated:data.generated,sourceFeatures:data.source,runToken:data.runToken,coreMs:data.coreMs,engineError:data.failure,featureCount:inspected.length,badCount:bad.length,bad:bad.slice(0,12),longest:inspected.sort((a,b)=>b.lengthM-a.lengthM).slice(0,4)};
 result.pass=!error&&!data.failure&&!errors.length&&data.tier==='regional'&&inspected.length>0&&!bad.length;
 results.push(result);
 try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false})}catch{}
 console.log('M101_WORM_GEOMETRY '+JSON.stringify(result));
 await context.close();
}
await browser.close();
writeFileSync(OUT+'/result.json',JSON.stringify(results,null,2));
if(results.some(x=>!x.pass))process.exitCode=1;
