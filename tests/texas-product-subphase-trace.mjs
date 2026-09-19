import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const patches={};
await page.route('**/*',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  const apply=(name,n,r)=>{patches[name]=body.split(n).length-1;body=body.split(n).join(r);};
  apply('primaryContours',
    "let contours=await makeContours(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);",
    "window.EARTHLINE_TX_SUBPHASE_16633={};let tPrimary16633=performance.now();let contours=await makeContours(hy);window.EARTHLINE_TX_SUBPHASE_16633.primaryContoursMs=Math.round(performance.now()-tPrimary16633);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · CONTOURS COMPLETE',runToken);await wait(0);");
  apply('supplementalContours',
    "const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;",
    "let tSupplemental16633=performance.now();const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;window.EARTHLINE_TX_SUBPHASE_16633.supplementalContoursMs=Math.round(performance.now()-tSupplemental16633);window.EARTHLINE_TX_SUBPHASE_16633.useSupplemental=useSupplemental16609;");
  apply('swales',
    "let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);",
    "let tSwales16633=performance.now();let swales=makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539);window.EARTHLINE_TX_SUBPHASE_16633.swalesMs=Math.round(performance.now()-tSwales16633);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · SWALES COMPLETE',runToken);await wait(0);");
  apply('flows',
    "let flows=makeFlows(hy);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);",
    "let tFlows16633=performance.now();let flows=makeFlows(hy);window.EARTHLINE_TX_SUBPHASE_16633.flowsMs=Math.round(performance.now()-tFlows16633);noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOWS COMPLETE',runToken);await wait(0);");
  apply('clip',
    "const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);",
    "let tClip16633=performance.now();const bounded16539=earthlineClipRegionalProducts16539({contours,flows,swales,query:q,runToken},boundary16539);window.EARTHLINE_TX_SUBPHASE_16633.clipMs=Math.round(performance.now()-tClip16633);");
  apply('render',
    "const regionalOverlayRenderOk16336=\n      typeof window.earthlineRenderRegionalOverlay16020==='function'\n        ?window.earthlineRenderRegionalOverlay16020(visualData)\n        :false;",
    "let tRender16633=performance.now();const regionalOverlayRenderOk16336=\n      typeof window.earthlineRenderRegionalOverlay16020==='function'\n        ?window.earthlineRenderRegionalOverlay16020(visualData)\n        :false;window.EARTHLINE_TX_SUBPHASE_16633.renderMs=Math.round(performance.now()-tRender16633);");
  return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_subphase='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));const started=Date.now();
 await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:30000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(350);
 const state=await page.evaluate(()=>({subphase:window.EARTHLINE_TX_SUBPHASE_16633||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,gen:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null}));
 console.log('EARTHLINE_TX_SUBPHASE '+JSON.stringify({repeat,patches,elapsedMs:Date.now()-started,timedOut,state}));
}
await browser.close();
