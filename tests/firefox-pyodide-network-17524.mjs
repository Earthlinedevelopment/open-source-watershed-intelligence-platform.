import { firefox } from 'playwright';
const browser=await firefox.launch({headless:false});
const context=await browser.newContext();
const page=await context.newPage();
const rows=[];
page.on('requestfinished',req=>{
  const u=req.url();
  if(/cdn\.jsdelivr\.net\/pyodide\/v0\.29\.5\/full\//.test(u)){
    try{rows.push({url:u,type:req.resourceType(),timing:req.timing()})}catch(_){rows.push({url:u,type:req.resourceType()})}
  }
});
await page.goto('data:text/html,<html><body>net</body></html>',{waitUntil:'load'});
const out=await page.evaluate(async()=>{
  const t0=performance.now();
  const mod=await import('https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs');
  const t1=performance.now();
  const py=await mod.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/'});
  const t2=performance.now();
  await py.loadPackage(['numpy']);
  const t3=performance.now();
  return {importModule:t1-t0,loadPyodide:t2-t1,numpy:t3-t2,total:t3-t0};
});
await page.waitForTimeout(500);
console.log('EARTHLINE_FIREFOX_PYODIDE_NETWORK_17524 '+JSON.stringify({out,rows}));
await context.close();await browser.close();
