import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16802-coverage-owner-12x12';
mkdirSync(OUT,{recursive:true});

const BASELINE={
  Arkansas:0.6069,
  Oklahoma:0.4783,
  Maryland:0.2713,
  Florida:0.8293,
  Colorado:0.7798
};

const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    const gridOld="const binsX16731=6,binsY16731=6,channel16731=percentile(hy.acc,.972);";
    const gridNew="const binsX16731=12,binsY16731=12,channel16731=percentile(hy.acc,.972);";
    if(body.split(gridOld).length-1!==1)throw new Error('coverage grid owner not found');
    body=body.replace(gridOld,gridNew);

    const highOld="if(preferred16767>=60)return 3;";
    const highNew="if(preferred16767>=15)return 3;";
    const midOld="if(preferred16767>=30)return 2;";
    const midNew="if(preferred16767>=8)return 2;";
    if(body.split(highOld).length-1!==1||body.split(midOld).length-1!==1)throw new Error('density thresholds owner not found');
    body=body.replace(highOld,highNew).replace(midOld,midNew);

    const gapOld="r16731.valid>=45&&r16731.opportunity>=8&&";
    const gapNew="r16731.valid>=12&&r16731.opportunity>=2&&";
    if(body.split(gapOld).length-1!==3)throw new Error('coverage significance predicates not found');
    body=body.split(gapOld).join(gapNew);

    const carryOld="row16749.valid<45||row16749.opportunity<8||";
    const carryNew="row16749.valid<12||row16749.opportunity<2||";
    if(body.split(carryOld).length-1!==1)throw new Error('coverage carry significance owner not found');
    body=body.replace(carryOld,carryNew);

    const genAudit="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    if(body.split(genAudit).length-1!==1)throw new Error('generation capture owner not found');
    body=body.replace(genAudit,"window.__EARTHLINE_M46_16802_CHAIN={hy,candidates,chosen};"+genAudit);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16802='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16802_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:60000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const {hy,chosen}=window.__EARTHLINE_M46_16802_CHAIN;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;
    const gapAudit=window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731||null;
    const gapRefine=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;

    const nx=24,ny=24;
    const vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b);
    const channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity;
    const [w,s,e,n]=hy.bounds;
    const toGrid=ll=>{
      if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;
      const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;
      return {x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)};
    };
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0});
    const binAt=(x,y)=>{
      const bx=Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))));
      const by=Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))));
      return bins[by*nx+bx];
    };
    for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){
      const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;
      const b=binAt(x,y);b.valid++;
      const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);
      if(!Number.isFinite(sp)||!Number.isFinite(ac)||ac>=channel)continue;
      if(sp>=.05&&sp<=4)b.opp++;
    }
    const qualified=new Set(bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18).map(b=>b.bx+','+b.by));
    const sel=new Set();
    const footprint=c=>{
      const out=new Set(),seg=Array.isArray(c?.segment)?c.segment:null;if(!seg||!seg.length)return out;
      let prev=null;
      for(const ll of seg){
        const g=toGrid(ll);if(!g)continue;
        const mark=(x,y)=>{const b=binAt(x,y),k=b.bx+','+b.by;if(qualified.has(k))out.add(k);};
        mark(g.x,g.y);
        if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}}
        prev=g;
      }
      return out;
    };
    for(const c of chosen||[])for(const k of footprint(c))sel.add(k);

    return {
      qualified:qualified.size,
      selectedCovered:sel.size,
      selectedCoverageRatio:qualified.size?Number((sel.size/qualified.size).toFixed(4)):null,
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip?.swales??null,
      gapPassed:gapAudit?.passed??null,
      gapUnresolved:gapAudit?.unresolved?.length??null,
      gapSelected:gapRefine?.selected?.length??null,
      gapAdded:gapRefine?.added??null,
      gapElapsedMs:gapRefine?.elapsedMs??null
    };
  });

  const row={
    query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit,
    deltaSelected:audit?Number((audit.selectedCoverageRatio-BASELINE[query]).toFixed(4)):null
  };
  rows.push(row);
  console.log('EARTHLINE_M46_16802 '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'.png',fullPage:false});}catch(_){}
  await context.close();
}
await browser.close();

writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
const bad=rows.filter(r=>r.loadError||r.timedOut||r.pageErrors.length||!r.audit||
  Number(r.audit.coreMs)>15000||
  Number(r.audit.generated)!==Number(r.audit.visible)||
  Number(r.audit.unsafe)!==0||
  Number(r.audit.outside||0)!==0
);
console.log('EARTHLINE_M46_16802_SUMMARY '+JSON.stringify(rows));
if(bad.length)process.exitCode=1;
