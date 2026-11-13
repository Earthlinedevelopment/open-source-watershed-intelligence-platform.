/* Earthline bare-earth grid processing — pure deterministic terrain primitives.
   The caller must supply a verified bare-earth elevation raster and provenance.
   No network access, map state, visual DEM or canopy-height substitution. */
export function validateTerrainGrid(grid) {
  if(!grid||grid.bareEarth!==true||grid.complete!==true)throw new Error('Verified bare-earth elevation unavailable');
  const {width,height,cellSizeM,elevations}=grid;
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<3||height<3 ||
    !Number.isFinite(cellSizeM)||cellSizeM<=0 ||
    !elevations||elevations.length!==width*height ||
    Array.from(elevations).some(v=>!Number.isFinite(v)))throw new Error('Incomplete elevation grid');
  return {width,height,cellSizeM,elevations};
}
const DIRECTIONS=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];
export function analyzeBareEarthGrid(grid){
  const {width:w,height:h,cellSizeM:d,elevations:z}=validateTerrainGrid(grid);
  const n=w*h,slopes=new Float64Array(n),downstream=new Int32Array(n).fill(-1),accumulation=new Float64Array(n).fill(1);
  // Central finite differences; one-sided differences at the outer grid edges.
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    const i=y*w+x,left=y*w+Math.max(0,x-1),right=y*w+Math.min(w-1,x+1);
    const up=Math.max(0,y-1)*w+x,down=Math.min(h-1,y+1)*w+x;
    const dx=(z[right]-z[left])/(d*(Math.min(w-1,x+1)-Math.max(0,x-1)));
    const dy=(z[down]-z[up])/(d*(Math.min(h-1,y+1)-Math.max(0,y-1)));
    slopes[i]=100*Math.hypot(dx,dy);
    let steepest=0,best=-1;
    for(const [ox,oy] of DIRECTIONS){
      const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=w||ny>=h)continue;
      const target=ny*w+nx,dist=d*Math.hypot(ox,oy);
      const gradient=(z[i]-z[target])/dist;
      if(gradient>steepest){steepest=gradient;best=target}
    }
    downstream[i]=best;
  }
  // Topological accumulation: process high cells first. Deterministic tie-break by index.
  const order=Array.from({length:n},(_,i)=>i).sort((a,b)=>z[b]-z[a]||a-b);
  for(const i of order)if(downstream[i]>=0)accumulation[downstream[i]]+=accumulation[i];
  return {width:w,height:h,cellSizeM:d,slopes,downstream,accumulation,
    accumulationUnits:'upstream_grid_cells'};
}
export function rasterizeNoBuild({width,height,cellSizeM,exclusions,channelIndices=[],channelsBufferM=3,
  roadBufferM=3.05,waterBufferM=18}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||
    !Number.isFinite(cellSizeM)||cellSizeM<=0)throw new Error('Invalid exclusion grid');
  if(!exclusions||exclusions.complete!==true ||
    !['features-found','verified-clear','screened-clear'].includes(exclusions.acquisition) ||
    !Array.isArray(exclusions.roads)||!Array.isArray(exclusions.water))throw new Error('Exclusions unverified');
  const n=width*height,mask=new Uint8Array(n);
  function mark(indices,radius){
    if(!Array.isArray(indices)||indices.some(v=>!Number.isInteger(v)||v<0||v>=n))throw new Error('Bad exclusion cells');
    const r=Math.ceil(radius/cellSizeM);
    for(const i of indices){
      const x=i%width,y=Math.floor(i/width);
      for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
        if(Math.hypot(dx,dy)*cellSizeM>radius)continue;
        const xx=x+dx,yy=y+dy;if(xx>=0&&xx<width&&yy>=0&&yy<height)mask[yy*width+xx]=1;
      }
    }
  }
  mark(exclusions.roads,roadBufferM);
  mark(exclusions.water,waterBufferM);
  mark(channelIndices,channelsBufferM);
  return mask;
}
