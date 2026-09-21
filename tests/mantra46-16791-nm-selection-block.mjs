import { chromium } from 'playwright';

const BASE='https://earthlinedevelopment.org/';
function patchBody(body){
  const old="if(donor16783<0)break;";
  const repl=`if(donor16783<0){
          const donorRows16791=[];
          for(let di16791=0;di16791<chosen.length;di16791++){
            const dc16791=chosen[di16791],dp16791=point16783(dc16791);if(!dp16791)continue;
            const dd16791=cellCount16783.get(dp16791.cell)||0,pn16791=parentCount16783.get(dp16791.parent)||0;
            if(dd16791>1)donorRows16791.push({cell:dp16791.cell,parent:dp16791.parent,duplicates:dd16791,parentCount:pn16791,sameParent:dp16791.parent===add16783.point.parent,score:Number(dc16791.score)||0});
          }
          window.EARTHLINE_FINAL_SPREAD_BLOCK_AUDIT_16791={targetCells:targetCells16783,finalCells:cellCount16783.size,missingCell:add16783.point.cell,missingParent:add16783.point.parent,duplicateDonors:donorRows16791,blockedByParentFloor:donorRows16791.filter(r=>r.parentCount<=3&&!r.sameParent).length,eligibleSameParent:donorRows16791.filter(r=>r.sameParent).length,at:new Date().toISOString()};
          break;
        }`;
  const n=body.split(old).length-1;if(n!==1)throw new Error('donor break expected once, found '+n);
  return body.replace(old,repl);
}

const browser=await chromium.launch({headless:true});
const context=await browser.newContext({viewport:{width:1800,height:950}});
const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',async route=>{
  const req=route.request();
  if(req.isNavigationRequest()&&req.resourceType()==='document'&&req.url().startsWith(BASE)){
    const response=await route.fetch();let body=await response.text();body=patchBody(body);await route.fulfill({response,body});return;
  }
  await route.continue();
});
await page.goto(BASE+'?earthline_m46_nm_block='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='New Mexico';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''))&&!!window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784,{},{timeout:45000,polling:100});
await page.waitForTimeout(300);
const out=await page.evaluate(()=>({spread:window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,block:window.EARTHLINE_FINAL_SPREAD_BLOCK_AUDIT_16791||null,root:window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null,perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,flow:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null}));
console.log('EARTHLINE_M46_NM_SELECTION_BLOCK '+JSON.stringify({errors,...out}));
await browser.close();
