import { chromium } from 'playwright';
import fs from 'node:fs';
fs.mkdirSync('artifacts/stability-audit-17074b',{recursive:true});
const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:830}});
const page=await context.newPage();
const badResponses=[], pageErrors=[], consoleErrors=[];
page.on('response',r=>{if(r.status()>=400)badResponses.push({status:r.status(),url:r.url()})});
page.on('pageerror',e=>pageErrors.push(String(e?.stack||e)));
page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
await page.goto('http://127.0.0.1:8787/index.html',{waitUntil:'domcontentloaded',timeout:30000});
await page.waitForTimeout(2500);
const snap=async(label)=>page.evaluate((label)=>{
  const root=document.documentElement;
  const panel=document.getElementById('earthlinePanel16188');
  const search=document.getElementById('earthlineRailSearch16188');
  const pr=panel?.getBoundingClientRect(), sr=search?.getBoundingClientRect();
  const ps=panel?getComputedStyle(panel):null;
  let mapState=null;try{
    const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
    mapState={exists:!!m,styleLoaded:!!m?.isStyleLoaded?.(),loaded:!!m?.loaded?.(),center:m?.getCenter?.()?.toArray?.()||null,zoom:m?.getZoom?.()??null};
  }catch(e){mapState={error:String(e)}}
  return {label,panelClass:root.classList.contains('earthline-panel-open-16188'),
    searchActive:search?.classList.contains('active')||false,
    panel:{x:pr?.x,y:pr?.y,w:pr?.width,h:pr?.height,transform:ps?.transform,visibility:ps?.visibility,opacity:ps?.opacity},
    search:{x:sr?.x,y:sr?.y,w:sr?.width,h:sr?.height},
    mapState,
    owners:{
      mobile:window.EARTHLINE_MOBILE_PRODUCTION_17003?.state||null,
      uiEmergency:window.EARTHLINE_UI_EMERGENCY_17069?.state||null,
      navReturn:window.EARTHLINE_NAV_RETURN_OWNER_17070?.state||null,
      navEdge:window.EARTHLINE_NAV_RAIL_EDGE_OWNER_17070?.state||null
    }};
},label);
const timeline=[await snap('before')];
await page.locator('#earthlineRailSearch16188').click({timeout:5000});
for(const [label,ms] of [['20ms',20],['100ms',80],['350ms',250],['1000ms',650]]){
  await page.waitForTimeout(ms); timeline.push(await snap(label));
}
const closeTimeline=[];
try{
  closeTimeline.push(await snap('before-close'));
  await page.locator('#earthlinePanelClose16188').click({timeout:5000});
  for(const [label,ms] of [['close-20ms',20],['close-350ms',330],['close-1000ms',650]]){
    await page.waitForTimeout(ms); closeTimeline.push(await snap(label));
  }
}catch(e){closeTimeline.push({error:String(e)})}
const result={badResponses,pageErrors,consoleErrors,timeline,closeTimeline};
fs.writeFileSync('artifacts/stability-audit-17074b/results.json',JSON.stringify(result,null,2));
console.log(JSON.stringify(result,null,2));
await browser.close();
