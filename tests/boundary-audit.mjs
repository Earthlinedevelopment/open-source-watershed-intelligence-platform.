// State-boundary audit: are the Regional corridors the page drew inside the state outline the page itself ships?
// Self-contained (serialised into the browser by page.evaluate). Outline = data/jurisdiction/us-states-2025-500k/<ST>.geojson,
// a 1:500,000 generalised boundary, so a vertex only counts as "outside" for the summary when it is more than 500 m beyond it.
export async function boundaryAudit(arg){
  try{
    const res=await fetch(new URL(arg.path,location.origin).href,{cache:'no-store'});
    if(!res.ok)return {ok:false,error:'boundary file HTTP '+res.status};
    const gj=await res.json();
    const polys=[];
    for(const f of (gj.type==='FeatureCollection'?gj.features:[gj])){const g=f&&f.geometry;if(!g)continue;
      if(g.type==='Polygon')polys.push(g.coordinates);else if(g.type==='MultiPolygon')for(const p of g.coordinates)polys.push(p);}
    if(!polys.length)return {ok:false,error:'no polygons in boundary file'};
    const map=(typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap;
    const src=map&&map.getSource&&map.getSource(arg.sourceId);
    const data=src&&(src._data||(src.serialize&&src.serialize().data));
    const feats=(data&&data.features)||[];
    const inRing=(x,y,r)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const xi=r[i][0],yi=r[i][1],xj=r[j][0],yj=r[j][1];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))c=!c;}return c;};
    const inside=(x,y)=>{for(const p of polys){if(inRing(x,y,p[0])){let hole=false;for(let k=1;k<p.length;k++)if(inRing(x,y,p[k])){hole=true;break;}if(!hole)return true;}}return false;};
    const rad=Math.PI/180;
    const distToEdges=(x,y)=>{let best=1e18;const kx=111320*Math.cos(y*rad),ky=110574;
      for(const p of polys)for(const r of p)for(let i=1;i<r.length;i++){
        const ax=(r[i-1][0]-x)*kx,ay=(r[i-1][1]-y)*ky,bx=(r[i][0]-x)*kx,by=(r[i][1]-y)*ky,dx=bx-ax,dy=by-ay,L=dx*dx+dy*dy;
        let t=L?(-(ax*dx+ay*dy))/L:0;t=Math.max(0,Math.min(1,t));const d=Math.hypot(ax+t*dx,ay+t*dy);if(d<best)best=d;}
      return best;};
    let vertices=0,outside=0,beyond=0,worst=0,worstAt=null,measured=0,capped=false;const featOut=new Set();
    feats.forEach((f,fi)=>{const g=f&&f.geometry;if(!g)return;
      const lines=g.type==='LineString'?[g.coordinates]:g.type==='MultiLineString'?g.coordinates:g.type==='Polygon'?g.coordinates:[];
      for(const ln of lines)for(const c of ln){vertices++;const x=c[0],y=c[1];if(!Number.isFinite(x)||!Number.isFinite(y))continue;
        if(!inside(x,y)){outside++;featOut.add(fi);
          if(measured<300){measured++;const d=distToEdges(x,y);if(d>500)beyond++;if(d>worst){worst=d;worstAt=[Math.round(y*1e6)/1e6,Math.round(x*1e6)/1e6];}}else capped=true;}}});
    return {ok:true,boundaryFile:arg.path,featuresChecked:feats.length,vertices,outside,featuresWithOutsideVertices:featOut.size,
      outsideBeyond500m:beyond,worstOutsideM:Math.round(worst),worstAt,distancesMeasuredForFirst:measured,capped};
  }catch(e){return {ok:false,error:String(e&&e.message||e).slice(0,200)};}
}
