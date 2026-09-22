import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16801-fine-success-anchor';
mkdirSync(OUT,{recursive:true});

const BASELINE={
  Arkansas:{candidate:0.7391,selected:0.6069},
  Oklahoma:{candidate:0.5270,selected:0.4783},
  Maryland:{candidate:0.2946,selected:0.2713},
  Florida:{candidate:0.9024,selected:0.8293},
  Colorado:{candidate:0.9706,selected:0.7798}
};

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    const oldBx="const bx=Math.max(0,Math.min(11,Math.floor(Number(g.x)*12/Math.max(1,hy.w))));";
    const newBx="const bx=Math.max(0,Math.min(23,Math.floor(Number(g.x)*24/Math.max(1,hy.w))));";
    const oldBy="const by=Math.max(0,Math.min(11,Math.floor(Number(g.y)*12/Math.max(1,hy.h))));";
    const newBy="const by=Math.max(0,Math.min(23,Math.floor(Number(g.y)*24/Math.max(1,hy.h))));";
    if(body.split(oldBx).length-1!==1||body.split(oldBy).length-1!==1)throw new Error('fine anchor key owner not found');
    body=body.replace(oldBx,newBx).replace(oldBy,newBy);

    const oldFixed="        if(!focusMode)noteAnchor16786(anchorKey16786(coords,idx));\n        const c=sampleSegment(coords,idx,false);if(c)candidates.push(c);";
    const newFixed="        const fixedKey16801=!focusMode?anchorKey16786(coords,idx):null;\n        const c=sampleSegment(coords,idx,false);\n        if(c){candidates.push(c);if(!focusMode)noteAnchor16786(fixedKey16801);}";
    if(body.split(oldFixed).length-1!==1)throw new Error('fixed-anchor owner not found');
    body=body.replace(oldFixed,newFixed);

    const oldSupp="          if((regionalAnchorAttempts16786.get(key)||0)>=2)continue;\\n          noteAnchor16786(key);supplementalAnchorAttempts16786++;\\n          const c=sampleSegment(coords,idx,false);\\n          if(c){c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;}";
    const newSupp="          if((regionalAnchorAttempts16786.get(key)||0)>=1)continue;\\n          supplementalAnchorAttempts16786++;\\n          const c=sampleSegment(coords,idx,false);\\n          if(c){noteAnchor16786(key);c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;}";
    if(body.split(oldSupp).length-1!==1)throw new Error('supplemental-anchor owner not found');
    body=body.replace(oldSupp,newSupp);

    const oldRule="rule:'preserve existing fixed anchors, then give each 12x12 contour cell up to two total real makeSwales sample attempts; capacity and science gates unchanged',";
    const newRule="rule:'preserve existing fixed anchors, then give each 24x24 contour cell up to one successful real makeSwales candidate; failed samples do not consume the cell quota; capacity and science gates unchanged',";
    if(body.split(oldRule).length-1!==1)throw new Error('anchor audit rule owner not found');
    body=body.replace(oldRule,newRule);

    const genAudit="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    if(body.split(genAudit).length-1!==1)throw new Error('generation audit owner not found');
    body=body.replace(genAudit,"window.__EARTHLINE_M46_16801_CHAIN={hy,candidates,chosen};"+genAudit);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;
  const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16801='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;
      i.dispatchEvent(new Event('input',{bubbles:true}));
      i.dispatchEvent(new Event('change',{bubbles:true}));
      b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16801_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:60000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const {hy,candidates,chosen}=window.__EARTHLINE_M46_16801_CHAIN;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const anchor=window.EARTHLINE_SPATIAL_ANCHOR_AUDIT_16786||null;

    const nx=24,ny=24;
    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
    const [w,s,e,n]=hy.bounds;
    const toGrid=ll=>{
      if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;
      const lng=Number(ll[0]),lat=Number(ll[1]);
      if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };
    const bins=[];
    for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0});
    const binAt=(x,y)=>{
      const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
      const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
      return bins[by*nx+bx];
    };
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;
      if(hy.validityMask16584?.[i]!==1)continue;
      const b=binAt(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opp++;
    }
    const qualified=new Set(bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18).map(b=>b.bx+','+b.by));

    const footprint=c=>{
      const out=new Set(),seg=Array.isArray(c?.segment)?c.segment:null;
      if(!seg||!seg.length)return out;
      let prev=null;
      for(const ll of seg){
        const g=toGrid(ll);if(!g)continue;
        const mark=(x,y)=>{const b=binAt(x,y),k=b.bx+','+b.by;if(qualified.has(k))out.add(k);};
        mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
        }
        prev=g;
      }
      return out;
    };

    const cand=new Set(),sel=new Set();
    for(const c of candidates||[])for(const k of footprint(c))cand.add(k);
    for(const c of chosen||[])for(const k of footprint(c))sel.add(k);
    const q=[...qualified];

    return {
      candidates:(candidates||[]).length,
      chosen:(chosen||[]).length,
      qualified:q.length,
      candidateCoverable:cand.size,
      selectedCovered:sel.size,
      candidateCoverageRatio:q.length?Number((cand.size/q.length).toFixed(4)):null,
      selectedCoverageRatio:q.length?Number((sel.size/q.length).toFixed(4)):null,
      noCandidateCount:q.filter(k=>!cand.has(k)).length,
      selectionMissCount:q.filter(k=>cand.has(k)&&!sel.has(k)).length,
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip?.swales??null,
      supplementalAttempts:anchor?.supplementalAttempts??null,
      supplementalCandidates:anchor?.supplementalCandidates??null
    };
  });

  const base=BASELINE[query];
  const row={
    query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,
    deltaCandidate:audit?Number((audit.candidateCoverageRatio-base.candidate).toFixed(4)):null,
    deltaSelected:audit?Number((audit.selectedCoverageRatio-base.selected).toFixed(4)):null
  };
  rows.push(row);
  console.log('EARTHLINE_M46_16801 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  await context.close();
}

await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));

const bad=rows.filter(r=>
  r.loadError||r.timedOut||r.pageErrors.length||!r.audit||
  Number(r.audit.coreMs)>15000||
  Number(r.audit.generated)!==Number(r.audit.visible)||
  Number(r.audit.unsafe)!==0||
  Number(r.audit.outside||0)!==0
);
console.log('EARTHLINE_M46_16801_SUMMARY '+JSON.stringify(rows));
if(bad.length)process.exitCode=1;
