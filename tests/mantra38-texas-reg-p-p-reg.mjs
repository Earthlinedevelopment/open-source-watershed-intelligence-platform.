import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:1000}});
await page.goto(URL,{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const out=await page.evaluate(()=>{
  const src=document.documentElement.innerHTML;
  const around=(needle,before=3500,after=5000,max=6)=>{const a=[];let p=0;while((p=src.indexOf(needle,p))>=0&&a.length<max){a.push(src.slice(Math.max(0,p-before),Math.min(src.length,p+needle.length+after)));p+=needle.length;}return a;};
  const fn=name=>typeof window[name]==='function'?String(window[name]):null;
  const keys=Object.keys(window).filter(k=>/boundary|jurisdiction|point.*polygon|state.*package|atomic.*state|regional.*overlay|realglobe|aquifer/i.test(k)).slice(0,300);
  return {
    overlayOkAssign:around('regionalOverlayRenderOk16336'),
    verifier:around('regional corridor-label publication incomplete:'),
    renderer:fn('earthlineRenderRegionalOverlay16020'),
    initGlobe:fn('initRealGlobe16233'),
    initial1020:around('center:[-102,20]'),
    initial018:around('center:[0,18]'),
    topText:fn('ensureAquiferTopText16501'),
    aqLabels:fn('aquiferLabelData15788'),
    fetchAq:fn('fetchUSGSAquifersLegacy16397'),
    inheritAq:fn('earthlineInheritRegionalAquiferContext16334'),
    containOptional:fn('earthlineContainOptionalContext16565'),
    atomicPackage:around('EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556'),
    boundaryHelpers:keys.reduce((o,k)=>{try{if(typeof window[k]==='function')o[k]=String(window[k]).slice(0,10000);else if(window[k]&&typeof window[k]==='object')o[k]=JSON.stringify(window[k]).slice(0,5000);}catch(_){}return o;},{})
  };
});
console.log('MANTRA38_TEXAS_ANCHORS '+JSON.stringify(out));
await browser.close();
