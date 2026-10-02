import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});

async function scenario(name, action){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  await page.goto('https://earthlinedevelopment.org/?de_path='+name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  await page.evaluate(()=>{
    const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
    i.value='germany country'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
  });
  await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
  await page.waitForTimeout(1200);
  const hit=page.locator('.earthline-swale-hit-16070,.earthline-swale-label-16149').first();
  if(await hit.count()) await hit.click({force:true});
  await page.waitForTimeout(600);

  const before=await page.evaluate(()=>({
    modalOpen:!!document.getElementById('earthlineCorridorDetail16149')?.classList.contains('open'),
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    detailButtons:[...document.querySelectorAll('#earthlineCorridorDetail16149 button')].map(b=>String(b.textContent||'').trim())
  }));
  console.log(name+'_BEFORE '+JSON.stringify(before));

  if(action==='zoom'){
    const z=page.locator('#earthlineCorridorDetail16149 [data-action="zoom"]').first();
    console.log(name+'_ZOOMCOUNT '+await z.count());
    if(await z.count()) await z.click();
  } else {
    const x=page.locator('#earthlineCorridorDetail16149 .el49-close').first();
    console.log(name+'_CLOSECOUNT '+await x.count());
    if(await x.count()) await x.click();
  }
  await page.waitForTimeout(1200);

  const mid=await page.evaluate(()=>({
    modalOpen:!!document.getElementById('earthlineCorridorDetail16149')?.classList.contains('open'),
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    declare:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').trim(),
    ariaDisabled:document.getElementById('earthlineDeclareProperty16169')?.getAttribute('aria-disabled')||null,
    tier:document.documentElement.dataset.earthlineAnalysisTier||''
  }));
  console.log(name+'_MID '+JSON.stringify(mid));

  const prop=page.locator('#earthlineDeclareProperty16169').first();
  try{ if(await prop.count()) await prop.click({timeout:5000}); }catch(e){ console.log(name+'_PROPERTY_CLICK_ERROR '+e.message); }
  await page.waitForTimeout(10000);
  const final=await page.evaluate(()=>({
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
    publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
    target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
    swales:Array.isArray(M?.swales)?M.swales.length:null,
    status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
  }));
  console.log(name+'_FINAL '+JSON.stringify(final));
  await page.close();
}
await scenario('ZOOM_BUTTON','zoom');
await scenario('CLOSE_X_ONLY','close');
await browser.close();