import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
page.on('console',m=>{ if(/Earthline|Vancouver|aquifer|flow/i.test(m.text())) console.log('BROWSER',m.text()); });
await page.goto(URL+'?vancouver-gate='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='vancouver island';
  i.dispatchEvent(new Event('input',{bubbles:true}));
  i.dispatchEvent(new Event('change',{bubbles:true}));
  b.click();
});
await page.waitForFunction(()=>{
  const t=window.EARTHLINE_REGIONAL_TERMINAL_16539;
  return t&&['published','failed','unavailable'].includes(String(t.status||''));
},null,{timeout:150000,polling:200});
const result=await page.evaluate(()=>({
  terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
  waterAudit:window.EARTHLINE_VANCOUVER_WATER_AUDIT_16912||null,
  aquiferAudit:window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912||null,
  boundaryAudit:window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,
  visual:{
    flows:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.flows?.features||[]).filter(f=>f?.properties?.feature_type==='flow').length,
    arrows:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.flows?.features||[]).filter(f=>f?.properties?.feature_type==='flow-arrow').length,
    swales:(window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[]).length,
    aquifers:(window.EARTHLINE_VANCOUVER_AQUIFER_AUDIT_16912?.published||0)
  }
}));
console.log(JSON.stringify(result));
if(result.terminal?.status!=='published')throw new Error('Vancouver Island did not publish');
if(!(Number(result.waterAudit?.waterPaths)>0)||!(Number(result.visual.flows)>0))throw new Error('Vancouver Island water paths missing');
if(Number(result.waterAudit?.waterPaths)<20)throw new Error('Vancouver Island water-path density insufficient: '+String(result.waterAudit?.waterPaths));
if(!(Number(result.aquiferAudit?.published)>0))throw new Error('Vancouver Island official aquifers missing');
if(!result.boundaryAudit)throw new Error('Vancouver Island authoritative containment audit missing');
await browser.close();

// trigger gate

// Vancouver density gate 16917

// 16918 launch gate rerun

// Mantra54 shared-flow rerun
