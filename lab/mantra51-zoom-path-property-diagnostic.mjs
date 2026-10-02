import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const TARGETS=['Germany','Laos'];
const browser=await chromium.launch({headless:true});
for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const rec={target,steps:[]};
  try{
    await page.goto(URL+'?zoom-path='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(target=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=target.toLowerCase()+' country';
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },target);
    await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
    await page.waitForTimeout(1500);
    rec.steps.push(await page.evaluate(()=>({
      phase:'regional',
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      mapCenter:(()=>{try{const c=(window.earthlineMap||window.map||window.mapboxMap)?.getCenter?.();return c?{lng:+c.lng,lat:+c.lat}:null}catch{return null}})(),
      tabs:[...document.querySelectorAll('#earthlineRegionalCorridorTabs16323 button,#earthlineRegionalCorridorTabs16323 [role="button"]')].map(e=>({text:String(e.textContent||'').trim(),aria:e.getAttribute('aria-label')}))
    })));
    const tab=await page.evaluate(()=>{
      const root=document.getElementById('earthlineRegionalCorridorTabs16323');
      if(!root)return {clicked:false,reason:'no-tabs'};
      const b=[...root.querySelectorAll('button,[role="button"]')].find(e=>!/zoom/i.test(String(e.textContent||e.getAttribute('aria-label')||'')))||root.querySelector('button,[role="button"]');
      if(!b)return {clicked:false,reason:'no-tab-button'};
      const text=String(b.textContent||b.getAttribute('aria-label')||'').trim(); b.click(); return {clicked:true,text};
    });
    rec.steps.push({phase:'tab-click',...tab});
    await page.waitForTimeout(500);
    const zoom=await page.evaluate(()=>{
      const all=[...document.querySelectorAll('button,[role="button"],a')];
      const b=all.find(e=>/zoom to location/i.test(String(e.textContent||e.getAttribute('aria-label')||'')));
      if(!b)return {clicked:false,reason:'no-zoom-control',controls:all.map(e=>String(e.textContent||e.getAttribute('aria-label')||'').trim()).filter(Boolean).filter(x=>/zoom|location/i.test(x)).slice(0,40)};
      const text=String(b.textContent||b.getAttribute('aria-label')||'').trim(); b.click(); return {clicked:true,text};
    });
    rec.steps.push({phase:'zoom-click',...zoom});
    await page.waitForTimeout(1800);
    rec.steps.push(await page.evaluate(()=>({
      phase:'after-zoom',
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      mapCenter:(()=>{try{const c=(window.earthlineMap||window.map||window.mapboxMap)?.getCenter?.();return c?{lng:+c.lng,lat:+c.lat}:null}catch{return null}})(),
      button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').trim()
    })));
    const prop=await page.evaluate(()=>{
      const b=document.getElementById('earthlineDeclareProperty16169')||[...document.querySelectorAll('button')].find(e=>/20\s*acres|analyze/i.test(String(e.textContent||'')));
      if(!b)return {clicked:false}; const text=String(b.textContent||'').trim(); b.click(); return {clicked:true,text};
    });
    rec.steps.push({phase:'property-click',...prop});
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:60000,polling:200}).catch(()=>{});
    await page.waitForTimeout(2500);
    rec.final=await page.evaluate(()=>({
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      swales:Number((typeof M!=='undefined'&&M?.swales?.length)||0),
      mapCenter:(()=>{try{const c=(window.earthlineMap||window.map||window.mapboxMap)?.getCenter?.();return c?{lng:+c.lng,lat:+c.lat}:null}catch{return null}})(),
      status:String(document.querySelector('#earthlineVermontStatus16147,#earthlineTierNotice16173')?.textContent||'').trim()
    }));
  }catch(e){rec.error=String(e?.stack||e)}
  console.log('ZOOM_PATH_DIAG '+JSON.stringify(rec));
  await page.close();
}
await browser.close();
// trigger shared zoom-path diagnostic
