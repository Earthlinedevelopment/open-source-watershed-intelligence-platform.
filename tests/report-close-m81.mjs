import { chromium } from 'playwright';

const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const rows=[];
for(let round=1;round<=7;round++){
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));
  let pass=false,fatal=null,state=null;
  try{
    await page.goto(URL+'?report-close-m81='+round+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.locator('#searchInput').fill('Vermont');
    await page.waitForTimeout(650);
    const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]').filter({hasText:/Vermont/i}).first();
    if(await opt.count())await opt.click().catch(()=>{});
    await page.locator('#runBtn').click();
    await page.waitForFunction(()=>!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191,{timeout:90000,polling:100});
    const t={lng:-73.012909,lat:44.513845};
    await page.evaluate(t=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[t.lng,t.lat],zoom:16.7,bearing:0,pitch:0});},t);
    await page.waitForTimeout(350);
    const before=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));
    await page.locator('#earthlineDeclareProperty16169').click();
    await page.waitForFunction(b=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||{};return Number(a.serial)===b+1&&a.scientificSettled===true&&a.result===true},before,{timeout:60000,polling:100});
    await page.waitForFunction(()=>{const s=window.EARTHLINE_PROPERTY_SAFE_VISIBILITY_AUDIT_16221||{};return s.visible===true&&Number(s.renderedFeatures||0)>0},{timeout:15000,polling:100});
    await page.locator('#earthlineVermontReport16149').click();
    await page.waitForFunction(()=>document.getElementById('earthlineVermontReportPanel16149')?.classList.contains('open'),{timeout:7000});
    await page.locator('#earthlineVermontReportPanel16149 [data-action="close"]').first().click();
    await page.waitForTimeout(150);
    state=await page.evaluate(()=>{
      const p=document.getElementById('earthlineVermontReportPanel16149'),s=p?getComputedStyle(p):null;
      return {open:!!p?.classList.contains('open'),display:s?.display||'',visibility:s?.visibility||'',pointerEvents:s?.pointerEvents||'',rootOpen:document.documentElement.classList.contains('earthline-report-open-16966')};
    });
    await page.locator('#searchInput').fill('Vermont');
    await page.locator('#runBtn').click({timeout:5000});
    pass=!state.open&&!state.rootOpen&&(state.display==='none'||state.visibility==='hidden'||state.pointerEvents==='none')&&!errors.length;
  }catch(e){fatal=String(e)}
  const row={round,pass,fatal,state,errors};rows.push(row);console.log('M81_REPORT_CLOSE '+JSON.stringify(row));
  await page.close();
  if(!pass){await browser.close();throw new Error('report close failed '+JSON.stringify(row));}
}
await browser.close();
console.log('M81_REPORT_CLOSE_SUMMARY '+JSON.stringify({total:rows.length,pass:rows.filter(r=>r.pass).length}));
