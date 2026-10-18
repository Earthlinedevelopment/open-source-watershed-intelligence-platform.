import { firefox } from 'playwright';
const browser=await firefox.launch({headless:false});
const page=await browser.newPage();
await page.goto('data:text/html,<html><body>phase</body></html>',{waitUntil:'load'});
const out=await page.evaluate(async()=>{
  const t0=performance.now();
  const mod=await import('https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs');
  const t1=performance.now();
  const py=await mod.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/'});
  const t2=performance.now();
  await py.loadPackage(['numpy']);
  const t3=performance.now();
  py.runPython('import numpy as np; a=np.arange(4096,dtype=np.float32).reshape(64,64); b=np.median(np.lib.stride_tricks.sliding_window_view(np.pad(a,((4,4),(4,4)),mode="edge"),(9,9)),axis=(-2,-1))');
  const t4=performance.now();
  return {importModule:t1-t0,loadPyodide:t2-t1,numpy:t3-t2,firstNumpyKernel:t4-t3,total:t4-t0};
});
console.log('EARTHLINE_FIREFOX_PYODIDE_PHASE_17523 '+JSON.stringify(out));
await browser.close();
