import {chromium} from 'playwright';
import fs from 'node:fs';
const source=fs.readFileSync('earthline-elder-runtime-17097.js','utf8');
new Function(source);
console.log('M83_ELDER_SYNTAX_PASS '+source.length);
const browser=await chromium.launch({headless:true});
const page=await browser.newPage();
const rows=[];
page.on('pageerror',e=>rows.push({type:'pageerror',msg:String(e)}));
page.on('console',m=>rows.push({type:'console-'+m.type(),msg:m.text()}));
page.on('requestfailed',r=>rows.push({type:'requestfailed',url:r.url(),msg:r.failure()?.errorText||''}));
await page.route('**/earthline-elder-runtime-17097.js*',r=>r.fulfill({status:200,contentType:'application/javascript',body:source}));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
let importResult='';
try{importResult=await page.evaluate(async()=>{await import('/earthline-elder-runtime-17097.js?diag=1');return 'imported';});}catch(e){importResult='ERR '+String(e);}
await page.waitForTimeout(500);
const state=await page.evaluate(()=>({api:!!window.EARTHLINE_ELDER_TREES_V1_17097,ready:document.readyState}));
console.log('M83_ELDER_INSTALL_DIAG '+JSON.stringify({importResult,state,rows:rows.slice(-30)}));
await browser.close();
