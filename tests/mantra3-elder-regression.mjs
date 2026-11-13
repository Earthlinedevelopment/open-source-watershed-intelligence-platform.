import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const origin='https://earthlinedevelopment.org/';
const TARGET={lat:42.13000,lng:-93.68000};
const files={
  '/':'index.html',
  '/index.html':'index.html',
  '/earthline-elder-restored-17097.js':'earthline-elder-restored-17097.js',
  '/earthline-elder-worker-17129.js':'earthline-elder-worker-17129.js'
};
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const context=await browser.newContext({viewport:{width:1440,height:900},serviceWorkers:'block'});
let requestsServed={};
await context.route('**/*',async route=>{
  try {
    const u=new URL(route.request().url());
    if(['earthlinedevelopment.org','www.earthlinedevelopment.org'].includes(u.hostname)&&files[u.pathname]){
      const p=files[u.pathname];requestsServed[p]=(requestsServed[p]||0)+1;
      return route.fulfill({status:200,contentType:p.endsWith('.js')?'text/javascript':'text/html',body:await fs.readFile(p)});
    }
  }catch(_){}
  return route.continue();
});
const page=await context.newPage(),errors=[],network=[];
page.on('pageerror',e=>errors.push(String(e)));
page.on('requestfailed',r=>{if(network.length<50)network.push({url:r.url(),err:r.failure()?.errorText})});
const out={candidate:'c7d98bc7da30b93ceaf170d3828eb4dbc8fbaf5a',target:TARGET,runs:[],errors,network,requestsServed,passed:false};
async function snapshot(label){
  return page.evaluate(label=>{
    const last=window.EARTHLINE_ELDER_TREE_LAST_17097||null,api=window.EARTHLINE_ELDER_TREES_V1_17097||null;
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const source=map?.getSource?.('earthline-elder-trees-17097');
    let count=0;
    try{count=(source?._data?.features||source?.serialize?.()?.data?.features||[]).length}catch(_){}
    return {label,tier:document.documentElement.dataset.earthlineAnalysisTier,
      propertyState:document.documentElement.dataset.earthlinePropertyRunState,
      propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      propertyTarget:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      last,apiPresent:!!api,apiCount:api?.features?.()?.length||0,
      sourceCount:count,layerPresent:!!map?.getLayer?.('earthline-elder-tree-points-17097'),
      mapZoom:map?.getZoom?.()||null,gauge:document.getElementById('earthlineElderTreesGauge17097')?.textContent||'',
      dynamicError:window.EARTHLINE_ELDER_TREE_LAST_17097?.dynamicError||null};
  },label);
}
async function prepare(label){
 return page.evaluate(async ({label,target})=>{
    if(!window.earthlineSelectedSiteFromCenter||!window.applyLocation||!window.earthlineSetPropertyTarget16201)
      return {ok:false,error:'Property APIs unavailable'};
    const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
    const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
    const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'mantra3-'+label},{openPanel:false});
    return {ok:!!applied&&!!set,applied,set:!!set};
 },{label,target:TARGET});
}
async function runProperty(label){
  const prepared=await prepare(label);
  const before=await snapshot('before '+label);
  if(!prepared.ok)return {label,prepared,before,pass:false};
  await page.evaluate(()=>{void window.earthlineDeclarePropertyAtCrosshair16169();});
  let waitError=null;
  try{
    await page.waitForFunction(previous=>{
      const x=window.EARTHLINE_ELDER_TREE_LAST_17097||{};
      const tier=String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase();
      return tier==='property' && x.at && x.at!==previous &&
        ['committed','failed','publication-pending'].includes(x.state);
    },before.last?.at||'',{timeout:150000,polling:250});
  }catch(e){waitError=String(e).slice(0,400)}
  const after=await snapshot('after '+label);
  const identity=String(after.last?.propertyRunIdentity||'');
  const pass=!waitError&&after.last?.state==='committed'&&after.last?.mapPublished===true&&
    after.apiCount>0&&after.sourceCount>0&&after.layerPresent&&
    identity.includes('-93.680000')&&identity.includes('42.130000');
  return {label,prepared,waitError,before:{last:before.last,apiCount:before.apiCount},after,pass};
}
try{
  await page.goto(origin,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,null,{timeout:45000,polling:250});
  out.loader=true;
  out.runs.push(await runProperty('Property first'));
  out.runs.push(await runProperty('Property second'));
  let region={};
  try{
    const ready=await page.evaluate(()=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      if(!i||!b)return false;
      i.value='Iowa';i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));b.click();return true;
    });
    if(!ready)throw new Error('Regional search controls not present');
    await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()==='regional',null,{timeout:75000,polling:350});
    region={pass:true,snapshot:await snapshot('regional')};
  }catch(e){region={pass:false,error:String(e).slice(0,400),snapshot:await snapshot('regional failure')}}
  out.regional=region;
  out.runs.push(await runProperty('Regional to Property'));
  out.passed=out.loader && out.regional.pass && out.runs.every(r=>r.pass);
}catch(e){out.fatal=String(e?.stack||e).slice(0,2000)}
finally{
  await fs.writeFile('mantra3-browser-result.json',JSON.stringify(out,null,2));
  console.log('MANTRA3_BROWSER_RESULT '+JSON.stringify({
    passed:out.passed,loader:out.loader,regional:out.regional?.pass,
    runs:out.runs.map(r=>({label:r.label,pass:r.pass,error:r.waitError,last:r.after?.last?.state,features:r.after?.apiCount,sourceCount:r.after?.sourceCount,identity:r.after?.last?.propertyRunIdentity})),
    fatal:out.fatal,requestsServed,errors:errors.slice(0,8),network:network.slice(0,6)
  }));
  await browser.close();
  if(!out.passed)process.exitCode=1;
}
