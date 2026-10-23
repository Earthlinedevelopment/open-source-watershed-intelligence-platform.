import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(BASE+'?active-iowa-render-audit='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(250);
await page.locator('#runBtn').click({force:true});

await page.waitForFunction(()=>{
  const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  return String(d&&(d.tier||d.mode)||'').toLowerCase()==='regional' &&
    document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
},null,{timeout:90000,polling:200});
await page.waitForTimeout(900);

const out=await page.evaluate(()=>{
  const m=window.earthlineMap||(typeof earthlineMap!=='undefined'?earthlineMap:null);
  const displayed=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
  const bounds=displayed?.bounds||null;
  const vis=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
  const swales=vis?.swales?.features||[];
  const mids=[];
  for(const f of swales){
    const g=f?.geometry;
    if(!g||g.type!=='LineString'||!Array.isArray(g.coordinates)||!g.coordinates.length)continue;
    const p=g.coordinates[Math.floor((g.coordinates.length-1)/2)];
    if(Array.isArray(p)&&Number.isFinite(Number(p[0]))&&Number.isFinite(Number(p[1])))mids.push([Number(p[0]),Number(p[1])]);
  }
  const grid=Array.from({length:6},()=>Array(6).fill(0));
  if(bounds&&mids.length){
    const [w,s,e,n]=bounds,dx=(e-w)/6,dy=(n-s)/6;
    for(const [lng,lat] of mids){
      const x=Math.max(0,Math.min(5,Math.floor((lng-w)/dx)));
      const y=Math.max(0,Math.min(5,Math.floor((n-lat)/dy)));
      grid[y][x]++;
    }
  }
  const nonempty=grid.flat().filter(v=>v>0).length;
  const svg=document.getElementById('earthlineRegionalVectorOverlay16020');
  const swaleGroup=svg?.querySelector?.('[data-layer="swale-opportunities"]');
  const allSvgPaths=swaleGroup?[...swaleGroup.querySelectorAll('path')]:[];
  const mapIds=['el-live-swale-halo-15970','el-live-swale-line-15970'];
  let renderedNative=0;
  try{
    const c=m?.getCanvas?.(),box=c&&[[0,0],[c.clientWidth||c.width,c.clientHeight||c.height]];
    if(box)renderedNative=(m.queryRenderedFeatures(box,{layers:mapIds.filter(id=>m.getLayer(id))})||[]).length;
  }catch(_){}
  const src=m?.getSource?.('el-live-swales-15970');
  const srcData=src&&(src._data||src._options?.data);
  return {
    displayed,
    generated:swales.length,
    midpointGrid:grid,
    nonempty6x6Bins:nonempty,
    sourceFeatures:Array.isArray(srcData?.features)?srcData.features.length:null,
    renderedNative,
    svgPathCount:allSvgPaths.length,
    overlayStyle:svg?{display:getComputedStyle(svg).display,visibility:getComputedStyle(svg).visibility,opacity:getComputedStyle(svg).opacity}:null,
    publicationAudit:window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,
    labelAudit:window.EARTHLINE_REGIONAL_CORRIDOR_LABEL_AUDIT_16336||null,
    displayAudit:window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,
    coverageAudit:window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null,
    selectionAudit:window.EARTHLINE_REGIONAL_PUBLICATION_SELECTION_17700||null,
    generationAudit:window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,
    publicationView:window.EARTHLINE_REGIONAL_PUBLICATION_VIEW_16337||null,
    zoom:Number(m?.getZoom?.()||0)
  };
});
out.errors=errors;
fs.writeFileSync('iowa-active-render-audit.json',JSON.stringify(out,null,2));
await page.screenshot({path:'iowa-active-render-audit.png',fullPage:false});
console.log('EARTHLINE_IOWA_ACTIVE_RENDER_AUDIT '+JSON.stringify(out));
await browser.close();