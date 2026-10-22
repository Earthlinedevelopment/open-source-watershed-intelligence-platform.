import { chromium } from 'playwright';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});
const errs=[]; page.on('pageerror',e=>errs.push(String(e)));
await page.goto('http://127.0.0.1:8787/?quick='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:20000,polling:100});
await page.locator('#searchInput').fill('Iowa'); await page.waitForTimeout(700);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await page.locator('#searchInput').press('Enter').catch(()=>{});
await page.waitForTimeout(150);
const t0=Date.now(); await page.locator('#runBtn').click({force:true});
const snaps=[];
for(let sec=0;sec<=35;sec+=5){
  if(sec) await page.waitForTimeout(5000);
  const s=await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const m=(typeof M!=='undefined'?M:null);
    const pick={};
    if(m) for(const k of Object.keys(m).filter(k=>/region|swale|tile|phase|substage|terrain|tree|forest|canopy|coverage|budget|deadline|progress/i.test(k))){
      const v=m[k];
      if(Array.isArray(v)||ArrayBuffer.isView(v)) pick[k]={type:'array',length:v.length};
      else if(v&&typeof v==='object'){try{pick[k]={type:'object',value:JSON.parse(JSON.stringify(v))}}catch(_){}}
      else if(['string','number','boolean'].includes(typeof v)) pick[k]={type:typeof v,value:v};
    }
    return {
      busy:document.getElementById('runBtn')?.getAttribute('aria-busy'),
      displayed:d,
      status:document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('status')?.textContent||'',
      model:pick
    };
  });
  snaps.push({sec,...s});
  const tier=String(s.displayed&&(s.displayed.tier||s.displayed.mode)||'').toLowerCase();
  if(tier==='regional'&&s.busy!=='true')break;
}
console.log('EARTHLINE_QUICK_IOWA '+JSON.stringify({elapsedMs:Date.now()-t0,snaps,errs}));
await browser.close();