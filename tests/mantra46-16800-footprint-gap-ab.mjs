import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Florida','Colorado'];
const OUT='artifacts/mantra46-16800-footprint-gap-ab';
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
      const repl=[
        ['const binsX16731=6,binsY16731=6','const binsX16731=24,binsY16731=24',1],
        ['r16731.valid>=45&&r16731.opportunity>=8&&ratio16731>=.035','r16731.valid>=5&&r16731.opportunity>=2&&ratio16731>=.18',1],
        ['row16749.valid<45||row16749.opportunity<8||(row16749.opportunity/Math.max(1,row16749.valid))<.035','row16749.valid<5||row16749.opportunity<2||(row16749.opportunity/Math.max(1,row16749.valid))<.18',1],
        ['r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035','r16731.valid>=5&&r16731.opportunity>=2&&(r16731.opportunity/Math.max(1,r16731.valid))>=.18',2],
        ["loadDEM(tile16731.b,48,48,8000,'coverage-gap refinement '+tile16731.id)","loadDEM(tile16731.b,32,32,5500,'coverage-gap refinement '+tile16731.id)",1]
      ];
      for(const [oldv,newv,expected] of repl){
        const count=body.split(oldv).length-1;
        if(count!==expected)throw new Error('owner mismatch '+oldv+' count='+count);
        body=body.split(oldv).join(newv);
      }

      const density=`const earthlineCoverageDensityTarget16767=r16767=>{
        const preferred16767=Number(r16767&&r16767.preferred||0);
        if(preferred16767>=60)return 3;
        if(preferred16767>=30)return 2;
        return 1;
      };`;
      if(body.split(density).length-1!==1)throw new Error('density owner mismatch');
      body=body.replace(density,'const earthlineCoverageDensityTarget16767=r16767=>1;');

      const initialCount=`for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        const mid16746=coords16731[Math.floor((coords16731.length-1)/2)],g16746=llGrid(hy,mid16746);
        if(!g16746||!Number.isFinite(g16746.x)||!Number.isFinite(g16746.y))continue;
        const bx16746=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16746.x)*binsX16731/Math.max(1,hy.w))));
        const by16746=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16746.y)*binsY16731/Math.max(1,hy.h))));
        const row16746=bins16731.find(r16731=>r16731.bx===bx16746&&r16731.by===by16746);if(row16746)row16746.swales++;
      }`;
      const initialNew=`for(const f16731 of swales.features){
        const coords16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;
        if(!Array.isArray(coords16731)||!coords16731.length)continue;
        for(const k16740 of earthlineCoverageBinsForLine16740(coords16731)){
          const parts16740=k16740.split(','),bx16740=Number(parts16740[0]),by16740=Number(parts16740[1]);
          const row16740=bins16731.find(r16731=>r16731.bx===bx16740&&r16731.by===by16740);if(row16740)row16740.swales++;
        }
      }`;
      if(body.split(initialCount).length-1!==1)throw new Error('initial footprint owner mismatch');
      body=body.replace(initialCount,initialNew);

      const finalCount=`for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        const mid16746=c16731[Math.floor((c16731.length-1)/2)],g16746=llGrid(hy,mid16746);if(!g16746||!Number.isFinite(g16746.x)||!Number.isFinite(g16746.y))continue;
        const bx16746=Math.max(0,Math.min(binsX16731-1,Math.floor(Number(g16746.x)*binsX16731/Math.max(1,hy.w)))),by16746=Math.max(0,Math.min(binsY16731-1,Math.floor(Number(g16746.y)*binsY16731/Math.max(1,hy.h))));
        const row16746=after16731.find(r16731=>r16731.bx===bx16746&&r16731.by===by16746);if(row16746)row16746.swales++;
      }`;
      const finalNew=`for(const f16731 of swales.features||[]){
        const c16731=f16731&&f16731.geometry&&f16731.geometry.type==='LineString'?f16731.geometry.coordinates:null;if(!Array.isArray(c16731)||!c16731.length)continue;
        for(const k16740 of earthlineCoverageBinsForLine16740(c16731)){
          const parts16740=k16740.split(','),bx16740=Number(parts16740[0]),by16740=Number(parts16740[1]);
          const row16740=after16731.find(r16731=>r16731.bx===bx16740&&r16731.by===by16740);if(row16740)row16740.swales++;
        }
      }`;
      if(body.split(finalCount).length-1!==1)throw new Error('final footprint owner mismatch');
      body=body.replace(finalCount,finalNew);

      const select="const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=18)break;selected16731.push(gap16731);}";
      const selectNew=`const gapMap16800=new Map(gaps16731.map(g16800=>[g16800.bx+','+g16800.by,g16800])),seen16800=new Set();
      for(const gap16800 of gaps16731){
        const k016800=gap16800.bx+','+gap16800.by;if(seen16800.has(k016800))continue;
        const q16800=[gap16800],component16800=[];seen16800.add(k016800);
        while(q16800.length){
          const cur16800=q16800.shift();component16800.push(cur16800);
          for(let oy16800=-1;oy16800<=1;oy16800++)for(let ox16800=-1;ox16800<=1;ox16800++){
            if(!ox16800&&!oy16800)continue;
            const nx16800=cur16800.bx+ox16800,ny16800=cur16800.by+oy16800,k16800=nx16800+','+ny16800,n16800=gapMap16800.get(k16800);
            if(!n16800||seen16800.has(k16800))continue;seen16800.add(k16800);q16800.push(n16800);
          }
        }
        for(const c16800 of component16800)c16800.component16800=component16800.length;
      }
      const adaptivePool16800=gaps16731.filter(g16800=>Number(g16800.component16800||0)>=20);
      const selected16731=[];
      while(adaptivePool16800.length&&selected16731.length<4){
        let bestI16800=0,bestM16800=-Infinity;
        for(let i16800=0;i16800<adaptivePool16800.length;i16800++){
          const g16800=adaptivePool16800[i16800],spread16800=selected16731.length?Math.min(...selected16731.map(s16800=>Math.hypot(s16800.bx-g16800.bx,s16800.by-g16800.by))):4;
          const m16800=Number(g16800.component16800||0)*1000+spread16800*80+(g16800.opportunity/Math.max(1,g16800.valid))*100+g16800.preferred;
          if(m16800>bestM16800){bestM16800=m16800;bestI16800=i16800;}
        }
        selected16731.push(adaptivePool16800.splice(bestI16800,1)[0]);
      }`;
      if(body.split(select).length-1!==1)throw new Error('selection owner mismatch');
      body=body.replace(select,selectNew);
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
    await page.goto(BASE+'?m46_16800_ab='+encodeURIComponent(query)+'_'+(variant?'variant':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});
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
      },query,{timeout:65000,polling:100});
    }catch(_){timedOut=true;}
    await page.waitForTimeout(600);
  }catch(e){loadError=String(e);}

  const audit=loadError||timedOut?null:await page.evaluate(q=>{
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
    const bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});
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
    const mark=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))binAt(x,y).covered=true};
    let targetNearest=Infinity,targetGrid=null;
    const target=q==='Arkansas'?[-91.71263,35.06357]:null;
    if(target)targetGrid=toGrid(target);
    const distSeg=(px,py,ax,ay,bx,by)=>{
      const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,vv=vx*vx+vy*vy;
      let t=vv?((wx*vx+wy*vy)/vv):0;t=Math.max(0,Math.min(1,t));
      return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));
    };
    for(const f of swales){
      const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!Array.isArray(c)||!c.length)continue;
      let prev=null;
      for(const ll of c){
        const g=toGrid(ll);if(!g)continue;mark(g.x,g.y);
        if(prev){
          const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));
          for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}
          if(targetGrid)targetNearest=Math.min(targetNearest,distSeg(targetGrid.x,targetGrid.y,prev.x,prev.y,g.x,g.y));
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
      gapError:gap?.error||null,
      qualified:qualified.length,
      covered:qualified.length-unserved.length,
      unservedKeys:unserved.map(b=>b.bx+','+b.by),
      targetNearest:Number.isFinite(targetNearest)?Number(targetNearest.toFixed(2)):null
    };
  },query);

  if(audit){
    audit.unserved=audit.unservedKeys.length;
    audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;
    audit.gapClusters=clusterSizes(audit.unservedKeys);
    delete audit.unservedKeys;
  }
  const row={query,variant:variant?'footprint-adaptive':'control-6x6',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};
  rows.push(row);console.log('EARTHLINE_M46_16800_AB '+JSON.stringify(row));
  try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'variant':'control')+'.png',fullPage:false});}catch(_){}
  await context.close();
}

for(const q of STATES){await runOne(q,false);await runOne(q,true);}
await browser.close();
writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));
console.log('EARTHLINE_M46_16800_AB_SUMMARY '+JSON.stringify(rows));

const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0||r.audit.gapError);
if(bad.length)process.exitCode=1;
