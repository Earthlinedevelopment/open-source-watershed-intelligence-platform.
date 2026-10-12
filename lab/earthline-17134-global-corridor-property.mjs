import { chromium } from 'playwright';
const TARGET=process.env.TARGET;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
let error=null,attempt=null;
try{
  await page.goto('https://earthlinedevelopment.org/?corridor17134='+encodeURIComponent(TARGET)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},TARGET);
  await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;return !!e||String(d?.query||'').trim().toLowerCase()===String(q).trim().toLowerCase();},TARGET,{timeout:95000,polling:100});
  const regErr=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  if(regErr)throw new Error(JSON.stringify(regErr));
  const target=await page.evaluate(q=>{
    const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
    const f=sw.filter(x=>x?.geometry?.type==='LineString'&&x.geometry.coordinates?.length)
      .sort((a,b)=>Number(a.properties?.rank||999)-Number(b.properties?.rank||999))[0];
    if(!f)return null;
    const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
    return {lng:Number(c[0]),lat:Number(c[1]),source:'global-ranked-corridor-17134',query:q,at:new Date().toISOString()};
  },TARGET);
  if(!target)throw new Error('no Regional corridor target');
  attempt=await page.evaluate(async t=>{
    window.EARTHLINE_PROPERTY_TARGET_16201=t;
    if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
    const fn=window.earthlineDeclarePropertyAtCrosshair16173;
    if(typeof fn!=='function')return {ok:false,error:'Property owner unavailable'};
    try{return {ok:(await Promise.resolve(fn()))!==false};}catch(e){return {ok:false,error:String(e?.message||e)}}
  },target);
  await page.waitForTimeout(2500);
}catch(e){error=String(e?.message||e)}
const out=await page.evaluate(()=>({
  run:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
  pub:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
  block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
  status:document.getElementById('earthlineVermontStatus16147')?.textContent||'',
  tier:document.documentElement.dataset.earthlineAnalysisTier||''
})).catch(()=>({}));
console.log('CORRIDOR17134 '+JSON.stringify({TARGET,error,attempt,out}));
await browser.close();
