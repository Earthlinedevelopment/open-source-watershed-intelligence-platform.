from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old=r'''function earthlinePathPointUsable(px,py,maxS){
  const gx=Math.round(px),gy=Math.round(py);
  if(gx<1||gy<1||gx>=GW-1||gy>=GH-1)return false;
  const i=idx(gx,gy);
  if(!M.inP[i]||M.pond[i])return false;
  if(slopePct(gx,gy)>maxS)return false;
  if(earthlineNoBuildBuffered(gx,gy))return false;
  const channelThreshold=streamThreshold()*3.2;
  const radius=Math.max(1,Math.ceil(4/Math.max(0.5,M.cellM||1)));
  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    const x=gx+ox,y=gy+oy;
    if(x<0||y<0||x>=GW||y>=GH)continue;
    if(M.acc&&M.acc[idx(x,y)]>=channelThreshold)return false;
  }
  return true;
}'''
new=r'''function earthlinePathPointReason17476(px,py,maxS){
  const gx=Math.round(px),gy=Math.round(py);
  if(gx<1||gy<1||gx>=GW-1||gy>=GH-1)return 'edge';
  const i=idx(gx,gy);
  if(!M.inP[i])return 'outside-parcel';
  if(M.pond[i])return 'pond';
  if(slopePct(gx,gy)>maxS)return 'slope';
  if(earthlineNoBuildBuffered(gx,gy))return 'no-build';
  const channelThreshold=streamThreshold()*3.2;
  const radius=Math.max(1,Math.ceil(4/Math.max(0.5,M.cellM||1)));
  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    const x=gx+ox,y=gy+oy;
    if(x<0||y<0||x>=GW||y>=GH)continue;
    if(M.acc&&M.acc[idx(x,y)]>=channelThreshold)return 'major-channel-buffer';
  }
  return 'ok';
}
function earthlinePathPointUsable(px,py,maxS){
  const reason=earthlinePathPointReason17476(px,py,maxS);
  const a=window.EARTHLINE_SEGMENT_REASON_AUDIT_17476||(window.EARTHLINE_SEGMENT_REASON_AUDIT_17476={checks:{},splitCalls:0,zeroSegmentCalls:0,discardedFragments:0,discardedLengthM:0,maxDiscardedLengthM:0,keptFragments:0});
  a.checks[reason]=(a.checks[reason]||0)+1;
  return reason==='ok';
}'''
if s.count(old)!=1: raise SystemExit(f"path usable anchor count {s.count(old)}")
s=s.replace(old,new,1)
old2=r'''function earthlineSplitUsableSegments(pts,maxS){
  // Split a contour wherever it touches a no-build setback. This avoids drawing across or
  // immediately beside roofs, roads, and driveways while preserving longer buildable contours.
  const segs=[];
  let cur=[];
  const minM=earthlineMinimumSwaleLengthM15768(); // physical 12–40 m corridor-length threshold
  let prev=null;
  for(const p of (pts||[])){
    // Check the actual line between vertices, not only the vertices. This prevents a smoothed
    // swale from visually crossing a narrow driveway/roof between sampled points.
    let ok=earthlinePathPointUsable(p[0],p[1],maxS);
    if(ok&&prev){
      const steps=Math.max(1,Math.ceil(Math.hypot(p[0]-prev[0],p[1]-prev[1])*2));
      for(let k=1;k<steps;k++){
        const t=k/steps;
        if(!earthlinePathPointUsable(prev[0]+(p[0]-prev[0])*t,prev[1]+(p[1]-prev[1])*t,maxS)){ok=false;break;}
      }
    }
    if(ok)cur.push(p);
    else{
      if(earthlineSegmentLengthM(cur)>=minM)segs.push(earthlineCleanPath(cur));
      cur=[];
    }
    prev=p;
  }
  if(earthlineSegmentLengthM(cur)>=minM)segs.push(earthlineCleanPath(cur));
  segs.sort((a,b)=>earthlineSegmentLengthM(b)-earthlineSegmentLengthM(a));
  return segs;
}'''
new2=r'''function earthlineSplitUsableSegments(pts,maxS){
  const segs=[];
  let cur=[];
  const minM=earthlineMinimumSwaleLengthM15768();
  let prev=null;
  const audit=window.EARTHLINE_SEGMENT_REASON_AUDIT_17476||(window.EARTHLINE_SEGMENT_REASON_AUDIT_17476={checks:{},splitCalls:0,zeroSegmentCalls:0,discardedFragments:0,discardedLengthM:0,maxDiscardedLengthM:0,keptFragments:0});
  audit.splitCalls++;
  const flush17476=()=>{
    const len=earthlineSegmentLengthM(cur);
    if(len>=minM){segs.push(earthlineCleanPath(cur));audit.keptFragments++;}
    else if(cur.length>=2){audit.discardedFragments++;audit.discardedLengthM+=len;audit.maxDiscardedLengthM=Math.max(audit.maxDiscardedLengthM,len);}
    cur=[];
  };
  for(const p of (pts||[])){
    let ok=earthlinePathPointUsable(p[0],p[1],maxS);
    if(ok&&prev){
      const steps=Math.max(1,Math.ceil(Math.hypot(p[0]-prev[0],p[1]-prev[1])*2));
      for(let k=1;k<steps;k++){
        const t=k/steps;
        if(!earthlinePathPointUsable(prev[0]+(p[0]-prev[0])*t,prev[1]+(p[1]-prev[1])*t,maxS)){ok=false;break;}
      }
    }
    if(ok)cur.push(p); else flush17476();
    prev=p;
  }
  flush17476();
  if(!segs.length)audit.zeroSegmentCalls++;
  audit.minM=minM;
  segs.sort((a,b)=>earthlineSegmentLengthM(b)-earthlineSegmentLengthM(a));
  return segs;
}'''
if s.count(old2)!=1: raise SystemExit(f"split anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)
p.write_text(s,encoding="utf-8")
print("installed segment rejection reason diagnostic 17476")
