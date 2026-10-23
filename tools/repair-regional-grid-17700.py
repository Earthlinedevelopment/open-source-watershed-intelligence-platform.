from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")

old='''  function buildPlan(anchor,z,elevM,forceRegional=false){
    const d=tileDimensions();
    const elevationM=Number(elevM||0);
    const highMountain=elevationM>=1200;
    const upland=elevationM>=600;
    let rows=z<=13.5?9:(z<=14.8?7:(z<=15.8?5:1));

    // BUILD-CHECK-15765:
    // Mountain analyses remain regional even when the searched place is an address
    // or the user has zoomed in closely. The corridor extends for miles north and south.
    if(forceRegional)rows=Math.max(rows,7);
    if(upland)rows=Math.max(rows,7);
    if(highMountain)rows=Math.max(rows,9);
    if(rows%2===0)rows+=1;

    const cols=1,stepY=d.h*.90,tiles=[];
    for(let r=0;r<rows;r++){
      const northM=((rows-1)/2-r)*stepY;
      const lat=anchor.lat+northM/111320,lng=anchor.lng;
      tiles.push({row:r,col:0,lat,lng,poly:rectangle(lng,lat,d.w,d.h),acres:TILE_ACRES,dist:Math.abs(northM),status:"pending"});
    }
    tiles.sort((a,b)=>a.dist-b.dist);
    const northM=((rows-1)/2)*stepY+d.h/2;
    const extent={
      minLng:anchor.lng-d.w/(2*metersPerLng(anchor.lat)),maxLng:anchor.lng+d.w/(2*metersPerLng(anchor.lat)),
      minLat:anchor.lat-northM/111320,maxLat:anchor.lat+northM/111320,
      widthM:d.w,heightM:northM*2,rows,cols,
      acres:d.w*(northM*2)/4046.8564224
    };
    const mode=highMountain?"high-elevation":(upland?"upland":(forceRegional?"regional-offset":"regional"));
    return {tiles,extent,d,mode,elevationM,highMountain,upland};
  }'''

new='''  function buildPlan(anchor,z,elevM,forceRegional=false){
    const d=tileDimensions();
    const elevationM=Number(elevM||0);
    const highMountain=elevationM>=1200;
    const upland=elevationM>=600;
    const statewide=Number(z)<=13.5;

    /* EARTHLINE 17700 — statewide Regional sampling uses the same nine real
       DEM samples but distributes them across two dimensions instead of the
       legacy one-column strip. */
    if(statewide){
      let west=anchor.lng-.75,east=anchor.lng+.75,south=anchor.lat-.75,north=anchor.lat+.75;
      try{
        const b=earthlineMap&&earthlineMap.getBounds&&earthlineMap.getBounds();
        if(b){west=Number(b.getWest());east=Number(b.getEast());south=Number(b.getSouth());north=Number(b.getNorth());}
      }catch(_){}
      if(![west,east,south,north].every(Number.isFinite)||!(east>west)||!(north>south)){
        west=anchor.lng-.75;east=anchor.lng+.75;south=anchor.lat-.75;north=anchor.lat+.75;
      }
      const insetX=(east-west)*.14,insetY=(north-south)*.14;
      const xs=[west+insetX,(west+east)/2,east-insetX];
      const ys=[north-insetY,(north+south)/2,south+insetY];
      const tiles=[];
      for(let r=0;r<3;r++)for(let c=0;c<3;c++){
        const lng=xs[c],lat=ys[r],dist=haversineM([anchor.lng,anchor.lat],[lng,lat]);
        tiles.push({row:r,col:c,lat,lng,poly:rectangle(lng,lat,d.w,d.h),acres:TILE_ACRES,dist,status:"pending"});
      }
      tiles.sort((a,b)=>a.dist-b.dist||a.row-b.row||a.col-b.col);
      const widthM=Math.max(1,(east-west)*metersPerLng(anchor.lat));
      const heightM=Math.max(1,(north-south)*111320);
      const extent={minLng:west,maxLng:east,minLat:south,maxLat:north,widthM,heightM,rows:3,cols:3,acres:widthM*heightM/4046.8564224};
      const mode=highMountain?"high-elevation":(upland?"upland":(forceRegional?"regional-offset":"regional"));
      return {tiles,extent,d,mode,elevationM,highMountain,upland};
    }

    let rows=z<=14.8?7:(z<=15.8?5:1);
    if(forceRegional)rows=Math.max(rows,7);
    if(upland)rows=Math.max(rows,7);
    if(highMountain)rows=Math.max(rows,9);
    if(rows%2===0)rows+=1;

    const cols=1,stepY=d.h*.90,tiles=[];
    for(let r=0;r<rows;r++){
      const northM=((rows-1)/2-r)*stepY;
      const lat=anchor.lat+northM/111320,lng=anchor.lng;
      tiles.push({row:r,col:0,lat,lng,poly:rectangle(lng,lat,d.w,d.h),acres:TILE_ACRES,dist:Math.abs(northM),status:"pending"});
    }
    tiles.sort((a,b)=>a.dist-b.dist);
    const northM=((rows-1)/2)*stepY+d.h/2;
    const extent={
      minLng:anchor.lng-d.w/(2*metersPerLng(anchor.lat)),maxLng:anchor.lng+d.w/(2*metersPerLng(anchor.lat)),
      minLat:anchor.lat-northM/111320,maxLat:anchor.lat+northM/111320,
      widthM:d.w,heightM:northM*2,rows,cols,
      acres:d.w*(northM*2)/4046.8564224
    };
    const mode=highMountain?"high-elevation":(upland?"upland":(forceRegional?"regional-offset":"regional"));
    return {tiles,extent,d,mode,elevationM,highMountain,upland};
  }'''

if s.count(old)!=1:
    raise SystemExit(f"BUILD_PLAN_COUNT={s.count(old)}")
s=s.replace(old,new,1)

old2='''      const deadline=performance.now()+55000;
      for(let i=0;i<plan.tiles.length;i++){
        if(earthlineIsStale(gen))throw new Error("Analysis cancelled");
        if(performance.now()>=deadline){for(let j=i;j<plan.tiles.length;j++)plan.tiles[j].status="withheld";state.withheld+=plan.tiles.length-i;break;}'''
new2='''      const deadline=performance.now()+55000;
      for(let i=0;i<plan.tiles.length;i++){
        if(earthlineIsStale(gen))throw new Error("Analysis cancelled");
        if(performance.now()>=deadline){
          for(let j=i;j<plan.tiles.length;j++)plan.tiles[j].status="withheld";
          state.withheld+=plan.tiles.length-i;
          throw new Error("Regional analysis incomplete — "+state.withheld+" of "+plan.tiles.length+" terrain tiles were not analyzed before the governed deadline.");
        }'''
if s.count(old2)!=1:
    raise SystemExit(f"DEADLINE_COUNT={s.count(old2)}")
s=s.replace(old2,new2,1)

p.write_text(s)
print("EARTHLINE_M75_REGIONAL_GRID_REPAIR_OK")
