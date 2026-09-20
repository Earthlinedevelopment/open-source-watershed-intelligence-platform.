import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/';
const STATES=(process.env.STATES||'Texas|Vermont|Hawaii|Alaska|New York').split('|').filter(Boolean);
const browser=await chromium.launch({headless:true});
const rows=[];

for(const stateName of STATES){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const started=Date.now();
  let regionalError=null,propertyError=null,propertyReturn=null,target=null;
  try{
    await page.goto(URL+'?propdiag16724='+encodeURIComponent(stateName)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },stateName);
    await page.waitForFunction(expected=>{
      const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');
      const pkg=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
      const exact=String(pkg?.identity?.name||'').toLowerCase()===String(expected).toLowerCase();
      const vt=String(expected).toLowerCase()==='vermont'&&String(pub?.runToken||'').toLowerCase().includes('vermont');
      return (exact||vt) && (!!err || (!!pub?.runToken&&/screening published\./i.test(status)));
    },stateName,{timeout:60000,polling:100});
    regionalError=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(!regionalError){
      target=await page.evaluate(q=>{
        const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
        const f=sw.find(x=>x?.geometry?.type==='LineString'&&Array.isArray(x.geometry.coordinates)&&x.geometry.coordinates.length);
        if(!f)return null;
        const c=f.geometry.coordinates[Math.floor((f.geometry.coordinates.length-1)/2)];
        return {lng:Number(c[0]),lat:Number(c[1]),source:'property-certification-16724',code:String(f.properties?.display_code||f.properties?.grade||''),score:Number(f.properties?.score||0),query:q,at:new Date().toISOString()};
      },stateName);
      if(!target) throw new Error('no regional corridor target available');
      const result=await page.evaluate(async t=>{
        try{
          window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178=null;
          window.EARTHLINE_PROPERTY_TARGET_16201=t;
          if(typeof window.earthlineSetPropertyTarget16201==='function')window.earthlineSetPropertyTarget16201(t);
          const fn=window.earthlineDeclarePropertyAtCrosshair16173;
          if(typeof fn!=='function')return {ok:false,error:'governed property function unavailable'};
          const timeout=new Promise((_,rej)=>setTimeout(()=>rej(new Error('property promise timeout')),55000));
          const out=await Promise.race([Promise.resolve(fn()),timeout]);
          return {ok:out!==false,out};
        }catch(e){return {ok:false,error:String(e&&e.message||e)};}
      },target);
      propertyReturn=result;
      if(!result.ok)propertyError=result.error||'property returned false';
    }
  }catch(e){ propertyError=propertyError||String(e&&e.message||e); }

  await page.waitForTimeout(500);
  const snap=await page.evaluate(()=>{
    const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const active=window.EARTHLINE_PROPERTY_ACTIVE_STAGE_16178||null;
    const timeout=window.EARTHLINE_PROPERTY_TIMEOUT_AUDIT_16178||null;
    const propertyKeys={};
    for(const k of Object.keys(window).filter(k=>/EARTHLINE_.*PROPERTY/i.test(k)).sort()){
      let v;try{v=window[k];}catch(_){continue;}
      if(v==null||typeof v==='function')continue;
      try{
        const s=JSON.stringify(v);
        if(s&&s.length<12000)propertyKeys[k]=v;
      }catch(_){}
    }
    const st=window.earthlineModel||window.EARTHLINE_MODEL||null;
    return {
      displayed:displayed&&{
        tier:displayed.tier||displayed.mode||null,
        query:displayed.query||null,
        runToken:displayed.runToken||null,
        corridorCount:displayed.corridorCount??displayed.swaleCount??null,
        rechargeScore:displayed.rechargeScore??null
      },
      active,
      timeout,
      propertyKeys,
      documentTier:document.documentElement.dataset.earthlineAnalysisTier||null,
      documentRunState:document.documentElement.dataset.earthlineRunState||null,
      propertyRunState:document.documentElement.dataset.earthlinePropertyRunState||null
    };
  }).catch(e=>({snapshotError:String(e)}));
  rows.push({state:stateName,elapsedMs:Date.now()-started,target,regionalError,propertyReturn,propertyError,snap});
  await page.close();
}
await browser.close();
const out={at:new Date().toISOString(),url:URL,rows};
fs.writeFileSync(process.env.OUT||'lab/16724-property-sample.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out));
