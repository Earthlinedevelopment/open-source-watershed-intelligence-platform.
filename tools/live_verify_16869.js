const { chromium } = require('playwright');
const fs = require('fs');

(async()=>{
  const results={};
  const save=()=>{fs.mkdirSync('artifacts',{recursive:true});fs.writeFileSync('artifacts/verification.json',JSON.stringify(results,null,2));};
  let browser;
  try{
    browser=await chromium.launch({channel:'chrome',headless:true,args:['--disable-dev-shm-usage']});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const errors=[];
    page.on('pageerror',e=>errors.push('pageerror: '+e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text())});
    await page.goto(process.env.EARTHLINE_URL||'https://earthlinedevelopment.org/?verify=16869-final',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForTimeout(4000);

    const live16869=await page.evaluate(()=>({
      style:!!document.getElementById('earthline-property-acres-16869-style'),
      buttonFn:typeof window.earthlineRenderPropertyTargetLabel16869==='function',
      title:document.title,
      url:location.href
    }));
    if(!live16869.style||!live16869.buttonFn) throw new Error('Production is not serving 16869 live DOM/functions: '+JSON.stringify(live16869));
    results.production=live16869; save();

    // Spanish: must visibly change live main UI.
    await page.selectOption('#earthlineLanguageSelect16488','es');
    await page.waitForTimeout(250);
    const spanish=await page.evaluate(()=>({
      lang:document.documentElement.lang,
      labels:[...document.querySelectorAll('.el-panel-label-16188')].map(x=>x.textContent.trim()),
      placeholder:document.querySelector('#searchInput')?.getAttribute('placeholder')||'',
      gauge:document.querySelector('.earthline-recharge-gauge-label-16488')?.textContent.trim()||'',
      menu:[...document.querySelectorAll('#earthlineHamburgerMenu16233 a span:last-child')].map(x=>x.textContent.trim())
    }));
    if(spanish.lang!=='es'||!spanish.labels.includes('Buscar')||!spanish.labels.includes('Modelado de la propiedad')||!spanish.labels.includes('Informe de impacto de bioswales')||spanish.placeholder!=='Buscar una ubicación') throw new Error('Spanish visible UI verification failed: '+JSON.stringify(spanish));
    results.spanish=spanish; save();
    await page.screenshot({path:'artifacts/01-spanish.png'});

    // Restore English; set Vermont target; verify ONLY the complete 20 ACRES suffix is larger.
    await page.selectOption('#earthlineLanguageSelect16488','en');
    await page.evaluate(()=>{
      if(typeof window.earthlineSetPropertyTarget16201!=='function') throw new Error('Property target function unavailable');
      window.earthlineSetPropertyTarget16201({lng:-73.1107,lat:44.4906,source:'16869-live-verification'},{openPanel:false});
    });
    await page.waitForTimeout(250);
    const button=await page.evaluate(()=>{
      const b=document.querySelector('#earthlineDeclareProperty16169'),p=b?.querySelector('.earthline-property-prefix-16869'),a=b?.querySelector('.earthline-property-acres-16869');
      if(!b||!p||!a) return null;
      return {text:b.textContent.replace(/\s+/g,' ').trim(),prefix:p.textContent.trim(),acres:a.textContent.trim(),prefixPx:parseFloat(getComputedStyle(p).fontSize),acresPx:parseFloat(getComputedStyle(a).fontSize)};
    });
    if(!button||!button.prefix.startsWith('CROSSHAIR')||button.acres!=='20 ACRES'||!(button.acresPx>button.prefixPx)) throw new Error('20 ACRES-only typography verification failed: '+JSON.stringify(button));
    results.propertyButton=button; save();
    await page.screenshot({path:'artifacts/02-property-button.png'});

    // Standalone How Swales Work / Swales Explained: Sources must be consolidated at its actual end.
    await page.click('#earthlineRailMenu16188');
    await page.click('#earthlineHamburgerMenu16233 a[href="#swales-explained"]');
    await page.waitForTimeout(900);
    const frameEl=await page.$('#earthlineSwalesFrame16125');
    if(!frameEl) throw new Error('Swales Explained iframe missing');
    const frame=await frameEl.contentFrame();
    await frame.waitForLoadState('domcontentloaded').catch(()=>{});
    const swalesSources=await frame.evaluate(()=>{
      const final=document.querySelector('#earthline-swales-final-sources-16869'),main=document.querySelector('main')||document.body;
      const outside=[...document.querySelectorAll('section,article,div')].filter(el=>!final?.contains(el)&&el!==final).filter(el=>{const h=el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4');return !!h&&/(source|reference|bibliograph|literature|standards)/i.test((h.textContent||'').trim())});
      return {exists:!!final,isLast:!!final&&main.lastElementChild===final,outsideCount:outside.length,text:(final?.innerText||'').slice(0,500)};
    });
    if(!swalesSources.exists||!swalesSources.isLast||swalesSources.outsideCount!==0) throw new Error('Standalone Swales source placement failed: '+JSON.stringify(swalesSources));
    results.standaloneSources=swalesSources; save();
    await page.screenshot({path:'artifacts/03-swales-sources.png'});
    await page.evaluate(()=>{if(typeof window.earthlineCloseSwalesExplained16125==='function')window.earthlineCloseSwalesExplained16125()});

    // Actual Property analysis — no fabricated swales.
    const done=page.evaluate(()=>new Promise(resolve=>{
      let finished=false;
      const finish=(d)=>{if(finished)return;finished=true;resolve(d)};
      document.addEventListener('earthline:analysis-complete',e=>{const d=e.detail||{};if(String(d.tier||d.mode||'').toLowerCase()==='property')finish({kind:'complete',detail:d})},{once:false});
      document.addEventListener('earthline:analysis-failed',e=>finish({kind:'failed',detail:e.detail||{}}),{once:false});
      setTimeout(()=>finish({kind:'timeout'}),45000);
    }));
    const start=Date.now();
    await page.click('#earthlineDeclareProperty16169');
    const terminal=await done;
    results.propertyTerminal={...terminal,elapsedMs:Date.now()-start}; save();
    if(terminal.kind!=='complete') throw new Error('Property analysis did not complete: '+JSON.stringify(results.propertyTerminal));
    await page.waitForTimeout(1200);

    // Existing Property ditch/water layer must be visible, saturated blue, opacity 1, with real generated features.
    const blue=await page.evaluate(()=>{
      let mp=null;
      for(const k of Object.getOwnPropertyNames(window)){
        try{const v=window[k];if(v&&typeof v.getLayer==='function'&&typeof v.getPaintProperty==='function'&&typeof v.getLayoutProperty==='function'){mp=v;break}}catch(_){ }
      }
      if(!mp)return {mapFound:false};
      const id='earthline-property-swale-ditch-16166',layer=mp.getLayer(id);
      if(!layer)return {mapFound:true,layerFound:false};
      let count=null;try{const src=mp.getSource(layer.source);count=src&&src._data&&Array.isArray(src._data.features)?src._data.features.length:null}catch(_){ }
      return {mapFound:true,layerFound:true,visibility:mp.getLayoutProperty(id,'visibility'),color:mp.getPaintProperty(id,'line-color'),opacity:mp.getPaintProperty(id,'line-opacity'),width:mp.getPaintProperty(id,'line-width'),sourceFeatureCount:count};
    });
    if(!blue.mapFound||!blue.layerFound||blue.visibility==='none'||blue.opacity!==1||String(blue.color).toLowerCase()!=='#00a7ff'||blue.sourceFeatureCount===0) throw new Error('Live blue layer verification failed: '+JSON.stringify(blue));
    results.blueLayer=blue; save();
    await page.screenshot({path:'artifacts/04-property-blue.png'});

    // Bioswale Impact Report: final page is Sources; no source/reference blocks remain elsewhere.
    const reportButton=page.locator('#earthlineVermontReport16149');
    if(await reportButton.count()!==1) throw new Error('Bioswale Impact Report button missing');
    await reportButton.click();
    await page.waitForTimeout(600);
    const report=await page.evaluate(()=>{
      const panel=document.querySelector('#earthlineVermontReportPanel16149'),final=panel?.querySelector('.el16864-final-sources'),pages=panel?[...panel.querySelectorAll('.el49-page')]:[];
      const outside=panel?[...panel.querySelectorAll('section,article,div')].filter(el=>final&&el!==final&&!final.contains(el)).filter(el=>{const h=el.querySelector(':scope > h1,:scope > h2,:scope > h3,:scope > h4');return !!h&&/(source|reference|bibliograph|literature|standards)/i.test((h.textContent||'').trim())}):[];
      return {panel:!!panel,final:!!final,isLast:!!final&&pages.at(-1)===final,pageCount:pages.length,outsideCount:outside.length,finalText:(final?.innerText||'').slice(0,800)};
    });
    if(!report.panel||!report.final||!report.isLast||report.outsideCount!==0) throw new Error('Report Sources final-page verification failed: '+JSON.stringify(report));
    results.reportSources=report; results.consoleErrors=errors; save();
    await page.screenshot({path:'artifacts/05-report-sources.png'});
    console.log('EARTHLINE 16869 LIVE VERIFICATION PASS');
    console.log(JSON.stringify(results,null,2));
  }catch(e){
    results.failure=String(e&&e.stack||e); save(); console.error(results.failure); process.exitCode=1;
  }finally{
    if(browser) await browser.close();
  }
})();
