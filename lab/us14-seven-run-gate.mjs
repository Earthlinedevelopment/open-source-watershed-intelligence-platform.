import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATE=process.env.EARTHLINE_STATE;
const REPEATS=Number(process.env.EARTHLINE_REPEATS||7);
const HARD_CEILING_MS=15000;
if(!STATE)throw new Error('EARTHLINE_STATE is required');

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1440,height:1000}});
const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const results=[];

async function openSurface(){
  const page=await context.newPage();
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  let frame=page;
  const host=await page.$('#earthline-lab-frame');
  if(host){const nested=await host.contentFrame();if(!nested)throw new Error('lab iframe unavailable');frame=nested;}
  await frame.waitForSelector('#searchInput',{timeout:30000});
  return {page,frame};
}

async function selectState(frame,state){
  await frame.evaluate(q=>{
    const input=document.getElementById('searchInput');
    if(!input)throw new Error('search input unavailable');
    input.focus();input.value=q;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  },state);
  await frame.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
  return frame.evaluate(q=>{
    const n=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
    const want=n(q);
    const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
    const match=b=>n(b.dataset.query||'')===want||n(b.textContent||'').includes(want);
    const typed=b=>/state|region/i.test(String(b.textContent||''));
    const b=opts.find(x=>match(x)&&typed(x))||opts.find(match);
    if(!b)return null;
    const out={text:String(b.textContent||'').trim(),query:String(b.dataset.query||'')};
    b.click();return out;
  },state);
}

for(let run=1;run<=REPEATS;run++){
  const started=Date.now();
  const {page,frame}=await openSurface();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  let selection=null,timedOut=false;
  try{selection=await selectState(frame,STATE);}catch(e){errors.push(String(e));}
  if(selection){
    try{
      await frame.waitForFunction(()=>{
        const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        return document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true'&&(/screening published/i.test(s)||/analysis failed/i.test(s))&&(String(d.tier||d.mode||'').toLowerCase()==='regional'||/analysis failed/i.test(s));
      },null,{timeout:32000,polling:100});
    }catch(_){timedOut=true;}
  }
  const elapsedMs=Date.now()-started;
  const snap=await frame.evaluate(()=>{
    const m=typeof M!=='undefined'?M:null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const w=window.EARTHLINE_REGIONAL_MAPPED_WATER_AUDIT_16609||null;
    const land=window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
    const swales=v?.swales?.features||[];
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim();
    const why=document.getElementById('earthlineWhyNotHere15803');
    let diagnosticVisible=false;
    if(why){const cs=getComputedStyle(why),r=why.getBoundingClientRect();diagnosticVisible=cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&r.width>1&&r.height>1;}
    const swaleLayerIds=[];
    try{for(const l of map?.getStyle?.().layers||[])if(/swale/i.test(String(l.id||'')))swaleLayerIds.push(l.id)}catch(_){ }
    const swalePaint=swaleLayerIds.map(id=>{
      let color=null,width=null,opacity=null,dash=null;
      try{color=map.getPaintProperty(id,'line-color')}catch(_){ }
      try{width=map.getPaintProperty(id,'line-width')}catch(_){ }
      try{opacity=map.getPaintProperty(id,'line-opacity')}catch(_){ }
      try{dash=map.getPaintProperty(id,'line-dasharray')}catch(_){ }
      return {id,color,width,opacity,dash};
    });
    return {
      locName:String(m?.loc?.name||''),locFullName:String(m?.loc?.fullName||''),locCountry:String(m?.loc?.countryCode||''),
      displayedTier:String(d.tier||d.mode||''),displayedName:String(d.name||d.label||d.location||''),status,
      land,water:w,swales:swales.length,diagnosticVisible,swalePaint,
      sparse:window.EARTHLINE_US_STATE_SPARSE_GRID_AUDIT_16609||null,
      blue16598:window.EARTHLINE_LAB_BLUE_16598||null
    };
  });
  const identity=norm([snap.locName,snap.locFullName,snap.displayedName].join(' ')).includes(norm(STATE));
  const terminal=!timedOut&&selection&&identity&&snap.displayedTier.toLowerCase()==='regional'&&!/analysis failed/i.test(snap.status);
  const landPass=Number(snap.land?.validLandCellCount||0)>0;
  const waterPass=snap.water?.verified===true&&snap.water?.safe===true;
  const swalePass=Number(snap.swales||0)>0;
  const uiPass=!snap.diagnosticVisible;
  const perfPass=elapsedMs<=HARD_CEILING_MS;
  const pass=!!(terminal&&landPass&&waterPass&&swalePass&&uiPass&&perfPass);
  const row={state:STATE,run,pass,elapsedMs,timedOut,identity,terminal,landPass,waterPass,swalePass,uiPass,perfPass,selection,snap,errors:errors.slice(0,12)};
  results.push(row);
  console.log('US14_RUN '+JSON.stringify({state:STATE,run,pass,elapsedMs,identity,terminal,validLand:Number(snap.land?.validLandCellCount||0),waterVerified:snap.water?.verified===true,waterSafe:snap.water?.safe===true,swales:snap.swales,rawWaterFeatures:snap.water?.rawWaterFeatures,waterPolygonParts:snap.water?.waterPolygonParts,waterwayLines:snap.water?.waterwayLines,diagnosticVisible:snap.diagnosticVisible,swalePaint:snap.swalePaint}));
  if(run===1||run===REPEATS){
    await page.screenshot({path:`lab-results/${STATE.toLowerCase().replace(/[^a-z0-9]+/g,'-')}-run-${run}.png`,fullPage:true}).catch(()=>{});
  }
  await page.close();
}

await fs.mkdir('lab-results',{recursive:true});
const allPass=results.length===REPEATS&&results.every(r=>r.pass);
const report={generatedAt:new Date().toISOString(),url:URL,state:STATE,repeats:REPEATS,hardCeilingMs:HARD_CEILING_MS,allPass,results};
await fs.writeFile(`lab-results/us14-${STATE.toLowerCase().replace(/[^a-z0-9]+/g,'-')}.json`,JSON.stringify(report,null,2));
console.log('US14_SUMMARY '+JSON.stringify({state:STATE,allPass,passes:results.filter(r=>r.pass).length,failures:results.filter(r=>!r.pass).length,times:results.map(r=>r.elapsedMs)}));
await browser.close();
if(!allPass)process.exitCode=1;
