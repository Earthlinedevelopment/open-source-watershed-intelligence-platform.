import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const AREA=process.env.EARTHLINE_AREA||'US';
const SHARD_INDEX=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const SHARD_TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||1));
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=26000;
const STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const SEA=['Brunei','Cambodia','Indonesia','Laos','Malaysia','Myanmar','Philippines','Singapore','Thailand','Timor-Leste','Vietnam'];
const source=AREA==='SEA'?SEA:STATES;
const TESTS=source.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const consoleErrors=[];
page.on('pageerror',e=>consoleErrors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push({type:'console',message:m.text()});});

async function openSurface(){
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  await frame.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
  return frame;
}

function snap(){
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||{};
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
  const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
  const p=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  const btn=document.getElementById('earthlineDeclareProperty16169');
  let debug=false;
  if(why){const cs=getComputedStyle(why),b=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&b.width>1&&b.height>1;}
  return {
    searchGen:Number(m&&m.searchGen||0),locName:String(m&&m.loc&&m.loc.name||''),locFullName:String(m&&m.loc&&m.loc.fullName||''),
    center:{lat:Number(m&&m.centerLat),lng:Number(m&&m.centerLng)},
    displayed:{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null},
    regional:{active:!!r.active,mode:String(r.mode||'')},propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
    propertyReady:document.documentElement.classList.contains('earthline-property-ready-16188'),propertyButton:!!btn,propertyButtonDisabled:!!(btn&&btn.disabled),
    audit:a,publication:p,lock:m&&m.propertyResultLock15815||null,safety:m&&m.safetyAudit15806||null,vector:m&&m.vectorNoBuildCoverage||null,
    water16601:window.EARTHLINE_LAB_WATER_16601||null,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
    swales:Number(m&&m.swales&&m.swales.length||0),recharge:Number(m&&m.rechZones&&m.rechZones.length||0),analysisReady:!!(m&&m.analysisReady),debugVisible:debug,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,900),runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'
  };
}

async function regional(frame,q){
  const before=await frame.evaluate(snap),started=Date.now();
  await frame.evaluate(query=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');if(!i||!b)throw new Error('search controls unavailable');i.focus();i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},q);
  let timeout=false;
  try{await frame.waitForFunction(({q,g})=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const m=typeof M!=='undefined'&&M,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};const text=n([m&&m.loc&&m.loc.name,m&&m.loc&&m.loc.fullName,d.name,d.label,d.location].join(' '));return Number(m&&m.searchGen||0)>=Number(g||0)&&n(q).split(' ').filter(Boolean).every(w=>text.includes(w))&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&String(d.tier||d.mode||'').toLowerCase()==='regional';},{q,g:before.searchGen},{timeout:WAIT_LIMIT_MS,polling:200});}catch(_){timeout=true;}
  const s=await frame.evaluate(snap),elapsedMs=Date.now()-started;
  const settled=!timeout&&String(s.displayed?.tier||'').toLowerCase()==='regional'&&s.runBusy===false;
  const failed=/analysis failed/i.test(s.status);
  return {elapsedMs,timeout,s,pass:settled&&!failed&&elapsedMs<=HARD_CEILING_MS&&!s.debugVisible};
}

async function property(frame){
  try{await frame.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&document.documentElement.classList.contains('earthline-property-ready-16188')&&!b.disabled;},null,{timeout:8000,polling:150});}catch(_){ }
  const pre=await frame.evaluate(snap),errorStart=consoleErrors.length,started=Date.now();
  const clicked=await frame.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked)return {classification:'FAIL',pass:false,reason:'authoritative Property control unavailable',elapsedMs:0,pre,post:pre,errors:[]};
  let timeout=false;
  try{await frame.waitForFunction(({priorGen})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');return a.settled===true&&Number(a.searchGenAtSettle||a.searchGen||0)>=Number(priorGen||0)&&state!=='running';},{priorGen:pre.searchGen},{timeout:WAIT_LIMIT_MS,polling:150});}catch(_){timeout=true;}
  const elapsedMs=Date.now()-started,post=await frame.evaluate(snap),a=post.audit||{};
  const published=a.settled===true&&a.result===true&&(String(post.displayed.tier).toLowerCase()==='property'||post.analysisReady);
  const safe=post.safety?.verified===true&&post.lock?.safetyVerified===true;
  const safelyBlocked=a.settled===true&&a.result===false&&(/stopped safely|blocked|unverified|unavailable|failed/i.test(String(a.error||'')+' '+post.status));
  const staleRegional=post.regional.active===true&&String(post.displayed.tier).toLowerCase()!=='property';
  const perf=elapsedMs<=HARD_CEILING_MS;
  let classification='FAIL';
  if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&published&&safe)classification='PASS';
  else if(!timeout&&!post.debugVisible&&!staleRegional&&perf&&safelyBlocked)classification='SAFE_BLOCK';
  return {classification,pass:classification==='PASS',safeBlock:classification==='SAFE_BLOCK',timeout,elapsedMs,performancePass:perf,published,safe,safelyBlocked,staleRegional,pre,post,errors:consoleErrors.slice(errorStart,errorStart+20)};
}

const rows=[];
let frame=await openSurface();
for(const q of TESTS){
  let row={query:q,area:AREA};
  try{const reg=await regional(frame,q);row.regional=reg;if(!reg.pass){row.classification='REGIONAL_FAIL';row.pass=false;}else{const prop=await property(frame);row.property=prop;row.classification=prop.classification;row.pass=prop.pass;}}
  catch(e){row.classification='HARNESS_FAIL';row.pass=false;row.error=String(e);}
  rows.push(row);
  console.log(`${AREA} ${q}: ${row.classification} regional=${row.regional?.elapsedMs??'n/a'}ms property=${row.property?.elapsedMs??'n/a'}ms camera16602=${row.property?.post?.camera16602?.installed===true||row.regional?.s?.camera16602?.installed===true?'ON':'OFF'}`);
  try{frame=await openSurface();}catch(e){console.error('surface reload failed',e);break;}
}
const summary={area:AREA,shardIndex:SHARD_INDEX,shardTotal:SHARD_TOTAL,expected:TESTS.length,run:rows.length,pass:rows.filter(r=>r.classification==='PASS').length,safeBlock:rows.filter(r=>r.classification==='SAFE_BLOCK').length,fail:rows.filter(r=>!['PASS','SAFE_BLOCK'].includes(r.classification)).length};
const report={generatedAt:new Date().toISOString(),url:URL,currentPatches:[16601,16602],acceptedParent:16584,protocol:{hardCeilingMs:HARD_CEILING_MS,realPropertyControl:true,acceptedParentUnchanged:true,sharedCoreOnly:true,safetyRequiredForPublishedProperty:true},summary,rows};
await fs.mkdir('lab-results',{recursive:true});
const out=`lab-results/property-${AREA.toLowerCase()}-${SHARD_INDEX}-of-${SHARD_TOTAL}.json`;await fs.writeFile(out,JSON.stringify(report,null,2));
console.log('EARTHLINE_PROPERTY_MATRIX '+JSON.stringify(report));
await browser.close();
if(summary.fail>0||summary.safeBlock>0)process.exitCode=1;
