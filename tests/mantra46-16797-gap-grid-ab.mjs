import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16797-gap-grid-ab';
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){
  const set=new Set(keys),seen=new Set(),sizes=[];
  for(const k0 of set){
    if(seen.has(k0))continue;
    const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let size=0;
    while(q.length){
      const [x,y]=q.shift();size++;
      for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){
        if(!ox&&!oy)continue;
        const xx=x+ox,yy=y+oy,k=xx+','+yy;
        if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;
        seen.add(k);q.push([xx,yy]);
      }
    }
    sizes.push(size);
  }
  return sizes.sort((a,b)=>b-a);
}

async function runOne(query,variant){
  const context=await browser.newContext({viewport:{width:1800,height:950}});
  await context.route('https://earthlinedevelopment.org/**',async route=>{
    if(route.request().resourceType()!=='document')return route.continue();
    const resp=await route.fetch();
    let body=await resp.text();

    if(variant){
      const checks=[
        ['const binsX16731=6,binsY16731=6','const binsX16731=12,binsY16731=12',1],
        ['r16731.valid>=45&&r16731.opportunity>=8','r16731.valid>=12&&r16731.opportunity>=2',3],
        ['row16749.valid<45||row16749.opportunity<8','row16749.valid<12||row16749.opportunity<2',1],
        ['if(preferred16767>=60)return 3;','if(preferred16767>=15)return 3;',1],
        ['if(preferred16767>=30)return 2;','if(preferred16767>=8)return 2;',1]
      ];
      for(const [oldv,newv,expected] of checks){
        const count=body.split(oldv).length-1;
        if(count!==expected)throw new Error('patch owner mismatch '+oldv+' count='+count);
        body=body.split(oldv).join(newv);
      }
    }

    const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";
    if(body.split(call).length-1!==1)throw new Error('main swale call owner not found');
    body=body.replace(call,"window.__EARTHLINE_M46_MAIN_HY=hy;"+call);

    await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
  });

  const page=await context.newPage();
  const pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));
  let loadError=null,timedOut=false;const started=Date.now();

  try{
    await page.goto(BASE+'?m46_16797_ab='+encodeURIComponent(query)+'_'+(variant?'variant':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
    await page.waitForSelector('#searchInput',{timeout:30000});
    await page.evaluate(q=>{
      const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');
      i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();
    },query);
    try{
      await page.waitForFunction(q=>{
        const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');
        const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;
        return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_MAIN_HY&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());
      },query,{timeout:70000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(700);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(()=>{
    const hy=window.__EARTHLINE_M46_MAIN_HY;
    const visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null;
    const swales=visual?.swales?.features||[];
    const gap=window.EARTHLINE_COVERAGE_GAP_REFINEMENT_16731||null;
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
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,pref:0,covered:false});
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
      if(sp>=.20&&sp<=4)b.pref++;
    }
    const mark=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))binAt(x,y).covered=true};
    for(const f of swales){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;
      if(!Array.isArray(c)||!c.length)continue;
      let prev=null;
      for(const ll of c){
        const g=toGrid(ll);if(!g)continue;mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
        }
        prev=g;
      }
    }
    const qualified=bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18);
    const unserved=qualified.filter(b=>!b.covered);
    return {
      coreMs:perf?.totalMs??null,
      generated:pub?.generated??null,
      visible:display?.swaleLines??pub?.overlaySwaleLines??null,
      unsafe:flow?.unsafeSegments??null,
      outside:boundary?.outsideAfterClip??null,
      gapSelected:(gap?.selected||[]).length,
      gapAdded:gap?.added??null,
      gapConfirmedNull:(gap?.confirmedNull16735||[]).length,
      gapError:gap?.error||null,
      qualified:qualified.length,
      covered:qualified.length-unserved.length,
      unservedKeys:unserved.map(b=>b.bx+','+b.by)
    };
  });

  if(audit){
    audit.unserved=audit.unservedKeys.length;
    audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;
    audit.gapClusters=clusterSizes(audit.unservedKeys);
    delete audit.unservedKeys;
  }

  const row={query,variant:variant?'12x12-gap-grid':'control-6x6',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);
  console.log('EARTHLINE_M46_16797_AB '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'variant':'control')+'.png',fullPage:false});}catch(_){}
  await context.close();
}

for(const q of STATES){await runOne(q,false);await runOne(q,true);}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16797_AB_SUMMARY '+JSON.stringify(rows));

const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0||r.audit.gapError);
if(bad.length)process.exitCode=1;
