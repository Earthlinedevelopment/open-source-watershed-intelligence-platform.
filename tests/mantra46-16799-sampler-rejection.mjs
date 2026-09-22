import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland'];
const OUT='artifacts/mantra46-16799-sampler-rejection';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

for(const query of STATES){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    const decl="const channel=percentile(hy.acc,.972),accLow=percentile(hy.acc,.22),accMid=percentile(hy.acc,.72),accHigh=percentile(hy.acc,.91),candidates=[];";
    const insert=decl+"\n    const sampleDiag16799=window.__EARTHLINE_M46_SAMPLE_REJECTION_16799={rows:{},jurisdictionRejected:{},supplementalSuccess:{},supplementalAttempts:{}};\n    const diagReject16799=(reason16799,relaxed16799)=>{const key16799=window.__EARTHLINE_M46_SAMPLE_KEY_16799;if(!key16799)return;const row16799=sampleDiag16799.rows[key16799]||(sampleDiag16799.rows[key16799]={});const tag16799=(relaxed16799?'relaxed:':'strict:')+reason16799;row16799[tag16799]=(row16799[tag16799]||0)+1;};";
    if(body.split(decl).length-1!==1)throw new Error('sampler declaration owner not found');
    body=body.replace(decl,insert);

    const reps=[
      ["const raw=coords.slice(start,end);if(raw.length<10)return null;","const raw=coords.slice(start,end);if(raw.length<10){diagReject16799('raw-short',relaxed);return null;}"],
      ["const segment=chaikin(raw,2,false);if(segment.length<10)return null;","const segment=chaikin(raw,2,false);if(segment.length<10){diagReject16799('segment-short',relaxed);return null;}"],
      ["if(linePx16632<minLinePx16632)return null;","if(linePx16632<minLinePx16632){diagReject16799('line-short',relaxed);return null;}"],
      ["if(valid<(relaxed?1:2)||!anchor)return null;","if(valid<(relaxed?1:2)||!anchor){diagReject16799(!anchor?'no-anchor':'insufficient-valid',relaxed);return null;}"]
    ];
    for(const [oldv,newv] of reps){
      if(body.split(oldv).length-1!==1)throw new Error('sampler rejection owner not found: '+oldv);
      body=body.replace(oldv,newv);
    }

    const oldCall="          noteAnchor16786(key);supplementalAnchorAttempts16786++;\n          const c=sampleSegment(coords,idx,false);\n          if(c){c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;}";
    const newCall="          noteAnchor16786(key);supplementalAnchorAttempts16786++;\n          window.__EARTHLINE_M46_SAMPLE_KEY_16799=key;\n          sampleDiag16799.supplementalAttempts[key]=(sampleDiag16799.supplementalAttempts[key]||0)+1;\n          const c=sampleSegment(coords,idx,false);\n          window.__EARTHLINE_M46_SAMPLE_KEY_16799=null;\n          if(c){c.spatialAnchor16786=true;c.spatialAnchorCell16786=key;candidates.push(c);supplementalAnchorCandidates16786++;sampleDiag16799.supplementalSuccess[key]=(sampleDiag16799.supplementalSuccess[key]||0)+1;}";
    if(body.split(oldCall).length-1!==1)throw new Error('supplemental call owner not found');
    body=body.replace(oldCall,newCall);

    const oldScreen="        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else jurisdictionRejectedCandidates16539++;";
    const newScreen="        const screened16539=screenJurisdictionCandidate16539(candidate16539);\n        if(screened16539)eligible16539.push(screened16539);else{jurisdictionRejectedCandidates16539++;if(candidate16539&&candidate16539.spatialAnchorCell16786){const k16799=candidate16539.spatialAnchorCell16786;sampleDiag16799.jurisdictionRejected[k16799]=(sampleDiag16799.jurisdictionRejected[k16799]||0)+1;}}";
    if(body.split(oldScreen).length-1!==1)throw new Error('jurisdiction screening owner not found');
    body=body.replace(oldScreen,newScreen);

    const mainCall="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(mainCall).length-1!==1)throw new Error('main swale call not found');
    body=body.replace(mainCall,"window.__EARTHLINE_M46_MAIN_HY_16799=hy;window.__EARTHLINE_M46_MAIN_CONTOURS_16799=swaleCandidateContours16609;"+mainCall);

    const genAudit="window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;";
    if(body.split(genAudit).length-1!==1)throw new Error('generation audit owner not found');
    body=body.replace(genAudit,"if(hy===window.__EARTHLINE_M46_MAIN_HY_16799)window.__EARTHLINE_M46_MAIN_CHAIN_16799={candidates,chosen};"+genAudit);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();
  try{
    await page.goto(BASE+'?m46_16799='+encodeURIComponent(query)+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_MAIN_CHAIN_16799&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:60000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(300);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const hy=window.__EARTHLINE_M46_MAIN_HY_16799;
    const contours=window.__EARTHLINE_M46_MAIN_CONTOURS_16799;
    const chain=window.__EARTHLINE_M46_MAIN_CHAIN_16799;
    const diag=window.__EARTHLINE_M46_SAMPLE_REJECTION_16799||{rows:{},jurisdictionRejected:{},supplementalSuccess:{},supplementalAttempts:{}};
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
    const cover=(coords,out)=>{
      if(!Array.isArray(coords)||!coords.length)return;
      let prev=null;
      for(const ll of coords){
        const g=toGrid(ll);if(!g)continue;
        const mark=(x,y)=>{const b=binAt(x,y),k=b.bx+','+b.by;if(qualified.has(k))out.add(k);};
        mark(g.x,g.y);
        if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}}
        prev=g;
      }
    };
    const cand=new Set(),contour=new Set();
    for(const c of chain.candidates||[])cover(c?.segment,cand);
    for(const f of contours?.features||[])if(f?.geometry?.type==='LineString')cover(f.geometry.coordinates,contour);

    const noCandidateWithContour=[...qualified].filter(k=>contour.has(k)&&!cand.has(k));
    const toAnchor12=k=>{
      const [x,y]=k.split(',').map(Number);
      return Math.floor(x/2)+','+Math.floor(y/2);
    };
    const anchorKeys=new Set(noCandidateWithContour.map(toAnchor12));
    const agg={attempts:0,success:0,jurisdictionRejected:0,reasons:{}};
    for(const key of anchorKeys){
      agg.attempts+=Number(diag.supplementalAttempts?.[key]||0);
      agg.success+=Number(diag.supplementalSuccess?.[key]||0);
      agg.jurisdictionRejected+=Number(diag.jurisdictionRejected?.[key]||0);
      const row=diag.rows?.[key]||{};
      for(const [reason,count] of Object.entries(row))agg.reasons[reason]=(agg.reasons[reason]||0)+Number(count||0);
    }

    return {
      qualified:qualified.size,
      candidates:(chain.candidates||[]).length,
      noCandidateWithContour:noCandidateWithContour.length,
      affectedAnchor12Cells:anchorKeys.size,
      diag:agg
    };
  });

  const row={query,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);console.log('EARTHLINE_M46_16799 '+JSON.stringify(row));
  await context.close();
}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16799_SUMMARY '+JSON.stringify(rows));
