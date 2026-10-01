import { chromium } from 'playwright';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1600,height:900}});
await page.goto(URL+'?vi-water='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value='Vancouver Island'; i.dispatchEvent(new Event('input',{bubbles:true})); i.dispatchEvent(new Event('change',{bubbles:true})); b.click();
});
await page.waitForFunction(()=>{
  const a=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329;
  return a && String(a.query||'').toLowerCase().includes('vancouver');
},{timeout:120000,polling:200});
await page.waitForTimeout(1500);
const out=await page.evaluate(()=>{
  const pre=window.EARTHLINE_REGIONAL_ATOMIC_PREFLIGHT_16329||null;
  const ba=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
  const vd=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const style=window.EARTHLINE_STYLE_WATER_INDEX_16584||null;
  const src=(()=>{try{
    const m=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    const ids=['earthline-regional-flows','earthline-modeled-flow-paths'];
    for(const id of ids){const s=m&&m.getSource&&m.getSource(id); if(s&&s._data)return {id,data:s._data};}
  }catch(_){} return null;})();
  const count=(fc,t)=>fc&&Array.isArray(fc.features)?fc.features.filter(f=>!t||f?.properties?.feature_type===t).length:0;
  return {
    pre,
    boundaryAudit:ba,
    visualFlows:count(vd&&vd.flows,'flow'),
    visualArrows:count(vd&&vd.flows,'flow-arrow'),
    style,
    sourceId:src&&src.id||null,
    sourceFlows:count(src&&src.data,'flow'),
    sourceArrows:count(src&&src.data,'flow-arrow')
  };
});
console.log(JSON.stringify(out));
if(!out.pre?.waterPaths)throw new Error('Vancouver preflight produced zero water paths');
if(!out.boundaryAudit)throw new Error('Vancouver authoritative boundary audit missing');
if((out.boundaryAudit.outsideAfterClip?.flows||0)!==0)throw new Error('Vancouver water paths remain outside island polygon');
if(!out.visualFlows)throw new Error('Vancouver published visual data has zero water paths');
await browser.close();
