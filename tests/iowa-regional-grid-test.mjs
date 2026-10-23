import { chromium } from 'playwright';
import fs from 'node:fs';

const base=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const browser=await chromium.launch({headless:true,channel:'chrome'});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
const errors=[]; page.on('pageerror',e=>errors.push(String(e)));

await page.goto(base+'?iowa-grid-test='+Date.now(),{waitUntil:'domcontentloaded',timeout:90000});
await page.waitForSelector('#searchInput',{timeout:30000});
await page.waitForFunction(()=>window.earthlineMap||(typeof earthlineMap!=='undefined'&&earthlineMap),null,{timeout:30000,polling:100});

const input=page.locator('#searchInput');
await input.fill('Iowa');
await page.waitForTimeout(900);
const opts=page.locator('#earthlineSearchSuggestions15970 [role="option"]:visible');
if(await opts.count()) await opts.first().click({force:true}); else await input.press('Enter').catch(()=>{});
await page.waitForTimeout(250);

const started=Date.now();
await page.locator('#runBtn').click({force:true});

let settled=false;
try{
  await page.waitForFunction(()=>{
    const st=window.earthlineRegional15778||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
    const tier=String(d&&(d.tier||d.mode)||'').toLowerCase();
    return st && st.running===false && tier==='regional' && document.getElementById('runBtn')?.getAttribute('aria-busy')!=='true';
  },null,{timeout:90000,polling:250});
  settled=true;
}catch(_){}

await page.waitForTimeout(800);
const diag=await page.evaluate(()=>{
  const st=window.earthlineRegional15778||null;
  const tiles=(st?.tiles||[]).map(t=>({row:t.row,col:t.col,lat:t.lat,lng:t.lng,status:t.status}));
  const completed=tiles.filter(t=>t.status==='complete').length;
  const withheld=tiles.filter(t=>t.status==='withheld').length;
  const uniqueRows=[...new Set(tiles.map(t=>t.row))].sort();
  const uniqueCols=[...new Set(tiles.map(t=>t.col))].sort();
  const opp=st?.opportunityLines?.features||[];
  const mids=opp.map(f=>{
    const c=f?.geometry?.coordinates||[];
    const p=c[Math.floor(c.length/2)]||c[0]||[];
    return [Number(p[0]),Number(p[1])];
  }).filter(p=>p.every(Number.isFinite));
  const lons=mids.map(p=>p[0]),lats=mids.map(p=>p[1]);
  const spread=mids.length?{
    minLng:Math.min(...lons),maxLng:Math.max(...lons),
    minLat:Math.min(...lats),maxLat:Math.max(...lats),
    lngSpan:Math.max(...lons)-Math.min(...lons),
    latSpan:Math.max(...lats)-Math.min(...lats)
  }:null;
  return {
    running:st?.running,
    mode:st?.mode,
    tileCount:tiles.length,completed,withheld,uniqueRows,uniqueCols,tiles,
    opportunityCount:opp.length,
    rawCorridorCount:Array.isArray(st?.rawCorridors)?st.rawCorridors.length:null,
    spread,
    summary:st?.summary||null,
    performance:window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,
    displayed:window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null,
    busy:document.getElementById('runBtn')?.getAttribute('aria-busy')
  };
});
diag.settled=settled;diag.elapsedMs=Date.now()-started;diag.errors=errors;
fs.writeFileSync('iowa-regional-grid-test.json',JSON.stringify(diag,null,2));
await page.screenshot({path:'iowa-regional-grid-test.png',fullPage:false});
console.log('EARTHLINE_IOWA_GRID_TEST '+JSON.stringify(diag));

if(!settled) throw new Error('Iowa Regional did not settle');
if(diag.tileCount!==9) throw new Error('Expected 9 statewide tiles, got '+diag.tileCount);
if(diag.uniqueRows.length!==3||diag.uniqueCols.length!==3) throw new Error('Expected 3x3 tile plan');
if(diag.withheld!==0) throw new Error('Withheld tiles='+diag.withheld);
if(diag.completed!==9) throw new Error('Completed tiles='+diag.completed);
if(!(diag.opportunityCount>0)) throw new Error('No Regional opportunity corridors published');

await browser.close();