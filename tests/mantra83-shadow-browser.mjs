import {chromium} from 'playwright';
import {spawn} from 'node:child_process';

const server=spawn('python3',['-m','http.server','4173'],{stdio:'ignore'});
await new Promise(r=>setTimeout(r,1200));
let browser;
try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage();
  await page.goto('http://127.0.0.1:4173/shadow-index.html',{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>window.EARTHLINE_MANTRA83_SHADOW&&typeof window.EARTHLINE_MANTRA83_SHADOW.rows==='function',{timeout:30000});
  const result=await page.evaluate(async()=>{
    const sample=Object.freeze({runToken:'shadow-test-1',query:'Shadow Test',tier:'property',mode:'property',derived:{swaleOpportunityLines:7}});
    window.EARTHLINE_DISPLAYED_RUN_16147=sample;
    window.EARTHLINE_DISPLAYED_RUN_16151=sample;
    const before=JSON.stringify(window.EARTHLINE_DISPLAYED_RUN_16151);
    document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{runToken:'shadow-test-1',tier:'property'}}));
    await new Promise(r=>setTimeout(r,20));
    const after=JSON.stringify(window.EARTHLINE_DISPLAYED_RUN_16151);
    const rows=window.EARTHLINE_MANTRA83_SHADOW.rows();
    return {before,after,count:rows.length,last:rows[rows.length-1]||null};
  });
  if(result.before!==result.after)throw new Error('shadow observer mutated displayed run');
  if(result.count<1)throw new Error('shadow observer did not capture completion');
  if(result.last.identityUnchanged!==true)throw new Error('observer identity invariant failed');
  console.log('M83_SHADOW_BROWSER_PASS '+JSON.stringify({rows:result.count,identityUnchanged:result.last.identityUnchanged,model:result.last.model}));
}finally{
  if(browser)await browser.close();
  server.kill('SIGTERM');
}
