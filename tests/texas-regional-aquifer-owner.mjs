import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';const browser=await chromium.launch({headless:true});const page=await browser.newPage({viewport:{width:1600,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});let patch=0;
await page.route('**/*',async route=>{if(route.request().resourceType()!=='document')return route.continue();const resp=await route.fetch();let text=await resp.text();
 const n='try{M.layers.usgsAquifer.on=true;M.usgsAquiferLoading=false;setTimeout(()=>fetchUSGSAquifers(),80);}catch(e){}';
 const r='try{M.layers.usgsAquifer.on=true;M.usgsAquiferLoading=false;const rb=Array.isArray(parent&&parent.bbox)&&parent.bbox.length===4?{minLng:Number(parent.bbox[0]),minLat:Number(parent.bbox[1]),maxLng:Number(parent.bbox[2]),maxLat:Number(parent.bbox[3])}:null;setTimeout(()=>fetchUSGSAquifers(rb,{owner:"regional"}),80);}catch(e){}';
 patch=text.split(n).length-1;text=text.split(n).join(r);return route.fulfill({response:resp,body:text});});
await page.goto(URL+'?tx_aq_regional='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
let terminal=false;try{await page.waitForFunction(()=>{const mm=(typeof M!=='undefined'?M:null),a=mm&&mm.usgsAquiferAudit||null;return a&&String(a.status||'')!=='loading';},{timeout:30000,polling:100});terminal=true;}catch(_){}
await page.waitForTimeout(500);
const state=await page.evaluate(()=>{const mm=(typeof M!=='undefined'&&M)||{},a=mm.usgsAquiferAudit||null;const src=(window.earthlineMap||earthlineMap)?.getSource?.('earthline-aquifers')||null,data=src&&(src._data||src._options?.data)||null;return {audit:a,box:mm.usgsAquiferBox||null,status:mm.usgsAquiferStatus||null,count:Array.isArray(mm.usgsAquifers)?mm.usgsAquifers.length:null,layerOn:mm.layers?.usgsAquifer?.on??null,sourceFeatures:Array.isArray(data?.features)?data.features.length:null,loc:mm.loc||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};});
console.log('EARTHLINE_TX_REGIONAL_AQUIFER_OWNER '+JSON.stringify({patch,terminal,state,errors:errors.slice(0,15)}));await browser.close();if(patch!==1||!terminal)process.exitCode=1;
