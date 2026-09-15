import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});

function attach(page,label){
  const errors=[];
  page.on('pageerror',e=>errors.push({type:'pageerror',message:String(e)}));
  page.on('console',m=>{ if(m.type()==='error') errors.push({type:'console',message:m.text()}); });
  return errors;
}

async function snap(page){
  return page.evaluate(()=>{
    const m=(typeof M!=='undefined'&&M)||null;
    const r=window.earthlineRegional15778||{};
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
    const btn=document.getElementById('runBtn');
    const pbtn=document.getElementById('earthlineDeclareProperty16169');
    const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().replace(/\s+/g,' ').slice(0,1000);
    return {
      href:location.href,
      searchGen:Number(m?.searchGen||0),
      locName:String(m?.loc?.name||''),
      locFullName:String(m?.loc?.fullName||''),
      displayedTier:String(d.tier||d.mode||''),
      displayedName:String(d.name||d.label||d.location||''),
      regionalActive:!!r.active,
      regionalMode:String(r.mode||''),
      analysisReady:!!m?.analysisReady,
      terrainReady:!!m?.terrainReady,
      demReady:!!m?.demReady,
      previewReady:!!m?.previewReady,
      propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      propertyAudit:a,
      swales:Number(m?.swales?.length||0),
      recharge:Number(m?.rechZones?.length||0),
      runBusy:btn?.getAttribute('aria-busy')||'',
      propertyButton:!!pbtn,
      propertyDisabled:!!pbtn?.disabled,
      status
    };
  });
}

async function loadPage(label){
  const page=await browser.newPage({viewport:{width:1440,height:1000}});
  const errors=attach(page,label);
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  return {page,errors};
}

async function startRegional(page,q){
  const before=await snap(page);
  await page.evaluate(query=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    if(!i||!b) throw new Error('search controls unavailable');
    i.focus(); i.value=query;
    i.dispatchEvent(new Event('input',{bubbles:true}));
    i.dispatchEvent(new Event('change',{bubbles:true}));
    b.click();
  },q);
  return before;
}

async function observeRegional(page,q,before,errors){
  const started=Date.now();
  const checkpoints=[];
  for(const wait of [3000,3000,4000,5000,5000]){
    await page.waitForTimeout(wait);
    checkpoints.push({t:Date.now()-started,s:await snap(page)});
    const s=checkpoints.at(-1).s;
    const text=[s.locName,s.locFullName,s.displayedName].join(' ').toLowerCase();
    const words=q.toLowerCase().split(/\s+/).filter(Boolean);
    const identity=words.every(w=>text.includes(w));
    if(identity && !s.regionalActive && s.runBusy!=='true') break;
  }
  const after=await snap(page);
  const text=[after.locName,after.locFullName,after.displayedName].join(' ').toLowerCase();
  const identity=q.toLowerCase().split(/\s+/).filter(Boolean).every(w=>text.includes(w));
  const complete=identity && !after.regionalActive && after.runBusy!=='true';
  return {stage:`${q} Regional`,elapsedMs:Date.now()-started,complete,after,checkpoints,errors:errors.slice(0,20)};
}

async function runRegional(page,q,errors){
  const before=await startRegional(page,q);
  return observeRegional(page,q,before,errors);
}

async function runProperty(page,label,errors){
  try{
    await page.waitForFunction(()=>{
      const b=document.getElementById('earthlineDeclareProperty16169');
      return !!b && !b.disabled;
    },null,{timeout:10000,polling:200});
  }catch(_){ }
  const pre=await snap(page);
  const clicked=await page.evaluate(()=>{const b=document.getElementById('earthlineDeclareProperty16169');if(!b||b.disabled)return false;b.click();return true;});
  if(!clicked) return {stage:`${label} Property`,clicked:false,pre,after:await snap(page),errors:errors.slice(0,20)};
  const started=Date.now(),checkpoints=[];
  for(const wait of [3000,3000,4000,5000,5000]){
    await page.waitForTimeout(wait);
    checkpoints.push({t:Date.now()-started,s:await snap(page)});
    const s=checkpoints.at(-1).s;
    if(s.propertyAudit?.settled===true && s.propertyState!=='running') break;
  }
  const after=await snap(page);
  return {stage:`${label} Property`,clicked:true,elapsedMs:Date.now()-started,settled:after.propertyAudit?.settled===true,after,checkpoints,errors:errors.slice(0,20)};
}

const A=await loadPage('fresh-ny');
const freshNY=await runRegional(A.page,'New York',A.errors);
await A.page.close();

const B=await loadPage('vt-property-ny');
const vt=await runRegional(B.page,'Vermont',B.errors);
const prop=await runProperty(B.page,'Vermont',B.errors);
const nyAfterProperty=await runRegional(B.page,'New York',B.errors);
await B.page.close();

const report={test:'Mantra 38 production root diagnostic',url:URL,expectedIndexBlob:'1c217d9486f0e234c08e1b6890e28d1db7dc03cf',freshNY,sequence:{vt,prop,nyAfterProperty}};
console.log('MANTRA38_PRODUCTION '+JSON.stringify(report));
await browser.close();
if(!freshNY || !nyAfterProperty) process.exitCode=1;

// trigger 2026-09-15 neutral production diagnostic
