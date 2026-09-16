import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const QUERY='Texas';
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=60000;
const POLL_MS=200;
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForSelector('#runBtn',{timeout:30000});

const readState=()=>page.evaluate(()=>{
  const m=typeof M!=='undefined'&&M;
  const r=window.earthlineRegional15778||null;
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const audit=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
  const map=window.earthlineMap;
  const flowSource=map?.getSource?.('el-live-flows-15970');
  const swaleSource=map?.getSource?.('el-live-swales-15970');
  const flowData=flowSource?._data||null;
  const swaleData=swaleSource?._data||null;
  const flowFeatures=Array.isArray(flowData?.features)?flowData.features:[];
  const swaleFeatures=Array.isArray(swaleData?.features)?swaleData.features:[];
  const why=document.getElementById('earthlineWhyNotHere15803');
  let diagnosticVisible=false;
  if(why){const cs=getComputedStyle(why),rr=why.getBoundingClientRect();diagnosticVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&rr.width>1&&rr.height>1;}
  const runBtn=document.getElementById('runBtn');
  return {
    searchGen:Number(m&&m.searchGen||0),
    currentStage:String(m&&m.currentStage||''),
    analysisReady:!!(m&&m.analysisReady),
    locName:String(m&&m.loc&&m.loc.name||''),
    locFullName:String(m&&m.loc&&m.loc.fullName||''),
    runBusy:!!(runBtn?.dataset?.busy)||runBtn?.getAttribute('aria-busy')==='true',
    regional:r?{active:!!r.active,mode:String(r.mode||''),summary:r.summary||null}:null,
    displayed:d?{tier:String(d.tier||d.mode||''),name:String(d.name||d.label||d.location||''),runToken:d.runToken||d.token||null}:null,
    corridorAudit:audit?{tier:String(audit.tier||''),generated:Number(audit.generated||0),sourceFeatures:Number(audit.sourceFeatures||0),overlaySwaleLines:Number(audit.overlaySwaleLines||0),checkedAt:audit.checkedAt||null}:null,
    flowFeatureCount:flowFeatures.length,
    waterPathCount:flowFeatures.filter(f=>String(f?.properties?.feature_type||f?.properties?.type||'').toLowerCase()==='flow').length,
    swaleFeatureCount:swaleFeatures.length,
    diagnosticVisible,
    statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,800)
  };
});

const before=await readState();
const started=Date.now();
await page.evaluate(q=>{
  const input=document.getElementById('searchInput');
  const btn=document.getElementById('runBtn');
  if(!input||!btn)throw new Error('search controls unavailable');
  input.focus();
  input.value=q;
  input.dispatchEvent(new Event('input',{bubbles:true}));
  input.dispatchEvent(new Event('change',{bubbles:true}));
  btn.click();
},QUERY);

const timeline=[];
let lastKey='';
let finalState=null;
let timedOut=true;
while(Date.now()-started<WAIT_LIMIT_MS){
  const s=await readState();
  const t=Date.now()-started;
  const key=JSON.stringify([s.currentStage,s.statusText,s.runBusy,s.regional?.active,s.regional?.mode,s.displayed?.name,s.displayed?.tier,s.corridorAudit?.checkedAt,s.corridorAudit?.generated,s.flowFeatureCount,s.swaleFeatureCount,s.analysisReady]);
  if(key!==lastKey){timeline.push({tMs:t,...s});lastKey=key;}
  const locText=norm([s.locName,s.locFullName,s.displayed?.name].filter(Boolean).join(' '));
  const identity=norm(QUERY).split(' ').filter(Boolean).every(w=>locText.includes(w));
  const auditFresh=!!s.corridorAudit&&s.corridorAudit.checkedAt!==before.corridorAudit?.checkedAt&&(s.corridorAudit.generated>0||s.corridorAudit.sourceFeatures>0||s.corridorAudit.overlaySwaleLines>0);
  const displayFresh=!!s.displayed&&norm(s.displayed.name).includes('texas')&&(s.displayed.runToken!==before.displayed?.runToken||norm(before.displayed?.name)!=='texas');
  const outputFresh=(s.flowFeatureCount>0||s.swaleFeatureCount>0)&&(before.flowFeatureCount===0&&before.swaleFeatureCount===0||auditFresh||displayFresh||s.searchGen>before.searchGen);
  const settled=!s.runBusy&&!(s.regional&&s.regional.active);
  if(identity&&s.analysisReady&&settled&&(auditFresh||displayFresh||outputFresh)){
    finalState=s;timedOut=false;break;
  }
  await sleep(POLL_MS);
}
if(!finalState)finalState=await readState();
const elapsedMs=Date.now()-started;
const locText=norm([finalState.locName,finalState.locFullName,finalState.displayed?.name].filter(Boolean).join(' '));
const identity=norm(QUERY).split(' ').filter(Boolean).every(w=>locText.includes(w));
const auditFresh=!!finalState.corridorAudit&&finalState.corridorAudit.checkedAt!==before.corridorAudit?.checkedAt&&(finalState.corridorAudit.generated>0||finalState.corridorAudit.sourceFeatures>0||finalState.corridorAudit.overlaySwaleLines>0);
const displayFresh=!!finalState.displayed&&norm(finalState.displayed.name).includes('texas')&&(finalState.displayed.runToken!==before.displayed?.runToken||norm(before.displayed?.name)!=='texas');
const freshPublication=auditFresh||displayFresh||finalState.flowFeatureCount>0||finalState.swaleFeatureCount>0;
const performancePass=elapsedMs<=HARD_CEILING_MS;
const terminalPass=!timedOut&&identity&&finalState.analysisReady&&finalState.runBusy===false&&!(finalState.regional&&finalState.regional.active)&&freshPublication;
const contentPass=finalState.flowFeatureCount>0&&finalState.swaleFeatureCount>0;
const uiPass=!finalState.diagnosticVisible;
const pass=terminalPass&&contentPass&&performancePass&&uiPass;
const report={generatedAt:new Date().toISOString(),url:URL,query:QUERY,acceptedParent:16584,hardCeilingMs:HARD_CEILING_MS,pass,timedOut,elapsedMs,performancePass,terminalPass,contentPass,identity,uiPass,freshPublication,before,finalState,timeline,errors:errors.slice(0,40)};
await fs.mkdir('lab-results',{recursive:true});
await fs.writeFile('lab-results/mantra39-texas-now.json',JSON.stringify(report,null,2));
console.log('MANTRA39_TEXAS '+JSON.stringify(report));
await browser.close();
if(!pass)process.exitCode=1;
