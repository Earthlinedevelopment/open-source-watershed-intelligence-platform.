/**
 * Independent numerical checks against a metric DEM and frozen exclusion raster.
 * This does not fetch a source, choose a swale, or declare a dataset authoritative.
 * All geometry is in grid.metricCrs, in metres, with cell (0,0)'s lower left
 * corner at (originX, originY). Caller must prove lon/lat projection alignment.
 */
const EPS = 1e-9;
const finite = Number.isFinite;
const label = s => typeof s === 'string' && s.trim().length > 0;
const point = p => Array.isArray(p) && p.length === 2 && p.every(finite);
const validArray = (v,n) => (Array.isArray(v) || ArrayBuffer.isView(v)) && v.length === n;
const at = (g,x,y) => y*g.width+x;
const inGrid = (g,x,y) => x>=0 && y>=0 && x<g.width && y<g.height;
const center = (g,x,y) => [
  g.originX + (x+.5)*g.cellSizeM,
  g.originY + (y+.5)*g.cellSizeM
];
const indexAt = (g,p) => [
  Math.floor((p[0]-g.originX)/g.cellSizeM),
  Math.floor((p[1]-g.originY)/g.cellSizeM)
];
const dot = (a,b) => a[0]*b[0]+a[1]*b[1];
const sub = (a,b) => [a[0]-b[0],a[1]-b[1]];
const cross = (a,b) => a[0]*b[1]-a[1]*b[0];
function pointSegmentSquared(p,a,b) {
  const d=sub(b,a),m=dot(d,d);
  if(m<=EPS) return dot(sub(p,a),sub(p,a));
  const t=Math.min(1,Math.max(0,dot(sub(p,a),d)/m));
  return dot(sub(p,[a[0]+t*d[0],a[1]+t*d[1]]),
             sub(p,[a[0]+t*d[0],a[1]+t*d[1]]));
}
function pointRectSquared(p,x0,y0,x1,y1) {
  const dx=Math.max(x0-p[0],0,p[0]-x1),dy=Math.max(y0-p[1],0,p[1]-y1);
  return dx*dx+dy*dy;
}
function between(v,a,b) {return v>=Math.min(a,b)-EPS && v<=Math.max(a,b)+EPS;}
function onSegment(p,a,b) {
  return Math.abs(cross(sub(b,a),sub(p,a)))<EPS &&
    between(p[0],a[0],b[0]) && between(p[1],a[1],b[1]);
}
function segmentIntersection(a,b,c,d) {
  const p=cross(sub(b,a),sub(c,a)),q=cross(sub(b,a),sub(d,a)),
    r=cross(sub(d,c),sub(a,c)),s=cross(sub(d,c),sub(b,c));
  if (((p>EPS&&q< -EPS)||(p< -EPS&&q>EPS)) &&
      ((r>EPS&&s< -EPS)||(r< -EPS&&s>EPS))) return true;
  return (Math.abs(p)<=EPS&&onSegment(c,a,b)) ||
    (Math.abs(q)<=EPS&&onSegment(d,a,b)) ||
    (Math.abs(r)<=EPS&&onSegment(a,c,d)) ||
    (Math.abs(s)<=EPS&&onSegment(b,c,d));
}
function segmentTouchesSquare(a,b,x0,y0,size,radius) {
  const x1=x0+size,y1=y0+size;
  if ((a[0]>=x0&&a[0]<=x1&&a[1]>=y0&&a[1]<=y1) ||
      (b[0]>=x0&&b[0]<=x1&&b[1]>=y0&&b[1]<=y1))
    return true;
  const corners=[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];
  for (let k=0;k<4;k++)
    if(segmentIntersection(a,b,corners[k],corners[(k+1)%4]))return true;
  const r2=(radius+EPS)**2;
  if(pointRectSquared(a,x0,y0,x1,y1)<=r2 ||
     pointRectSquared(b,x0,y0,x1,y1)<=r2)return true;
  return corners.some(p=>pointSegmentSquared(p,a,b)<=r2);
}
function gridOk(g) {
  if(!g||!Number.isInteger(g.width)||!Number.isInteger(g.height)||
     g.width<3||g.height<3||!finite(g.cellSizeM)||g.cellSizeM<=0||
     !finite(g.originX)||!finite(g.originY)||!label(g.metricCrs)||
     !label(g.gridId)||!label(g.maskFingerprint))return false;
  const n=g.width*g.height;
  return n<=5_000_000 && validArray(g.demMeters,n) &&
    validArray(g.validity,n) && validArray(g.noBuild,n);
}
function hornSlope(g,x,y) {
  if(x===0||y===0||x===g.width-1||y===g.height-1)return null;
  const z=[];
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
    const i=at(g,x+dx,y+dy);
    if(g.validity[i]!==1||!finite(g.demMeters[i]))return null;
    z.push(g.demMeters[i]);
  }
  const dzdx=((z[2]+2*z[5]+z[8])-(z[0]+2*z[3]+z[6]))/(8*g.cellSizeM);
  const dzdy=((z[6]+2*z[7]+z[8])-(z[0]+2*z[1]+z[2]))/(8*g.cellSizeM);
  return Math.hypot(dzdx,dzdy)*100;
}
function allFootprintCells(g,polyline,radius) {
  const cells=new Set();
  for(let k=1;k<polyline.length;k++){
    const a=polyline[k-1],b=polyline[k];
    const x0=Math.floor((Math.min(a[0],b[0])-radius-g.originX)/g.cellSizeM)-1,
      x1=Math.floor((Math.max(a[0],b[0])+radius-g.originX)/g.cellSizeM)+1,
      y0=Math.floor((Math.min(a[1],b[1])-radius-g.originY)/g.cellSizeM)-1,
      y1=Math.floor((Math.max(a[1],b[1])+radius-g.originY)/g.cellSizeM)+1;
    if(x1-x0>g.width+2||y1-y0>g.height+2)return null;
    // Absence outside the raster must NEVER be silently clipped to 'safe'.
    if(x0< -1||y0< -1||x1>g.width||y1>g.height)return null;
    for(let y=Math.max(0,y0);y<=Math.min(g.height-1,y1);y++)
      for(let x=Math.max(0,x0);x<=Math.min(g.width-1,x1);x++){
        const sqX=g.originX+x*g.cellSizeM,sqY=g.originY+y*g.cellSizeM;
        if(segmentTouchesSquare(a,b,sqX,sqY,g.cellSizeM,radius))
          cells.add(at(g,x,y));
      }
  }
  return cells;
}
function flowEvidence(g,path,flows,modelId) {
  let crossings=0,runoff=0;
  const seen=new Set();
  for(const f of flows){
    if(!f||!label(f.id)||seen.has(f.id))continue;
    seen.add(f.id);
    if(!point(f.from)||!point(f.to)||!finite(f.modeledRunoffM3)||
       f.modeledRunoffM3<=0||f.modelSourceId!==modelId)continue;
    const [sx,sy]=indexAt(g,f.from),[tx,ty]=indexAt(g,f.to);
    if(!inGrid(g,sx,sy)||!inGrid(g,tx,ty)||
       g.validity[at(g,sx,sy)]!==1||g.validity[at(g,tx,ty)]!==1)continue;
    let crosses=false;
    for(let k=1;k<path.length;k++)
      if(segmentIntersection(path[k-1],path[k],f.from,f.to)){
        crosses=true;break;
      }
    if(crosses){crossings++;runoff+=f.modeledRunoffM3;}
  }
  return {crossings,runoff};
}
export function auditMetricCorridor({grid,centerlineM,halfWidthM,flowSegments,flowModelId,maskFingerprint}) {
  const fail=(code,detail={})=>({status:'blocked',errors:[code],...detail});
  if(!gridOk(grid))return fail('INVALID_OR_INCOMPLETE_METRIC_GRID');
  if(grid.maskFingerprint!==maskFingerprint)return fail('EXCLUSION_MASK_FINGERPRINT_MISMATCH');
  if(!Array.isArray(centerlineM)||centerlineM.length<2||!centerlineM.every(point)||
     !finite(halfWidthM)||halfWidthM<=0)return fail('CORRIDOR_GEOMETRY_OR_WIDTH_INVALID');
  if(!label(flowModelId)||!Array.isArray(flowSegments))
    return fail('FLOW_MODEL_EVIDENCE_MISSING');
  for(let i=1;i<centerlineM.length;i++)
    if(Math.hypot(...sub(centerlineM[i],centerlineM[i-1]))<=EPS)
      return fail('CORRIDOR_ZERO_LENGTH_EDGE');
  const cells=allFootprintCells(grid,centerlineM,halfWidthM);
  if(!cells||!cells.size)return fail('CORRIDOR_OUTSIDE_VERIFIED_RASTER');
  let maxLocalPct=0;
  for(const i of cells) {
    const x=i%grid.width,y=Math.floor(i/grid.width);
    if(grid.validity[i]!==1)return fail('CORRIDOR_HAS_UNKNOWN_TERRAIN',{x,y});
    if(grid.noBuild[i]!==0)return fail('CORRIDOR_INTERSECTS_NO_BUILD',{x,y});
    const slope=hornSlope(grid,x,y);
    if(slope===null)return fail('CORRIDOR_SLOPE_UNRESOLVED',{x,y});
    maxLocalPct=Math.max(maxLocalPct,slope);
    if(maxLocalPct>4+EPS)
      return fail('CORRIDOR_EXCEEDS_4_PCT',{x,y,maxLocalPct});
  }
  const flow=flowEvidence(grid,centerlineM,flowSegments,flowModelId);
  if(!flow.crossings||!finite(flow.runoff)||flow.runoff<=0)
    return fail('POSITIVE_RUNOFF_CROSSING_NOT_PROVEN');
  return {status:'verified',errors:[],
    slopeAudit:{status:'verified',coverage:'full-corridor',checkedCells:cells.size,maxLocalPct},
    exclusionAudit:{status:'verified',coverage:'full-corridor-footprint',
      checkedCells:cells.size,unsafeIntersections:0,maskFingerprint},
    flowAudit:{status:'verified',crossingCount:flow.crossings,
      positiveRunoffEvidence:flow.runoff,modelSourceId:flowModelId},
    evidence:{gridId:grid.gridId,metricCrs:grid.metricCrs,footprintCells:cells.size}};
}
/**
 * Recompute raster-based audits rather than trusting supplier-written audit fields.
 * SOURCE ALIGNMENT NOT YET PROVEN: caller must independently verify that the
 * published lon/lat coordinates correspond to the exact metric centerline.
 */
export function certifyRasterCandidate(candidate,{grid,flowSegments,flowModelId}){
  if(!candidate||!Array.isArray(candidate.swales)||!candidate.sources?.exclusions)
    return {status:'blocked',errors:['CANDIDATE_OR_EXCLUSION_SOURCE_MISSING']};
  const verified=[];
  const errors=[];
  for(const swale of candidate.swales){
    const result=auditMetricCorridor({grid,centerlineM:swale.centerlineM,
      halfWidthM:swale.halfWidthM,flowSegments,flowModelId,
      maskFingerprint:candidate.sources.exclusions.fingerprint});
    if(result.status==='blocked'){
      errors.push(...result.errors.map(code=>String(swale.id||'(missing)')+':'+code));
      continue;
    }
    verified.push({...swale,slopeAudit:result.slopeAudit,
      flowAudit:result.flowAudit,
      exclusionAudit:{...result.exclusionAudit,corridorId:swale.id},
      rasterEvidence:result.evidence});
  }
  if(errors.length)return {status:'blocked',errors};
  return {status:'audited',candidate:{...candidate,swales:verified}};
}
