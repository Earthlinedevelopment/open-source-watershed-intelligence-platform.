/* Earthline Property Swale Engine v1.1.1
   One authoritative implementation of the Property swale rules R1-R13 plus R14 (PROPOSED, needs owner approval: terrain relief gate)
   (governing/EARTHLINE-PROPERTY-SWALE-ENGINE-SPEC.md). Pure function: no map, page or viewport input.
   Same inputs -> same output. Works in the browser (window.EarthlinePropertySwales) and in Node (module.exports). */
(function(root){
'use strict';
const VERSION='1.1.1';
const LIMITS=Object.freeze({
  slopeMaxPct:4,            // R2, R3
  slopeMinPct:0.2,          // R12
  windowSamples:5,          // R3
  contourRangeM:0.3,        // R1
  minLengthFloorM:12,       // R4: max(12 m, 4 cells), capped at 40 m
  minLengthCellFactor:4,
  minLengthCapM:40,
  spacingMinM:4.572,        // R5 (15 ft)
  spacingMaxM:7.620,        // R5 (25 ft) target, reported
  builtSetbackM:3.05,       // R6 (10 ft): buildings, roads, driveways, parking, property line
  waterSetbackM:18,         // R7
  channelSetbackM:3,        // R8
  maxTortuosity:2.15,       // R11
  drawdownHours:48,         // R13 (72 h = marginal outer bound)
  drawdownMarginalHours:72,
  channelAreaM2:300,        // R8: contributing area above which a modelled cell is a wash/channel (approved v1.0.0 value; input.channelAreaM2 overrides for sensitivity testing)
  contourStepM:0.05,
  gapSamplesAllowed:2,
  preferredSlopePct:[3.0,4.0],
  minReliefM:1.0            // R14 (PROPOSED - needs owner approval; input.minReliefM overrides, 0 turns it off): elevation relief across the property (5th-95th percentile) must exceed what the elevation data can resolve, else no swales are published
});
// Hydrologic soil group infiltration (mm/h) and the geometry factor that reproduces the Compendium table
// (A 0.5 m -> 32.7 h, B -> 54.5 h, C -> 124.3 h, D -> 345.2 h).
const SOIL=Object.freeze({A:9.5,B:5.7,C:2.5,D:0.9});
const DRAWDOWN_K=0.6215;
const MAX_DEPTH_M=0.5, MIN_DEPTH_M=0.15;

/* ---------- small deterministic helpers ---------- */
function fnv1a(str){let h1=0x811c9dc5,h2=0x01000193;for(let i=0;i<str.length;i++){const c=str.charCodeAt(i);h1^=c;h1=Math.imul(h1,16777619)>>>0;h2^=c;h2=Math.imul(h2,2246822519)>>>0;}return ('00000000'+h1.toString(16)).slice(-8)+('00000000'+h2.toString(16)).slice(-8);}
function median(a){const s=a.slice().sort((x,y)=>x-y);return s[Math.floor(s.length/2)];}
function dilate(mask,w,h,rCells){
  if(rCells<=0)return mask.slice();
  const out=new Uint8Array(w*h),r=Math.ceil(rCells),r2=rCells*rCells;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){if(!mask[y*w+x])continue;
    for(let dy=-r;dy<=r;dy++){const yy=y+dy;if(yy<0||yy>=h)continue;
      for(let dx=-r;dx<=r;dx++){const xx=x+dx;if(xx<0||xx>=w)continue;if(dx*dx+dy*dy<=r2)out[yy*w+xx]=1;}}}
  return out;
}
function bilinear(arr,w,h,x,y){
  x=Math.max(0,Math.min(w-1.000001,x));y=Math.max(0,Math.min(h-1.000001,y));
  const x0=Math.floor(x),y0=Math.floor(y),fx=x-x0,fy=y-y0,i=y0*w+x0;
  return arr[i]*(1-fx)*(1-fy)+arr[i+1]*fx*(1-fy)+arr[i+w]*(1-fx)*fy+arr[i+w+1]*fx*fy;
}
function nearest(arr,w,h,x,y){const xi=Math.max(0,Math.min(w-1,Math.round(x))),yi=Math.max(0,Math.min(h-1,Math.round(y)));return arr[yi*w+xi];}

/* ---------- terrain ---------- */
function slopePct(elev,w,h,cell){
  const s=new Float32Array(w*h);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const xl=Math.max(0,x-1),xr=Math.min(w-1,x+1),yu=Math.max(0,y-1),yd=Math.min(h-1,y+1);
    const dzdx=(elev[y*w+xr]-elev[y*w+xl])/((xr-xl)*cell),dzdy=(elev[yd*w+x]-elev[yu*w+x])/((yd-yu)*cell);
    s[y*w+x]=100*Math.hypot(dzdx,dzdy);
  }
  return s;
}
function flowAccumulation(elev,w,h){ // D8, deterministic tie-break by index
  const n=w*h,order=new Int32Array(n);for(let i=0;i<n;i++)order[i]=i;
  const idx=Array.from(order).sort((a,b)=>elev[b]-elev[a]||a-b);
  const acc=new Float32Array(n).fill(1);
  for(const i of idx){const x=i%w,y=(i/w)|0;let best=-1,drop=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
      const j=yy*w+xx,d=(elev[i]-elev[j])/Math.hypot(dx,dy);if(d>drop){drop=d;best=j;}}
    if(best>=0)acc[best]+=acc[i];}
  return acc;
}

/* ---------- contour tracing (marching squares, chained) ---------- */
function traceContours(elev,w,h,level){
  const segs=[];const key=(p)=>p[0].toFixed(4)+','+p[1].toFixed(4);
  for(let y=0;y<h-1;y++)for(let x=0;x<w-1;x++){
    const a=elev[y*w+x],b=elev[y*w+x+1],c=elev[(y+1)*w+x+1],d=elev[(y+1)*w+x];
    const pts=[];const edge=(z1,z2,p1,p2)=>{if((z1<level)!==(z2<level)){const t=(level-z1)/(z2-z1);pts.push([p1[0]+t*(p2[0]-p1[0]),p1[1]+t*(p2[1]-p1[1])]);}};
    edge(a,b,[x,y],[x+1,y]);edge(b,c,[x+1,y],[x+1,y+1]);edge(c,d,[x+1,y+1],[x,y+1]);edge(d,a,[x,y+1],[x,y]);
    if(pts.length===2)segs.push(pts);else if(pts.length===4){segs.push([pts[0],pts[1]]);segs.push([pts[2],pts[3]]);}
  }
  const ends=new Map();segs.forEach((s,i)=>{for(const p of s){const k=key(p);if(!ends.has(k))ends.set(k,[]);ends.get(k).push(i);}});
  const used=new Uint8Array(segs.length),lines=[];
  for(let i=0;i<segs.length;i++){if(used[i])continue;used[i]=1;let line=[segs[i][0],segs[i][1]];
    for(const dir of [1,0]){let grow=true;while(grow){grow=false;const tip=dir?line[line.length-1]:line[0];
      for(const j of (ends.get(key(tip))||[])){if(used[j])continue;used[j]=1;const s=segs[j];const nxt=key(s[0])===key(tip)?s[1]:s[0];
        if(dir)line.push(nxt);else line.unshift(nxt);grow=true;break;}}}
    lines.push(line);}
  return lines;
}
function resample(line,stepCells){
  const out=[line[0]];let carry=0;
  for(let i=1;i<line.length;i++){const p=line[i-1],q=line[i];let seg=Math.hypot(q[0]-p[0],q[1]-p[1]),t=stepCells-carry;
    while(t<=seg){out.push([p[0]+(q[0]-p[0])*t/seg,p[1]+(q[1]-p[1])*t/seg]);t+=stepCells;}carry=seg-(t-stepCells);}
  return out;
}
function lengthCells(pts){let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L;}

/* ---------- R13 drawdown ---------- */
function drawdownFor(soilGroup){
  const rate=SOIL[soilGroup];
  if(!rate)return {assessed:false,depth_m:null,hours:null,status:'not-assessed'};
  const maxDepth=LIMITS.drawdownHours*rate/(DRAWDOWN_K*1000);
  const depth=Math.min(MAX_DEPTH_M,maxDepth);
  if(depth<MIN_DEPTH_M)return {assessed:true,depth_m:+depth.toFixed(3),hours:+(DRAWDOWN_K*MIN_DEPTH_M*1000/rate).toFixed(1),status:'fail'};
  const hours=DRAWDOWN_K*depth*1000/rate;
  return {assessed:true,depth_m:+depth.toFixed(3),hours:+hours.toFixed(1),status:hours<=LIMITS.drawdownHours?'pass':hours<=LIMITS.drawdownMarginalHours?'marginal':'fail'};
}

/* ---------- main ---------- */
/* input = {
     grid:{w,h,cellM,bbox:[west,south,east,north],elev:Float32Array|Array (row 0 = north)},
     inside:Uint8Array (1 = inside property),
     exclusions:{status:'features-found'|'verified-clear'|'screened-clear'|'unavailable'|'failed', sourceTier:'authoritative-local'|'open-data'|'none',
                 built:Uint8Array (roads, driveways, parking, buildings), water:Uint8Array (mapped waterways, water bodies, wetlands)},
     soilGroup:'A'|'B'|'C'|'D'|null, elevationSource:string, landcover?:Uint8Array (1 = intact closed forest, ranked last) } */
function run(input){
  const ev={engine:'earthline-property-swales',version:VERSION,method:'Earthline Screening Method v1.0'};
  const fail=(acq,msg)=>({status:{sourceTier:(input&&input.exclusions&&input.exclusions.sourceTier)||'none',acquisition:acq},message:msg,swales:[],rejections:{},evidence:ev,determinismHash:fnv1a(acq+msg)});
  const g=input&&input.grid;
  if(!g||!g.w||!g.h||!(g.cellM>0)||!g.elev||g.elev.length!==g.w*g.h||!g.bbox)return fail('failed','Elevation unavailable · try again');
  for(let i=0;i<g.elev.length;i++)if(!Number.isFinite(g.elev[i]))return fail('failed','Elevation unavailable · try again');
  const ex=input.exclusions||{};
  if(!['features-found','verified-clear','screened-clear'].includes(ex.status)||!ex.built||!ex.water)return fail(ex.status==='unavailable'?'unavailable':'failed','Road and water check unavailable · try again'); // R10
  const {w,h,cellM}=g,elev=Float32Array.from(g.elev),n=w*h;
  const inside=input.inside||new Uint8Array(n).fill(1);
  const slope=slopePct(elev,w,h,cellM);
  // Flow accumulation (cells). The page may supply its own (D8 on its depression-filled terrain) so R8 agrees with the water paths it draws; otherwise the engine computes D8 itself.
  const pageAcc=(input.flowAccumulation&&input.flowAccumulation.length===n)?input.flowAccumulation:null;
  const acc=pageAcc?Float32Array.from(pageAcc):flowAccumulation(elev,w,h);
  const channelAreaM2=(input.channelAreaM2>0)?input.channelAreaM2:LIMITS.channelAreaM2;
  const areaThresholdCells=(input.channelThresholdCells>0)?input.channelThresholdCells:Math.max(12,Math.round(channelAreaM2/(cellM*cellM))); // channel = modelled concentrated flow (washes, gullies); channelThresholdCells (cells) overrides the area form
  const channel=new Uint8Array(n);for(let i=0;i<n;i++)if(acc[i]>=areaThresholdCells)channel[i]=1;
  const ownChannelCells=channel.reduce((a,b)=>a+b,0);
  if(input.channelMask&&input.channelMask.length===n)for(let i=0;i<n;i++)if(input.channelMask[i])channel[i]=1; // page-drawn water paths: union, never replace
  const outside=new Uint8Array(n);for(let i=0;i<n;i++)outside[i]=inside[i]?0:1;
  const rc=m=>Math.max(1,Math.ceil(m/cellM-1e-9)); // setback in whole cells, rounded UP (never less than the rule, never less than one cell)
  const noBuilt=dilate(ex.built,w,h,rc(LIMITS.builtSetbackM));
  const noLine=dilate(outside,w,h,rc(LIMITS.builtSetbackM));
  const noWater=dilate(ex.water,w,h,rc(LIMITS.waterSetbackM));
  const noChan=dilate(channel,w,h,rc(LIMITS.channelSetbackM));
  // Exclude verified closed-canopy cells when the caller supplies a landcover mask; no relay or new data fetch.
  const canopy=(input.landcover&&input.landcover.length===n)?input.landcover:null;
  const cellReason=i=>outside[i]?'R9':noLine[i]?'R6':noBuilt[i]?'R6':noWater[i]?'R7':noChan[i]?'R8':(canopy&&canopy[i])?'R15':null;
  const cov={insideCells:0,slopeOver4Total:0,excluded:{line:0,built:0,water:0,channel:0,slopeOver4:0},buildableCells:0};
  for(let i=0;i<n;i++){if(!inside[i])continue;cov.insideCells++;
    if(noLine[i])cov.excluded.line++;else if(noBuilt[i])cov.excluded.built++;else if(noWater[i])cov.excluded.water++;else if(noChan[i])cov.excluded.channel++;
    else if(slope[i]>LIMITS.slopeMaxPct)cov.excluded.slopeOver4++;else cov.buildableCells++;
    if(slope[i]>LIMITS.slopeMaxPct)cov.slopeOver4Total++;}
  cov.insideAreaM2=Math.round(cov.insideCells*cellM*cellM);cov.buildablePct=cov.insideCells?+(100*cov.buildableCells/cov.insideCells).toFixed(1):0;
  const rej={R1:0,R2:0,R3:0,R4:0,R5:0,R6:0,R7:0,R8:0,R9:0,R11:0,R12:0,R13:0,R14:0,R15:0};
  const minLenM=Math.min(LIMITS.minLengthCapM,Math.max(LIMITS.minLengthFloorM,LIMITS.minLengthCellFactor*cellM));
  const dd=drawdownFor(input.soilGroup);
  let lo=Infinity,hi=-Infinity;for(let i=0;i<n;i++)if(inside[i]){if(elev[i]<lo)lo=elev[i];if(elev[i]>hi)hi=elev[i];}
  // R14 inputs: robust relief across the property (5th-95th percentile of elevation inside the boundary)
  const insideElev=[];for(let i=0;i<n;i++)if(inside[i])insideElev.push(elev[i]);insideElev.sort((a,b)=>a-b);
  const qEl=pq=>insideElev.length?insideElev[Math.min(insideElev.length-1,Math.floor(pq*insideElev.length))]:0;
  const p05El=qEl(0.05),p95El=qEl(0.95),reliefM=p95El-p05El;
  const minReliefM=(input.minReliefM>=0)?input.minReliefM:LIMITS.minReliefM;
  const cand=[];const stepCells=1;
  for(let lev=Math.ceil(lo/LIMITS.contourStepM)*LIMITS.contourStepM;lev<=hi;lev=+(lev+LIMITS.contourStepM).toFixed(4)){
    for(const raw of traceContours(elev,w,h,lev)){
      const pts=resample(raw,stepCells);if(pts.length<3)continue;
      // split where the line leaves buildable ground for more than gapSamplesAllowed samples
      let run=[],gap=0,gapReasons=[];
      const flush=()=>{while(run.length&&run[run.length-1].bad)run.pop();if(run.length>=3)cand.push(run.map(r=>r.p));run=[];};
      for(const p of pts){const i=Math.round(p[1])*w+Math.round(p[0]);const reason=(i>=0&&i<n)?cellReason(i):'R9';
        if(reason){gap++;gapReasons.push(reason);if(gap>LIMITS.gapSamplesAllowed){if(run.length)rej[gapReasons[0]]++;flush();gapReasons=[];}else if(run.length)run.push({p,bad:true});}
        else{gap=0;gapReasons=[];run.push({p,bad:false});}}
      flush();
    }
  }
  const passed=[];
  for(const pts of cand){
    const lenM=lengthCells(pts)*cellM;
    if(lenM<minLenM){rej.R4++;continue;}
    const zs=pts.map(p=>bilinear(elev,w,h,p[0],p[1]));
    if(Math.max(...zs)-Math.min(...zs)>LIMITS.contourRangeM){rej.R1++;continue;}
    const ss=pts.map(p=>bilinear(slope,w,h,p[0],p[1]));
    const mean=ss.reduce((a,b)=>a+b,0)/ss.length;
    if(mean>LIMITS.slopeMaxPct){rej.R2++;continue;}
    if(mean<LIMITS.slopeMinPct){rej.R12++;continue;}
    let maxMed=0,sustained=false;
    for(let k=0;k<ss.length;k++){const a=Math.max(0,Math.min(k-2,ss.length-5)),m=median(ss.slice(a,Math.min(ss.length,a+5)));if(m>maxMed)maxMed=m;if(m>LIMITS.slopeMaxPct)sustained=true;}
    if(sustained){rej.R3++;continue;}
    const chord=Math.hypot(pts[pts.length-1][0]-pts[0][0],pts[pts.length-1][1]-pts[0][1])*cellM;
    const tort=chord>0?lenM/chord:Infinity;
    if(tort>LIMITS.maxTortuosity){rej.R11++;continue;}
    if(dd.assessed&&dd.status==='fail'){rej.R13++;continue;}
    const capture=pts.reduce((a,p)=>a+nearest(acc,w,h,p[0],p[1]),0)/pts.length*cellM*cellM;
    const forest=input.landcover?pts.filter(p=>nearest(input.landcover,w,h,p[0],p[1])).length/pts.length:0;
    const pref=(mean>=LIMITS.preferredSlopePct[0]&&mean<=LIMITS.preferredSlopePct[1])?1:0;
    passed.push({pts,lenM,mean,maxMed,tort,capture,forest,pref,elev:zs.reduce((a,b)=>a+b,0)/zs.length});
  }
  // R5 + ranking: preferred slope band first, cleared ground before intact forest, then water captured; ties by geometry
  passed.forEach(c=>c.key=c.pts.map(p=>p[0].toFixed(3)+','+p[1].toFixed(3)).join(';'));
  passed.sort((a,b)=>((a.forest>0.5)-(b.forest>0.5))||(b.pref-a.pref)||(b.capture-a.capture)||(a.key<b.key?-1:1));
  const accepted=[],minSpacingCells=LIMITS.spacingMinM/cellM;
  // spatial hash of accepted points (bucket = minimum spacing): same answer as comparing every pair, without the O(n²) cost
  const bucket=new Map(),bk=(x,y)=>Math.floor(x/minSpacingCells)+','+Math.floor(y/minSpacingCells);
  const addAccepted=c=>{for(const q of c.pts){const k=bk(q[0],q[1]);if(!bucket.has(k))bucket.set(k,[]);bucket.get(k).push(q);}};
  const tooClose=(c)=>{for(const p of c.pts){const bx=Math.floor(p[0]/minSpacingCells),by=Math.floor(p[1]/minSpacingCells);
    for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){const b=bucket.get((bx+dx)+','+(by+dy));if(!b)continue;for(const q of b)if(Math.hypot(p[0]-q[0],p[1]-q[1])<minSpacingCells)return true;}}return false;};
  for(const c of passed){if(tooClose(c)){rej.R5++;continue;}accepted.push(c);addAccepted(c);}
  // geography, orientation, ids
  const [W,S,E,N]=g.bbox,toLL=p=>[+(W+(p[0]+0.5)/w*(E-W)).toFixed(6),+(N-(p[1]+0.5)/h*(N-S)).toFixed(6)];
  const swalesAll=accepted.map(c=>{
    const coords=c.pts.map(toLL);
    const fwd=coords.map(q=>q[0].toFixed(5)+','+q[1].toFixed(5)).join(';'),rev=coords.slice().reverse().map(q=>q[0].toFixed(5)+','+q[1].toFixed(5)).join(';');
    const id='EL-P-'+fnv1a(fwd<rev?fwd:rev).slice(0,10).toUpperCase();
    // orientation lock: sample both sides at 1.5 cells
    let up=0,down=0;for(let k=1;k<c.pts.length;k++){const p=c.pts[k-1],q=c.pts[k],dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy)||1,nx=-dy/L*1.5,ny=dx/L*1.5;
      const zl=bilinear(elev,w,h,p[0]+nx,p[1]+ny),zr=bilinear(elev,w,h,p[0]-nx,p[1]-ny);if(zl>zr+0.01)up++;else if(zr>zl+0.01)down++;}
    const tot=c.pts.length-1,orientation=up/tot>=0.8?'left-upslope':down/tot>=0.8?'right-upslope':'ambiguous';
    return {type:'Feature',geometry:{type:'LineString',coordinates:coords},properties:{
      id,length_m:+c.lenM.toFixed(1),mean_slope_pct:+c.mean.toFixed(2),max_5pt_median_slope_pct:+c.maxMed.toFixed(2),
      elevation_m:+c.elev.toFixed(2),capture_score:Math.round(c.capture),tortuosity:+c.tort.toFixed(2),
      orientation,render:orientation==='ambiguous'?'symmetric':'directional',
      depth_m:dd.depth_m,drawdown_h:dd.hours,drawdown:dd.status,
      form:'level ditch 2–5 ft wide × 12–24 in deep · berm downhill · trees on berm',
      evidence:'M',label:'(MODELED) Proposed swale alignment · screening result, not design · field levelling establishes the swale',
      safety:['slope ceiling 4%','drawdown '+(dd.assessed?dd.hours+' h ('+dd.status+')':'not assessed — soil group unavailable'),'spillway and overflow at the low end','do not direct overflow toward a neighbour']}};
  });
  const gateRefused=reliefM<minReliefM; // R14
  const swales=gateRefused?[]:swalesAll;if(gateRefused)rej.R14=1;
  const tier=ex.status==='screened-clear'?' · no mapped roads, buildings or water found · check on the ground before digging':'';
  const message=gateRefused?('No qualifying swales on this property · terrain relief '+reliefM.toFixed(2)+' m is below the '+minReliefM+' m needed to tell real slope from elevation-data noise · R14'):swales.length?swales.length+' proposed swale alignments · slope ≤ 4% · screening result, not design'+tier
    :'No qualifying swales on this property · '+Object.entries(rej).filter(e=>e[1]).map(e=>e[0]+' '+e[1]).join(' · ');
  const out={status:{sourceTier:ex.sourceTier||'none',acquisition:ex.status},message,swales,rejections:rej,
    evidence:Object.assign(ev,{terrain:{reliefM:+reliefM.toFixed(3),p05M:+p05El.toFixed(3),p95M:+p95El.toFixed(3),minReliefM,gate:gateRefused?'refused':'pass',swalesSuppressedByGate:gateRefused?swalesAll.length:0},elevationSource:input.elevationSource||'unspecified',cellM,grid:[w,h],channelAreaM2:Math.round(areaThresholdCells*cellM*cellM),channelThresholdCells:areaThresholdCells,accumulationSource:pageAcc?'supplied':'engine-d8',channelCells:{own:ownChannelCells,withPageMask:channel.reduce((a,b)=>a+b,0)},coverage:cov,
      soilGroup:input.soilGroup||null,minLengthM:minLenM,candidates:cand.length,passedRules:passed.length,accepted:swales.length})};
  out.determinismHash=fnv1a(JSON.stringify([out.swales.map(s=>s.properties.id+s.geometry.coordinates.join(';')),out.rejections]));
  return out;
}
const api={VERSION,LIMITS,run,drawdownFor,_internal:{slopePct,flowAccumulation,traceContours,dilate}};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.EarthlinePropertySwales=api;
})(typeof window!=='undefined'?window:globalThis);
