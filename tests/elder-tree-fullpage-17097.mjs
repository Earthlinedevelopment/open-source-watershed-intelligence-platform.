import { chromium } from 'playwright';
import { spawn } from 'node:child_process';

const server=spawn('python3',['-m','http.server','8788','--bind','127.0.0.1'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
await sleep(500);

const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:900}});
const pageErrors=[];
page.on('pageerror',e=>pageErrors.push(String(e)));

await page.goto('http://127.0.0.1:8788/index.html?elder17097=1',{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForFunction(()=>!!window.EARTHLINE_ELDER_TREES_V1_17097,{timeout:15000});
await page.waitForTimeout(1200);

const audit=await page.evaluate(()=>({
  owner:!!window.EARTHLINE_ELDER_TREES_V1_17097,
  manifest:window.EARTHLINE_ELDER_TREES_V1_17097?.manifest||null,
  rechargeWeight:window.EARTHLINE_ELDER_TREES_V1_17097?.rechargeWeight,
  searchOrb:!!document.querySelector('#runBtn svg use[href="#orb"]'),
  searchInput:!!document.getElementById('searchInput'),
  docWidth:document.documentElement.scrollWidth,
  viewportWidth:innerWidth
}));
console.log('EARTHLINE_ELDER_FULLPAGE_17097 '+JSON.stringify(audit));
console.log('EARTHLINE_ELDER_FULLPAGE_ERRORS '+JSON.stringify(pageErrors));
const pass=audit.owner&&audit.manifest==='data/elder-trees/v1/manifest.json'&&audit.rechargeWeight===0&&audit.searchInput&&audit.searchOrb&&audit.docWidth<=audit.viewportWidth+2&&pageErrors.length===0;
await browser.close();
server.kill('SIGTERM');
if(!pass)process.exitCode=1;
