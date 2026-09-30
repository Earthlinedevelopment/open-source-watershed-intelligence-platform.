import { chromium } from 'playwright';
const BASE='http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.goto(BASE+'?m50='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForTimeout(1200);
const language=await page.evaluate(()=>{const s=document.getElementById('earthlineLanguage16488');return s?{values:[...s.options].map(o=>o.value),labels:[...s.options].map(o=>o.textContent),disabled:s.disabled,aria:s.getAttribute('aria-disabled'),value:s.value}:null});
const languagePass=!!language&&JSON.stringify(language.values)===JSON.stringify(['en','th','vi','lo'])&&language.disabled===true&&language.aria==='true'&&language.value==='en';
async function start(q){await page.evaluate(query=>{const i=document.getElementById('searchInput');i.value=query;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));document.getElementById('runBtn')?.click();},q);}
async function waitPublished(q,timeout=70000){await page.waitForFunction(query=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;const status=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return /screening published\./i.test(status)&&String(d?.query||d?.name||'').toLowerCase().includes(query);},q.toLowerCase(),{timeout,polling:100});}
await start('New Mexico');await waitPublished('new mexico');
await start('Texas');
const samples=[];
for(const ms of [0,25,75,150,300,600,1000]){if(ms)await page.waitForTimeout(ms-(samples.at(-1)?.ms||0));samples.push(await page.evaluate(ms=>{const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null;const ids=['earthline-ranked-swale-opportunities-15775','earthline-regional-flow-15761','earthline-regional-grades-15772','earthline-regional-contours-15772'];const counts={};for(const id of ids){const src=map?.getSource?.(id);const data=src?._data;counts[id]=Array.isArray(data?.features)?data.features.length:0;}return {ms,counts,overlay:document.getElementById('earthlineRegionalVectorOverlay16020')?.childElementCount||0,tabs:!!document.getElementById('earthlineRegionalCorridorTabs16323'),audit:window.EARTHLINE_REGIONAL_TRANSITION_CLEAR_AUDIT_16906||null};},ms));}
const transitionPass=samples.every(s=>Object.values(s.counts).every(n=>n===0)&&s.overlay===0&&!s.tabs&&s.audit?.ok===true);
console.log('M50_16906 '+JSON.stringify({language,languagePass,samples,transitionPass,errors}));
await browser.close();
if(!languagePass||!transitionPass||errors.length)process.exitCode=1;
