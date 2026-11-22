/* Earthline R15 candidate: independent, georeferenced 30 m USDA Forest Service
   NLCD Tree Canopy Cover (TCC), CONUS. Scientific screening only, not site design.
   No canvas-color inference, no second swale engine and no paid APIs.
   If data acquisition fails, the caller MUST refuse to publish swales. */
(function (root) {
  'use strict';
  const URL = 'https://ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-canopy-r15-probe';
  const SOURCE = 'USDA Forest Service NLCD Tree Canopy Cover, 30m (Earthline CORS relay)';
  const THRESHOLD_PCT = 35; // conservative closed/wooded canopy screening only
  const SPACING_M = 15; // subsamples 30m source to protect raster edges
  const CHUNK = 20;
  function createPoints({frame,w,h,cellM}) {
    const step=Math.max(1,Math.round(SPACING_M/cellM));
    const xs=[],ys=[];
    for(let x=0;x<w;x+=step)xs.push(x);
    if(xs[xs.length-1]!==w-1)xs.push(w-1);
    for(let y=0;y<h;y+=step)ys.push(y);
    if(ys[ys.length-1]!==h-1)ys.push(h-1);
    const points=[];
    for(let j=0;j<ys.length;j++)for(let i=0;i<xs.length;i++){
      const xy=frame.toLngLat(xs[i],ys[j]);
      if(!xy||!Number.isFinite(xy[0])||!Number.isFinite(xy[1]))throw Error('canopy-grid-georef-unavailable');
      points.push({x:xs[i],y:ys[j],lng:xy[0],lat:xy[1],i,j});
    }
    return {xs,ys,points};
  }
  async function fetchGroup(points,signal,fetchFn) {
    const response=await fetchFn(URL,{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({points:points.map(p=>[+p.lng.toFixed(7),+p.lat.toFixed(7)])}),
      mode:'cors',cache:'no-store',credentials:'omit',signal
    });
    if(!response.ok)throw Error('canopy-relay-http-'+response.status);
    const json=await response.json();
    if(!Array.isArray(json.values)||json.values.length!==points.length||
       json.source!=='USDA Forest Service NLCD Tree Canopy Cover 30m'||json.resolutionM!==30)
      throw Error('canopy-relay-source-or-coverage-unverified');
    const out=json.values.map(Number);
    if(out.some(v=>!Number.isFinite(v)||v<0||v>100))throw Error('canopy-relay-invalid-data');
    return out;
  }
  function nearest(xs,v) {
    let lo=0,hi=xs.length-1;
    while(lo<hi){let mid=Math.floor((lo+hi)/2);if(xs[mid]<v)lo=mid+1;else hi=mid;}
    if(lo===0)return 0;
    return Math.abs(xs[lo]-v)<Math.abs(xs[lo-1]-v)?lo:lo-1;
  }
  async function load(params) {
    const {frame,w,h,cellM,inside}=params||{};
    const invalid=reason=>({ok:false,reason,source:SOURCE});
    if(!frame||typeof frame.toLngLat!=='function'||!(w>0&&h>0&&cellM>0)||!inside||inside.length!==w*h)
      return invalid('canopy-grid-inputs-unavailable');
    const loc=frame.toLngLat(w/2,h/2);
    if(!(loc[0]>=-125&&loc[0]<=-66&&loc[1]>=24&&loc[1]<=50))return invalid('usfs-conus-canopy-outside-coverage');
    const fetchFn=params.fetchFn||root.fetch;
    if(typeof fetchFn!=='function')return invalid('canopy-fetch-unavailable');
    try {
      const grid=createPoints({frame,w,h,cellM});
      const result=new Array(grid.points.length);
      const controller=new AbortController();
      const stop=setTimeout(()=>controller.abort(),20000);
      try {
        const groups=[];
        for(let i=0;i<grid.points.length;i+=CHUNK)groups.push([i,grid.points.slice(i,i+CHUNK)]);
        // Official raster service rate-limits simultaneous large geospatial requests.
        // Sequential batches with bounded retry avoid 503 bursts without weakening R15.
        for(const [offset,points] of groups){
          let returned=null;
          for(let attempt=0;attempt<3;attempt++){
            try{returned=await fetchGroup(points,controller.signal,fetchFn);break;}
            catch(error){
              if(controller.signal.aborted||attempt===2)throw error;
              await new Promise(resolve=>setTimeout(resolve,250*(attempt+1)));
            }
          }
          for(let j=0;j<returned.length;j++)result[offset+j]=returned[j];
        }
      }finally{clearTimeout(stop)}
      if(result.some(v=>!Number.isFinite(v)))return invalid('canopy-samples-incomplete');
      const mask=new Uint8Array(w*h),open=new Uint8Array(w*h);
      let flaggedCells=0,flaggedInside=0,openInside=0;
      for(let y=0;y<h;y++)for(let x=0;x<w;x++){
        const k=y*w+x,i=nearest(grid.xs,x),j=nearest(grid.ys,y);
        const pct=result[j*grid.xs.length+i];
        if(pct>=THRESHOLD_PCT){mask[k]=1;flaggedCells++;if(inside[k])flaggedInside++;}
        else{open[k]=1;if(inside[k])openInside++;}
      }
      // A valid all-forest parcel or all-open parcel is not automatically a service failure.
      // The independent real-browser gate checks expected forest evidence at NY.
      return {ok:true,mask,evidence:{source:SOURCE,url:URL,sourceResolutionM:30,sampleSpacingM:SPACING_M,
        thresholdPct:THRESHOLD_PCT,sampleCount:grid.points.length,flaggedCells,flaggedInside,
        openInside,insideSharePct:inside.length?+(100*flaggedInside/(flaggedInside+openInside||1)).toFixed(1):null}};
    } catch(error){return invalid(String(error?.message||error))}
  }
  root.EarthlineUSFSCanopyR15=Object.freeze({VERSION:'usfs-tcc-1.0.0',load,source:SOURCE});
  if(typeof module!=='undefined'&&module.exports)module.exports=root.EarthlineUSFSCanopyR15;
})(typeof window!=='undefined'?window:globalThis);
