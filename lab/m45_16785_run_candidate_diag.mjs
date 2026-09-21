import {chromium} from 'playwright';
import fs from 'fs';

const html=fs.readFileSync('/tmp/index-16785.html','utf8');
const cases={
  iowa:['1,0','3,0','4,0','1,1','8,1','0,3','1,3','4,3','5,3','0,4','4,4','7,4','8,4','4,6','5,6','7,6','8,8','8,9','9,11'],
  arkansas:['0,0','1,0','4,0','5,0','6,0','7,0','10,1','0,2','7,2','8,2','0,3','6,3','7,3','9,3','0,4','4,4','0,5','3,5','6,5','6,6','9,6','1,7','3,7','4,7','7,7','9,7','0,9','1,9','2,11','3,11','5,11','8,11']
};

const browser=await chromium.launch({headless:true});
const rows=[];
for(const [state,targetCells] of Object.entries(cases)){
  const page=await browser.newPage({viewport:{width:1800,height:832}});
  await page.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();
    if(req.resourceType()==='document'){
      const u=new URL(req.url());
      if(u.pathname==='/'||u.pathname==='/index.html'){
        await route.fulfill({status:200,contentType:'text/html',body:html,headers:{'cache-control':'no-store'}});
        return;
      }
    }
    await route.continue();
  });

  let error=null;
  try{
    await page.goto('https://earthlinedevelopment.org/?canddiag='+state+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(({state,targetCells})=>{
      window.EARTHLINE_M45_CANDIDATE_GATE_DIAG={state,targetCells,cells:{},at:new Date().toISOString()};
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=state+' state';
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },{state,targetCells});
    await page.waitForFunction(()=>window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784?.cellLineage?.opportunityNoCandidate,{timeout:90000,polling:100});
    await page.waitForTimeout(500);
  }catch(e){error=String(e&&e.message||e);}

  const snap=await page.evaluate(()=>{
    const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||{};
    const diag=window.EARTHLINE_M45_CANDIDATE_GATE_DIAG||{};
    return {
      bounds:window.EARTHLINE_M45_STATE_BOUNDS||null,
      root:root.cellLineage||null,
      cells:diag.cells||{},
      fine:window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null,
      perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null
    };
  }).catch(()=>({}));
  rows.push({state,error,...snap});
  await page.close();
}
await browser.close();

for(const r of rows){
  const aggregate={};
  for(const cell of Object.values(r.cells||{})){
    for(const [k,v] of Object.entries(cell)){
      if(k==='cell')continue;
      const n=Number(v);
      if(Number.isFinite(n))aggregate[k]=(aggregate[k]||0)+n;
    }
  }
  r.aggregate=aggregate;
}
const out={at:new Date().toISOString(),rows};
fs.writeFileSync('lab/mantra45-16785-ia-ar-candidate-gates.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(rows.map(r=>({state:r.state,error:r.error,root:r.root,aggregate:r.aggregate,cells:r.cells}))));
