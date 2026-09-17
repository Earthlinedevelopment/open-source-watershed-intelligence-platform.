import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
let patchPlanning=0,patchSearch=0;
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let text=await resp.text();
  const n1='if(MB_ON())fetchUSGSAquifers();';
  const r1='if(MB_ON()){const rb=Array.isArray(loc&&loc.bbox)&&loc.bbox.length===4?{minLng:Number(loc.bbox[0]),minLat:Number(loc.bbox[1]),maxLng:Number(loc.bbox[2]),maxLat:Number(loc.bbox[3])}:null;fetchUSGSAquifers(rb,{owner:"regional"});}';
  const n2='try{M.layers.usgsAquifer.on=true;setTimeout(()=>fetchUSGSAquifers(),120);}catch(e){}';
  const r2='try{M.layers.usgsAquifer.on=true;const rb=Array.isArray(loc&&loc.bbox)&&loc.bbox.length===4?{minLng:Number(loc.bbox[0]),minLat:Number(loc.bbox[1]),maxLng:Number(loc.bbox[2]),maxLat:Number(loc.bbox[3])}:null;setTimeout(()=>fetchUSGSAquifers(rb,{owner:"regional"}),120);}catch(e){}';
  patchPlanning=text.split(n1).length-1;patchSearch=text.split(n2).length-1;
  text=text.split(n1).join(r1).split(n2).join(r2);
  return route.fulfill({response:resp,body:text});
});
await page.goto(URL+'?tx_aquifer_bbox='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let timedOut=false;
try{await page.waitForFunction(()=>{const a=window.M?.usgsAquiferAudit||null;return a&&String(a.status||'')!=='loading';},{timeout:25000,polling:100});}catch(_){timedOut=true;}
await page.waitForTimeout(500);
const state=await page.evaluate(()=>{
 const M0=window.M||{};const a=M0.usgsAquiferAudit||null;const src=(window.earthlineMap||window.earthlineMap)?.getSource?.('earthline-aquifers')||null;const data=src&&(src._data||src._options?.data)||null;
 return {audit:a,box:M0.usgsAquiferBox||null,status:M0.usgsAquiferStatus||null,count:Array.isArray(M0.usgsAquifers)?M0.usgsAquifers.length:null,layerOn:M0.layers?.usgsAquifer?.on??null,sourceFeatures:Array.isArray(data?.features)?data.features.length:null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
});
console.log('EARTHLINE_TX_AQUIFER_BBOX_REPAIR '+JSON.stringify({patchPlanning,patchSearch,timedOut,state,errors:errors.slice(0,20)}));
await browser.close();
if(patchPlanning<1||patchSearch!==1||timedOut)process.exitCode=1;
