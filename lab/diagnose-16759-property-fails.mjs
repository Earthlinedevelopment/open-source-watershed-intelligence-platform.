import { chromium } from 'playwright';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATE=process.env.STATE;
const MAX=Number(process.env.MAX_TARGETS||4);
if(!STATE)throw new Error('STATE required');
const browser=await chromium.launch({headless:true});

async function runRegional(page,stateName){
  await page.goto(URL+'?propertydiag16759='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{
    window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
    window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731=null;
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  },stateName);
  await page.waitForFunction(expected=>{
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const audit=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
    const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
    const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
    const generated=Number(pub?.generated??0),visible=Number(disp?.swaleLines??0);
    return (exact||vt)&&(!!err||(!!audit&&generated>0&&visible===generated));
  },stateName,{timeout:60000,polling:100});
  const err=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  if(err)throw new Error('regional '+JSON.stringify(err));
}
async function targets(page,stateName){
  return page.evaluate(q=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const parent=String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||'');
    return sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
      .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))
      .slice(0,8).map(f=>{
        const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
        return {lng:Number(c[0]),lat:Number(c[1]),source:'property-diagnostic-16759',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,parentRunToken:parent,at:new Date().toISOString()};
      });
  },stateName);
}
async function attempt(index){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  const started=Date.now();let target=null,out=null,thrown=null;
  try{
    await runRegional(page,STATE);
    const ts=await targets(page,STATE);
    target=ts[index]||null;
    if(!target)throw new Error('target '+index+' unavailable');
    out=await page.evaluate(async t=>{
      window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
      window.EARTHLINE_LOCATION_INTEGRITY_15801=null;
      window.EARTHLINE_PROPERTY_TARGET_16201=t;
      window.earthlineSetPropertyTarget16201?.(t);
      const fn=window.earthlineDeclarePropertyAtCrosshair16173;
      if(typeof fn!=='function')return {returned:false,thrown:'property owner unavailable'};
      try{
        const result=await Promise.race([Promise.resolve(fn()),new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),55000))]);
        return {returned:result!==false,result};
      }catch(e){return {returned:false,thrown:String(e&&e.message||e)}}
    },target);
  }catch(e){thrown=String(e&&e.message||e)}
  await page.waitForTimeout(600);
  const snap=await page.evaluate(()=>({
    run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
    waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
    integrity:window.EARTHLINE_LOCATION_INTEGRITY_15801||null,
    displayedTier:String(window.EARTHLINE_DISPLAYED_RUN_16151?.tier||window.EARTHLINE_DISPLAYED_RUN_16147?.tier||'').toLowerCase(),
    documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
    handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
    timeout:window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null
  })).catch(e=>({snapshotError:String(e)}));
  await page.close();
  return {index,elapsedMs:Date.now()-started,target,out,thrown,snap};
}
const rows=[];
for(let i=0;i<MAX;i++){
  const r=await attempt(i);rows.push(r);
  if(r.out?.returned===true&&r.snap?.publication?.published===true)break;
}
await browser.close();
console.log(JSON.stringify({state:STATE,rows,success:rows.some(r=>r.out?.returned===true&&r.snap?.publication?.published===true)}));
