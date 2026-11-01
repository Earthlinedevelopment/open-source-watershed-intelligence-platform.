import {chromium} from 'playwright';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const chrome=['/usr/bin/google-chrome-stable','/usr/bin/google-chrome','/usr/bin/chromium','/usr/bin/chromium-browser'].find(fs.existsSync);
if(!chrome)throw new Error('system Chrome missing');
const root=process.cwd();
const server=http.createServer((req,res)=>{
  try{
    const u=new URL(req.url,'http://127.0.0.1:8000');
    let rel=decodeURIComponent(u.pathname);if(rel==='/'||!rel)rel='/index.html';
    const file=path.join(root,rel.replace(/^\/+/,''));const data=fs.readFileSync(file);
    const ext=path.extname(file).toLowerCase(),types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
    res.writeHead(200,{'Content-Type':types[ext]||'application/octet-stream'});res.end(data);
  }catch(e){res.writeHead(404);res.end('not found')}
});
await new Promise(r=>server.listen(8000,'127.0.0.1',r));
const base='http://127.0.0.1:8000/';
const browser=await chromium.launch({headless:true,executablePath:chrome,args:['--no-sandbox']});
const page=await browser.newPage({viewport:{width:1440,height:900}});
await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
await page.waitForTimeout(700);
const out={};
for(const q of ['California','Texas','Arizona','Vermont']){
  const before=await page.evaluate(()=>String((window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147)?.runToken||''));
  await page.locator('#searchInput').fill(q);
  await page.evaluate(()=>window.earthlineRunAnalysis?.({preventDefault(){},stopPropagation(){},stopImmediatePropagation(){}}));
  await page.waitForFunction(prev=>{const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147;return !!d&&String(d.runToken||'')!==String(prev||'')&&String(document.documentElement.dataset.earthlineRunState||'')==='published';},before,{timeout:90000});
  await page.waitForTimeout(120);
  out[q]=await page.evaluate(()=>{
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147,a=window.EARTHLINE_STANDARD_AUDIT_16784||null,fs=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020?.swales?.features||[],g=window.EARTHLINE_STATEWIDE_SUPERTILE_16839||null;
    const c=a?.rankedCauses?.find(x=>x.id==='candidate-generation')?.metrics||{},land=a?.rankedCauses?.find(x=>x.id==='land-water-exclusions')?.metrics||{};
    return {swales:Number(d?.derived?.swaleOpportunityLines||0),rendered:document.querySelectorAll('#earthlineRegionalVectorOverlay16020 [data-layer="swale-opportunities"] path').length,maxSlope:Math.max(0,...fs.map(f=>Number(f?.properties?.slope_pct)||0)),candidateCells:Number(c.candidateCells||0),missing:Number(c.missingCandidateCells||0),unsafe:Number(land.unsafeSegments||0),groupAdded:Number(g?.added||0)};
  });
}
console.log('M83_LOCAL_BOUNDARY_RESULT '+JSON.stringify(out));
for(const [q,r] of Object.entries(out)){if(r.swales<1||r.rendered<1||r.maxSlope>4||r.unsafe!==0)throw new Error(q+' safety/output failure');}
await browser.close();
await new Promise(r=>server.close(r));
