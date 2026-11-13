/* Earthline Property Swale Engine — pure R1–R13 acceptance kernel.
   Staging only. No global page/map reads, no fallback to unverified data.
   Input candidates are contour traces from the future bare-earth generator.
   Not a production engine until full terrain/exclusion acquisition is connected. */
export const ENGINE_VERSION='property-swale-kernel-0.1.0';
export const LIMITS=Object.freeze({slopeMin:0.2,slopeMax:4,minSpacingM:4.572,
  targetSpacingMaxM:7.620,waterBufferM:18,channelBufferM:3,
  roadsBufferM:3.05,contourRangeM:0.3,maxTortuosity:2.15,drawdownHours:48});
const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
const lineLength=pts=>pts.slice(1).reduce((sum,p,i)=>sum+length(pts[i],p),0);
const median=v=>[...v].sort((a,b)=>a-b)[Math.floor(v.length/2)];
const minLength=cell=>Math.min(40,Math.max(12,4*cell));
const fail=(message,reason='R10')=>({status:'failed',message,swales:[],rejections:{[reason]:1},evidence:{acquisition:'failed'},version:ENGINE_VERSION});
function pointSegmentDistance(p,a,b){
  const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy;
  const t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;
  return length(p,[a[0]+t*dx,a[1]+t*dy]);
}
function linesTooClose(a,b,minM){
  // Sample endpoints and midpoints on each segment, not only corresponding vertices.
  for(const [aLine,bLine] of [[a,b],[b,a]]){
    for(let i=1;i<aLine.length;i++){
      const p=aLine[i-1],q=aLine[i],n=Math.max(1,Math.ceil(length(p,q)/(minM/3)));
      for(let k=0;k<=n;k++){
        const t=k/n,x=[p[0]*(1-t)+q[0]*t,p[1]*(1-t)+q[1]*t];
        for(let j=1;j<bLine.length;j++)if(pointSegmentDistance(x,bLine[j-1],bLine[j])<minM)return true;
      }
    }
  }
  return false;
}
export function validateCandidate(c,context){
  const pts=c?.points,slopes=c?.slopes,elev=c?.elevations;
  const rejected=reason=>({ok:false,reason});
  if(!Array.isArray(pts)||pts.length<5||pts.some(p=>!Array.isArray(p)||p.length!==2||p.some(v=>!Number.isFinite(v)))||
      !Array.isArray(slopes)||slopes.length!==pts.length||slopes.some(v=>!Number.isFinite(v))||
      !Array.isArray(elev)||elev.length!==pts.length||elev.some(v=>!Number.isFinite(v)))return rejected('R10');
  if(Math.max(...elev)-Math.min(...elev)>LIMITS.contourRangeM)return rejected('R1');
  const mean=slopes.reduce((a,b)=>a+b,0)/slopes.length;
  if(mean>LIMITS.slopeMax)return rejected('R2');
  for(let i=0;i<=slopes.length-5;i++)if(median(slopes.slice(i,i+5))>LIMITS.slopeMax)return rejected('R3');
  const span=lineLength(pts);
  if(span<minLength(context.cellSizeM))return rejected('R4'); // no maximum swale length
  if(c.obstructionDistanceM===undefined||!Number.isFinite(c.obstructionDistanceM)||c.obstructionDistanceM<LIMITS.roadsBufferM)return rejected('R6');
  if(c.mappedWaterDistanceM===undefined||!Number.isFinite(c.mappedWaterDistanceM)||c.mappedWaterDistanceM<LIMITS.waterBufferM)return rejected('R7');
  if(c.modeledChannelDistanceM===undefined||!Number.isFinite(c.modeledChannelDistanceM)||c.modeledChannelDistanceM<LIMITS.channelBufferM)return rejected('R8');
  if(c.insideProperty!==true||c.propertyBoundaryDistanceM<LIMITS.roadsBufferM)return rejected('R9');
  if(!Number.isFinite(c.propertyBoundaryDistanceM))return rejected('R10');
  const chord=length(pts[0],pts[pts.length-1]);
  if(chord<=0||span/chord>LIMITS.maxTortuosity)return rejected('R11');
  if(mean<LIMITS.slopeMin)return rejected('R12');
  if(!Number.isFinite(c.drawdownHours)||c.drawdownHours>LIMITS.drawdownHours)return rejected('R13');
  return {ok:true,mean_slope_pct:mean,length_m:span,max_5pt_median_slope_pct:Math.max(...slopes.slice(0,-4).map((_,i)=>median(slopes.slice(i,i+5))))};
}
export function screenProperty({boundary,elevation,exclusion,candidates,cellSizeM,runId}={}){
  if(!boundary||!Array.isArray(boundary)||boundary.length<3)return fail('Property boundary unavailable');
  if(!elevation||elevation.complete!==true||elevation.bareEarth!==true)return fail('Elevation unavailable · try again');
  if(!exclusion||exclusion.complete!==true||!['features-found','verified-clear','screened-clear'].includes(exclusion.acquisition))return fail('Road and water check unavailable · try again');
  if(!Number.isFinite(cellSizeM)||cellSizeM<=0||!Array.isArray(candidates))return fail('Property inputs incomplete');
  const rejections={},swales=[];
  for(const c of candidates){
    const verdict=validateCandidate(c,{cellSizeM});
    if(!verdict.ok){rejections[verdict.reason]=(rejections[verdict.reason]||0)+1;continue;}
    if(swales.some(s=>linesTooClose(s._points,c.points,LIMITS.minSpacingM))){rejections.R5=(rejections.R5||0)+1;continue;}
    swales.push({id:c.id,length_m:verdict.length_m,mean_slope_pct:verdict.mean_slope_pct,
      max_5pt_median_slope_pct:verdict.max_5pt_median_slope_pct,
      geometry:{type:'LineString',coordinates:c.lngLat},_points:c.points});
  }
  for(const s of swales)delete s._points;
  return {status:'screened',message:swales.length+' proposed swales · screening result, not design',
    swales,rejections,evidence:{elevationSource:elevation.source,exclusionSource:exclusion.source,
      acquisition:exclusion.acquisition,runId},version:ENGINE_VERSION};
}
