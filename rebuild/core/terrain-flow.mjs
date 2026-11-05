/**
 * Pure, deterministic DEM routing based on Earthline's earlier priority-flood
 * and D8 accumulation design. No Mapbox/DOM, geography-specific quotas or
 * swale generation. Real DEM coverage and vertical-datum qualifications remain
 * responsibility of the source adapter.
 *
 * This is a terrain-derived runoff screening model, NOT field hydrology or a
 * construction-ready engineering analysis.
 */
const neighbors=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
const finite=Number.isFinite;
class MinHeap {
  #a=[];
  push(item){
    const a=this.#a;let i=a.length;a.push(item);
    while(i){const p=(i-1)>>1;if(!this.#lt(item,a[p]))break;a[i]=a[p];i=p;}
    a[i]=item;
  }
  pop(){
    const a=this.#a,root=a[0],last=a.pop();
    if(a.length){let i=0;while(i*2+1<a.length){
      let c=i*2+1;if(c+1<a.length&&this.#lt(a[c+1],a[c]))c++;
      if(!this.#lt(a[c],last))break;
      a[i]=a[c];i=c;
    }a[i]=last;}
    return root;
  }
  #lt(a,b){return a.z<b.z || (a.z===b.z && a.i<b.i);}
  get length(){return this.#a.length;}
}
const idx=(x,y,w)=>y*w+x;
function validInput(grid){
  if(!grid||!Number.isInteger(grid.width)||!Number.isInteger(grid.height)||
     grid.width<3||grid.height<3||grid.width*grid.height>5_000_000||
     !finite(grid.cellSizeM)||grid.cellSizeM<=0||
     !finite(grid.originX)||!finite(grid.originY)||
     typeof grid.metricCrs!=='string'||!grid.metricCrs.trim())return false;
  const n=grid.width*grid.height;
  if(!(Array.isArray(grid.demMeters)||ArrayBuffer.isView(grid.demMeters))||
     grid.demMeters.length!==n)return false;
  if(!(Array.isArray(grid.validity)||ArrayBuffer.isView(grid.validity))||
     grid.validity.length!==n)return false;
  for(let i=0;i<n;i++)
    if((grid.validity[i]!==0&&grid.validity[i]!==1)||
       (grid.validity[i]===1&&!finite(grid.demMeters[i])))return false;
  return true;
}
export function deriveTerrainFlow(grid,{pitRaiseM=0.001}={}){
  if(!validInput(grid))return {status:'blocked',errors:['DEM_INCOMPLETE_OR_INVALID']};
  if(!finite(pitRaiseM)||pitRaiseM<=0||pitRaiseM>grid.cellSizeM*0.01)
    return {status:'blocked',errors:['PIT_FILL_INCREMENT_INVALID']};
  const {width:w,height:h,validity,demMeters}=grid,n=w*h;
  const filledMeters=Float64Array.from(demMeters,v=>finite(v)?v:NaN);
  const seen=new Uint8Array(n),outlet=new Uint8Array(n);
  const heap=new MinHeap();
  function seed(i){
    if(seen[i])return;seen[i]=1;outlet[i]=1;
    heap.push({i,z:filledMeters[i]});
  }
  let covered=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=idx(x,y,w);
    if(!validity[i]){seen[i]=1;continue;}
    covered++;
    const edge=x===0||y===0||x===w-1||y===h-1;
    // An internal DEM no-data hole is NOT a hydrologically proven outlet.
    // Only independently established tile-edge outlets seed priority flood.
    // A valid island unreachable from the raster edge fails closed below.
    if(edge)seed(i);
  }
  if(!covered)return {status:'blocked',errors:['DEM_NO_VALID_CELLS']};
  let visited=0;
  while(heap.length){
    const p=heap.pop(),x=p.i%w,y=Math.floor(p.i/w);visited++;
    for(const [dx,dy] of neighbors){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h)continue;
      const j=idx(xx,yy,w);
      if(seen[j]||!validity[j])continue;
      seen[j]=1;
      // Strict descent on the ROUTING surface. Original DEM is never changed.
      filledMeters[j]=Math.max(filledMeters[j],p.z+pitRaiseM);
      heap.push({i:j,z:filledMeters[j]});
    }
  }
  if(visited!==covered)return {status:'blocked',errors:['UNREACHABLE_VALID_TERRAIN']};
  const to=new Int32Array(n);to.fill(-1);
  const slopePct=new Float64Array(n);slopePct.fill(NaN);
  const accCells=new Float64Array(n);accCells.fill(NaN);
  const order=[];
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=idx(x,y,w);if(!validity[i])continue;
    accCells[i]=1;order.push(i);
    if(outlet[i])continue;
    let best=-1,bestGradient=0;
    for(const [dx,dy] of neighbors){
      const xx=x+dx,yy=y+dy;
      if(xx<0||yy<0||xx>=w||yy>=h)continue;
      const j=idx(xx,yy,w);if(!validity[j])continue;
      const dist=Math.hypot(dx,dy)*grid.cellSizeM;
      const gradient=(filledMeters[i]-filledMeters[j])/dist;
      if(gradient>bestGradient){bestGradient=gradient;best=j;}
    }
    to[i]=best;slopePct[i]=bestGradient*100;
  }
  // Descending routing elevations ensure upstream contributions precede
  // downstream cells. Tie-break on index for reproducibility.
  order.sort((a,b)=>filledMeters[b]-filledMeters[a]||a-b);
  for(const i of order)if(to[i]>=0)accCells[to[i]]+=accCells[i];
  for(let i=0;i<n;i++)if(validity[i]&&to[i]>=0){
    if(!finite(accCells[i])||!finite(accCells[to[i]])||
       filledMeters[i]<=filledMeters[to[i]])
      return {status:'blocked',errors:['D8_ROUTING_NOT_STRICTLY_DOWNHILL']};
  }
  return {status:'derived',errors:[],width:w,height:h,to,accCells,
    filledMeters,slopePct,validCells:covered,routingModel:'priority-flood-D8',
    pitRaiseM,gridId:grid.gridId||null};
}
/**
 * Convert verified D8 cell-to-cell links into eligible modeled-flow segments.
 * Source-derived runoff depth (metres over the specified modeled period) MUST
 * be supplied explicitly. Missing rainfall/runoff model => blocked, never
 * auto-filled with a regional average.
 */
export function routedFlowSegments(grid,derived,{runoffDepthM,modelSourceId}={}){
  if(derived?.status!=='derived'||derived.width!==grid?.width||
     derived.height!==grid?.height)
    return {status:'blocked',errors:['D8_GRID_MISMATCH']};
  if(!finite(runoffDepthM)||runoffDepthM<=0||
     typeof modelSourceId!=='string'||!modelSourceId.trim())
    return {status:'blocked',errors:['SOURCE_BACKED_RUNOFF_DEPTH_MISSING']};
  const segments=[];
  const n=grid.width*grid.height,w=grid.width;
  for(let i=0;i<n;i++){
    const j=derived.to[i];if(j<0)continue;
    const x=i%w,y=Math.floor(i/w),nx=j%w,ny=Math.floor(j/w);
    if(Math.max(Math.abs(x-nx),Math.abs(y-ny))!==1 ||
       derived.filledMeters[i]<=derived.filledMeters[j])
      return {status:'blocked',errors:['INVALID_D8_LINK']};
    const volume=derived.accCells[i]*grid.cellSizeM**2*runoffDepthM;
    if(!finite(volume)||volume<=0)
      return {status:'blocked',errors:['INVALID_ROUTED_RUNOFF_VOLUME']};
    segments.push({id:grid.gridId+':'+i+'>'+j,modelSourceId,
      from:[grid.originX+(x+.5)*grid.cellSizeM,
            grid.originY+(y+.5)*grid.cellSizeM],
      to:[grid.originX+(nx+.5)*grid.cellSizeM,
          grid.originY+(ny+.5)*grid.cellSizeM],
      modeledRunoffM3:volume});
  }
  return {status:'derived',errors:[],segments,modelSourceId,
    runoffDepthM,gridId:grid.gridId};
}
