import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Maryland','Texas','Florida','Colorado'];
const OUT='artifacts/mantra46-16809-opportunity-gap-swap-ab';
const TARGET=[-91.71263,35.06357];
mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});
const rows=[];

function clusterSizes(keys,nx=24,ny=24){const set=new Set(keys),seen=new Set(),sizes=[];for(const k0 of set){if(seen.has(k0))continue;const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let size=0;while(q.length){const [x,y]=q.shift();size++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy,k=xx+','+yy;if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;seen.add(k);q.push([xx,yy]);}}sizes.push(size);}return sizes.sort((a,b)=>b-a);}

async function runOne(query,variant){
 const context=await browser.newContext({viewport:{width:1908,height:882}});
 await context.route('https://earthlinedevelopment.org/**',async route=>{
  if(route.request().resourceType()!=='document')return route.continue();
  const resp=await route.fetch();let body=await resp.text();
  if(variant){
   const capOld='const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));';
   if(body.split(capOld).length-1!==1)throw new Error('capacity owner mismatch');
   body=body.replace(capOld,'const regionalCapacity16755=focusMode?80:Math.min(180,Math.max(80,coverageGroups16736.size*4));');
   const gridOld='const nx16783=12,ny16783=12;';if(body.split(gridOld).length-1!==1)throw new Error('grid owner mismatch');body=body.replace(gridOld,'const nx16783=24,ny16783=24;');
   const rx='const cx16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.x)*12/Math.max(1,hy.w))));';
   const ry='const cy16791=Math.max(0,Math.min(11,Math.floor(Number(g16791.y)*12/Math.max(1,hy.h))));';
   if(body.split(rx).length-1!==1||body.split(ry).length-1!==1)throw new Error('coverage audit owner mismatch');
   body=body.replace(rx,'const cx16791=Math.max(0,Math.min(nx16783-1,Math.floor(Number(g16791.x)*nx16783/Math.max(1,hy.w))));').replace(ry,'const cy16791=Math.max(0,Math.min(ny16783-1,Math.floor(Number(g16791.y)*ny16783/Math.max(1,hy.h))));');

   const auditAnchor="window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783={";
   if(body.split(auditAnchor).length-1!==1)throw new Error('final spread audit anchor mismatch');
   const pass=`/* EARTHLINE 16809 diagnostic — opportunity-gap-aware count-neutral final spread. */
      const opportunitySwaps16809=[];
      try{
        const vals16809=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a16809,b16809)=>a16809-b16809);
        const channel16809=vals16809.length?vals16809[Math.max(0,Math.min(vals16809.length-1,Math.floor((vals16809.length-1)*.972)))]:Infinity;
        const valid16809=new Uint16Array(nx16783*ny16783),opp16809=new Uint16Array(nx16783*ny16783);
        const idx16809=(x16809,y16809)=>Math.max(0,Math.min(ny16783-1,Math.floor(Number(y16809)*ny16783/Math.max(1,hy.h))))*nx16783+Math.max(0,Math.min(nx16783-1,Math.floor(Number(x16809)*nx16783/Math.max(1,hy.w))));
        const key16809=i16809=>(i16809%nx16783)+','+Math.floor(i16809/nx16783);
        for(let y16809=0;y16809<hy.h;y16809++)for(let x16809=0;x16809<hy.w;x16809++){
          const hi16809=y16809*hy.w+x16809;if(hy.validityMask16584?.[hi16809]!==1)continue;
          const bi16809=idx16809(x16809,y16809);valid16809[bi16809]++;
          const sp16809=Number(hy.slope[hi16809]),ac16809=Number(hy.acc[hi16809]);
          if(Number.isFinite(sp16809)&&sp16809>=.05&&sp16809<=4&&Number.isFinite(ac16809)&&ac16809<channel16809)opp16809[bi16809]++;
        }
        const qualified16809=new Set();
        for(let i16809=0;i16809<valid16809.length;i16809++)if(valid16809[i16809]>=5&&opp16809[i16809]>=2&&(opp16809[i16809]/Math.max(1,valid16809[i16809]))>=.18)qualified16809.add(key16809(i16809));
        const footprintCache16809=new Map();
        const footprint16809=c16809=>{
          if(footprintCache16809.has(c16809))return footprintCache16809.get(c16809);
          const out16809=new Set(),seg16809=Array.isArray(c16809&&c16809.segment)?c16809.segment:[];let prev16809=null;
          const mark16809=(x16809,y16809)=>{const k16809=key16809(idx16809(x16809,y16809));if(qualified16809.has(k16809))out16809.add(k16809);};
          for(const ll16809 of seg16809){const g16809=llGrid(hy,ll16809);if(!g16809||!Number.isFinite(Number(g16809.x))||!Number.isFinite(Number(g16809.y)))continue;const gx16809=Number(g16809.x),gy16809=Number(g16809.y);mark16809(gx16809,gy16809);if(prev16809){const dx16809=gx16809-prev16809.x,dy16809=gy16809-prev16809.y,steps16809=Math.max(1,Math.ceil(Math.hypot(dx16809,dy16809)*2));for(let s16809=1;s16809<steps16809;s16809++){const t16809=s16809/steps16809;mark16809(prev16809.x+dx16809*t16809,prev16809.y+dy16809*t16809);}}prev16809={x:gx16809,y:gy16809};}
          footprintCache16809.set(c16809,out16809);return out16809;
        };
        const coverCounts16809=new Map();
        const rebuildCover16809=()=>{coverCounts16809.clear();for(const c16809 of chosen)for(const k16809 of footprint16809(c16809))coverCounts16809.set(k16809,(coverCounts16809.get(k16809)||0)+1);};
        const components16809=counts16809=>{
          const unserved16809=new Set([...qualified16809].filter(k16809=>(counts16809.get(k16809)||0)<=0)),seen16809=new Set(),components16809=[];
          for(const k016809 of unserved16809){if(seen16809.has(k016809))continue;const q16809=[k016809],comp16809=[];seen16809.add(k016809);while(q16809.length){const k16809=q16809.shift();comp16809.push(k16809);const p16809=k16809.split(',').map(Number);for(let oy16809=-1;oy16809<=1;oy16809++)for(let ox16809=-1;ox16809<=1;ox16809++){if(!ox16809&&!oy16809)continue;const nx16809=p16809[0]+ox16809,ny16809=p16809[1]+oy16809,nk16809=nx16809+','+ny16809;if(nx16809<0||nx16809>=nx16783||ny16809<0||ny16809>=ny16783||!unserved16809.has(nk16809)||seen16809.has(nk16809))continue;seen16809.add(nk16809);q16809.push(nk16809);}}components16809.push(comp16809);}components16809.sort((a16809,b16809)=>b16809.length-a16809.length);return components16809;
        };
        const simulated16809=(add16809,donor16809)=>{const counts16809=new Map(coverCounts16809);for(const k16809 of footprint16809(donor16809))counts16809.set(k16809,(counts16809.get(k16809)||0)-1);for(const k16809 of footprint16809(add16809))counts16809.set(k16809,(counts16809.get(k16809)||0)+1);const cc16809=components16809(counts16809);return {largest:cc16809[0]?.length||0,total:cc16809.reduce((s16809,c16809)=>s16809+c16809.length,0)};};
        rebuildCover16809();rebuild16783();
        for(let round16809=0;round16809<12;round16809++){
          const comps16809=components16809(coverCounts16809),largest16809=comps16809[0]||[];if(!largest16809.length)break;
          const largestSet16809=new Set(largest16809),currentLargest16809=largest16809.length,currentTotal16809=comps16809.reduce((s16809,c16809)=>s16809+c16809.length,0);
          const adds16809=candidates.filter(c16809=>!chosen.includes(c16809)).map(c16809=>({c:c16809,hit:[...footprint16809(c16809)].filter(k16809=>largestSet16809.has(k16809)).length})).filter(r16809=>r16809.hit>0).sort((a16809,b16809)=>b16809.hit-a16809.hit||(Number(b16809.c.score)||0)-(Number(a16809.c.score)||0)).slice(0,18);
          if(!adds16809.length)break;
          const donors16809=chosen.map((c16809,i16809)=>{const p16809=point16783(c16809),fp16809=footprint16809(c16809);let unique16809=0;for(const k16809 of fp16809)if((coverCounts16809.get(k16809)||0)===1)unique16809++;return {c:c16809,i:i16809,p:p16809,unique:unique16809,score:Number(c16809.score)||0};}).filter(r16809=>r16809.p).sort((a16809,b16809)=>a16809.unique-b16809.unique||a16809.score-b16809.score).slice(0,36);
          let best16809=null;
          for(const a16809 of adds16809){const ap16809=point16783(a16809.c);if(!ap16809)continue;for(const d16809 of donors16809){if(d16809.c===a16809.c)continue;const parentN16809=parentCount16783.get(d16809.p.parent)||0;if(d16809.p.parent!==ap16809.parent&&parentN16809<=3)continue;const sim16809=simulated16809(a16809.c,d16809.c);if(sim16809.largest>=currentLargest16809)continue;const metric16809=(currentLargest16809-sim16809.largest)*10000+(currentTotal16809-sim16809.total)*100+a16809.hit-d16809.unique;if(!best16809||metric16809>best16809.metric)best16809={add:a16809.c,donor:d16809,sim:sim16809,metric:metric16809};}}
          if(!best16809)break;
          chosen[best16809.donor.i]=best16809.add;opportunitySwaps16809.push({beforeLargest:currentLargest16809,afterLargest:best16809.sim.largest,beforeTotal:currentTotal16809,afterTotal:best16809.sim.total,addScore:Number(best16809.add.score)||0,donorScore:Number(best16809.donor.c.score)||0});
          rebuild16783();rebuildCover16809();
        }
        window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809={build:'EARTHLINE 16809 diagnostic',qualifiedCells:qualified16809.size,swaps:opportunitySwaps16809.length,rows:opportunitySwaps16809,finalLargest:components16809(coverCounts16809)[0]?.length||0,rule:'count-neutral swaps are accepted only when a real screened candidate reduces the largest connected unserved qualified-opportunity component; 6x6 donor parent floor retained'};
      }catch(e16809){window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809={build:'EARTHLINE 16809 diagnostic',error:String(e16809&&e16809.message||e16809),swaps:0};}
      `;
   body=body.replace(auditAnchor,pass+auditAnchor);
  }
  const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";if(body.split(call).length-1!==1)throw new Error('main call not found');body=body.replace(call,'window.__EARTHLINE_M46_16809_HY=hy;'+call);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
 });
 const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
 try{await page.goto(BASE+'?m46_16809='+encodeURIComponent(query)+'_'+(variant?'oppgap':'control')+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&!!window.__EARTHLINE_M46_16809_HY&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:70000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(500);}catch(e){loadError=String(e);}
 const audit=loadError||timedOut?null:await page.evaluate(({query,target})=>{
  const hy=window.__EARTHLINE_M46_16809_HY,visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,swales=visual?.swales?.features||[],perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,score=window.EARTHLINE_REGIONAL_SCORE_ORDER_16717||null,spread=window.EARTHLINE_FINAL_PUBLISHED_SPREAD_16783||null,oppSwap=window.EARTHLINE_OPPORTUNITY_GAP_SWAP_16809||null;
  const rad=x=>x*Math.PI/180,mpl=lat=>111320*Math.cos(rad(lat)),xy=ll=>[(Number(ll[0])-target[0])*mpl((Number(ll[1])+target[1])/2),(Number(ll[1])-target[1])*111320],segD=(a,b)=>{const A=xy(a),B=xy(b),vx=B[0]-A[0],vy=B[1]-A[1],vv=vx*vx+vy*vy;let t=vv?(-(A[0]*vx+A[1]*vy)/vv):0;t=Math.max(0,Math.min(1,t));return Math.hypot(A[0]+t*vx,A[1]+t*vy)},lineD=c=>{if(!Array.isArray(c)||c.length<2)return Infinity;let d=Infinity;for(let i=1;i<c.length;i++)d=Math.min(d,segD(c[i-1],c[i]));return d};let targetNearest=null;if(query==='Arkansas'){const ds=swales.map(f=>lineD(f?.geometry?.coordinates)).filter(Number.isFinite);targetNearest=ds.length?Math.round(Math.min(...ds)):null;}
  const nx=24,ny=24,vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),channel=vals.length?vals[Math.floor((vals.length-1)*.972)]:Infinity,[w,s,e,n]=hy.bounds,toGrid=ll=>({x:(Number(ll[0])-w)/(e-w)*(hy.w-1),y:(n-Number(ll[1]))/(n-s)*(hy.h-1)}),bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});const binAt=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];
  for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;const b=binAt(x,y);b.valid++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4&&Number.isFinite(ac)&&ac<channel)b.opp++;}
  for(const f of swales){const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!c?.length)continue;let prev=null;for(const ll of c){const g=toGrid(ll);binAt(g.x,g.y).covered=true;if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;binAt(prev.x+dx*t,prev.y+dy*t).covered=true}}prev=g;}}
  const qualified=bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18),unserved=qualified.filter(b=>!b.covered);
  return{coreMs:perf?.totalMs??null,generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip??null,capacity:score?.capacity16755??null,targetNearest,oppSwap,spread:{candidateCells:spread?.candidateCells,chosenCount:spread?.chosenCount,finalCells:spread?.finalCells,swaps:spread?.swaps,stop:spread?.selectionStopReason},qualified:qualified.length,covered:qualified.length-unserved.length,unservedKeys:unserved.map(b=>b.bx+','+b.by)};
 },{query,target:TARGET});
 if(audit){audit.unserved=audit.unservedKeys.length;audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;audit.gapClusters=clusterSizes(audit.unservedKeys);delete audit.unservedKeys;}
 const row={query,variant:variant?'opportunity-gap-swap':'control',loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);console.log('EARTHLINE_M46_16809 '+JSON.stringify(row));try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+(variant?'oppgap':'control')+'.png',fullPage:false});}catch(_){ }await context.close();
}
for(const q of STATES){await runOne(q,false);await runOne(q,true)}
await browser.close();writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));console.log('EARTHLINE_M46_16809_SUMMARY '+JSON.stringify(rows));const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0||r.audit.oppSwap?.error);if(bad.length)process.exitCode=1;
