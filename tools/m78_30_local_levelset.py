from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE M78.30 — deterministic local DEM level-set fallback'
if marker in s:
    raise SystemExit(0)

anchor='''function traceLevelContour(sx,sy,L,maxS,dropH){'''
if s.count(anchor)!=1:
    raise SystemExit(f'M78.30 trace anchor count={s.count(anchor)}')

solver=r'''/* EARTHLINE M78.30 — deterministic local DEM level-set fallback.
   Scientific rules are unchanged: same DEM, frozen no-build mask, parcel,
   channel and slope safety. This solver is used only when the historical
   marching-squares contour trace cannot produce a usable path. */
function earthlineTraceLocalLevelSetM78(sx,sy,L,maxS,dropH,deadline){
  const tolerance=Math.max(0.35,Number(dropH||1)*0.75);
  const endAt=Number.isFinite(Number(deadline))?Number(deadline):Number.POSITIVE_INFINITY;
  const start0=earthlineNearestContourCell(sx,sy,L,maxS)||[Number(sx),Number(sy)];
  const project=(xin,yin)=>{
    let x=Number(xin),y=Number(yin);
    for(let k=0;k<4;k++){
      if(!Number.isFinite(x)||!Number.isFinite(y))return null;
      if(x<1||y<1||x>=GW-2||y>=GH-2)return null;
      const h=Number(hAt(x,y));if(!Number.isFinite(h))return null;
      const err=h-Number(L);if(Math.abs(err)<=Math.max(0.04,tolerance*.18))break;
      const g=gradCell(x,y),gx=Number(g[0]),gy=Number(g[1]),g2=gx*gx+gy*gy;
      if(!(g2>1e-8))break;
      const corr=Math.max(-0.8,Math.min(0.8,err/g2));x-=gx*corr;y-=gy*corr;
    }
    return [x,y];
  };
  const projectedStart=project(start0[0],start0[1]);if(!projectedStart)return [];
  const sxi=Math.round(projectedStart[0]),syi=Math.round(projectedStart[1]);
  if(!earthlineSafeCell(sxi,syi,maxS))return [];
  const half=(sign)=>{
    const pts=[];let x=projectedStart[0],y=projectedStart[1],px=0,py=0;const visited=new Set();
    for(let step=0;step<360;step++){
      if(performance.now()>=endAt)break;
      const xi=Math.round(x),yi=Math.round(y);
      if(xi<1||yi<1||xi>=GW-2||yi>=GH-2||!earthlineSafeCell(xi,yi,maxS))break;
      const g=gradCell(x,y),gx=Number(g[0]),gy=Number(g[1]),gm=Math.hypot(gx,gy);if(!(gm>1e-7))break;
      let tx=(-gy/gm)*sign,ty=(gx/gm)*sign;if(step>0&&(tx*px+ty*py)<0){tx=-tx;ty=-ty;}px=tx;py=ty;
      let nx=x+tx*.72,ny=y+ty*.72;const q=project(nx,ny);if(!q)break;nx=q[0];ny=q[1];
      const nxi=Math.round(nx),nyi=Math.round(ny);
      if(nxi<1||nyi<1||nxi>=GW-2||nyi>=GH-2||!earthlineSafeCell(nxi,nyi,maxS))break;
      const hh=Number(hAt(nx,ny));if(!Number.isFinite(hh)||Math.abs(hh-Number(L))>tolerance*1.6)break;
      const key=Math.round(nx*4)+','+Math.round(ny*4);if(visited.has(key))break;visited.add(key);
      if(Math.hypot(nx-x,ny-y)<0.08)break;pts.push([nx,ny]);x=nx;y=ny;
    }
    return pts;
  };
  const a=half(1),b=half(-1);b.reverse();const merged=b.concat([projectedStart],a);
  if(merged.length<3)return [];const clean=earthlineCleanPath(merged);return clean&&clean.length>=3?clean:[];
}

'''
s=s.replace(anchor,solver+anchor,1)
old='''  const a=walk(0),b=walk(1);
  const merged=a.slice().reverse().concat(b);
  if(merged.length<3)return [];

  return earthlineCleanPath(merged);
}'''
new='''  const a=walk(0),b=walk(1);
  const merged=a.slice().reverse().concat(b);
  const cleaned=merged.length>=3?earthlineCleanPath(merged):[];
  if(cleaned&&cleaned.length>=3)return cleaned;
  const localM78=earthlineTraceLocalLevelSetM78(sx,sy,L,maxS,dropH,arguments.length>5?arguments[5]:Number.POSITIVE_INFINITY);
  M.scienceKernelM78=M.scienceKernelM78||{version:'Earthline-Science-Kernel-v1.0.0',owner:'authoritative-property-science-kernel',validationPolicy:'independent-fail-closed-publication-gate',attempts:0,recoveries:0};
  M.scienceKernelM78.attempts=Number(M.scienceKernelM78.attempts||0)+1;
  if(localM78&&localM78.length>=3){M.scienceKernelM78.recoveries=Number(M.scienceKernelM78.recoveries||0)+1;return localM78;}
  return [];
}'''
if s.count(old)!=1:raise SystemExit(f'M78.30 return anchor count={s.count(old)}')
s=s.replace(old,new,1)
if marker not in s or 'Earthline-Science-Kernel-v1.0.0' not in s:raise SystemExit('M78.30 verification failed')
p.write_text(s,encoding='utf-8')
print('Applied M78.30 local DEM level-set fallback')

# EARTHLINE SCIENCE KERNEL v1.0.0 formal identity
