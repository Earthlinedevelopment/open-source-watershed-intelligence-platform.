import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const SHARD_INDEX=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const SHARD_TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||1));
const HARD_CEILING_MS=15000;
const WAIT_LIMIT_MS=20000;
const STATES=['Vermont','Maryland','New York','Massachusetts','Arizona','Colorado','New Mexico','Nevada','Utah','Oklahoma','California','Nebraska','North Carolina','Texas','Alabama','Alaska','Florida','Hawaii','Idaho','Missouri','Virginia'];
const TESTS=STATES.filter((_,i)=>i%SHARD_TOTAL===SHARD_INDEX);
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const page=await context.newPage();
const browserErrors=[];
page.on('pageerror',e=>browserErrors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')browserErrors.push({type:'console',message:m.text()});});

async function openSurface(){
  await page.goto(URL+'?m36='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
}

async function snap(){
  return await page.evaluate(()=>{
    const m=typeof M!=='undefined'?M:null;
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const rd=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    let rendered=null,canvas={w:0,h:0,display:null,visibility:null};
    try{
      const c=map?.getCanvas?.(),r=c?.getBoundingClientRect?.();
      canvas={w:r?.width||0,h:r?.height||0,display:c?getComputedStyle(c).display:null,visibility:c?getComputedStyle(c).visibility:null};
      rendered=map?.queryRenderedFeatures?.()?.length??null;
    }catch(_){}
    const why=document.getElementById('earthlineWhyNotHere15803');
    let debugVisible=false;
    if(why){const cs=getComputedStyle(why),r=why.getBoundingClientRect();debugVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>1&&r.height>1;}
    return {
      loc:{name:String(m?.loc?.name||''),fullName:String(m?.loc?.fullName||''),countryCode:String(m?.loc?.countryCode||'')},
      displayed:d,regionalDisplay:rd,flowAudit:fa,analysisReady:!!m?.analysisReady,
      status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),
      runBusy:document.getElementById('runBtn')?.getAttribute('aria-busy')==='true',
      map:{exists:!!map,canvas,rendered},debugVisible
    };
  });
}

async function runState(name){
  await openSurface();
  const err0=browserErrors.length;
  await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
  try{await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});}
  catch(e){return {state:name,pass:false,stage:'suggestions',error:String(e),after:await snap().catch(()=>null)};}
  const started=Date.now();
  const picked=await page.evaluate(name=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const b=opts.find(x=>/state|region/i.test(x.textContent||'')&&(n(x.dataset.query||'')===n(name)||n(x.textContent||'').includes(n(name))))||opts.find(x=>n(x.textContent||'').includes(n(name)));
    if(!b)return null;
    const r={text:String(b.textContent||'').trim(),query:String(b.dataset.query||'')};b.click();return r;
  },name);
  if(!picked)return {state:name,pass:false,stage:'pick',picked:null,after:await snap()};
  let timedOut=false;
  try{
    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const terminal=/screening published|analysis failed/i.test(s);
      const regional=String(d?.tier||d?.mode||'').toLowerCase()==='regional';
      return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&terminal&&(regional||/analysis failed/i.test(s));
    },null,{timeout:WAIT_LIMIT_MS,polling:150});
  }catch(_){timedOut=true;}
  const elapsedMs=Date.now()-started;
  const after=await snap();
  const identityText=norm([after.loc.name,after.loc.fullName,after.displayed?.name,after.displayed?.label,after.displayed?.location,after.status].filter(Boolean).join(' '));
  const identity=norm(name).split(' ').every(w=>identityText.includes(w));
  const mapVisible=after.map.exists&&after.map.canvas.w>300&&after.map.canvas.h>250&&after.map.canvas.display!=='none'&&after.map.canvas.visibility!=='hidden'&&Number(after.map.rendered||0)>0;
  const flowSafe=after.flowAudit?.safe===true&&Number(after.flowAudit?.unsafeSegments??after.flowAudit?.unsafeDisplayedSegments??0)===0;
  const waterPaths=Number(after.regionalDisplay?.waterPaths||0);
  const swaleLines=Number(after.regionalDisplay?.swaleLines||0);
  const presentation=waterPaths>0&&swaleLines>0;
  const published=/screening published/i.test(after.status)&&String(after.displayed?.tier||after.displayed?.mode||'').toLowerCase()==='regional'&&!/analysis failed/i.test(after.status);
  const performance=elapsedMs<=HARD_CEILING_MS;
  const pass=!timedOut&&identity&&mapVisible&&flowSafe&&presentation&&published&&performance&&!after.debugVisible;
  return {state:name,pass,timedOut,elapsedMs,performance,identity,mapVisible,flowSafe,presentation,waterPaths,swaleLines,published,picked,after,errors:browserErrors.slice(err0,err0+12)};
}

const results=[];
for(const state of TESTS){
  const r=await runState(state).catch(e=>({state,pass:false,error:String(e)}));
  results.push(r);
  console.log(`M36_STATE ${state}: ${r.pass?'PASS':'FAIL'} ${r.elapsedMs??'n/a'}ms water=${r.waterPaths??'n/a'} swales=${r.swaleLines??'n/a'} safe=${r.flowSafe??'n/a'}`);
}
const report={test:'Mantra 36 exact accepted 16584 launch21 control',acceptedCommit:'74343a24f90fed7d7abbe9267ef11a2836220de7',acceptedArtifactSha256:'19f075d67cc19b12c6169be69aad78dc37acee0cdcb62c957f94d423bd45c33f',url:URL,hardCeilingMs:HARD_CEILING_MS,shardIndex:SHARD_INDEX,shardTotal:SHARD_TOTAL,pass:results.filter(x=>x.pass).length,fail:results.filter(x=>!x.pass).length,results,browserErrors:browserErrors.slice(0,40)};
console.log('EARTHLINE_M36_16584_CONTROL '+JSON.stringify(report));
await browser.close();
if(report.fail>0)process.exitCode=1;
