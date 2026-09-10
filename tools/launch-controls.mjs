import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const HARD_CEILING_MS=15000;
const CONTROLS=[
  {name:'Vermont',kind:'state',query:'Vermont',selector:'Vermont state',lat:44.262436,lng:-72.580536},
  {name:'New York',kind:'state',query:'New York',selector:'New York state',lat:42.652843,lng:-73.757874},
  {name:'Alabama',kind:'state',query:'Alabama',selector:'Alabama state',lat:32.377716,lng:-86.300568},
  {name:'Vietnam',kind:'country',query:'Vietnam',selector:'Vietnam country',lat:21.0278,lng:105.8342},
  {name:'Laos',kind:'country',query:'Laos',selector:'Laos country',lat:17.9757,lng:102.6331}
];

function haversineKm(a,b,c,d){
  const R=6371,toRad=x=>x*Math.PI/180;
  const dLat=toRad(c-a),dLng=toRad(d-b);
  const s=Math.sin(dLat/2)**2+Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();

async function open(){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  await page.waitForTimeout(500);
}

async function snap(){
  return await page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||window.M||null;
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;
    const r=window.earthlineRegional15778||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
    const why=document.getElementById('earthlineWhyNotHere15803');
    let debug=false;if(why){const cs=getComputedStyle(why),b=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&b.width>1&&b.height>1;}
    return {
      loc:m?.loc?JSON.parse(JSON.stringify(m.loc)):null,
      searchGen:Number(m&&m.searchGen||0),
      center:{Mlat:Number(m&&m.centerLat),Mlng:Number(m&&m.centerLng),map:map?.getCenter?{lat:map.getCenter().lat,lng:map.getCenter().lng}:null,zoom:map?.getZoom?map.getZoom():null},
      displayed:{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null},
      regional:{active:!!r.active,mode:String(r.mode||''),published:!!r.published},
      runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),
      propertyButton:!!document.getElementById('earthlineDeclareProperty16169'),
      propertyButtonDisabled:!!document.getElementById('earthlineDeclareProperty16169')?.disabled,
      analysisReady:!!(m&&m.analysisReady),swales:Number(m&&m.swales&&m.swales.length||0),recharge:Number(m&&m.rechZones&&m.rechZones.length||0),
      audit:a,publication:p,lock:m&&m.propertyResultLock15815||null,safety:m&&m.safetyAudit15806||null,
      vector:m&&m.vectorNoBuildCoverage||null,water16601:window.EARTHLINE_LAB_WATER_16601||null,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
      debugVisible:debug,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1200)
    };
  });
}

function geography(target,s){
  const loc=s.loc||{},name=String(loc.name||'').toLowerCase(),wanted=target.name.toLowerCase();
  const nameMatch=name===wanted||name.includes(wanted)||wanted.includes(name);
  let bboxPass=null;
  if(Array.isArray(loc.bbox)&&loc.bbox.length===4){bboxPass=target.lng>=loc.bbox[0]&&target.lng<=loc.bbox[2]&&target.lat>=loc.bbox[1]&&target.lat<=loc.bbox[3];}
  const map=s.center.map; const mapDistanceKm=map?haversineKm(target.lat,target.lng,map.lat,map.lng):null;
  // Named canonical selection is authoritative; bbox containment is stronger where available.
  return {nameMatch,bboxPass,mapDistanceKm,pass:nameMatch&&(bboxPass!==false)};
}

async function selectRegional(target){
  const before=await snap(),started=Date.now();
  const input=page.locator('#searchInput');
  await input.fill(target.query);
  await input.dispatchEvent('input');
  const sel=`#earthlineSearchSuggestions15970 [role="option"][data-query="${target.selector}"]`;
  await page.waitForSelector(sel,{state:'visible',timeout:10000});
  await page.locator(sel).first().click({timeout:5000});
  // Selection itself launches Regional; first prove the canonical location changed.
  await page.waitForFunction(({name})=>String((typeof M!=='undefined'&&M&&M.loc&&M.loc.name)||'').toLowerCase().includes(name.toLowerCase()),{name:target.name},{timeout:10000,polling:100});
  try{await page.waitForFunction(()=>document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true',null,{timeout:40000,polling:150});}catch(_){ }
  await page.waitForTimeout(250);
  const s=await snap(),elapsedMs=Date.now()-started,geo=geography(target,s);
  const failed=/analysis failed/i.test(s.status);
  const published=String(s.displayed.tier||'').toLowerCase()==='regional'||/regional screening published/i.test(s.status)||s.regional.active;
  return {before,after:s,elapsedMs,geography:geo,published,failed,performancePass:elapsedMs<=HARD_CEILING_MS,pass:geo.pass&&published&&!failed&&!s.debugVisible&&elapsedMs<=HARD_CEILING_MS};
}

async function runProperty(){
  try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled&&document.documentElement.classList.contains('earthline-property-ready-16188');},null,{timeout:10000,polling:150});}catch(_){ }
  const pre=await snap(),started=Date.now();
  const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {classification:'FAIL',reason:'authoritative Property control unavailable',elapsedMs:0,pre,post:pre};
  let timeout=false;
  try{await page.waitForFunction(()=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');return a.settled===true&&state!=='running';},null,{timeout:40000,polling:150});}catch(_){timeout=true;}
  await page.waitForTimeout(200);
  const post=await snap(),elapsedMs=Date.now()-started,a=post.audit||{};
  const published=a.settled===true&&a.result===true&&(String(post.displayed.tier).toLowerCase()==='property'||post.analysisReady);
  const safe=post.safety?.verified===true&&post.lock?.safetyVerified===true;
  const safelyBlocked=a.settled===true&&a.result===false&&(/stopped safely|blocked|unverified|unavailable|failed/i.test(String(a.error||'')+' '+post.status));
  const staleRegional=post.regional.active===true&&String(post.displayed.tier).toLowerCase()!=='property';
  const perf=elapsedMs<=HARD_CEILING_MS;
  let classification='FAIL';
  if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&published&&safe)classification='PASS';
  else if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&safelyBlocked)classification='SAFE_BLOCK';
  const mw=post.vector?.mappedWater16601||post.vector?.mappedWater||null;
  const five={
    mappedWaterFeatures:Number(mw?.mappedWaterFeatures??mw?.features??mw?.sourceFeatures??mw?.acceptedFeatures??0),
    mappedWaterCells:Number(mw?.mappedWaterCells??mw?.cells??mw?.rasterizedCells??0),
    cellsInFinalNoBuildMask:Number(mw?.cellsInFinalNoBuildMask??mw?.finalMaskCells??mw?.mergedCells??0),
    swaleIntersectWater:Number(post.safety?.swaleIntersectWater??post.safety?.swaleWaterIntersections??post.lock?.swaleIntersectWater??0),
    rechargeIntersectWater:Number(post.safety?.rechargeIntersectWater??post.safety?.rechargeWaterIntersections??post.lock?.rechargeIntersectWater??0)
  };
  return {classification,timeout,elapsedMs,performancePass:perf,published,safe,safelyBlocked,staleRegional,five,pre,post};
}

const rows=[];
for(const target of CONTROLS){
  await open();
  const row={target};
  try{
    row.regional=await selectRegional(target);
    if(!row.regional.pass){row.classification='REGIONAL_FAIL';}
    else{row.property=await runProperty();row.classification=row.property.classification;}
  }catch(e){row.classification='HARNESS_FAIL';row.error=String(e);}
  rows.push(row);
  console.log(`CONTROL ${target.name}: ${row.classification} geo=${row.regional?.geography?.pass?'OK':'BAD'} regional=${row.regional?.elapsedMs??'n/a'} property=${row.property?.elapsedMs??'n/a'} camera=${row.property?.post?.camera16602?.installed===true||row.regional?.after?.camera16602?.installed===true?'ON':'OFF'}`);
}
const summary={total:rows.length,pass:rows.filter(r=>r.classification==='PASS').length,safeBlock:rows.filter(r=>r.classification==='SAFE_BLOCK').length,fail:rows.filter(r=>!['PASS','SAFE_BLOCK'].includes(r.classification)).length,geographicPass:rows.filter(r=>r.regional?.geography?.pass).length,cameraInstalled:rows.filter(r=>r.property?.post?.camera16602?.installed===true||r.regional?.after?.camera16602?.installed===true).length};
const report={generatedAt:new Date().toISOString(),url:URL,acceptedParent:16584,patches:[16601,16602],protocol:{authoritativeSuggestionSelection:true,selectionAutoRunsRegional:true,hardCeilingMs:HARD_CEILING_MS},summary,rows};
await fs.mkdir('runtime-results',{recursive:true});
await fs.writeFile('runtime-results/earthline-five-controls.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_FIVE_CONTROLS '+JSON.stringify(summary));
await browser.close();
if(summary.fail>0||summary.safeBlock>0)process.exitCode=1;
