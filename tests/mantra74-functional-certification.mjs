import { chromium } from 'playwright';
import fs from 'node:fs';

const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const CASES=JSON.parse(process.env.CASES||'[]');
const OUT=process.env.OUT||'earthline-functional.json';
if(!CASES.length)throw new Error('CASES required');

const browser=await chromium.launch({headless:true});
const rows=[];
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

async function runCase(c){
  const context=await browser.newContext({viewport:{width:1600,height:900}});
  const page=await context.newPage();
  /* EARTHLINE_PRODUCTION_ORIGIN_HEADERS_17691 — local CI candidate, deployed
     Mapbox token origin. This changes test transport only, never Earthline science. */
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
  const started=Date.now(); let fatal=null;
  try{
    await page.goto(URL+'?m74cert='+encodeURIComponent(c.query)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

    if(await page.locator('#earthlineLanguage16488').count()){
      await page.evaluate(()=>{
        const sel=document.getElementById('earthlineLanguage16488');
        if(!sel)return;
        sel.value='en';
        sel.dispatchEvent(new Event('change',{bubbles:true}));
      });
      await page.waitForTimeout(150);
    }

    if(c.loc){
      await page.evaluate(({query,loc})=>{
        if(typeof M==='undefined'||!M)throw new Error('Earthline model unavailable for deterministic location seed');
        M.loc=Object.assign({},loc,{query});
        M.centerLat=Number(loc.lat); M.centerLng=Number(loc.lng);
        M.appliedSearchText=query;
      },{query:c.query,loc:c.loc});
    }
    await page.locator('#searchInput').fill(c.query);
    await page.waitForTimeout(c.loc?100:700);
    const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
    if(await opts.count())await opts.first().click({force:true});
    else await page.locator('#searchInput').press('Enter').catch(()=>{});
    await page.waitForTimeout(120);
    await page.locator('#runBtn').click({force:true});

    await page.waitForFunction(()=>{
      const err=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null;
      if(err)return true;
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
    },null,{timeout:90000,polling:150});

    const regionalErr=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
    if(regionalErr)throw new Error('regional '+JSON.stringify(regionalErr));

    await page.waitForFunction(()=>{
      const sw=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[];
      return sw.length>0||document.querySelectorAll('.earthline-swale-label-16149,.earthline-swale-hit-16070').length>0;
    },null,{timeout:20000,polling:100});

    const corridor=page.locator('.earthline-swale-label-16149:visible').first();
    if(!await corridor.count())throw new Error('no visible Regional corridor label');
    await corridor.click({force:true});
    await page.waitForFunction(
      ()=>!!document.getElementById('earthlineCorridorDetail16149')?.classList?.contains('open'),
      null,{timeout:10000,polling:100}
    );
    const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
    if(!await zoom.count())throw new Error('corridor detail missing Zoom control');
    await zoom.click({force:true});
    await page.waitForFunction(()=>{
      const b=document.getElementById('earthlineDeclareProperty16169');
      return !!b&&!b.disabled;
    },null,{timeout:20000,polling:100});

    const serialBefore=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    const prop=page.locator('#earthlineDeclareProperty16169');
    if(await prop.count())await prop.click({force:true});
    else await page.evaluate(()=>window.earthlineDeclarePropertyAtCrosshair16173?.());

    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      const runState=String(document.documentElement.dataset.earthlinePropertyRunState||'').toLowerCase();
      const audit=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const handoff=window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null;
      return (tier==='property'&&runState!=='running')||
        (runState!=='running'&&audit?.settled===true)||
        handoff?.validParent===false;
    },null,{timeout:45000,polling:150});

    const propertyOutcome=await page.evaluate(()=>({
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
      block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
      safetyDiag:window.EARTHLINE_SAFETY_LOCK_DIAG_17695||null
    }));
    const propertyTier=String(propertyOutcome.displayed&&(propertyOutcome.displayed.tier||propertyOutcome.displayed.mode)||'').toLowerCase();
    if(propertyTier!=='property')throw new Error('Property handoff failed '+JSON.stringify(propertyOutcome));

    const serialAfter=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    if(serialAfter!==serialBefore+1)throw new Error('Property click serial '+serialBefore+'→'+serialAfter);

    await page.waitForTimeout(8000);
    const snap=await page.evaluate(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const pa=window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null;
      const ra=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null;
      const sv=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null;
      const mp=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
      const safeLayerIds=Array.isArray(sv?.visibleLayers)?sv.visibleLayers.filter(id=>{try{return !!mp?.getLayer?.(id)&&mp.getLayoutProperty?.(id,'visibility')!=='none'}catch(_){return false}}):[];
      let renderedSafeNow=0;
      try{
        const canvas=mp?.getCanvas?.(),box=canvas&&[[0,0],[canvas.clientWidth||canvas.width,canvas.clientHeight||canvas.height]];
        if(box&&safeLayerIds.length)renderedSafeNow=(mp.queryRenderedFeatures?.(box,{layers:safeLayerIds})||[]).length;
      }catch(_){}
      const directSafeVisible=safeLayerIds.length>0&&renderedSafeNow>0;
      const svg=document.getElementById('earthlinePropertyWaterOverlay15824');
      const cs=svg?getComputedStyle(svg):null;
      const wr=(typeof M!=='undefined'&&M?.directWaterRenderer15824)||null;
      const corridorCount=Number(ra?.corridors??pa?.publicationCount??0);
      return {
        displayedTier:String(d&&(d.tier||d.mode)||'').toLowerCase(),
        documentTier:String(document.documentElement.dataset.earthlineAnalysisTier||'').toLowerCase(),
        published:pa?.published===true, settled:ra?.settled===true, result:ra?.result===true,
        timedOut:ra?.timedOut===true, renderVerified:ra?.renderVerified===true||corridorCount===0||directSafeVisible,
        corridors:corridorCount,
        safeVisible:sv?.visible===true||directSafeVisible,safeCount:Number(sv?.count||0),
        safeAuditVisible:sv?.visible===true,safeLayerIds,renderedSafeNow,
        waterVisible:!!(svg&&svg.isConnected&&cs&&cs.display!=='none'&&cs.visibility!=='hidden'&&Number(cs.opacity||1)>0&&svg.childElementCount>0&&wr?.visible===true),
        waterChildren:svg?.childElementCount||0,
        language:String(document.documentElement.lang||'').toLowerCase(),
        selectedLanguage:String(document.getElementById('earthlineLanguage16488')?.value||'').toLowerCase(),
        weirdBox:!!document.getElementById('earthlineWhyNotHere15803'),
        publicationBlock:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
        lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null
      };
    });

    const report=page.locator('#earthlineVermontReport16149');
    let reportState={present:await report.count()>0,open:false,print:false,newtab:false,download:false,close:false};
    if(reportState.present){
      await report.click({force:true});
      await page.waitForTimeout(250);
      reportState=await page.evaluate(()=>{
        const p=document.getElementById('earthlineVermontReportPanel16149');
        return {present:!!p,open:!!p?.classList?.contains('open'),print:!!p?.querySelector('[data-action="print"]'),newtab:!!p?.querySelector('[data-action="newtab"]'),download:!!p?.querySelector('[data-action="download"]'),close:!!p?.querySelector('[data-action="close"],.el49-close')};
      });
    }

    const failures=[];
    if(!snap.published||!snap.settled||!snap.result||snap.timedOut)failures.push('Property publication/run failed');
    if(!snap.renderVerified)failures.push('Property render not verified');
    if(snap.corridors>0&&!snap.safeVisible)failures.push('safe swales not visible');
    if(snap.displayedTier!=='property'||snap.documentTier!=='property')failures.push('wrong canonical tier');
    if(!snap.waterVisible)failures.push('Property blue water not persistent');
    if(snap.language!=='en'||snap.selectedLanguage!=='en')failures.push('language changed without user action');
    if(snap.weirdBox)failures.push('retired diagnostic message box visible');
    if(!(reportState.present&&reportState.open&&reportState.print&&reportState.newtab&&reportState.download&&reportState.close))failures.push('Bioswale Report unavailable/incomplete');
    if(errors.length)failures.push('page errors: '+errors.join(' | '));
    return {name:c.name,query:c.query,pass:failures.length===0,failures,snap,reportState,errors,elapsedMs:Date.now()-started};
  }catch(e){
    fatal=String(e&&e.message||e);
    return {name:c.name,query:c.query,pass:false,failures:[fatal],errors,elapsedMs:Date.now()-started};
  }finally{await context.close();}
}

for(const c of CASES){const row=await runCase(c);rows.push(row);console.log('EARTHLINE_M74_CASE '+JSON.stringify(row));await sleep(250);}
await browser.close();
const out={at:new Date().toISOString(),url:URL,total:rows.length,passed:rows.filter(r=>r.pass).length,failed:rows.filter(r=>!r.pass).map(r=>({name:r.name,query:r.query,failures:r.failures})),pass:rows.every(r=>r.pass),rows};
fs.writeFileSync(OUT,JSON.stringify(out,null,2));
console.log('EARTHLINE_M74_SUMMARY '+JSON.stringify({total:out.total,passed:out.passed,failed:out.failed,pass:out.pass}));
if(!out.pass)process.exitCode=1;
