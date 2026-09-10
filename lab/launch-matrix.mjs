// Current-public launch rerun marker: 2026-09-10T11:50Z
import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const AREA=process.env.EARTHLINE_AREA||'ALL';
const SHARD_INDEX=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const SHARD_TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||1));
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=26000;
const STATES=['Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts','Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey','New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island','South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia','Wisconsin','Wyoming'];
const SE_ASIA=['Brunei','Cambodia','Indonesia','Laos','Malaysia','Myanmar','Philippines','Singapore','Thailand','Timor-Leste','Vietnam'];
const SOURCE=AREA==='US'?STATES:AREA==='SEA'?SE_ASIA:[...STATES,...SE_ASIA];
const TESTS=SOURCE.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
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

function snapshotScript(){
  const m=typeof M!=='undefined'&&M;
  const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const regional=window.earthlineRegional15778||null;
  const audit=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const why=document.getElementById('earthlineWhyNotHere15803');
  let diagnosticVisible=false;
  if(why){const cs=getComputedStyle(why),r=why.getBoundingClientRect();diagnosticVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>1&&r.height>1;}
  return {
    searchGen:Number(m&&m.searchGen||0),locName:String(m&&m.loc&&m.loc.name||''),locFullName:String(m&&m.loc&&m.loc.fullName||''),locCountry:String(m&&m.loc&&m.loc.countryCode||''),analysisReady:!!(m&&m.analysisReady),
    vectorCoverage:m&&m.vectorNoBuildCoverage||null,water16601:window.EARTHLINE_LAB_WATER_16601||null,camera16602:window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602||null,
    mapZoom:Number((window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null))?.getZoom?.()||0),
    regional:regional?{active:!!regional.active,mode:String(regional.mode||''),summary:regional.summary||null}:null,
    displayed:displayed?{tier:String(displayed.tier||displayed.mode||''),name:String(displayed.name||displayed.label||displayed.location||''),runToken:displayed.runToken||displayed.token||null}:null,
    corridorAudit:audit?{tier:String(audit.tier||''),generated:Number(audit.generated||0),sourceFeatures:audit.sourceFeatures,overlaySwaleLines:audit.overlaySwaleLines,checkedAt:audit.checkedAt||null}:null,
    diagnosticVisible,statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,700),runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'
  };
}

async function runQuery(frame,query,kind){
  const before=await frame.evaluate(snapshotScript),errorStart=consoleErrors.length,started=Date.now();
  await frame.evaluate(q=>{const input=document.getElementById('searchInput'),btn=document.getElementById('runBtn');if(!input||!btn)throw new Error('search controls unavailable');input.focus();input.value=q;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));btn.click();},query);
  let timedOut=false;
  try{await frame.waitForFunction(({q,beforeGen})=>{const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const m=typeof M!=='undefined'&&M,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{},btn=document.getElementById('runBtn');const loc=[m&&m.loc&&m.loc.name,m&&m.loc&&m.loc.fullName,d&&d.name,d&&d.label,d&&d.location].map(n).join(' | '),qn=n(q),words=qn.split(' ').filter(Boolean);const identity=words.every(w=>loc.includes(w))||loc.includes(qn);const advanced=Number(m&&m.searchGen||0)>Number(beforeGen||0)||identity;return advanced&&identity&&btn?.getAttribute('aria-busy')!=='true'&&String(d.tier||d.mode||'').toLowerCase()==='regional';},{q:query,beforeGen:before.searchGen},{timeout:WAIT_LIMIT_MS,polling:200});}catch(_){timedOut=true;}
  const elapsedMs=Date.now()-started,after=await frame.evaluate(snapshotScript),locText=norm([after.locName,after.locFullName,after.displayed&&after.displayed.name].filter(Boolean).join(' ')),identity=norm(query).split(' ').filter(Boolean).every(w=>locText.includes(w));
  const newErrors=consoleErrors.slice(errorStart).filter(e=>!/(favicon|ERR_BLOCKED_BY_CLIENT|Failed to load resource.*favicon)/i.test(e.message));
  const performancePass=elapsedMs<=HARD_CEILING_MS;
  const terminalPass=!timedOut&&identity&&after.runBusy===false&&String(after.displayed?.tier||'').toLowerCase()==='regional'&&!/analysis failed/i.test(after.statusText);
  const uiPass=!after.diagnosticVisible;
  return {query,kind,pass:terminalPass&&performancePass&&uiPass,timedOut,elapsedMs,performancePass,terminalPass,identity,uiPass,after,errors:newErrors.slice(0,12)};
}

let frame=await openSurface();
const results=[];
for(const q of TESTS){
  const kind=STATES.includes(q)?'us-state-regional':'se-asia-regional';
  let result;
  try{result=await runQuery(frame,q,kind);}catch(e){result={query:q,kind,pass:false,error:String(e),elapsedMs:null};}
  results.push(result);
  console.log(`${kind==='us-state-regional'?'STATE':'SEA'} ${q}: ${result.pass?'PASS':'FAIL'} ${result.elapsedMs??'n/a'}ms camera16602=${result.after?.camera16602?.installed===true?'ON':'OFF'}`);
  try{frame=await openSurface();}catch(e){console.error('surface reload failed',e);break;}
}
const summary={area:AREA,shardIndex:SHARD_INDEX,shardTotal:SHARD_TOTAL,expected:TESTS.length,run:results.length,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length,camera16602On:results.filter(r=>r.after?.camera16602?.installed===true).length,camera16602Off:results.filter(r=>r.after&&r.after.camera16602?.installed!==true).length};
const report={generatedAt:new Date().toISOString(),url:URL,currentPatches:[16601,16602],acceptedParent:16584,protocol:{hardCeilingMs:HARD_CEILING_MS,acceptedParentUnchanged:true,sharedCoreOnly:true,noStateScienceBranches:true},summary,results,browserErrors:consoleErrors.slice(0,100)};
await fs.mkdir('lab-results',{recursive:true});
const out=`lab-results/regional-${AREA.toLowerCase()}-${SHARD_INDEX}-of-${SHARD_TOTAL}.json`;await fs.writeFile(out,JSON.stringify(report,null,2));
console.log('EARTHLINE_REGIONAL_MATRIX '+JSON.stringify(report));
await browser.close();
if(summary.fail>0)process.exitCode=1;
