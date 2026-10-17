import { webkit } from 'playwright';
const browser=await webkit.launch({headless:false});
const page=await browser.newPage({viewport:{width:1800,height:950}});
await page.goto((process.env.EARTHLINE_URL||'http://127.0.0.1:8787/')+'?p17363='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.evaluate(()=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Vermont';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:90000,polling:100});
console.log('EARTHLINE_17363 '+JSON.stringify({perf:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,supertile:window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null}));
await browser.close();