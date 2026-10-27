import { chromium, firefox, webkit } from 'playwright';
const browserName=(process.env.BROWSER||'webkit').toLowerCase();
const launchers={chromium,firefox,webkit};
const headless=String(process.env.HEADLESS||'true').toLowerCase()!=='false';
const browser=await launchers[browserName].launch({headless});
const page=await browser.newPage({viewport:{width:1800,height:950}});
const base=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const query=process.env.STATE||'Texas';
await page.goto(base+'?audit17344='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},query);
await page.waitForFunction(q=>{
  const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
  const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
  return /screening published\./i.test(s)&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
},query,{timeout:90000,polling:100});
const out=await page.evaluate(()=>{
  const wanted={};
  for(const k of Object.keys(window)){
    if(!/^EARTHLINE_/.test(k))continue;
    if(!/(REFIN|GAP|SUPERTILE|SCALE|COVERAGE|COAST|TERRAIN)/i.test(k))continue;
    const v=window[k];
    if(!v||typeof v!=='object')continue;
    const s={};
    for(const p of ['build','elapsedMs','totalMs','durationMs','selected','added','failed','gaps','groups','triggered','carried','confirmedNull','unresolved','selectedTiles']){
      if(v[p]!==undefined)s[p]=Array.isArray(v[p])?v[p].length:v[p];
    }
    if(Object.keys(s).length)wanted[k]=s;
  }
  return {perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,wanted};
});
console.log('EARTHLINE_REFINEMENT_DUMP_17344 '+JSON.stringify({browser:browserName,query,...out}));
await browser.close();
