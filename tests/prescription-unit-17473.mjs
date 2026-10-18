import { chromium, firefox, webkit } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BROWSER=(process.env.BROWSER||'chromium').toLowerCase();
const launcher={chromium,firefox,webkit}[BROWSER];
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launcher.launch({headless});
const page=await browser.newPage({viewport:{width:1200,height:800}});
const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?prescriptionUnit17473='+BROWSER+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForFunction(()=>typeof window.earthlineNearestNeighborSpacing15760==='function',null,{timeout:30000});
const out=await page.evaluate(()=>{
  const model=(typeof M!=='undefined'?M:window.M);
  if(!model)throw new Error('model unavailable');
  const oldCell=model.cellM;
  model.cellM=1;
  const spacing=window.earthlineNearestNeighborSpacing15760([
    {pts:[[0,0],[20,0]]},
    {pts:[[0,6.096],[20,6.096]]},
    {pts:[[0,12.192],[20,12.192]]},
    {pts:[[0,18.288],[20,18.288]]}
  ]);
  model.cellM=oldCell;
  return spacing;
});
const targetM=6.096,withinBand=out.medianM>=4.572&&out.medianM<=7.620;
const exact=Math.abs(out.medianM-targetM)<0.001&&Math.abs(out.minM-targetM)<0.001&&Math.abs(out.maxM-targetM)<0.001;
const html=await page.locator('html').evaluate(el=>el.outerHTML);
const checks={
  contourOwned:/function makeSwales[\s\S]{0,1800}feature_type==='contour'/.test(html),
  slopeFlowGate:/minSlope=relaxed\?\.05:\.20,maxSlope=relaxed\?\(focusMode\?18:4\):13\.5/.test(html)&&/acc>=channel/.test(html),
  spacingClamp:/clamp\(requested,4\.572,7\.620\)/.test(html),
  parcelPondGate:/if\(!M\.inP\[i\]\|\|M\.pond\[i\]\)return false/.test(html),
  noBuildGate:/if\(M\.noBuildMask&&M\.noBuildMask\[i\]\)return false/.test(html),
  majorChannelGate:/if\(earthlineMajorChannelUnsafeAt16288\(cx,cy\)\)return false/.test(html),
  vectorFailClosed:/if\(!vectorVerified\)failures\.push\("vector-exclusion-coverage-unverified"\)/.test(html),
  finalMaskFailClosed:/if\(!finalMaskAvailable\)failures\.push\("final-no-build-mask-unavailable"\)/.test(html)
};
const pass=withinBand&&exact&&Object.values(checks).every(Boolean)&&!errors.length;
const result={browser:BROWSER,pass,spacing:out,targetM,withinBand,exact,checks,errors};
mkdirSync('artifacts/prescription-unit-17473',{recursive:true});
writeFileSync('artifacts/prescription-unit-17473/'+BROWSER+'.json',JSON.stringify(result,null,2));
console.log('EARTHLINE_PRESCRIPTION_UNIT_17473 '+JSON.stringify(result));
await browser.close();if(!pass)process.exitCode=1;
