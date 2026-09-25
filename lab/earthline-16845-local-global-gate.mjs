import { chromium } from 'playwright';
import fs from 'node:fs';
const URL=process.env.EARTHLINE_URL||'http://127.0.0.1:8787/';
const TARGETS=(process.env.TARGETS||'Singapore|India|Australia|Indonesia|Philippines|Brunei|Cabo Verde|Comoros|Mauritius|Seychelles|Arkansas|Hawaii').split('|');
const MANUAL={
  'Singapore':{lat:1.3521,lng:103.8198,bbox:[103.55,1.15,104.1,1.5],placeType:'country',countryCode:'sg',name:'Singapore',label:'Singapore'},
  'India':{lat:20.5937,lng:78.9629,bbox:[68,6,97.5,37.5],placeType:'country',countryCode:'in',name:'India',label:'India'},
  'Australia':{lat:-25.2744,lng:133.7751,bbox:[112,-44,154,-10],placeType:'country',countryCode:'au',name:'Australia',label:'Australia'},
  'Indonesia':{lat:-0.7893,lng:113.9213,bbox:[95,-11,141,6],placeType:'country',countryCode:'id',name:'Indonesia',label:'Indonesia'},
  'Philippines':{lat:12.8797,lng:121.774,bbox:[116,4,127,21],placeType:'country',countryCode:'ph',name:'Philippines',label:'Philippines'},
  'Brunei':{lat:4.5353,lng:114.7277,bbox:[114,4,115.4,5.2],placeType:'country',countryCode:'bn',name:'Brunei',label:'Brunei'},
  'Cabo Verde':{lat:15.1201,lng:-23.6052,bbox:[-25.5,14.5,-22.5,17.5],placeType:'country',countryCode:'cv',name:'Cabo Verde',label:'Cabo Verde'},
  'Comoros':{lat:-11.6455,lng:43.3333,bbox:[43,-13,44.7,-11],placeType:'country',countryCode:'km',name:'Comoros',label:'Comoros'},
  'Mauritius':{lat:-20.3484,lng:57.5522,bbox:[56.5,-21.5,64,-10],placeType:'country',countryCode:'mu',name:'Mauritius',label:'Mauritius'},
  'Seychelles':{lat:-4.6796,lng:55.492,bbox:[46,-10,57,0],placeType:'country',countryCode:'sc',name:'Seychelles',label:'Seychelles'}
};
const browser=await chromium.launch({headless:true});
const rows=[];
for(const target of TARGETS){
  const page=await browser.newPage({viewport:{width:1600,height:900}});
  let error=null;
  try{
    await page.goto(URL+'?gate16845='+encodeURIComponent(target)+'-'+Date.now(),{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    if(MANUAL[target]){
      await page.waitForFunction(()=>typeof window.__EARTHLINE_REGIONAL_TEST_HOOKS_16147?.setDevPreset16845==='function',{timeout:30000});
      await page.evaluate(({q,loc})=>window.__EARTHLINE_REGIONAL_TEST_HOOKS_16147.setDevPreset16845(q,loc),{q:target,loc:MANUAL[target]});
    }
    await page.evaluate(q=>{window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970=null;const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},target);
    await page.waitForFunction(q=>{const e=window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970,d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970;return !!e||String(d?.query||'').toLowerCase()===String(q).toLowerCase();},target,{timeout:95000,polling:100});
    await page.waitForTimeout(500);
    error=await page.evaluate(()=>window.EARTHLINE_LAST_LIVE_REGIONAL_ERROR_15970||null);
  }catch(e){error=String(e?.message||e);}
  const snap=await page.evaluate(()=>{
    const pkg=window.EARTHLINE_ACTIVE_JURISDICTION_PACKAGE_16556||null;
    const cp=window.EARTHLINE_LAST_ATOMIC_COUNTRY_PACKAGE_16845||null;
    const sp=window.EARTHLINE_LAST_ATOMIC_STATE_PACKAGE_16556||null;
    const b=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_LAST_LIVE_REGIONAL_RUN_15970||null;
    const disp=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    return {active:pkg?{build:pkg.build,packageKind:pkg.packageKind||null,profileId:pkg.profileId,countryCode:pkg.countryCode||pkg.identity?.countryCode||null,capability:pkg.boundary?.capability||null,extent:pkg.regionalExtent?.bbox||null}:null,
      country:cp?{label:cp.boundary?.label,code:cp.countryCode,capability:cp.boundary?.capability,extent:cp.regionalExtent?.bbox}:null,
      state:sp?{profileId:sp.profileId,build:sp.build,capability:sp.boundary?.capability}:null,
      boundary:b?{passed:b.passed,capability:b.capability||b.boundaryCapability||null,outside:b.outsideJurisdiction??b.outsideCount??null}:null,
      publication:pub?{generated:Number(pub.generated??0),visible:Number(pub.visible??pub.displayed??pub.generated??0),outside:Number(pub.outsideJurisdiction??pub.outside??0),unsafe:Number(pub.unsafe??pub.unsafeDisplayedSegments??0)}:null,
      display:disp?{swales:Number(disp.swaleLines??0),waterPaths:Number(disp.waterPaths??0),arrows:Number(disp.directionArrows??0)}:null,
      performance:perf?Number(perf.totalMs||0):null,displayed:d?{query:d.query,bounds:d.bounds||d.bbox||null}:null};
  }).catch(e=>({probeError:String(e?.message||e)}));
  try{await page.screenshot({path:'gate-16845-'+target.toLowerCase().replace(/[^a-z0-9]+/g,'-')+'.jpg',type:'jpeg',quality:45});}catch{}
  const row={target,error,snap};rows.push(row);console.log(JSON.stringify(row));await page.close();
}
await browser.close();
fs.writeFileSync('gate-16845.json',JSON.stringify(rows,null,2));
console.log(JSON.stringify({summary:rows.map(r=>({target:r.target,error:!!r.error,active:r.snap?.active,performance:r.snap?.performance,publication:r.snap?.publication,display:r.snap?.display}))}));
