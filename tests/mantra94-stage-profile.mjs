import {chromium} from 'playwright';
import {existsSync,statSync,readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
const BASE='https://earthlinedevelopment.org/',ROOT=process.cwd();
mkdirSync('artifacts/m94-stages',{recursive:true});
const browser=await chromium.launch({headless:true});
for(const state of ['New York','Arizona','Texas']){
  const context=await browser.newContext({viewport:{width:1600,height:950}});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
  await page.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.origin!==new URL(BASE).origin)return route.continue();
    let rel;try{rel=decodeURIComponent(u.pathname).replace(/^\/+/,'')||'index.html'}catch{return route.abort()}
    const p=path.resolve(ROOT,rel);if(p!==ROOT&&!p.startsWith(ROOT+path.sep))return route.abort();
    if(existsSync(p)&&statSync(p).isFile()){
      const ext=path.extname(p).toLowerCase();
      const types={'.html':'text/html; charset=utf-8','.js':'application/javascript','.mjs':'application/javascript','.json':'application/json','.geojson':'application/geo+json','.png':'image/png','.css':'text/css'};
      return route.fulfill({status:200,contentType:types[ext]||'application/octet-stream',body:readFileSync(p)});
    }
    return route.continue();
  });
  let out;
  try{
    await page.goto(BASE+'?m94_stage='+encodeURIComponent(state)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:50000});
    await page.waitForSelector('#searchInput',{timeout:20000});
    const begin=Date.now();
    await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},state);
    let timeout=null;
    try{await page.waitForFunction(()=>!!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||!!window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.runToken,null,{timeout:100000,polling:150})}catch(e){timeout=String(e)}
    out=await page.evaluate(()=>({
      phases:window.EARTHLINE_REGIONAL_PERFORMANCE_16191?.phaseTotalsMs||null,
      trace:window.EARTHLINE_M94_STAGE_TRACE||null,
      gate:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
      error:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,
      audits:Object.fromEntries(Object.entries(window).filter(([k,v])=>/^EARTHLINE_/.test(k)&&v&&typeof v==='object'&&typeof v.elapsedMs==='number').map(([k,v])=>[k,{elapsedMs:v.elapsedMs,added:v.added,selected:v.selectedTiles?.length||v.selected?.length||null}]))
    }));
    out={state,wallMs:Date.now()-begin,...out,timeout,errors};
  }catch(e){out={state,error:String(e),errors}}
  console.log('M94_STAGE_PROFILE '+JSON.stringify(out));
  writeFileSync('artifacts/m94-stages/'+state.toLowerCase().replace(/\s+/g,'-')+'.json',JSON.stringify(out,null,2));
  await context.close();
}
await browser.close();