// rerun after detector restore
import {chromium} from 'playwright';
import fs from 'node:fs';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('chrome missing');
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage();
await page.goto('https://earthlinedevelopment.org/?elder-import=1',{waitUntil:'domcontentloaded',timeout:120000});
const out=await page.evaluate(async()=>{
 const rows=[];
 for(const url of [
  'https://cdn.jsdelivr.net/npm/geotiff@3.0.5/+esm',
  'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs'
 ]){
  try{const m=await import(url);rows.push({url,ok:true,keys:Object.keys(m).slice(0,10)});}
  catch(e){rows.push({url,ok:false,name:e?.name,message:e?.message,stack:e?.stack});}
 }
 const worker=await new Promise(resolve=>{
  try{
    const w=new Worker('earthline-elder-worker-17129.js?diag=1',{type:'module'});
    let done=false;
    const finish=x=>{if(done)return;done=true;try{w.terminate()}catch(_){}resolve(x)};
    w.addEventListener('error',e=>finish({ok:false,message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno,error:String(e.error||'')}));
    w.addEventListener('message',e=>finish({ok:true,data:e.data}));
    w.postMessage({id:'diag',warm:true});
    setTimeout(()=>finish({ok:false,message:'worker timeout'}),15000);
  }catch(e){resolve({ok:false,message:e.message,stack:e.stack});}
 });
 return {rows,worker,userAgent:navigator.userAgent};
});
console.log('M83_ELDER_BROWSER_IMPORT '+JSON.stringify(out));
await browser.close();
