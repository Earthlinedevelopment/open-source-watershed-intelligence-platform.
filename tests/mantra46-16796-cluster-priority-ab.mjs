import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland'];
const OUT='artifacts/mantra46-16796-cluster-priority-ab';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusters(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),out=[];
  for(const k0 of set){
    if(seen.has(k0))continue;
    const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]],cells=[];seen.add(k0);
    while(q.length){
      const [x,y]=q.shift();cells.push(x+','+y);
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;
        const xx=x+ox,yy=y+oy,k=xx+','+yy;
        if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;
        seen.add(k);q.push([xx,yy]);
      }
    }
    out.push(cells);
  }
  return out.sort((a,b)=>b.length-a.length);
}

async function runOne(query,variant){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    if(variant){
      const old="const metric16781=(row16780.coarseContourHit16788?0:10000)+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(Number(row16780.cluster16781)||0)*12+row16780.opportunity/16;";
      const neu="const metric16781=(Number(row16780.cluster16781)||0)*2200+pref16781*1200+ratio16781*180+row16780.preferred*6+spread16781*24+(row16780.coarseContourHit16788?240:0)+row16780.opportunity/16;";
      const count=body.split(old).length-1;
      if(count!==1)throw new Error('metric owner count='+count);
      body=body.replace(old,neu);
    }

    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main swale call owner not found');
    body=body.replace(call,"window.__EARTHLINE_M46_MAIN_HY=hy;window.__EARTHLINE_M46_MAIN_CONTOURS=swaleCandidateContours16609;"+call);

    const cap="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    if(body.split(cap).length-1!==1)throw new Error('generation audit owner not found');
    body=body.replace(cap,"if(hy===window.__EARTHLINE_M46_MAIN_HY)window.__EARTHLINE_M46_MAIN_CHAIN={candidates,chosen};"+cap);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  const started=Date.now();let loadError=null,timedOut=false;

  try{
    await page.goto(BASE+'?m46_16796_ab='+encodeURIComponent(query)+'_'+(variant?'variant':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_MAIN_CHAIN&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:60000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(500);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const hy=window.__EARTHLINE_M46_MAIN_HY;
    const contours=window.__EARTHLINE_M46_MAIN_CONTOURS;
    const {candidates,chosen}=window.__EARTHLINE_M46_MAIN_CHAIN;
    const fine=window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781||null;
    const perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null;
    const pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null;
    const display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null;
    const flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null;
    const boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null;

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
    const coverLine=(coords,out)=>{
      if(!Array.isArray(coords)||!coords.length)return;
      let prev=null;
      for(const ll of coords){
        const g=toGrid(ll);if(!g)continue;
        const mark=(x,y)=>{const b=binAt(x,y),k=b.bx+','+b.by;if(qualified.has(k))out.add(k);};
        mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
        }
        prev=g;
      }
    };
    const candidateCover=new Set(),selectedCover=new Set(),contourCover=new Set();
    for(const c of candidates||[])coverLine(c?.segment,candidateCover);
    for(const c of chosen||[])coverLine(c?.segment,selectedCover);
    for(const f of contours?.features||[])if(f?.geometry?.type==='LineString')coverLine(f.geometry.coordinates,contourCover);

    const noCandidate=[...qualified].filter(k=>!candidateCover.has(k));
    const selectionMiss=[...qualified].filter(k=>candidateCover.has(k)&&!selectedCover.has(k));
    return {
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip??null,
      fineSelected:(fine?.selected||[]).map(r=>({bx:r.bx,by:r.by,cluster:r.cluster,coarse:r.coarseContourHit16788})),
      fineAdded:fine?.added??null,
      fineUnresolved:(fine?.unresolvedAfter||[]).length,
      qualified:qualified.size,
      candidates:(candidates||[]).length,
      chosen:(chosen||[]).length,
      candidateCovered:candidateCover.size,
      selectedCovered:selectedCover.size,
      noCandidateKeys:noCandidate,
      selectionMissKeys:selectionMiss
    };
  });

  if(audit){
    audit.noCandidate=audit.noCandidateKeys.length;
    audit.selectionMiss=audit.selectionMissKeys.length;
    audit.noCandidateClusters=clusters(audit.noCandidateKeys).map(c=>c.length);
    audit.selectionMissClusters=clusters(audit.selectionMissKeys).map(c=>c.length);
    delete audit.noCandidateKeys;delete audit.selectionMissKeys;
  }

  const row={query,variant:variant?'cluster-first':'control',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);
  console.log('EARTHLINE_M46_16796_AB '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'variant':'control')+'.png',fullPage:false});}catch(_){}
  await context.close();
}

for(const q of STATES){await runOne(q,false);await runOne(q,true);}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));

const pairs=STATES.map(q=>{
  const control=rows.find(r=>r.query===q&&r.variant==='control');
  const variant=rows.find(r=>r.query===q&&r.variant==='cluster-first');
  return {query:q,control:control?.audit||null,variant:variant?.audit||null};
});
console.log('EARTHLINE_M46_16796_AB_SUMMARY '+JSON.stringify(pairs));

const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0);
if(bad.length)process.exitCode=1;
