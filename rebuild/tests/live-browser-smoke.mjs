/**
 * M116 read-only public-browser smoke. Does NOT click Run Analysis,
 * publish output, or certify hydrology or geographic coverage.
 */
import {chromium} from 'playwright';
import fs from 'node:fs/promises';

const url='https://earthlinedevelopment.org/';
const out='artifacts/mantra116-live-browser';
await fs.mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
const cases=[{name:'desktop',width:1366,height:900,isMobile:false},
             {name:'mobile',width:390,height:844,isMobile:true}];
let failures=0;
for(const tc of cases){
  const context=await browser.newContext({viewport:{width:tc.width,height:tc.height},
    isMobile:tc.isMobile,deviceScaleFactor:1});
  const page=await context.newPage();
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e.message||e)));
  let report={profile:tc.name,publicUrl:url};
  try{
    const response=await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
    report.httpStatus=response?.status()??null;
    await page.locator('#searchInput').waitFor({state:'attached',timeout:30000});
    await page.locator('#mapboxBase').waitFor({state:'attached',timeout:30000});
    await page.locator('#runBtn').waitFor({state:'attached',timeout:30000});
    try{
      await page.waitForFunction(()=>!!document.querySelector(
        '#mapboxBase canvas.mapboxgl-canvas'),null,{timeout:35000});
    }catch{report.mapboxCanvasNotReady=true;}
    report.title=await page.title();
    report.searchPresent=await page.locator('#searchInput').count()===1;
    report.runButtonPresent=await page.locator('#runBtn').count()===1;
    report.mapboxCanvasPresent=await page.locator(
      '#mapboxBase canvas.mapboxgl-canvas').count()>0;
    report.viewport=tc;
    report.pageErrors=pageErrors.slice(0,20);
    report.passed=report.httpStatus===200 &&
      report.title.includes('Earthline') &&
      report.searchPresent&&report.runButtonPresent&&report.mapboxCanvasPresent;
  }catch(e){
    report.passed=false;report.error=String(e.stack||e);
    report.pageErrors=pageErrors.slice(0,20);
  }
  try{await page.screenshot({path:`${out}/${tc.name}.png`,timeout:15000});}
  catch(e){report.screenshotError=String(e.message||e);}
  await fs.writeFile(`${out}/${tc.name}.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
  if(!report.passed)failures++;
  await context.close();
}
await browser.close();
if(failures){
  console.error(`${failures}/${cases.length} browser smoke profiles failed`);
  process.exitCode=1;
}
