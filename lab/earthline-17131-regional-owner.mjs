import { chromium } from 'playwright';
const TARGET=process.env.TARGET;
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
await page.goto('https://earthlinedevelopment.org/?diag17131='+TARGET+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},TARGET);
await page.waitForFunction(q=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||{}).query||'').toLowerCase()===q.toLowerCase(),TARGET,{timeout:95000,polling:100});
const out=await page.evaluate(()=>{
 const obj={};
 for(const k of Object.keys(window).filter(k=>/REGIONAL.*(PERFORMANCE|TIM|AUDIT|CAPACITY|SUPERTILE|DISPERSION|CAMERA|FRAME|JURISDICTION)|ATOMIC_STATE|LAND_VALIDITY/i.test(k)).sort()){
   try{const v=window[k];if(v&&typeof v==='object')obj[k]=JSON.parse(JSON.stringify(v));else if(typeof v==='string'||typeof v==='number'||typeof v==='boolean')obj[k]=v;}catch{}
 }
 const m=window.earthlineMap;
 let mapState=null;try{mapState=m?{center:m.getCenter().toArray(),zoom:m.getZoom(),bounds:m.getBounds().toArray(),styleLoaded:m.isStyleLoaded()}:null}catch{}
 return {error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,displayed:window.EARTHLINE_DISPLAYED_RUN_16151||null,performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,mapState,obj};
});
console.log('DIAG17131 '+JSON.stringify({TARGET,pageErrors,out}));
await browser.close();