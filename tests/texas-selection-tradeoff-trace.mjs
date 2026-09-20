import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const variants=[{label:'112',lower:112},{label:'112x96',lower:96}];
const browser=await chromium.launch({headless:true});
const out=[];
for(const variant of variants){
  const page=await browser.newPage({viewport:{width:1800,height:1000}});
  let resPatch=0,auditPatch=0;
  await page.route('**/*',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();let body=await resp.text();
    if(variant.lower!==112){
      const a=`const d16702=await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)`;
      const ar=`const localRes16709=tile16702.id==='coast-1'?112:${variant.lower},d16702=await loadDEM(tile16702.b,localRes16709,localRes16709,6000,'scale refinement '+tile16702.id)`;
      resPatch=body.split(a).length-1;if(resPatch!==1)throw new Error('resolution anchor '+resPatch);body=body.replace(a,ar);
    }else resPatch=1;
    const b=`    window.EARTHLINE_REFINED_SELECTION_16702={supplementalInput:Array.isArray(supplementalCandidates16702)?supplementalCandidates16702.length:0,chosenRefined:chosen.filter(c=>c&&c.refined16702).length,chosenRefinedRows:chosen.filter(c=>c&&c.refined16702).map(c=>({x:c.x,y:c.y,score:c.score,coastKm:c.coastKm16702,tile:c.tile16702}))};`;
    const br=`    window.EARTHLINE_REFINED_SELECTION_16702={supplementalInput:Array.isArray(supplementalCandidates16702)?supplementalCandidates16702.length:0,chosenRefined:chosen.filter(c=>c&&c.refined16702).length,chosenRefinedRows:chosen.filter(c=>c&&c.refined16702).map(c=>({x:c.x,y:c.y,score:c.score,coastKm:c.coastKm16702,tile:c.tile16702}))};
    window.EARTHLINE_TX_SELECTION_TRACE_16709=chosen.map((c,i)=>({i,x:c.x,y:c.y,score:c.score,slope:c.slope,refined:!!c.refined16702,tile:c.tile16702||null,coastKm:c.coastKm16702??null,mid:c.segment&&c.segment.length?c.segment[Math.floor((c.segment.length-1)/2)]:null}));`;
    auditPatch=body.split(b).length-1;if(auditPatch!==1)throw new Error('audit anchor '+auditPatch);body=body.replace(b,br);
    return route.fulfill({response:resp,body});
  });
  await page.goto(URL+'?tx_selection_trace='+variant.label+'&t='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
  await page.waitForSelector('#searchInput',{timeout:30000});
  const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''));
  await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;window.EARTHLINE_TX_SELECTION_TRACE_16709=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
  let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:45000,polling:100});}catch(_){timedOut=true;}
  await page.waitForTimeout(400);
  const snap=await page.evaluate(()=>{
    const trace=window.EARTHLINE_TX_SELECTION_TRACE_16709||[];
    const classify=r=>{const p=r.mid;if(!Array.isArray(p))return 'other';const x=+p[0],y=+p[1];if(x>-103.1&&x<-100&&y>35&&y<36.6)return 'panhandle';if(x>-96.5&&x<-93.45&&y>28.8&&y<31.2)return 'upper';if(x>-99.5&&x<-97&&y>25.7&&y<28.2)return 'lower';if(x>-99.3&&x<-96&&y>27.4&&y<30.2)return 'mid';if(x>-96&&x<-93.45&&y>30.5&&y<34.3)return 'east';return 'other';};
    return {trace:trace.map(r=>({...r,zone:classify(r)})),input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null};
  });
  out.push({variant:variant.label,timedOut,resPatch,auditPatch,snap});
  console.log('EARTHLINE_TX_SELECTION_TRACE '+JSON.stringify(out[out.length-1]));
  await page.close();
}
console.log('EARTHLINE_TX_SELECTION_TRACE_SUMMARY '+JSON.stringify(out));
await browser.close();
