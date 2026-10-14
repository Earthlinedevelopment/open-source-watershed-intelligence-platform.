import { chromium } from 'playwright';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve, extname } from 'node:path';
const BASE='https://earthlinedevelopment.org/',ROOT=process.cwd();
const MIME={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.geojson':'application/json','.py':'text/plain'};
const T={lat:37.41924,lng:-119.30853};
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1908,height:882}});
await page.route('https://earthlinedevelopment.org/**',async route=>{
 const u=new URL(route.request().url());let rel=decodeURIComponent(u.pathname.replace(/^\/+/,''))||'index.html';if(rel.endsWith('/'))rel+='index.html';
 const local=resolve(ROOT,rel);if(local.startsWith(ROOT)&&existsSync(local)&&statSync(local).isFile())return route.fulfill({status:200,body:readFileSync(local),headers:{'content-type':MIME[extname(local)]||'application/octet-stream','cache-control':'no-store'}});
 return route.continue();
});
await page.goto(BASE+'?diag17176='+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
await page.waitForSelector('#searchInput',{timeout:20000});
const input=page.locator('#searchInput');await input.fill('California');await page.waitForTimeout(900);
const opt=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible').first();await opt.click();await page.waitForTimeout(200);await page.locator('#runBtn').click();
await page.waitForFunction(()=>/screening published\./i.test(String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'')),{timeout:45000});
const hint=page.locator('#earthlineCrosshairMoveHint17093');if(await hint.isVisible()){const b=hint.getByRole('button',{name:/got it|dismiss/i});if(await b.count())await b.click()}
await page.evaluate(({lng,lat})=>{const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);m.jumpTo({center:[lng,lat],zoom:16.5})},T);
await page.waitForTimeout(900);
const canvas=page.locator('.mapboxgl-canvas'),box=await canvas.boundingBox();const x=box.x+box.width*.7,y=box.y+box.height*.6;await page.mouse.move(x,y);await page.mouse.down();await page.mouse.move(x-5,y+2,{steps:4});await page.mouse.up();await page.waitForTimeout(500);
const btn=page.locator('#earthlineDeclareProperty16169');const pre=await page.evaluate(()=>Number(window.EARTHLINE_PROPERTY_RUN_AUDIT_16173?.serial||0));await btn.click();
await page.waitForFunction(({pre})=>{const a=window.EARTHLINE_PROPERTY_RUN_AUDIT_16173;return a?.settled===true&&Number(a.serial||0)>pre},{pre},{timeout:45000});
await page.waitForFunction(()=>window.EARTHLINE_ELDER_TREE_LAST_17097?.state==='committed'&&Number(window.EARTHLINE_ELDER_TREE_LAST_17097?.featureCount||0)>0,{timeout:60000,polling:200});
for(const ms of [0,100,300,700,1500,3000]){
 if(ms)await page.waitForTimeout(ms-(ms===100?0:ms===300?100:ms===700?300:ms===1500?700:1500));
 const d=await page.evaluate(()=>{
   const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null),id='earthline-elder-tree-points-17097',src='earthline-elder-trees-17097';
   const layer=m?.getLayer?.(id)||null,source=m?.getSource?.(src)||null,style=m?.getStyle?.()||null;
   const data=source?._data||source?._options?.data||null,coords=(data?.features||[]).map(f=>f.geometry?.coordinates).filter(Boolean);
   const projected=coords.slice(0,6).map(c=>{const p=m.project(c);return [p.x,p.y]});
   let rendered=0,sourceFeatures=0;
   try{const r=m.getCanvas().getBoundingClientRect();rendered=m.queryRenderedFeatures([[0,0],[r.width,r.height]],{layers:[id]}).length}catch(_){}
   try{sourceFeatures=m.querySourceFeatures(src).length}catch(_){}
   return {zoom:m?.getZoom?.(),center:m?.getCenter?.(),layerExists:!!layer,visibility:layer?.layout?.visibility||m?.getLayoutProperty?.(id,'visibility'),sourceExists:!!source,dataCount:coords.length,sourceFeatures,rendered,isStyleLoaded:m?.isStyleLoaded?.(),projected,styleIndex:(style?.layers||[]).findIndex(l=>l.id===id),layerCount:(style?.layers||[]).length};
 });
 console.log('ELDER_RENDER_DIAG '+ms+' '+JSON.stringify(d));
}
await browser.close();
