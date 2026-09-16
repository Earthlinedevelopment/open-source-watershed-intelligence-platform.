import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/lab.html';
const QUERY='Texas';
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=30000;

const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
const el=await page.waitForSelector('#earthline-lab-frame',{timeout:20000});
const frame=await el.contentFrame();
if(!frame)throw new Error('lab iframe unavailable');
await frame.waitForSelector('#searchInput',{timeout:30000});

const beforeGen=await frame.evaluate(()=>Number((typeof M!=='undefined'&&M&&M.searchGen)||0));
const started=Date.now();
await frame.evaluate(q=>{
  const input=document.getElementById('searchInput');
  const btn=document.getElementById('runBtn');
  if(!input||!btn)throw new Error('search controls unavailable');
  input.focus();
  input.value=q;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  btn.click();
},QUERY);

let timedOut=false;
try{
  await frame.waitForFunction(({q,beforeGen})=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const m=typeof M!=='undefined'&&M;
    const r=window.earthlineRegional15778||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const btn=document.getElementById('runBtn');
    const loc=[m&&m.loc&&m.loc.name,m&&m.loc&&m.loc.fullName,d&&d.name,d&&d.label,d&&d.location].map(n).join(' | ');
    const qn=n(q);
    const identity=qn.split(' ').filter(Boolean).every(w=>loc.includes(w));
    const advanced=Number(m&&m.searchGen||0)>Number(beforeGen||0)||identity;
    const settled=(btn?.getAttribute('aria-busy')!=='true')&&r.active!==true;
    return advanced&&identity&&settled;
  },{q:QUERY,beforeGen},{timeout:WAIT_LIMIT_MS,polling:200});
}catch(_){timedOut=true;}

const elapsedMs=Date.now()-started;
const snapshot=await frame.evaluate(()=>{
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const audit=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const flowSource=window.earthlineMap?.getSource?.('el-live-flows-15970');
  const sourceData=flowSource?._data||null;
  const flowFeatures=Array.isArray(sourceData?.features)?sourceData.features:[];
  const why=document.getElementById('earthlineWhyNotHere15803');
  let diagnosticVisible=false;
  if(why){const cs=getComputedStyle(why),rr=why.getBoundingClientRect();diagnosticVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&rr.width>1&&rr.height>1;}
  return {
    searchGen:Number(m&&m.searchGen||0),
    locName:String(m&&m.loc&&m.loc.name||''),
    locFullName:String(m&&m.loc&&m.loc.fullName||''),
    analysisReady:!!(m&&m.analysisReady),
    regional:r?{active:!!r.active,mode:String(r.mode||''),summary:r.summary||null}:null,
    displayed:d?{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||'')}:null,
    corridorAudit:audit?{tier:String(audit.tier||''),generated:Number(audit.generated||0),sourceFeatures:audit.sourceFeatures,overlaySwaleLines:audit.overlaySwaleLines,checkedAt:audit.checkedAt||null}:null,
    flowFeatureCount:flowFeatures.length,
    waterPathCount:flowFeatures.filter(f=>String(f?.properties?.feature_type||f?.properties?.type||'').toLowerCase()==='flow').length,
    diagnosticVisible,
    statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1000),
    runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true'
  };
});

const locText=norm([snapshot.locName,snapshot.locFullName,snapshot.displayed&&snapshot.displayed.name].filter(Boolean).join(' '));
const identity=norm(QUERY).split(' ').every(w=>locText.includes(w));
const performancePass=elapsedMs<=HARD_CEILING_MS;
const terminalPass=!timedOut&&identity&&snapshot.runBusy===false&&!(snapshot.regional&&snapshot.regional.active);
const uiPass=!snapshot.diagnosticVisible;
const pass=terminalPass&&performancePass&&uiPass;
const report={generatedAt:new Date().toISOString(),url:URL,query:QUERY,acceptedParent:16584,productExpectedFromLive:true,hardCeilingMs:HARD_CEILING_MS,pass,timedOut,elapsedMs,performancePass,terminalPass,identity,uiPass,snapshot,errors:errors.slice(0,30)};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/mantra39-texas-now.json',JSON.stringify(report,null,2));
console.log('MANTRA39_TEXAS '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
