import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto('https://earthlinedevelopment.org/',{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const out=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;
  const around=(needle,b=5000,a=7000,max=4)=>{const out=[];let p=0;while((p=src.indexOf(needle,p))>=0&&out.length<max){out.push(src.slice(Math.max(0,p-b),Math.min(src.length,p+needle.length+a)));p+=needle.length;}return out;};
  const fn=name=>{try{const f=window[name];return typeof f==='function'?String(f):null}catch(_){return null}};
  return {
    pointInJurisdiction:fn('earthlinePointInJurisdiction16539'),
    clipFC:fn('earthlineClipFeatureCollection16539'),
    clipLine:fn('earthlineClipLine16539'),
    prepareJurisdiction:fn('earthlinePrepareJurisdiction16539'),
    topTextAround:around('ensureAquiferTopText16501'),
    aqSyncAround:around('ensureAquiferLabels15788'),
    usgsAssignmentAround:around('M.usgsAquifers=all.filter'),
    planningAqAround:around('earthlinePreparePlanningAquiferView'),
    rendererReturnAround:around('return labels>0&&waterPaths>0&&nativeWater.ready&&swales>0'),
    mapLoadJumpAround:around('earthlineMap.jumpTo({center:[-102,20],zoom:0,bearing:0,pitch:0})')
  };
});
console.log('MANTRA38_TEXAS_CLIP_ANCHORS '+JSON.stringify(out));
await browser.close();
