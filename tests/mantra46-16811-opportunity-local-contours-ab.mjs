import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const BASE='https://earthlinedevelopment.org/';
const STATES=['Arkansas','Oklahoma','Maryland','Colorado'];
const VARIANTS=[
 {name:'control',local:false,cap:120,mult:4},
 {name:'local-opportunity',local:true,cap:120,mult:4},
 {name:'local-opportunity-cap180',local:true,cap:180,mult:6},
 {name:'local-opportunity-cap240',local:true,cap:240,mult:8}
];
const OUT='artifacts/mantra46-16811-opportunity-local-contours-ab';mkdirSync(OUT,{recursive:true});
const browser=await chromium.launch({headless:true});const rows=[];
function clusters(keys,nx=24,ny=24){const set=new Set(keys),seen=new Set(),sizes=[];for(const k0 of set){if(seen.has(k0))continue;const [sx,sy]=k0.split(',').map(Number),q=[[sx,sy]];seen.add(k0);let n=0;while(q.length){const [x,y]=q.shift();n++;for(let oy=-1;oy<=1;oy++)for(let ox=-1;ox<=1;ox++){if(!ox&&!oy)continue;const xx=x+ox,yy=y+oy,k=xx+','+yy;if(xx<0||xx>=nx||yy<0||yy>=ny||!set.has(k)||seen.has(k))continue;seen.add(k);q.push([xx,yy]);}}sizes.push(n);}return sizes.sort((a,b)=>b-a);}
async function runOne(query,v){
 const context=await browser.newContext({viewport:{width:1800,height:950}});
 await context.route('https://earthlinedevelopment.org/**',async route=>{if(route.request().resourceType()!=='document')return route.continue();const resp=await route.fetch();let body=await resp.text();
  if(v.local){
   const old='const swaleCandidateContours16609=useSupplemental16609?await makeContours(hy,true):contours;';
   const neu=`const baseCandidateContours16811=useSupplemental16609?await makeContours(hy,true):contours;
    const localFeatures16811=[];
    if(!focusMode&&hy&&hy.validityMask16584){
      const nx16811=24,ny16811=24,channel16811=percentile(hy.acc,.972),bins16811=[];
      for(let by16811=0;by16811<ny16811;by16811++)for(let bx16811=0;bx16811<nx16811;bx16811++)bins16811.push({bx:bx16811,by:by16811,valid:0,opp:0,best:null});
      const binAt16811=(x16811,y16811)=>bins16811[Math.max(0,Math.min(ny16811-1,Math.floor(y16811*ny16811/Math.max(1,hy.h))))*nx16811+Math.max(0,Math.min(nx16811-1,Math.floor(x16811*nx16811/Math.max(1,hy.w))))];
      for(let y16811=1;y16811<hy.h-1;y16811++)for(let x16811=1;x16811<hy.w-1;x16811++){
        const i16811=y16811*hy.w+x16811;if(hy.validityMask16584[i16811]!==1)continue;const b16811=binAt16811(x16811,y16811);b16811.valid++;
        const sp16811=Number(hy.slope[i16811]),ac16811=Number(hy.acc[i16811]);if(!Number.isFinite(sp16811)||sp16811<.05||sp16811>4||!Number.isFinite(ac16811)||ac16811>=channel16811)continue;
        b16811.opp++;const metric16811=Math.abs(sp16811-2.0)*2+(ac16811/Math.max(1,channel16811));if(!b16811.best||metric16811<b16811.best.metric)b16811.best={x:x16811,y:y16811,metric:metric16811,level:Number(hy.elev[i16811])};
      }
      const interp16811=(a16811,b16811,l16811)=>{const d16811=b16811-a16811;return Math.abs(d16811)<1e-9?.5:Math.max(0,Math.min(1,(l16811-a16811)/d16811));};
      const qualified16811=bins16811.filter(b16811=>b16811.best&&b16811.valid>=5&&b16811.opp>=2&&(b16811.opp/Math.max(1,b16811.valid))>=.18);
      for(const b16811 of qualified16811){
        const tx16811=b16811.best.x,ty16811=b16811.best.y,level16811=b16811.best.level,r16811=7,segments16811=[];
        const x016811=Math.max(0,tx16811-r16811),x116811=Math.min(hy.w-2,tx16811+r16811),y016811=Math.max(0,ty16811-r16811),y116811=Math.min(hy.h-2,ty16811+r16811);
        for(let y16811=y016811;y16811<=y116811;y16811++)for(let x16811=x016811;x16811<=x116811;x16811++){
          const i016811=y16811*hy.w+x16811,i116811=i016811+1,i316811=(y16811+1)*hy.w+x16811,i216811=i316811+1;
          if(!hy.validityMask16584[i016811]||!hy.validityMask16584[i116811]||!hy.validityMask16584[i216811]||!hy.validityMask16584[i316811])continue;
          const a16811=hy.elev[i016811],bb16811=hy.elev[i116811],c16811=hy.elev[i216811],d16811=hy.elev[i316811],pts16811=[];
          if((a16811<level16811)!=(bb16811<level16811))pts16811.push([x16811+interp16811(a16811,bb16811,level16811),y16811]);
          if((bb16811<level16811)!=(c16811<level16811))pts16811.push([x16811+1,y16811+interp16811(bb16811,c16811,level16811)]);
          if((c16811<level16811)!=(d16811<level16811))pts16811.push([x16811+1-interp16811(c16811,d16811,level16811),y16811+1]);
          if((d16811<level16811)!=(a16811<level16811))pts16811.push([x16811,y16811+1-interp16811(d16811,a16811,level16811)]);
          if(pts16811.length===2)segments16811.push([pts16811[0],pts16811[1]]);else if(pts16811.length===4){const center16811=(a16811+bb16811+c16811+d16811)/4;if(center16811<level16811)segments16811.push([pts16811[0],pts16811[3]],[pts16811[1],pts16811[2]]);else segments16811.push([pts16811[0],pts16811[1]],[pts16811[2],pts16811[3]]);}
        }
        const paths16811=stitchContourSegments(segments16811);let bestPath16811=null,bestD16811=Infinity;
        for(const p16811 of paths16811){if(!p16811||p16811.length<5)continue;let d16811=Infinity;for(const g16811 of p16811)d16811=Math.min(d16811,Math.hypot(g16811[0]-tx16811,g16811[1]-ty16811));if(d16811<bestD16811){bestD16811=d16811;bestPath16811=p16811;}}
        if(!bestPath16811||bestD16811>2.5)continue;const raw16811=bestPath16811.map(p16811=>gridLL(hy,p16811[0],p16811[1])),closed16811=Math.abs(bestPath16811[0][0]-bestPath16811[bestPath16811.length-1][0])<.001&&Math.abs(bestPath16811[0][1]-bestPath16811[bestPath16811.length-1][1])<.001,coords16811=chaikin(raw16811,2,closed16811);
        if(coords16811.length<10||lineLengthPixels(hy,coords16811)<4)continue;localFeatures16811.push({type:'Feature',properties:{feature_type:'contour',elev_m:Math.round(level16811),earthline_local_opportunity_16811:true,source_bin_16811:b16811.bx+','+b16811.by},geometry:{type:'LineString',coordinates:coords16811}});
      }
      window.EARTHLINE_LOCAL_OPPORTUNITY_CONTOURS_16811={qualified:qualified16811.length,features:localFeatures16811.length,rule:'derive local iso-elevation candidate lines through qualified <=4% opportunity bins; display contours unchanged',at:new Date().toISOString()};
    }
    const swaleCandidateContours16609={type:'FeatureCollection',features:[...(baseCandidateContours16811&&baseCandidateContours16811.features||[]),...localFeatures16811]};`;
   if(body.split(old).length-1!==1)throw new Error('candidate contour owner');body=body.replace(old,neu);
  }
  if(v.cap!==120){const old='const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));';const neu=`const regionalCapacity16755=focusMode?80:Math.min(${v.cap},Math.max(80,coverageGroups16736.size*${v.mult}));`;if(body.split(old).length-1!==1)throw new Error('capacity owner');body=body.replace(old,neu);}
  const call="let swales=await makeSwales(hy,swaleCandidateContours16609,focusMode,swaleJurisdictionGeometry16539,supplementalCandidates16702);";if(body.split(call).length-1!==1)throw new Error('main call owner');body=body.replace(call,"window.__M46_16811_HY=hy;window.__M46_16811_CONTOURS=swaleCandidateContours16609;"+call);
  const capmark='window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;';if(body.split(capmark).length-1!==1)throw new Error('generation owner');body=body.replace(capmark,"if(hy===window.__M46_16811_HY&&!window.__M46_16811_CAND)window.__M46_16811_CAND=candidates.map(c=>({x:c.x,y:c.y,segment:c.segment}));"+capmark);
  await route.fulfill({response:resp,body,headers:{...resp.headers(),'content-type':'text/html; charset=utf-8'}});
 });
 const page=await context.newPage(),pageErrors=[];page.on('pageerror',e=>pageErrors.push(String(e)));let loadError=null,timedOut=false;const started=Date.now();
 try{await page.goto(BASE+'?m46_16811='+encodeURIComponent(query)+'_'+v.name+'_'+Date.now(),{waitUntil:'domcontentloaded',timeout:45000});await page.waitForSelector('#searchInput',{timeout:30000});await page.evaluate(q=>{const i=document.getElementById('searchInput'),b=document.getElementById('runBtn');i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));i.dispatchEvent(new Event('change',{bubbles:true}));b.click();},query);try{await page.waitForFunction(q=>{const s=String(document.getElementById('earthlineVermontStatus16147')?.textContent||document.getElementById('earthlineTierNotice16173')?.textContent||'');const root=window.EARTHLINE_STANDARD_ROOT_CAUSE_AUDIT_16784||null;return /screening published\./i.test(s)&&!!window.__M46_16811_HY&&!!window.__M46_16811_CAND&&root&&String(root.query||'').toLowerCase().includes(q.toLowerCase());},query,{timeout:80000,polling:100});}catch(_){timedOut=true;}await page.waitForTimeout(500);}catch(e){loadError=String(e);}
 const audit=loadError||timedOut?null:await page.evaluate(q=>{const hy=window.__M46_16811_HY,candidates=window.__M46_16811_CAND||[],visual=window.EARTHLINE_REGIONAL_VISUAL_DATA_16020||null,swales=visual?.swales?.features||[],local=window.EARTHLINE_LOCAL_OPPORTUNITY_CONTOURS_16811||null,perf=window.EARTHLINE_REGIONAL_PERFORMANCE_16191||null,pub=window.EARTHLINE_CORRIDOR_PUBLICATION_AUDIT_16167||null,display=window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16040||window.EARTHLINE_REGIONAL_DISPLAY_AUDIT_16020||null,flow=window.EARTHLINE_LAND_VALIDITY_FLOW_AUDIT_16584||null,boundary=window.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539||null,gen=window.EARTHLINE_SWALE_GENERATION_AUDIT_16167||null,sel=window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736||null;
 const nx=24,ny=24,vals=Array.from(hy.acc||[]).map(Number).filter(Number.isFinite).sort((a,b)=>a-b),channel=vals.length?vals[Math.max(0,Math.min(vals.length-1,Math.floor((vals.length-1)*.972)))]:Infinity,bins=[];for(let by=0;by<ny;by++)for(let bx=0;bx<nx;bx++)bins.push({bx,by,valid:0,opp:0,covered:false});const at=(x,y)=>bins[Math.max(0,Math.min(ny-1,Math.floor(y*ny/Math.max(1,hy.h))))*nx+Math.max(0,Math.min(nx-1,Math.floor(x*nx/Math.max(1,hy.w))))];for(let y=0;y<hy.h;y++)for(let x=0;x<hy.w;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;const b=at(x,y);b.valid++;const sp=Number(hy.slope[i]),ac=Number(hy.acc[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4&&Number.isFinite(ac)&&ac<channel)b.opp++;}const qualified=new Set(bins.filter(b=>b.valid>=5&&b.opp>=2&&(b.opp/Math.max(1,b.valid))>=.18).map(b=>b.bx+','+b.by));const midpoint=new Set();for(const c of candidates){if(!Number.isFinite(Number(c.x))||!Number.isFinite(Number(c.y)))continue;const b=at(Number(c.x),Number(c.y)),k=b.bx+','+b.by;if(qualified.has(k))midpoint.add(k);}
 const [w,s,e,n]=hy.bounds,toGrid=ll=>{if(!Array.isArray(ll)||ll.length<2||e===w||n===s)return null;const lng=Number(ll[0]),lat=Number(ll[1]);if(!Number.isFinite(lng)||!Number.isFinite(lat))return null;return{x:(lng-w)/(e-w)*Math.max(1,hy.w-1),y:(n-lat)/(n-s)*Math.max(1,hy.h-1)}};const mark=(x,y)=>{if(Number.isFinite(x)&&Number.isFinite(y))at(x,y).covered=true};let targetNearest=Infinity;const target=q==='Arkansas'?[-91.71263,35.06357]:null,tg=target?toGrid(target):null;const dist=(px,py,ax,ay,bx,by)=>{const vx=bx-ax,vy=by-ay,wx=px-ax,wy=py-ay,vv=vx*vx+vy*vy;let t=vv?((wx*vx+wy*vy)/vv):0;t=Math.max(0,Math.min(1,t));return Math.hypot(px-(ax+t*vx),py-(ay+t*vy));};for(const f of swales){const c=f?.geometry?.type==='LineString'?f.geometry.coordinates:null;if(!Array.isArray(c)||!c.length)continue;let prev=null;for(const ll of c){const g=toGrid(ll);if(!g)continue;mark(g.x,g.y);if(prev){const dx=g.x-prev.x,dy=g.y-prev.y,steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)*2));for(let j=1;j<steps;j++){const t=j/steps;mark(prev.x+dx*t,prev.y+dy*t);}if(tg)targetNearest=Math.min(targetNearest,dist(tg.x,tg.y,prev.x,prev.y,g.x,g.y));}prev=g;}}const qbins=[...qualified].map(k=>{const [bx,by]=k.split(',').map(Number);return bins[by*nx+bx]}),unserved=qbins.filter(b=>!b.covered);
 return{coreMs:perf?.totalMs??null,generated:pub?.generated??null,visible:display?.swaleLines??pub?.overlaySwaleLines??null,unsafe:flow?.unsafeSegments??null,outside:boundary?.outsideAfterClip??null,capacity:sel?.capacity??null,localContours:local,candidates:gen?.jurisdictionEligibleCandidates??candidates.length,chosen:gen?.chosenBeforeTierGate??null,qualified:qualified.size,midpointCovered:midpoint.size,midpointRatio:qualified.size?Number((midpoint.size/qualified.size).toFixed(4)):null,covered:qualified.size-unserved.length,unservedKeys:unserved.map(b=>b.bx+','+b.by),targetNearest:Number.isFinite(targetNearest)?Number(targetNearest.toFixed(2)):null};},query);
 if(audit){audit.unserved=audit.unservedKeys.length;audit.coverageRatio=audit.qualified?Number((audit.covered/audit.qualified).toFixed(4)):null;audit.gapClusters=clusters(audit.unservedKeys);delete audit.unservedKeys;}
 const row={query,variant:v.name,loadError,timedOut,pageErrors,elapsedMs:Date.now()-started,audit};rows.push(row);console.log('EARTHLINE_M46_16811 '+JSON.stringify(row));try{await page.screenshot({path:OUT+'/'+query.toLowerCase()+'-'+v.name+'.png',fullPage:false});}catch(_){ }await context.close();
}
for(const q of STATES)for(const v of VARIANTS)await runOne(q,v);await browser.close();writeFileSync(OUT+'/results.json',JSON.stringify(rows,null,2));console.log('EARTHLINE_M46_16811_SUMMARY '+JSON.stringify(rows));const bad=rows.filter(r=>!r.audit||r.loadError||r.timedOut||r.pageErrors.length||Number(r.audit.coreMs)>15000||Number(r.audit.generated)!==Number(r.audit.visible)||Number(r.audit.unsafe)!==0||Number(r.audit.outside?.swales||0)!==0);if(bad.length)process.exitCode=1;
