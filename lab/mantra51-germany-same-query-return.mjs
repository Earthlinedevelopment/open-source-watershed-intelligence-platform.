import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const URL='https://earthlinedevelopment.org/';
page.on('console',m=>{if(/Earthline|regional|property|stale|search|tier/i.test(m.text()))console.log('BROWSER',m.text())});
await page.goto(URL+'?germany-return='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:30000});
const run=async q=>page.evaluate(q=>{
  const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
  i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
},q);
await run('germany country');
await page.waitForFunction(()=>window.EARTHLINE_REGIONAL_TERMINAL_16539?.status==='published',null,{timeout:180000,polling:250});
await page.waitForTimeout(1200);

// Use a real corridor tab if present, otherwise synthesize through existing selected corridor owner.
const open=await page.evaluate(()=>{
  const root=document.getElementById('earthlineRegionalCorridorTabs16323');
  const btn=root?.querySelector('button,[role="button"]');
  if(btn){const text=String(btn.textContent||'').trim();btn.click();return {via:'tab',text};}
  const hits=[...document.querySelectorAll('.earthline-swale-hit-16070,.earthline-swale-label-16149')];
  if(hits[0]){hits[0].dispatchEvent(new MouseEvent('click',{bubbles:true}));return {via:'map-hit'};}
  return {via:'none'};
});
console.log('CORRIDOR_OPEN '+JSON.stringify(open));
await page.waitForTimeout(500);
const zoom=await page.evaluate(()=>{
  const all=[...document.querySelectorAll('button,[role="button"],a')];
  const b=all.find(e=>/zoom to location/i.test(String(e.textContent||e.getAttribute('aria-label')||'')));
  if(b){const t=String(b.textContent||'').trim();b.click();return {clicked:true,text:t};}
  const d=document.getElementById('earthlineCorridorDetail16149');
  const bb=d?.querySelector('button,[role="button"]');
  if(bb){const t=String(bb.textContent||'').trim();bb.click();return {clicked:true,text:t,via:'detail-first'};}
  return {clicked:false};
});
console.log('ZOOM '+JSON.stringify(zoom));
await page.waitForTimeout(1000);
const prop=await page.evaluate(()=>{
 const b=document.getElementById('earthlineDeclareProperty16169')||[...document.querySelectorAll('button')].find(e=>/20\s*acres|analyze/i.test(String(e.textContent||'')));
 if(!b)return {clicked:false}; const t=String(b.textContent||'').trim();b.click();return {clicked:true,text:t};
});
console.log('PROPERTY '+JSON.stringify(prop));
await page.waitForFunction(()=>window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.settled===true,null,{timeout:60000,polling:200}).catch(()=>{});
await page.waitForTimeout(1500);

const before=await page.evaluate(()=>({
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  searchGen:Number(M?.searchGen||0),
  runBtnBusy:document.getElementById('runBtn')?.dataset?.busy||null,
  runBtnAria:document.getElementById('runBtn')?.getAttribute('aria-busy')||null,
  propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  crossTier:window.EARTHLINE_CROSS_TIER_SUPERSEDE_AUDIT_16327||null,
  clearAudit:window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334||null,
  propertyAudit:window.EARTHLINE_PROPERTY_RUN_AUDIT_16173||null
}));
console.log('GERMANY_BEFORE_RETURN '+JSON.stringify(before));

await run('germany country');
await page.waitForTimeout(20000);

const after=await page.evaluate(()=>({
  search:String(document.getElementById('searchInput')?.value||''),
  displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
  lastRegional:window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null,
  lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
  terminal:window.EARTHLINE_REGIONAL_TERMINAL_16539||null,
  searchGen:Number(M?.searchGen||0),
  runBtnBusy:document.getElementById('runBtn')?.dataset?.busy||null,
  runBtnAria:document.getElementById('runBtn')?.getAttribute('aria-busy')||null,
  propertyState:document.documentElement.dataset.earthlinePropertyRunState||'',
  tier:document.documentElement.dataset.earthlineAnalysisTier||'',
  crossTier:window.EARTHLINE_CROSS_TIER_SUPERSEDE_AUDIT_16327||null,
  clearAudit:window.EARTHLINE_PROPERTY_TO_REGIONAL_CLEAR_AUDIT_16334||null,
  regionalState:window.earthlineRegional15778?{mode:window.earthlineRegional15778.mode,running:window.earthlineRegional15778.running,active:window.earthlineRegional15778.active,queued:window.earthlineRegional15778.queuedRunCount15786}:null,
  reportText:String(document.getElementById('earthlineVermontReport16149')?.textContent||'').trim(),
  statusText:String(document.getElementById('earthlineVermontStatus16147')?.textContent||'').trim()
}));
console.log('GERMANY_SAME_QUERY_AFTER_RETURN '+JSON.stringify(after));
await browser.close();
// trigger Germany property return diagnostic

// trigger same-query Germany return diagnostic
