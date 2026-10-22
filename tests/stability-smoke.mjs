import { chromium, webkit } from 'playwright';

const BASE='http://127.0.0.1:8787/';
const engines=[['chromium',chromium],['webkit',webkit]];

function assert(ok,msg){if(!ok)throw new Error(msg)}

for(const [name,engine] of engines){
  const browser=await engine.launch({headless:true});
  const page=await browser.newPage({
    viewport:name==='webkit'?{width:390,height:844}:{width:1440,height:960}
  });
  /* EARTHLINE_PRODUCTION_ORIGIN_HEADERS_17691 — CI serves the candidate locally,
     but the secured public Mapbox token permits the production origin. Preserve
     product code unchanged and emulate only the deployed request origin. */
  await page.route('https://api.mapbox.com/**',async route=>{
    const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
    await route.continue({headers});
  });
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));

  try{
    await page.goto(BASE+'?earthline-stability='+Date.now(),{
      waitUntil:'domcontentloaded',timeout:90000
    });
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.waitForFunction(
      ()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),
      null,{timeout:30000,polling:100}
    );

    await page.waitForSelector('#earthlineLanguage16488',{state:'attached',timeout:15000});
    await page.evaluate(()=>{
      const sel=document.getElementById('earthlineLanguage16488');
      if(!sel)throw new Error('language control missing');
      sel.value='en';
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    });
    await page.waitForTimeout(300);
    let language=await page.evaluate(()=>({
      html:String(document.documentElement.lang||'').toLowerCase(),
      selected:String(document.getElementById('earthlineLanguage16488')?.value||'').toLowerCase()
    }));
    assert(language.html==='en'&&language.selected==='en',name+': language did not lock to English');

    const input=page.locator('#searchInput');
    await input.fill('Vermont');
    await page.waitForTimeout(900);
    const options=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
    if(await options.count())await options.first().click({force:true});
    else await input.press('Enter').catch(()=>{});

    await page.locator('#runBtn').click({force:true});
    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      return tier==='regional'&&document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
    },null,{timeout:90000,polling:150});

    await page.waitForFunction(
      ()=>document.querySelectorAll('.earthline-swale-label-16149,.earthline-swale-hit-16070').length>0,
      null,{timeout:20000,polling:100}
    );

    const corridor=page.locator('.earthline-swale-label-16149:visible').first();
    assert(await corridor.count(),name+': no visible Regional corridor label');
    await corridor.click({force:true});
    await page.waitForFunction(
      ()=>!!document.getElementById('earthlineCorridorDetail16149')?.classList?.contains('open'),
      null,{timeout:10000,polling:100}
    );

    const zoom=page.getByRole('button',{name:/zoom to (this )?location/i}).first();
    assert(await zoom.count(),name+': corridor detail missing Zoom control');
    await zoom.click({force:true});
    await page.waitForFunction(()=>{
      const b=document.getElementById('earthlineDeclareProperty16169');
      return !!b&&!b.disabled;
    },null,{timeout:20000,polling:100});

    if(name==='webkit'){
      const open=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
      if(!open){
        const rail=page.locator('#earthlineRailSearch16188');
        assert(await rail.count(),name+': mobile rail search control missing');
        await rail.click({force:true});
        await page.waitForFunction(()=>document.documentElement.classList.contains('earthline-panel-open-16188'),null,{timeout:5000,polling:50});
      }
    }

    const propertyReachability=await page.evaluate(()=>{
      const body=document.getElementById('earthlinePanelBody16188');
      const button=document.getElementById('earthlineDeclareProperty16169');
      if(!body||!button)throw new Error('panel/property control missing');
      const before={bodyScrollTop:body.scrollTop,bodyClientHeight:body.clientHeight,bodyScrollHeight:body.scrollHeight,buttonTop:button.getBoundingClientRect().top,buttonBottom:button.getBoundingClientRect().bottom,vh:innerHeight};
      const br=body.getBoundingClientRect(),rr=button.getBoundingClientRect();
      body.scrollTop=Math.max(0,Math.min(body.scrollHeight-body.clientHeight,body.scrollTop+(rr.top-br.top)-Math.max(8,(body.clientHeight-button.offsetHeight)/2)));
      const ar=button.getBoundingClientRect();
      return {before,after:{bodyScrollTop:body.scrollTop,buttonTop:ar.top,buttonBottom:ar.bottom}};
    });
    console.log('EARTHLINE_PROPERTY_REACHABILITY '+JSON.stringify({engine:name,audit:propertyReachability}));
    await page.waitForTimeout(80);
    const propertyLayoutAudit=await page.locator('#earthlineDeclareProperty16169').evaluate(el=>{
      const chain=[]; let n=el;
      while(n&&n!==document.documentElement){
        const r=n.getBoundingClientRect(),cs=getComputedStyle(n);
        chain.push({id:n.id||'',tag:n.tagName,top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height,position:cs.position,display:cs.display,overflowY:cs.overflowY,transform:cs.transform,marginTop:cs.marginTop,marginBottom:cs.marginBottom,clientHeight:n.clientHeight,scrollHeight:n.scrollHeight,scrollTop:n.scrollTop,offsetParent:n.offsetParent?.id||n.offsetParent?.tagName||''});
        n=n.parentElement;
      }
      return chain;
    });
    console.log('EARTHLINE_PROPERTY_LAYOUT_AUDIT '+JSON.stringify({engine:name,chain:propertyLayoutAudit}));
    const propertyPoint=await page.locator('#earthlineDeclareProperty16169').evaluate(el=>{
      const r=el.getBoundingClientRect(),top=Math.max(0,r.top),bottom=Math.min(innerHeight,r.bottom);
      if(bottom-top<20)throw new Error('Property control has less than 20px visible touch height');
      return {x:(r.left+r.right)/2,y:(top+bottom)/2,visibleHeight:bottom-top};
    });
    const serialBefore=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    await page.mouse.click(propertyPoint.x,propertyPoint.y);

    let propertyWaitTimedOut=false;
    try{
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
    }catch(_){propertyWaitTimedOut=true;}

    const propertyOutcome=await page.evaluate(()=>({
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      runState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      handoff:window.EARTHLINE_REGIONAL_PROPERTY_HANDOFF_AUDIT_16347||null,
      block:window.EARTHLINE_PROPERTY_PUBLICATION_BLOCK_16176||null,
      waterGate:window.EARTHLINE_PROPERTY_WATER_BODY_GATE_16529||null,
      launch:window.EARTHLINE_PROPERTY_LAUNCH_AUDIT_16322||null,
      trace:window.EARTHLINE_PROPERTY_PHASE_TRACE_16319||null
    }));
    const propertyTier=String(propertyOutcome.displayed&&(propertyOutcome.displayed.tier||propertyOutcome.displayed.mode)||'').toLowerCase();
    if(propertyWaitTimedOut)console.log('EARTHLINE_PROPERTY_WAIT_TIMEOUT '+JSON.stringify({engine:name,propertyOutcome}));
    assert(propertyTier==='property',name+': Property handoff failed '+JSON.stringify(propertyOutcome));

    const serialAfter=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    assert(serialAfter===serialBefore+1,name+': one Property click did not produce exactly one run');

    const visibleWater=()=>page.evaluate(()=>{
      const svg=document.getElementById('earthlinePropertyWaterOverlay15824');
      if(!svg)return false;
      const cs=getComputedStyle(svg);
      const r=typeof M!=='undefined'&&M?.directWaterRenderer15824||null;
      return svg.isConnected&&cs.display!=='none'&&cs.visibility!=='hidden'&&
        Number(cs.opacity||1)>0&&svg.childElementCount>0&&r?.visible===true;
    });

    await page.waitForFunction(()=>{
      const svg=document.getElementById('earthlinePropertyWaterOverlay15824');
      if(!svg)return false;
      const cs=getComputedStyle(svg);
      const r=typeof M!=='undefined'&&M?.directWaterRenderer15824||null;
      return svg.isConnected&&cs.display!=='none'&&cs.visibility!=='hidden'&&
        Number(cs.opacity||1)>0&&svg.childElementCount>0&&r?.visible===true;
    },null,{timeout:30000,polling:100});
    assert(await visibleWater(),name+': Property water never became visible');
    await page.waitForTimeout(8000);
    assert(await visibleWater(),name+': Property water blinked off after publication');

    if(name==='webkit'){
      const open=await page.evaluate(()=>document.documentElement.classList.contains('earthline-panel-open-16188'));
      if(!open){
        const rail=page.locator('#earthlineRailSearch16188');
        assert(await rail.count(),name+': mobile rail search control missing before report');
        await rail.click({force:true});
        await page.waitForFunction(()=>document.documentElement.classList.contains('earthline-panel-open-16188'),null,{timeout:5000,polling:50});
      }
    }
    const report=page.locator('#earthlineVermontReport16149');
    assert(await report.count(),name+': Bioswale Report control missing');
    const reportGeometryBefore=await report.evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,vw:innerWidth,vh:innerHeight}});
    const reportScrollAudit=await page.evaluate(()=>{
      const report=document.getElementById('earthlineVermontReport16149');
      if(!report)throw new Error('report missing for reachability test');
      const chain=[]; let el=report;
      while(el&&el!==document.documentElement){
        const cs=getComputedStyle(el),r=el.getBoundingClientRect();
        chain.push({id:el.id||'',tag:el.tagName,top:r.top,bottom:r.bottom,clientHeight:el.clientHeight,scrollHeight:el.scrollHeight,scrollTop:el.scrollTop,overflowY:cs.overflowY});
        el=el.parentElement;
      }
      const scroller=chain.find(x=>x.scrollHeight>x.clientHeight+2&&/auto|scroll/.test(x.overflowY));
      const node=scroller?.id?document.getElementById(scroller.id):null;
      if(node){
        const nr=node.getBoundingClientRect(),rr=report.getBoundingClientRect();
        node.scrollTop=Math.max(0,node.scrollTop+(rr.top-nr.top)-Math.max(8,(node.clientHeight-report.offsetHeight)/2));
      }
      return {chain,scroller:scroller||null};
    });
    await page.waitForTimeout(120);
    const reportGeometryAfter=await report.evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,vw:innerWidth,vh:innerHeight}});
    console.log('EARTHLINE_REPORT_SCROLL_AUDIT '+JSON.stringify({engine:name,audit:reportScrollAudit}));
    console.log('EARTHLINE_REPORT_REACHABILITY '+JSON.stringify({engine:name,before:reportGeometryBefore,after:reportGeometryAfter}));
    assert(reportGeometryAfter.bottom>0&&reportGeometryAfter.top<reportGeometryAfter.vh,
      name+': Bioswale Report control cannot be scrolled into the viewport '+JSON.stringify(reportGeometryAfter));
    await report.click({force:true});
    await page.waitForFunction(
      ()=>!!document.getElementById('earthlineVermontReportPanel16149')?.classList?.contains('open'),
      null,{timeout:10000,polling:100}
    );
    await page.waitForTimeout(250);
    const reportState=await page.evaluate(()=>{
      const p=document.getElementById('earthlineVermontReportPanel16149');
      return {
        open:!!p?.classList?.contains('open'),
        print:!!p?.querySelector('[data-action="print"]'),
        newtab:!!p?.querySelector('[data-action="newtab"]'),
        download:!!p?.querySelector('[data-action="download"]'),
        close:!!p?.querySelector('[data-action="close"],.el49-close')
      };
    });
    assert(reportState.open&&reportState.print&&reportState.newtab&&reportState.download&&reportState.close,
      name+': Bioswale Report controls are incomplete');

    language=await page.evaluate(()=>({
      html:String(document.documentElement.lang||'').toLowerCase(),
      selected:String(document.getElementById('earthlineLanguage16488')?.value||'').toLowerCase()
    }));
    assert(language.html==='en'&&language.selected==='en',name+': language changed without user action');

    const diagnostics=await page.evaluate(()=>({
      whyNotHere:!!document.getElementById('earthlineWhyNotHere15803'),
      publicCoverage:String(window.EARTHLINE_PUBLIC_COVERAGE_UI_17005||'')
    }));
    assert(!diagnostics.whyNotHere,name+': retired public diagnostic message box returned');

    assert(pageErrors.length===0,name+': uncaught page errors: '+pageErrors.join(' | '));

    console.log('EARTHLINE_RENDERED_STABILITY_PASS',JSON.stringify({
      engine:name,serialBefore,serialAfter,language,reportState,diagnostics
    }));
  }finally{
    await browser.close();
  }
}
