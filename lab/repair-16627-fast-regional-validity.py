from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16627 — FAST EQUIVALENT REGIONAL VALIDITY WALK'
if marker in s:
    raise SystemExit('guard failed: 16627 marker already present')
old=r'''  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const ga16584=llGrid(hy16584,a16584),gb16584=llGrid(hy16584,b16584),
          steps16584=Math.max(2,Math.ceil(Math.hypot(gb16584.x-ga16584.x,gb16584.y-ga16584.y)*4));
    for(let s16584=0;s16584<=steps16584;s16584++){
      const t16584=s16584/steps16584,
            p16584=[a16584[0]+(b16584[0]-a16584[0])*t16584,a16584[1]+(b16584[1]-a16584[1])*t16584];
      if(!earthlineRegionalPointValid16584(hy16584,p16584))return false;
    }
    return true;
  }'''
new=r'''  /* EARTHLINE 16627 — FAST EQUIVALENT REGIONAL VALIDITY WALK.
     Preserve the 16584 fail-closed verdict and its 4-samples-per-grid-cell density,
     but perform the affine lon/lat→grid transform once per segment instead of
     allocating a lon/lat point and calling llGrid/point-valid for every sample. */
  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const bounds16584=hy16584.bounds,
          sx16584=(hy16584.w-1)/(bounds16584[2]-bounds16584[0]),
          sy16584=(hy16584.h-1)/(bounds16584[3]-bounds16584[1]),
          rax16584=(a16584[0]-bounds16584[0])*sx16584,
          ray16584=(bounds16584[3]-a16584[1])*sy16584,
          rbx16584=(b16584[0]-bounds16584[0])*sx16584,
          rby16584=(bounds16584[3]-b16584[1])*sy16584,
          gax16584=Math.max(0,Math.min(hy16584.w-1,rax16584)),
          gay16584=Math.max(0,Math.min(hy16584.h-1,ray16584)),
          gbx16584=Math.max(0,Math.min(hy16584.w-1,rbx16584)),
          gby16584=Math.max(0,Math.min(hy16584.h-1,rby16584)),
          steps16584=Math.max(2,Math.ceil(Math.hypot(gbx16584-gax16584,gby16584-gay16584)*4)),
          invSteps16584=1/steps16584,
          dx16584=rbx16584-rax16584,dy16584=rby16584-ray16584,
          mask16584=hy16584.validityMask16584,w16584=hy16584.w,h16584=hy16584.h;
    for(let s16584=0;s16584<=steps16584;s16584++){
      const t16584=s16584*invSteps16584,
            gx16584=Math.max(0,Math.min(w16584-1,rax16584+dx16584*t16584)),
            gy16584=Math.max(0,Math.min(h16584-1,ray16584+dy16584*t16584)),
            x16584=Math.max(0,Math.min(w16584-1,Math.round(gx16584))),
            y16584=Math.max(0,Math.min(h16584-1,Math.round(gy16584)));
      if(!mask16584[y16584*w16584+x16584])return false;
    }
    return true;
  }'''
if s.count(old)!=1:
    raise SystemExit(f'guard failed: 16584 segment-valid owner count {s.count(old)}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('16627 patch applied')
