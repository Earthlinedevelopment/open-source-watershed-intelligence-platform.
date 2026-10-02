import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
for(const target of ['Germany','Laos']){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  const rec={target};
  try{
    await page.goto('https://earthlinedevelopment.org/?corridor-zoom='+target+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(target=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=target.toLowerCase()+' country';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },target);
    await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
    await page.waitForFunction(()=>Array.isArray(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features)&&window.EARTHLINE_REGIONAL_VISUAL_DATA_16020.swales.features.length>0,null,{timeout:30000,polling:250});
    rec.before=await page.evaluate(()=>({count:window.EARTHLINE_REGIONAL_VISUAL_DATA_16020.swales.features.length,target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
    const opened=await page.evaluate(()=>{
      const f=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features?.[0];
      if(!f||typeof window.earthlineOpenCorridorDetail16149!=='function')return false;
      return window.earthlineOpenCorridorDetail16149(f,0);
    });
    rec.opened=opened;
    await page.waitForTimeout(300);
    rec.detail=await page.evaluate(()=>({open:document.getElementById('earthlineCorridorDetail16149')?.classList.contains('open')||false,target:window.EARTHLINE_PROPERTY_TARGET_16201||null}));
    const zoomed=await page.evaluate(()=>{
      const b=document.querySelector('#earthlineCorridorDetail16149 [data-action="zoom"]');if(!b)return false;b.click();return true;
    });
    rec.zoomed=zoomed;
    await page.waitForTimeout(1200);
    rec.afterZoom=await page.evaluate(()=>({target:window.EARTHLINE_PROPERTY_TARGET_16201||null,button:String(document.getElementById('earthlineDeclareProperty16169')?.textContent||'').trim(),analysisTier:document.documentElement.dataset.earthlineAnalysisTier||''}));
    await page.evaluate(()=>document.getElementById('earthlineDeclareProperty16169')?.click());
    await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:60000,polling:200}).catch(()=>{});
    await page.waitForTimeout(2500);
    rec.final=await page.evaluate(()=>({
      displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
      audit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
      publication:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
      safe:window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||null,
      target:window.EARTHLINE_PROPERTY_TARGET_16201||null,
      swales:Number((typeof M!=='undefined'&&M?.swales?.length)||0),
      analysisTier:document.documentElement.dataset.earthlineAnalysisTier||'',
      propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',
      status:String(document.querySelector('#earthlineVermontStatus16147,#earthlineTierNotice16173')?.textContent||'').trim()
    }));
  }catch(e){rec.error=String(e?.stack||e)}
  console.log('CORRIDOR_ZOOM_PROPERTY '+JSON.stringify(rec));
  await page.close();
}
await browser.close();
// trigger exact corridor zoom path
