import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const TARGET={lng:-73.012909,lat:44.513845,label:'61 Sleepy Hollow Rd, Essex, Vermont, USA'};
const HARD_CEILING_MS=15000;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const host=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await host.contentFrame();if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});
await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});

const prepared=await frame.evaluate(async target=>{
  const site=window.earthlineSelectedSiteFromCenter(M?.loc||null,target.lng,target.lat,20);
  const applied=await window.applyLocation(site,null,M.searchGen,{analyzeNow:false,preserveMapView:false});
  if(!applied)return {ok:false,reason:'applyLocation rejected fixed Vermont site'};
  await new Promise(r=>setTimeout(r,2500));
  const set=window.earthlineSetPropertyTarget16201({lng:target.lng,lat:target.lat,source:'fixed-vt-property-control'},{openPanel:false});
  const b=document.getElementById('earthlineDeclareProperty16169');
  return {ok:!!set,modelCenter:{lng:M?.centerLng,lat:M?.centerLat},jurisdiction:M?.propertyJurisdiction16516||null,ready:document.documentElement.classList.contains('earthline-property-ready-16188'),button:!!b,disabled:!!b?.disabled};
},TARGET);
console.log('EARTHLINE_VT_PROPERTY_PREPARED '+JSON.stringify(prepared));

if(!prepared.ok){await browser.close();process.exitCode=1;}else{
  const started=Date.now();let callResult=null,callError=null;
  try{callResult=await frame.evaluate(async()=>await window.earthlineDeclarePropertyAtCrosshair16169());}catch(e){callError=String(e)}
  const elapsedMs=Date.now()-started;
  const result=await frame.evaluate(()=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const s=M?.safetyAudit15806||null,lock=M?.propertyResultLock15815||null;
    const j=M?.propertyJurisdiction16516||null,b=window.EARTHLINE_PROPERTY_BOUNDARY_AUDIT_16178||null;
    return {audit:a,safety:s,lock,jurisdiction:j,boundaryAudit:b,swaleCount:Number(M?.swales?.length||0),safeSwaleCount:Number(M?.authoritativeSafeSwales15815?.length||0),rechargeCount:Number(M?.rechZones?.length||0),water16601:M?.vectorNoBuildCoverage?.mappedWater16601||null,propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1800),debugVisible:(()=>{const e=document.getElementById('earthlineWhyNotHere15803');if(!e)return false;const c=getComputedStyle(e),r=e.getBoundingClientRect();return c.display!=='none'&&c.visibility!=='hidden'&&r.width>1&&r.height>1})()};
  });
  const centerMatches=Math.abs(Number(result.audit?.center?.lng)-TARGET.lng)<1e-6&&Math.abs(Number(result.audit?.center?.lat)-TARGET.lat)<1e-6;
  const settled=result.audit?.settled===true&&result.propertyState!=='running';
  const vermont=(result.jurisdiction?.insideVermont===true||result.boundaryAudit?.ok===true)&&result.jurisdiction?.mode!=='portable-non-vermont';
  const corridors=Number(result.audit?.corridors??result.safeSwaleCount??result.swaleCount);
  const pass=!callError&&settled&&centerMatches&&vermont&&elapsedMs<=HARD_CEILING_MS&&result.audit?.result===true&&corridors>0&&result.safety?.verified===true&&result.lock?.safetyVerified===true&&!result.debugVisible;
  console.log('EARTHLINE_VT_PROPERTY '+JSON.stringify({test:'Vermont fixed Property control',labBuild:16601,acceptedParent:16584,target:TARGET,centerMatches,vermont,settled,elapsedMs,hardCeilingMs:HARD_CEILING_MS,callResult,callError,corridors,pass,result,errors:errors.slice(0,30)}));
  await browser.close();if(!pass)process.exitCode=1;
}
