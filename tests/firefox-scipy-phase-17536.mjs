import { firefox } from 'playwright';
const browser=await firefox.launch({headless:true});
const page=await browser.newPage();
await page.goto('https://earthlinedevelopment.org/?scipy17536='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
const out=await page.evaluate(async()=>{
  const t0=performance.now();
  const mod=await import('https://cdn.jsdelivr.net/pyodide/v0.29.5/full/pyodide.mjs');
  const t1=performance.now();
  const py=await mod.loadPyodide({indexURL:'https://cdn.jsdelivr.net/pyodide/v0.29.5/full/',packages:['numpy','scipy']});
  const t2=performance.now();
  await py.runPythonAsync(`
import numpy as np
from scipy import ndimage
a=(np.arange(420*420,dtype=np.float32).reshape((420,420))%37).astype(np.float32)
m=ndimage.median_filter(a,size=9,mode='nearest')
u=ndimage.uniform_filter((a>5).astype(np.float32),size=9,mode='nearest')
x=ndimage.maximum_filter(a,size=7,mode='nearest')
g=ndimage.gaussian_filter(a,sigma=1.2)
lab,n=ndimage.label(a>20)
`);
  const t3=performance.now();
  return {importModule:t1-t0,loadPyodideScipy:t2-t1,compiledKernels:t3-t2,total:t3-t0};
});
console.log('EARTHLINE_FIREFOX_SCIPY_PHASE_17536 '+JSON.stringify(out));
await browser.close();