import {chromium} from 'playwright';
import fs from 'node:fs';

const chromePaths=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'];
const executablePath=chromePaths.find(p=>fs.existsSync(p));
if(!executablePath)throw new Error('system Chrome not found');

const browser=await chromium.launch({headless:true,executablePath,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const cdp=await page.context().newCDPSession(page);
await cdp.send('Runtime.enable');
const exceptions=[];
cdp.on('Runtime.exceptionThrown',ev=>exceptions.push(ev.exceptionDetails));
page.on('pageerror',e=>console.log('M83_PAGEERROR '+JSON.stringify({message:String(e),stack:e.stack||''})));
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(2500);
await page.locator('#searchInput').fill('Arizona');
await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
await page.waitForFunction(()=>String(document.documentElement.dataset.earthlineRunState||'')==='published',{timeout:90000});
await page.waitForTimeout(1000);
console.log('M83_EXCEPTIONS '+JSON.stringify(exceptions.map(x=>({
 text:x.text,url:x.url,lineNumber:x.lineNumber,columnNumber:x.columnNumber,
 description:x.exception?.description||null
}))));
await browser.close();
