import { chromium } from 'playwright';
const URL='https://earthlinedevelopment.org/';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1800,height:1000}});
let expandPatch=0,resPatch=0,tilePatch=0;
await page.route('**/*',async route=>{
 if(route.request().resourceType()!=='document')return route.continue();
 const resp=await route.fetch();let body=await resp.text();
 const a=`const tileResults16702=await Promise.all(tiles16702.map(async tile16702=>{`;
 const ar=`const tilesMulti16711=tiles16702.flatMap(t16711=>[Object.assign({},t16711,{baseId16711:t16711.id,res16711:112,id:t16711.id+'-r112'}),Object.assign({},t16711,{baseId16711:t16711.id,res16711:96,id:t16711.id+'-r96'})]);\n        const tileResults16702=await Promise.all(tilesMulti16711.map(async tile16702=>{`;
 expandPatch=body.split(a).length-1;if(expandPatch!==1)throw new Error('expand anchor '+expandPatch);body=body.replace(a,ar);
 const b=`const d16702=await loadDEM(tile16702.b,112,112,6000,'scale refinement '+tile16702.id)`;
 const br=`const d16702=await loadDEM(tile16702.b,tile16702.res16711,tile16702.res16711,6000,'scale refinement '+tile16702.id)`;
 resPatch=body.split(b).length-1;if(resPatch!==1)throw new Error('res anchor '+resPatch);body=body.replace(b,br);
 const c=`tile16702:tile16702.id`;
 const cr=`tile16702:(tile16702.baseId16711||tile16702.id)`;
 tilePatch=body.split(c).length-1;if(tilePatch<1)throw new Error('tile anchor '+tilePatch);body=body.split(c).join(cr);
 return route.fulfill({response:resp,body});
});
await page.goto(URL+'?tx_multi_resolution='+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
await page.waitForSelector('#searchInput',{timeout:30000});
const rows=[];
for(let repeat=1;repeat<=3;repeat++){
 const prior=await page.evaluate(()=>String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||'')),started=Date.now();
 await page.evaluate(()=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value='Texas';i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();});
 let timedOut=false;try{await page.waitForFunction(prev=>{const at=String(window.EARTHLINE_SWALE_GENERATION_AUDIT_16167?.at||''),s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||'');return !!window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||((!prev||at!==prev)&&/screening published\./i.test(s));},prior,{timeout:55000,polling:100});}catch(_){timedOut=true;}
 await page.waitForTimeout(400);
 const snap=await page.evaluate(()=>{const v=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,sw=Array.isArray(v?.swales?.features)?v.swales.features:[],mid=f=>{const c=f?.geometry?.coordinates||[];return c.length?c[Math.floor((c.length-1)/2)]:null;},count=pred=>sw.reduce((n,f)=>{const m=mid(f);return n+(Array.isArray(m)&&pred(+m[0],+m[1])?1:0);},0),d=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||null,g=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,p=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;return {swales:sw.length,visible:d?.swaleLines??null,published:g?.publishedFeatures??null,totalMs:p?.totalMs??null,candidates:g?.candidates??null,eligible:g?.jurisdictionEligibleCandidates??null,input:window.EARTHLINE_SCALE_REFINED_INPUT_16702||null,selection:window.EARTHLINE_REFINED_SELECTION_16702||null,unsafe:flow?.unsafeSegments??null,outside:b?.outsideAfterClip??null,lastError:window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null,zones:{panhandle:count((x,y)=>x>-103.1&&x<-100&&y>35&&y<36.6),upperGulf:count((x,y)=>x>-96.5&&x<-93.45&&y>28.8&&y<31.2),midGulf:count((x,y)=>x>-99.3&&x<-96&&y>27.4&&y<30.2),lowerGulf:count((x,y)=>x>-99.5&&x<-97&&y>25.7&&y<28.2),east:count((x,y)=>x>-96&&x<-93.45&&y>30.5&&y<34.3)}};});
 const row={repeat,elapsedMs:Date.now()-started,timedOut,expandPatch,resPatch,tilePatch,snap};rows.push(row);console.log('EARTHLINE_TX_MULTI_RES '+JSON.stringify(row));
}
console.log('EARTHLINE_TX_MULTI_RES_SUMMARY '+JSON.stringify(rows));
await browser.close();
if(rows.some(r=>r.timedOut||r.snap.lastError||Number(r.snap.unsafe||0)!==0||Number(r.snap.outside?.swales||0)!==0||Number(r.snap.visible)!==Number(r.snap.published)||!(Number(r.snap.totalMs)<=15000)))process.exitCode=1;