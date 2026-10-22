import { chromium, webkit } from 'playwright';

const BASE='http://127.0.0.1:8787/';
const engines=[['chromium',chromium],['webkit',webkit]];

function assert(ok,msg){if(!ok)throw new Error(msg)}

for(const [name,engine] of engines){
  const browser=await engine.launch({headless:true});
  const page=await browser.newPage({
    viewport:name==='webkit'?{width:390,height:844}:{width:1440,height:960}
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

    await page.waitForSelector('#earthlineLanguage16488',{timeout:15000});
    await page.selectOption('#earthlineLanguage16488','en');
    await page.locator('#earthlineLanguage16488').dispatchEvent('change');
    await page.waitForTimeout(300);
    let language=await page.evaluate(()=>({
      html:String(document.documentElement.lang||'').toLowerCase(),
      selected:String(document.getElementById('earthlineLanguage16488')?.value||'').toLowerCase()
    }));
    assert(language.html==='en'&&language.selected==='en',name+': language did not lock to English');

    const input=page.locator('#searchInput');
    await input.fill('Essex Junction, Vermont');
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

    const serialBefore=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    await page.locator('#earthlineDeclareProperty16169').click({force:true});

    await page.waitForFunction(()=>{
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
      return tier==='property'&&String(document.documentElement.dataset.earthlinePropertyRunState||'')!=='running';
    },null,{timeout:90000,polling:150});

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

    const report=page.locator('#earthlineVermontReport16149');
    assert(await report.count(),name+': Bioswale Report control missing');
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
