from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("  function earthlineClipLine16539(coords,g){")
if start<0: raise SystemExit("clip owner start missing")
ends=[x for x in [s.find("  async function earthlineClipFeatureCollection16539",start),s.find("  function earthlineClipFeatureCollection16539",start)] if x>start]
if not ends: raise SystemExit("clip owner end missing")
end=min(ends)
new=r'''  const earthlineExactClipIndex17324=new WeakMap();
  function earthlineExactClipIndexBuild17324(g){
    if(!g||(typeof g!=='object'&&typeof g!=='function'))return null;
    let hit=earthlineExactClipIndex17324.get(g);if(hit)return hit;
    const prepared=earthlinePrepareJurisdiction16539(g);if(!prepared)return null;
    const scale=8,bins=new Map(),edges=[];let edgeId=0;
    for(const poly of (prepared.polygons||[])){
      const rings=[poly.outer,...(poly.holes||[]).map(h=>h.ring)];
      for(const ring of rings){
        if(!Array.isArray(ring)||ring.length<2)continue;
        for(let i=0,j=ring.length-1;i<ring.length;j=i++){
          const a=ring[j],b=ring[i];if(!earthlineFinitePoint16539(a)||!earthlineFinitePoint16539(b))continue;
          const x1=Number(a[0]),y1=Number(a[1]),x2=Number(b[0]),y2=Number(b[1]);
          const e={id:edgeId++,x1,y1,x2,y2,minx:Math.min(x1,x2),maxx:Math.max(x1,x2),miny:Math.min(y1,y2),maxy:Math.max(y1,y2)};
          edges.push(e);
          const cx0=Math.floor(e.minx*scale),cx1=Math.floor(e.maxx*scale),cy0=Math.floor(e.miny*scale),cy1=Math.floor(e.maxy*scale);
          for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++){
            const k=cx+','+cy;let list=bins.get(k);if(!list)bins.set(k,list=[]);list.push(e);
          }
        }
      }
    }
    hit={prepared,scale,bins,edges};earthlineExactClipIndex17324.set(g,hit);return hit;
  }
  function earthlineCross17324(ax,ay,bx,by){return ax*by-ay*bx;}
  function earthlineSegmentCuts17324(a,b,e){
    const ax=Number(a[0]),ay=Number(a[1]),bx=Number(b[0]),by=Number(b[1]),rx=bx-ax,ry=by-ay;
    const sx=e.x2-e.x1,sy=e.y2-e.y1,qx=e.x1-ax,qy=e.y1-ay,den=earthlineCross17324(rx,ry,sx,sy),eps=1e-12,out=[];
    if(Math.abs(den)>eps){
      const t=earthlineCross17324(qx,qy,sx,sy)/den,u=earthlineCross17324(qx,qy,rx,ry)/den;
      if(t>=-eps&&t<=1+eps&&u>=-eps&&u<=1+eps)out.push(Math.max(0,Math.min(1,t)));
      return out;
    }
    if(Math.abs(earthlineCross17324(qx,qy,rx,ry))>eps)return out;
    const rr=rx*rx+ry*ry;if(rr<eps)return out;
    const t0=(qx*rx+qy*ry)/rr,t1=t0+(sx*rx+sy*ry)/rr,lo=Math.max(0,Math.min(t0,t1)),hi=Math.min(1,Math.max(t0,t1));
    if(hi>=lo-eps){out.push(lo);if(hi-lo>1e-10)out.push(hi);}
    return out;
  }
  function earthlineCandidateEdges17324(a,b,idx){
    const minx=Math.min(Number(a[0]),Number(b[0])),maxx=Math.max(Number(a[0]),Number(b[0])),
          miny=Math.min(Number(a[1]),Number(b[1])),maxy=Math.max(Number(a[1]),Number(b[1])),
          cx0=Math.floor(minx*idx.scale),cx1=Math.floor(maxx*idx.scale),cy0=Math.floor(miny*idx.scale),cy1=Math.floor(maxy*idx.scale),
          seen=new Set(),out=[];
    for(let cx=cx0;cx<=cx1;cx++)for(let cy=cy0;cy<=cy1;cy++)for(const e of (idx.bins.get(cx+','+cy)||[])){
      if(seen.has(e.id))continue;seen.add(e.id);
      if(e.maxx<minx||e.minx>maxx||e.maxy<miny||e.miny>maxy)continue;
      out.push(e);
    }
    return out;
  }
  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const denseAppend=(run,p0,p1)=>{
      if(!run.length)run.push(p0);
      else{const q=run[run.length-1];if(Math.abs(Number(q[0])-Number(p0[0]))>1e-10||Math.abs(Number(q[1])-Number(p0[1]))>1e-10)run.push(p0);}
      const steps=Math.max(1,Math.ceil(Math.max(Math.abs(Number(p1[0])-Number(p0[0])),Math.abs(Number(p1[1])-Number(p0[1])))/.01));
      for(let k=1;k<=steps;k++)run.push(earthlineInterpolate16539(p0,p1,k/steps));
    };
    if(g&&g.earthlineCertifiedInterior16850===true){
      const run=[];for(let i=1;i<raw.length;i++)denseAppend(run,raw[i-1],raw[i]);return run.length>=2?[run]:[];
    }
    const idx=earthlineExactClipIndexBuild17324(g);if(!idx)return [];
    const runs=[];let run=[];
    for(let i=1;i<raw.length;i++){
      const a=raw[i-1],b=raw[i],cuts=[0,1];
      for(const e of earthlineCandidateEdges17324(a,b,idx))cuts.push(...earthlineSegmentCuts17324(a,b,e));
      cuts.sort((x,y)=>x-y);
      const uniq=[];for(const t of cuts){const v=Math.max(0,Math.min(1,t));if(!uniq.length||Math.abs(v-uniq[uniq.length-1])>1e-9)uniq.push(v);}
      for(let k=1;k<uniq.length;k++){
        const t0=uniq[k-1],t1=uniq[k];if(t1-t0<1e-10)continue;
        const p0=earthlineInterpolate16539(a,b,t0),p1=earthlineInterpolate16539(a,b,t1),pm=earthlineInterpolate16539(a,b,(t0+t1)/2);
        if(earthlinePointInJurisdiction16539(pm,idx.prepared))denseAppend(run,p0,p1);
        else if(run.length>=2){runs.push(run);run=[];}
      }
    }
    if(run.length>=2)runs.push(run);
    return runs;
  }
'''
s=s[:start]+new+s[end:]
s="<!-- EARTHLINE_EXACT_SEGMENT_CLIP_17324: exact polygon-boundary intersection clipping; preserves 0.01-degree output densification while replacing repeated densified PIP screening. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact segment jurisdiction clip 17324")
