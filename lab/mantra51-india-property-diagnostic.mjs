import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
page.on('console',m=>{if(/Earthline|exclusion|property|vector|road|building/i.test(m.text()))console.log('BROWSER',m.text())});
await page.goto(URL+'?india-property-diag='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='india country'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
});
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
await page.waitForTimeout(1500);
const zoomed=await page.evaluate(()=>{
  const els=[...document.querySelectorAll('button,[role="button"],a')];
  const z=els.find(e=>/zoom to location/i.test(String(e.textContent||e.getAttribute('aria-label')||'')));
  if(z){z.click();return String(z.textContent||z.getAttribute('aria-label')||'zoom');}
  return null;
});
if(zoomed){console.log('ZOOM_CONTROL '+zoomed);await page.waitForTimeout(1500);}
const clickInfo=await page.evaluate(()=>{
  const b=document.getElementById('earthlineDeclareProperty16169')||[...document.querySelectorAll('button')].find(e=>/20\s*acres|analyze/i.test(String(e.textContent||'')));
  if(!b)return {clicked:false,buttons:[...document.querySelectorAll('button')].map(x=>String(x.textContent||'').trim()).filter(Boolean).slice(0,80)};
  b.click();return {clicked:true,text:String(b.textContent||'').trim()};
});
console.log('PROPERTY_CLICK '+JSON.stringify(clickInfo));
await page.waitForTimeout(15000);
const out=await page.evaluate(()=>{
 const M0=(typeof M!=='undefined'&&M)||null;
 const pick={};
 for(const k of Object.keys(window)){
   if(/EXCLUSION|VECTOR|NOBUILD|PROPERTY.*AUDIT|ROAD|BUILDING|15861|16173|16220/i.test(k)){
     const v=window[k]; if(v==null||typeof v==='function')continue;
     try{pick[k]=JSON.parse(JSON.stringify(v));}catch(_){pick[k]=String(v);}
   }
 }
 return {
   search:String(document.getElementById('searchInput')?.value||''),
   rootState:String(document.documentElement.dataset.earthlineRunState||''),
   propertyState:String(document.documentElement.dataset.earthlinePropertyRunState||''),
   status:String(document.body.innerText||'').match(/OPEN-DATA SCREENING[\s\S]{0,500}/i)?.[0]||'',
   M:{swales:Number(M0?.swales?.length||0),analysisReady:!!M0?.analysisReady,vectorNoBuildCoverage:M0?.vectorNoBuildCoverage||null,loc:M0?.loc||null},
   propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null,
   publicationAudit:window.EARTHLINE_PROPERTY_PUBLICATION_AUDIT_16220||null,
   picked:pick
 };
});
console.log('INDIA_PROPERTY_DIAG '+JSON.stringify(out));
await browser.close();
// trigger India property diagnostic after user-visible fail
