import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const SHARD=Number(process.env.EARTHLINE_SHARD_INDEX||0);
const TOTAL=Math.max(1,Number(process.env.EARTHLINE_SHARD_TOTAL||1));
const HARD=15000;
const TARGETS=[
  {q:'Hawaii',type:'state'},{q:'Alaska',type:'state'},{q:'Idaho',type:'state'},
  {q:'Minnesota',type:'state'},{q:'Texas',type:'state'},{q:'West Virginia',type:'state'},
  {q:'New Hampshire',type:'state'},{q:'Maryland',type:'state'},{q:'Missouri',type:'state'},
  {q:'Vermont',type:'state'},{q:'Cambodia',type:'country'},{q:'Laos',type:'country'},
  {q:'Thailand',type:'country'},{q:'Timor-Leste',type:'country'},{q:'Vietnam',type:'country'}
].filter((_,i)=>i%TOTAL===SHARD);
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const browser=await chromium.launch({headless:true});
const results=[];

for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errs=[];page.on('pageerror',e=>errs.push(String(e)));page.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  let result={query:target.q,type:target.type,pass:false};
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true&&window.EARTHLINE_REGIONAL_CAMERA_SCALE_16602?.auditOnly===true,null,{timeout:20000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},target.q);
    await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
    const picked=await page.evaluate(({q,type})=>{
      const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
      const want=type==='state'?/state|region/i:/country/i;
      const exact=opts.find(b=>want.test(b.textContent||'')&&(n(b.dataset.query||'')===n(q)||n(b.dataset.query||'')===n(q+' '+type)||n(b.textContent||'').startsWith(n(q))));
      const fallback=opts.find(b=>n(b.textContent||'').includes(n(q)));
      const b=exact||fallback;if(!b)return null;const p={text:(b.textContent||'').trim(),query:b.dataset.query||''};b.click();return p;
    },target);
    if(!picked)throw new Error('suggestion not found');
    const started=Date.now();let timeout=false;
    try{await page.waitForFunction(()=>{
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      return /screening published|ANALYSIS FAILED/i.test(s)&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
    },null,{timeout:22000,polling:120});}catch(_){timeout=true;}
    const elapsedMs=Date.now()-started;
    const snap=await page.evaluate(()=>{
      const m=typeof M!=='undefined'?M:null,map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const rd=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
      const ca=window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null;
      const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      const why=document.getElementById('earthlineWhyNotHere15803');let debug=false;
      if(why){const cs=getComputedStyle(why),r=why.getBoundingClientRect();debug=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>1&&r.height>1;}
      const c=map?.getCanvas?.(),r=c?.getBoundingClientRect?.();let rendered=0;try{rendered=map?.queryRenderedFeatures?.()?.length||0}catch(_){}
      return {locName:String(m?.loc?.name||''),locFullName:String(m?.loc?.fullName||''),status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim(),displayed:d,regionalDisplay:rd,cameraAudit:ca,flowAudit:fa,map:{exists:!!map,w:r?.width||0,h:r?.height||0,rendered},debug};
    });
    const text=norm([snap.locName,snap.locFullName,snap.displayed?.query,snap.status].filter(Boolean).join(' '));
    const identity=norm(target.q).split(' ').every(w=>text.includes(w));
    const failed=/ANALYSIS FAILED/i.test(snap.status);
    const published=/screening published/i.test(snap.status)&&snap.displayed?.renderSettlement?.coreVisible===true;
    const mapVisible=snap.map.exists&&snap.map.w>300&&snap.map.h>250&&snap.map.rendered>0;
    const presentation=Number(snap.regionalDisplay?.waterPaths||0)>0&&Number(snap.regionalDisplay?.swaleLines||0)>0;
    const cameraReady=snap.cameraAudit?.settled===true&&Number(snap.cameraAudit?.coverage||0)>=0.98;
    const flowSafe=snap.flowAudit?.safe===true&&Number(snap.flowAudit?.unsafeSegments||0)===0;
    const pass=!timeout&&!failed&&published&&identity&&mapVisible&&presentation&&cameraReady&&flowSafe&&!snap.debug&&elapsedMs<=HARD;
    result={query:target.q,type:target.type,picked,pass,timeout,elapsedMs,performancePass:elapsedMs<=HARD,failed,published,identity,mapVisible,presentation,cameraReady,flowSafe,debug:snap.debug,status:snap.status,derived:snap.displayed?.derived||null,flowAudit:snap.flowAudit||null,errors:errs.slice(0,12)};
  }catch(e){result={...result,error:String(e),errors:errs.slice(0,12)};}
  results.push(result);console.log(`RECHECK ${target.q}: ${result.pass?'PASS':'FAIL'} ${result.elapsedMs??'n/a'}ms :: ${result.status||result.error||''}`);
  await page.close();
}
await fs.mkdir('lab-results',{recursive:true});
const report={generatedAt:new Date().toISOString(),url:URL,hardCeilingMs:HARD,shard:SHARD,total:TOTAL,results,pass:results.filter(r=>r.pass).length,fail:results.filter(r=>!r.pass).length};
await fs.writeFile(`lab-results/launch-failure-recheck-${SHARD}-of-${TOTAL}.json`,JSON.stringify(report,null,2));
console.log('EARTHLINE_LAUNCH_FAILURE_RECHECK '+JSON.stringify(report));
await browser.close();
if(report.fail)process.exitCode=1;
