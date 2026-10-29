import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const TARGET={lng:-73.012909,lat:44.513845};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const pageErrors=[]; page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto(URL+'?mantra81-continuity='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});

async function regional(label){
  const beforeToken=await page.evaluate(()=>String(window.EARTHLINE_DISPLAYED_RUN_16151?.runToken||window.EARTHLINE_DISPLAYED_RUN_16147?.runToken||''));
  await page.locator('#searchInput').fill('Vermont');
  await page.waitForTimeout(650);
  const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Vermont/i}).first();
  if(await opt.count())await opt.click().catch(()=>{});
  const t0=Date.now();
  await page.locator('#runBtn').click();
  await page.waitForFunction(prev=>{
    const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;if(err)return true;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
    const token=String(d.runToken||'');
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    return !!window.EARTHLINE_REGIONAL_PERFORMANCE_16191&&token&&token!==prev&&Number(pub?.generated||0)>0&&Number(pub?.sourceFeatures||0)===Number(pub?.generated||0)&&Number(disp?.swaleGradeLabels||0)>0;
  },beforeToken,{timeout:45000,polling:100});
  const row=await page.evaluate(label=>({
    label,
    error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
    perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    publication:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    display:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase()
  }),label);
  row.wallMs=Date.now()-t0;
  if(row.error)throw new Error(label+' Regional error '+JSON.stringify(row.error));
  if(row.tier!=='regional')throw new Error(label+' Regional tier '+row.tier);
  if(!(Number(row.perf?.totalMs)>0&&Number(row.perf?.totalMs)<=15000&&row.wallMs<=25000))throw new Error(label+' Regional speed '+JSON.stringify({core:row.perf?.totalMs,wall:row.wallMs}));
  return row;
}

async function property(label){
  await page.evaluate(t=>{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    if(!m)throw new Error('map unavailable');
    m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});
  },TARGET);
  await page.waitForTimeout(350);
  const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
  const t0=Date.now();
  await page.locator('#earthlineDeclareProperty16169').click();
  await page.waitForFunction(serial=>{
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    return Number(a.serial)===serial+1&&a.scientificSettled===true&&a.result===true;
  },before,{timeout:60000,polling:100});
  await page.waitForFunction(()=>{
    const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    return s.visible===true&&Number(s.renderedFeatures||0)>0;
  },{timeout:15000,polling:100});
  await page.waitForFunction(()=>{
    const m=typeof M!=='undefined'?M:null;
    const r=m?.usgsAquiferLastResult16393||null;
    return !!r&&!m?.usgsAquiferLoading&&String(r.requestOwner||'')==='property'&&Number(r.searchGen)===Number(m?.searchGen||0);
  },{timeout:20000,polling:100});
  const row=await page.evaluate(label=>{
    const m=typeof M!=='undefined'?M:null;
    const map=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};
    const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};
    const q=m?.usgsAquiferLastResult16393||null;
    const ids=['earthline-aquifers-fill','earthline-aquifers-outer','earthline-aquifers-line','earthline-aquifer-wells-16398','earthline-aquifer-evidence-label-16398'];
    const layerState={};
    for(const id of ids){
      try{layerState[id]={exists:!!map?.getLayer?.(id),visibility:map?.getLayer?.(id)?(map.getLayoutProperty?.(id,'visibility')||'visible'):null}}catch(_){layerState[id]={exists:false,visibility:null}}
    }
    return {
      label,
      tier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
      audit:{serial:Number(a.serial||0),corridors:Number(a.corridors||0),renderVerified:a.renderVerified===true,settled:a.settled===true,result:a.result===true},
      safe:{visible:s.visible===true,count:Number(s.count||0),rendered:Number(s.renderedFeatures||0)},
      aquiferResult:q,
      aquiferCount:Number(m?.usgsAquifers?.length||0),
      wellCount:Number(m?.vtGroundwaterWells16398?.length||0),
      evidenceLabel:String(m?.vtGroundwaterSummaryPoint16398?.label||''),
      aquiferStatus:String(m?.usgsAquiferStatus||''),
      layerState,
      reportReady:document.getElementById('earthlineVermontReport16149')?.getAttribute('data-ready')||null
    };
  },label);
  row.wallMs=Date.now()-t0;
  if(row.tier!=='property'||!row.audit.settled||!row.audit.result||!row.audit.renderVerified||!(row.audit.corridors>0)||!row.safe.visible||!(row.safe.rendered>0))throw new Error(label+' Property publication '+JSON.stringify(row));
  if(row.wallMs>15000)throw new Error(label+' Property speed '+row.wallMs);
  const evidenceCount=row.aquiferCount+row.wellCount;
  if(!(evidenceCount>0)||!/^loaded-vt-/.test(row.aquiferStatus))throw new Error(label+' aquifer evidence missing '+JSON.stringify({status:row.aquiferStatus,aquiferCount:row.aquiferCount,wellCount:row.wellCount,result:row.aquiferResult}));
  const visibleEvidence=Object.values(row.layerState).some(x=>x.exists&&x.visibility!=='none');
  if(!visibleEvidence)throw new Error(label+' aquifer layers hidden');
  return row;
}

async function surfaces(label){
  const dataBtn=page.locator('#earthlineRailData16488');
  if(!(await dataBtn.count()))throw new Error(label+' DATA control missing');
  await dataBtn.click();
  await page.waitForFunction(()=>document.getElementById('earthlineRechargeDataModal16488')?.classList.contains('open'),{timeout:5000});
  const data=await page.evaluate(()=>{
    const el=document.getElementById('earthlineRechargeDataContent16488');
    const text=String(el?.innerText||'');
    const modal=document.getElementById('earthlineRechargeDataModal16488');
    return {open:!!modal?.classList.contains('open'),text,drivers:document.querySelectorAll('.earthline-data-driver16488').length,score:String(document.querySelector('.earthline-data-score16488')?.textContent||'')};
  });
  if(!data.open||data.drivers<4||!/Recharge suitability/i.test(data.text)||!/Average yearly rainfall/i.test(data.text)||!/(Aquifer|Groundwater)/i.test(data.text)||!/Slope/i.test(data.text)||!/Flow/i.test(data.text))throw new Error(label+' DATA incomplete '+JSON.stringify(data));
  await page.locator('#earthlineRechargeDataClose16488').click();

  const report=page.locator('#earthlineVermontReport16149');
  if(!(await report.count()))throw new Error(label+' report control missing');
  await report.click();
  await page.waitForFunction(()=>document.getElementById('earthlineVermontReportPanel16149')?.classList.contains('open'),{timeout:7000});
  const rep=await page.evaluate(()=>{
    const p=document.getElementById('earthlineVermontReportPanel16149');
    const text=String(p?.innerText||'');
    const shell=p?.querySelector('.el49-shell');
    const style=p?getComputedStyle(p):null;
    return {open:!!p?.classList.contains('open'),display:style?.display||'',textHead:text.slice(0,1800),pages:p?.querySelectorAll('.el49-page').length||0,scrollHeight:Number(shell?.scrollHeight||0),clientHeight:Number(shell?.clientHeight||0)};
  });
  if(!rep.open||rep.display==='none'||rep.pages<1||!/Bioswale/i.test(rep.textHead)||!/Earthline/i.test(rep.textHead))throw new Error(label+' report incomplete '+JSON.stringify(rep));
  const close=page.locator('#earthlineVermontReportPanel16149 [data-action="close"]').first();
  if(!(await close.count()))throw new Error(label+' report close control missing');
  await close.click();
  await page.waitForFunction(()=>!document.getElementById('earthlineVermontReportPanel16149')?.classList.contains('open'),{timeout:5000});
  return {data:{drivers:data.drivers,score:data.score},report:{pages:rep.pages,scrollable:rep.scrollHeight>rep.clientHeight}};
}

const r1=await regional('regional-1');
const p1=await property('property-1');
const s1=await surfaces('surfaces-1');
await page.keyboard.press('Escape').catch(()=>{});
const r2=await regional('regional-2');
const p2=await property('property-2');
const s2=await surfaces('surfaces-2');
console.log('MANTRA81_CONTINUITY '+JSON.stringify({r1,p1,s1,r2,p2,s2,pageErrors}));
if(pageErrors.length)throw new Error('page errors '+JSON.stringify(pageErrors));
await browser.close();
