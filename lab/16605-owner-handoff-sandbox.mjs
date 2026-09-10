import { chromium } from 'playwright';
import fs from 'node:fs/promises';

const URL='https://earthlinedevelopment.org/';
const HISTORIC_16605='https://raw.githubusercontent.com/Earthlinedevelopment/open-source-watershed-intelligence-platform./618aeb8207e5f08329dfceb71172f0ad451d8f6a/index.html';

async function fetchText(url){
  const r=await fetch(url+(url.includes('?')?'&':'?')+'earthline-sandbox='+Date.now(),{headers:{'cache-control':'no-cache'}});
  if(!r.ok)throw new Error(`fetch failed ${r.status} ${url}`);
  return r.text();
}

const baseline=await fetchText(URL);
if(!baseline.includes('lineSafe16584(retrySmooth16584)'))throw new Error('16603 public source missing');
if(baseline.includes('EARTHLINE 16605'))throw new Error('public rollback unexpectedly contains 16605');

const historic=await fetchText(HISTORIC_16605);
if(!historic.includes("const minSpan16605=pt==='country'?.02:1.8;"))throw new Error('exact historical 16605 marker missing');
if(!historic.includes('lineSafe16584(retrySmooth16584)'))throw new Error('historical 16605 does not retain 16603');

const settleNeedle=`  async function settleRegionalCamera(m,b,runToken){\n    if(!isCurrentRun(runToken))return false;\n    if(!m)return;`;
if(!historic.includes(settleNeedle))throw new Error('settle owner source not found in historical 16605');
const handoff=historic.replace(settleNeedle,`  async function settleRegionalCamera(m,b,runToken){\n    if(!isCurrentRun(runToken))return false;\n    if(!m)return;\n    /* SANDBOX ONLY — explicit handoff from search framing to existing Regional camera owner. */\n    earthlineCancelSearchCameraLock();`);

const TARGETS=[
 {name:'Barbados',type:'country'},
 {name:'Portugal',type:'country'},
 {name:'Peru',type:'country'},
 {name:'Thailand',type:'country'},
 {name:'New Zealand',type:'country'},
 {name:'Tuvalu',type:'country'},
 {name:'Canada',type:'country'},
 {name:'Vermont',type:'region'}
];

function expectedBounds(loc,variant){
  if(!loc)return null;
  const n=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
  const lat=n(loc.lat,0),lng=n(loc.lng,0);
  let b=Array.isArray(loc.bbox)&&loc.bbox.length===4?loc.bbox.map(Number):null;
  const pt=String(loc.placeType||'').toLowerCase();
  const focusMode=loc.focusMode===true;
  const locked=!!(loc.analysisBBox&&b);
  if(!b||(!locked&&(pt==='place'||pt==='locality'||pt==='district'||pt==='region'))){
    const halfLat=2.25,halfLng=2.25/Math.max(0.35,Math.cos(lat*Math.PI/180));
    b=[lng-halfLng,lat-halfLat,lng+halfLng,lat+halfLat];
  }
  let w=b[2]-b[0],h=b[3]-b[1];
  if(!focusMode){
    const minSpan=variant==='baseline'?1.8:(pt==='country'?.02:1.8);
    if(w<minSpan){const d=(minSpan-w)/2;b[0]-=d;b[2]+=d;}
    if(h<minSpan){const d=(minSpan-h)/2;b[1]-=d;b[3]+=d;}
    w=b[2]-b[0];h=b[3]-b[1];
  }else{
    const minSpan=.004;
    if(w<minSpan){const d=(minSpan-w)/2;b[0]-=d;b[2]+=d;}
    if(h<minSpan){const d=(minSpan-h)/2;b[1]-=d;b[3]+=d;}
    w=b[2]-b[0];h=b[3]-b[1];
  }
  if(w>18){const c=variant==='baseline'?(b[0]+b[2])/2:(pt==='country'&&Number.isFinite(lng)?lng:(b[0]+b[2])/2);b[0]=c-9;b[2]=c+9;}
  if(h>14){const c=variant==='baseline'?(b[1]+b[3])/2:(pt==='country'&&Number.isFinite(lat)?lat:(b[1]+b[3])/2);b[1]=c-7;b[3]=c+7;}
  b[0]=Math.max(-179.9,b[0]);b[2]=Math.min(179.9,b[2]);b[1]=Math.max(-80,b[1]);b[3]=Math.min(80,b[3]);
  return b;
}

function boundsEqual(a,b){
  return Array.isArray(a)&&Array.isArray(b)&&a.length===4&&b.length===4&&a.every((v,i)=>Math.abs(Number(v)-Number(b[i]))<1e-6);
}

const browser=await chromium.launch({headless:true});

async function runOne(variant,name,type,html){
  const context=await browser.newContext({viewport:{width:1440,height:1000}});
  const page=await context.newPage();
  await page.route('https://earthlinedevelopment.org/**',async route=>{
    const req=route.request();let u;try{u=new URL(req.url())}catch(_){return route.continue()}
    if(req.resourceType()==='document'&&u.hostname==='earthlinedevelopment.org'&&u.pathname==='/'){
      return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:html,headers:{'cache-control':'no-store'}});
    }
    return route.continue();
  });

  let error=null,snap=null;
  try{
    await page.goto(URL+'?candidate='+variant+'-'+encodeURIComponent(name),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    const marker=await page.evaluate(()=>document.documentElement.innerHTML.includes('EARTHLINE 16605'));
    if(variant==='baseline'&&marker)throw new Error('baseline runtime unexpectedly contains 16605');
    if(variant!=='baseline'&&!marker)throw new Error('candidate runtime did not load exact historical 16605 bytes');
    await page.waitForFunction(()=>window.EARTHLINE_LAB_WATER_16601?.installed===true,null,{timeout:20000});
    await page.evaluate(q=>{const i=document.getElementById('searchInput');i.focus();i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));},name);
    await page.waitForSelector('#earthlineSearchSuggestions15970.open button[role="option"]',{timeout:12000});
    const picked=await page.evaluate(({name,type})=>{
      const norm=s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
      const want=type==='country'?/country/i:/state|region/i;
      const opts=[...document.querySelectorAll('#earthlineSearchSuggestions15970 button[role="option"]')];
      const b=opts.find(x=>want.test(x.textContent||'')&&(norm(x.dataset.query||'')===norm(name)||norm(x.textContent||'').includes(norm(name))));
      if(!b)return null;const r={text:(b.textContent||'').trim(),q:b.dataset.query||''};b.click();return r;
    },{name,type});
    if(!picked)throw new Error('selection missing');

    await page.waitForFunction(()=>{
      const ledger=window.EARTHLINE_RUN_LEDGER_16147||[];
      const hasBounds=ledger.some(x=>x&&x.event==='analysis_bounds_locked');
      const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||{};
      const busy=document.getElementById('runBtn')?.disabled;
      return hasBounds&&(/ANALYSIS FAILED|Regional screening published|core preflight incomplete/i.test(s)||(!busy&&/regional/i.test(String(d.tier||d.mode||d.extentClass||''))));
    },null,{timeout:50000,polling:200});
    await page.waitForTimeout(800);

    snap=await page.evaluate(()=>{
      const map=typeof earthlineMap!=='undefined'?earthlineMap:null;
      const canvas=map?.getCanvas?.();const rect=canvas?.getBoundingClientRect?.();
      const style=map?.getStyle?.();const layers=Array.isArray(style?.layers)?style.layers:[];
      let rendered=null;try{rendered=map?.queryRenderedFeatures?.()?.length??null}catch(_){}
      const d=window.EARTHLINE_DISPLAYED_RUN_16151||window.EARTHLINE_DISPLAYED_RUN_16147||null;
      const ca=window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null;
      const fa=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
      const lg=window.EARTHLINE_LAND_VALIDITY_GRID_16584||window.EARTHLINE_LAND_VALIDITY_GRID_AUDIT_16584||null;
      const va=window.EARTHLINE_LAND_VALIDITY_16584||null;
      const loc=(typeof M!=='undefined'&&M.loc)?JSON.parse(JSON.stringify(M.loc)):null;
      const ledger=window.EARTHLINE_RUN_LEDGER_16147||[];
      const boundsRow=[...ledger].reverse().find(x=>x&&x.event==='analysis_bounds_locked')||null;
      const c=map?.getCenter?.();
      return {
        source16605:document.documentElement.innerHTML.includes('EARTHLINE 16605'),
        loc,boundsRow,
        status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'').trim().slice(0,1600),
        displayed:d,cameraAudit:ca,flowAudit:fa,landGrid:lg,landValidity:va,
        map:{exists:!!map,styleLoaded:map?.isStyleLoaded?.()??null,canvas:{w:rect?.width||0,h:rect?.height||0,display:canvas?getComputedStyle(canvas).display:null,visibility:canvas?getComputedStyle(canvas).visibility:null,opacity:canvas?getComputedStyle(canvas).opacity:null},layerCount:layers.length,rendered,center:c?{lng:c.lng,lat:c.lat}:null,zoom:map?.getZoom?.()??null}
      };
    });
  }catch(e){
    error=String(e);
    try{snap=await page.evaluate(()=>({source16605:document.documentElement.innerHTML.includes('EARTHLINE 16605'),loc:(typeof M!=='undefined'&&M.loc)?JSON.parse(JSON.stringify(M.loc)):null,status:String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||''),boundsRow:[...(window.EARTHLINE_RUN_LEDGER_16147||[])].reverse().find(x=>x&&x.event==='analysis_bounds_locked')||null,cameraAudit:window.EARTHLINE_REGIONAL_CAMERA_SETTLE_AUDIT_16334||null,flowAudit:window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null}))}catch(_){}
  }

  const expected=expectedBounds(snap?.loc,variant==='baseline'?'baseline':'16605');
  const actual=snap?.boundsRow?.bounds||null;
  const boundsMatch=boundsEqual(actual,expected);
  const markerMatch=variant==='baseline'?!snap?.source16605:!!snap?.source16605;
  const slug=name.toLowerCase().replace(/[^a-z0-9]+/g,'-');
  await page.screenshot({path:`/tmp/sandbox-${variant}-${slug}.png`,fullPage:true}).catch(()=>{});
  await context.close();

  const published=!!snap&&/Regional screening published/i.test(snap.status||'');
  const mapVisible=!!(snap?.map?.exists&&snap?.map?.canvas?.w>300&&snap?.map?.canvas?.h>250);
  const safe=Number(snap?.flowAudit?.unsafeSegments??snap?.flowAudit?.unsafeDisplayedSegments??0)===0;
  const pass=published&&mapVisible&&safe&&boundsMatch&&markerMatch;
  return {variant,name,type,pass,published,mapVisible,safe,boundsMatch,markerMatch,expectedBounds:expected,actualBounds:actual,error,snap};
}

const rows=[];
for(const [variant,html] of [['baseline',baseline],['historic16605',historic],['historic16605-handoff',handoff]]){
  for(const t of TARGETS)rows.push(await runOne(variant,t.name,t.type,html));
}

const evidence={at:new Date().toISOString(),historicalCommit:'618aeb8207e5f08329dfceb71172f0ad451d8f6a',rows};
await fs.writeFile('/tmp/earthline-16605-owner-handoff-sandbox.json',JSON.stringify(evidence,null,2));
console.log(JSON.stringify(rows.map(r=>({variant:r.variant,name:r.name,pass:r.pass,published:r.published,mapVisible:r.mapVisible,safe:r.safe,boundsMatch:r.boundsMatch,markerMatch:r.markerMatch,expectedBounds:r.expectedBounds,actualBounds:r.actualBounds,error:r.error,status:r.snap?.status,validLand:r.snap?.landGrid?.validLandCellCount,map:r.snap?.map})),null,2));
await browser.close();

const invalid=rows.filter(r=>!r.boundsMatch||!r.markerMatch);
if(invalid.length)throw new Error('sandbox invalid: intended runtime bytes/bounds were not exercised: '+invalid.map(r=>`${r.variant}/${r.name}`).join(', '));
