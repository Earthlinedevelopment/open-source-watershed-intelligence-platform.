import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];
page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()});});

async function snap(){
  return page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||null;
    const r=window.earthlineRegional15778||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,1200);
    const pbtn=document.getElementById('earthlineDeclareProperty16169');
    const regionalTip=[...document.querySelectorAll('body *')].some(el=>{
      const t=String(el.textContent||'').trim();
      if(!t.startsWith('Regional corridors are clickable')||t.length>240)return false;
      const s=getComputedStyle(el),b=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&b.width>2&&b.height>2;
    });
    let center=null;
    try{const c=earthlineMap?.getCenter?.();center=c?{lng:Number(c.lng),lat:Number(c.lat)}:null;}catch(_){}
    return {
      locName:String(m?.loc?.name||''),locFullName:String(m?.loc?.fullName||''),
      displayedTier:String(d.tier||d.mode||''),displayedName:String(d.name||d.label||d.location||''),
      regionalActive:!!r.active,analysisReady:!!m?.analysisReady,terrainReady:!!m?.terrainReady,demReady:!!m?.demReady,
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),propertyAudit:a,
      propertyButton:!!pbtn,propertyDisabled:!!pbtn?.disabled,
      status,lastRegionalError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      regionalTip,center
    };
  });
}

async function regional(){
  const start=Date.now();
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b)throw new Error('search controls unavailable');
    i.focus();i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
  });
  let timedOut=false;
  try{await page.waitForFunction(()=>{
    const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
    const m=(typeof M!=='undefined'&&M)||null;
    const tx=/texas/i.test(String(m?.loc?.name||''))||/texas/i.test(String(m?.loc?.fullName||''));
    return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||(tx&&/screening published\./i.test(s)&&!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191);
  },{timeout:30000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(300);
  return {elapsedMs:Date.now()-start,timedOut,state:await snap()};
}

async function property(label){
  try{await page.waitForFunction(()=>{const b=document.getElementById('earthlineDeclareProperty16169');return !!b&&!b.disabled;},{timeout:10000,polling:100});}catch(_){}
  const before=await snap();
  const priorToken=String(before.propertyAudit?.runToken||before.propertyAudit?.token||'');
  const start=Date.now();
  const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  let timedOut=false;
  if(clicked){
    try{await page.waitForFunction(prior=>{
      const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const token=String(a?.runToken||a?.token||'');
      const state=String(document.documentElement.dataset.earthlinePropertyRunState||'');
      return !!a&&a.settled===true&&state!=='running'&&(!prior||!token||token!==prior);
    },priorToken,{timeout:30000,polling:100});}catch(_){timedOut=true;}
  }
  await page.waitForTimeout(250);
  return {label,elapsedMs:Date.now()-start,clicked,timedOut,before,after:await snap()};
}

await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const regional1=await regional();
const property1=await property('property-1');
await page.evaluate(()=>{try{earthlineMap?.panBy?.([140,70],{duration:0});}catch(_){}});
await page.waitForTimeout(500);
const property2=await property('property-2');
const regional2=await regional();

const report={regional1,property1,property2,regional2,errors:errors.slice(0,30)};
console.log('EARTHLINE_TEXAS_LIVE_PPR '+JSON.stringify(report));

const bad=
  errors.length>0||
  regional1.timedOut||regional1.state.lastRegionalError||regional1.elapsedMs>15000||
  !property1.clicked||property1.timedOut||property1.after.propertyState==='running'||property1.after.regionalTip||property1.elapsedMs>15000||
  !property2.clicked||property2.timedOut||property2.after.propertyState==='running'||property2.after.regionalTip||property2.elapsedMs>15000||
  regional2.timedOut||regional2.state.lastRegionalError||regional2.elapsedMs>15000||!/screening published\./i.test(regional2.state.status);

await browser.close();
if(bad)process.exitCode=1;
