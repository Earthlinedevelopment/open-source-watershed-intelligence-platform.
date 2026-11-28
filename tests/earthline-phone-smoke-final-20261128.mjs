import {chromium} from 'playwright';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';

const BASE='https://earthlinedevelopment.org/';
const ROOT=process.cwd();
mkdirSync('artifacts/phone-final',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,deviceScaleFactor:1,hasTouch:true});
const page=await context.newPage();
const errors=[];
page.on('pageerror',err=>errors.push(String(err)));
await page.route('**/*',async route=>{
  const url=new URL(route.request().url());
  if(url.origin!==new URL(BASE).origin)return route.continue();
  const rel=decodeURIComponent(url.pathname).replace(/^[/]+/,'')||'index.html';
  const file=path.resolve(ROOT,rel);
  if(file!==ROOT&&!file.startsWith(ROOT+path.sep))return route.abort();
  if(existsSync(file)&&statSync(file).isFile()){
    const ext=path.extname(file).toLowerCase();
    const mime={'.html':'text/html; charset=utf-8','.js':'application/javascript','.css':'text/css','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
    return route.fulfill({status:200,contentType:mime[ext]||'application/octet-stream',body:readFileSync(file)});
  }
  return route.continue();
});
const stages=[];
const snap=()=>page.evaluate(()=>{
  const panel=document.getElementById('earthlinePanel16188');
  const canvas=document.querySelector('.mapboxgl-canvas');
  const rect=canvas?.getBoundingClientRect();
  return {
    panelOpen:document.documentElement.classList.contains('earthline-panel-open-16188'),
    panelExists:!!panel,searchRail:!!document.getElementById('earthlineRailSearch16188'),
    canvasExists:!!canvas,canvasWidth:rect?.width||0,canvasHeight:rect?.height||0,
    banner:!!document.getElementById('earthlineCrosshairMoveHint17093'),
    controller:!!window.EARTHLINE_PHONE_MAP_VISIBILITY_20261128
  };
});
await page.goto(BASE+'?phone_candidate_20261128='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#earthlineRailSearch16188',{timeout:30000});
await page.waitForTimeout(1200);
const initial=await snap();
stages.push({name:'initial phone map',pass:!initial.panelOpen&&initial.canvasExists&&initial.canvasWidth>=150&&initial.controller,snap:initial});
await page.locator('#earthlineRailSearch16188').click();
await page.waitForTimeout(200);
const opened=await snap();
stages.push({name:'rail opens panel',pass:opened.panelOpen,snap:opened});
await page.locator('#earthlinePanelClose16188').click();
await page.waitForTimeout(220);
const closed=await snap();
stages.push({name:'close returns to map',pass:!closed.panelOpen,snap:closed});
await page.evaluate(()=>document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{tier:'regional'}})));
await page.waitForTimeout(100);
const tipShown=await snap();
stages.push({name:'regional onboarding generated',pass:tipShown.banner,snap:tipShown});
await page.evaluate(()=>document.querySelector('.mapboxgl-canvas')?.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,pointerType:'touch'})));
await page.waitForTimeout(90);
const tipHidden=await snap();
stages.push({name:'map interaction dismisses banner',pass:!tipHidden.banner,snap:tipHidden});
await page.locator('#earthlineRailSearch16188').click();
await page.waitForTimeout(130);
await page.evaluate(()=>document.dispatchEvent(new CustomEvent('earthline:analysis-complete',{detail:{tier:'property'}})));
await page.waitForTimeout(320);
const postProperty=await snap();
stages.push({name:'phone Property completion reveals map',pass:!postProperty.panelOpen,snap:postProperty});
await page.screenshot({path:'artifacts/phone-final/phone-final.png'});
const report={at:new Date().toISOString(),stages,errors,pass:stages.every(r=>r.pass)&&errors.length===0};
writeFileSync('artifacts/phone-final/results.json',JSON.stringify(report,null,2));
console.log('EARTHLINE_PHONE_FINAL '+JSON.stringify(report));
await browser.close();
if(!report.pass)process.exitCode=1;
