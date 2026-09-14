from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")
marker = "EARTHLINE 16633 — EXACT PREFIX-PRUNED SAMPLE WALK."

if marker in s:
    print("16633 already installed")
    raise SystemExit(0)

start = s.find("  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){")
end = s.find("  function earthlineRegionalSmoothFlow16584", start)
if start < 0 or end < 0:
    raise SystemExit("Expected Regional validity owner markers not found")

replacement = r'''  /* EARTHLINE 16633 — EXACT PREFIX-PRUNED SAMPLE WALK.
     Same 16584 owner, mask, 4-samples-per-grid-cell density, and Math.round verdict.
     Clear sample intervals are proven from the existing validity prefix index and skipped;
     intervals near invalid cells are subdivided until the original samples are checked.
     Out-of-bounds inputs retain the prior exact path. */
  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const bounds16584=hy16584.bounds,w16584=hy16584.w,h16584=hy16584.h,
          sx16584=(w16584-1)/(bounds16584[2]-bounds16584[0]),
          sy16584=(h16584-1)/(bounds16584[3]-bounds16584[1]),
          rax16584=(a16584[0]-bounds16584[0])*sx16584,
          ray16584=(bounds16584[3]-a16584[1])*sy16584,
          rbx16584=(b16584[0]-bounds16584[0])*sx16584,
          rby16584=(bounds16584[3]-b16584[1])*sy16584,
          inBounds16584=rax16584>=0&&rax16584<=w16584-1&&ray16584>=0&&ray16584<=h16584-1&&rbx16584>=0&&rbx16584<=w16584-1&&rby16584>=0&&rby16584<=h16584-1,
          gax16584=inBounds16584?rax16584:Math.max(0,Math.min(w16584-1,rax16584)),
          gay16584=inBounds16584?ray16584:Math.max(0,Math.min(h16584-1,ray16584)),
          gbx16584=inBounds16584?rbx16584:Math.max(0,Math.min(w16584-1,rbx16584)),
          gby16584=inBounds16584?rby16584:Math.max(0,Math.min(h16584-1,rby16584)),
          steps16584=Math.max(2,Math.ceil(Math.hypot(gbx16584-gax16584,gby16584-gay16584)*4)),
          invSteps16584=1/steps16584,
          dx16584=rbx16584-rax16584,dy16584=rby16584-ray16584,
          mask16584=hy16584.validityMask16584;
    if(inBounds16584){
      const fast16584=earthlineRegionalValidityPrefix16584(hy16584);
      if(fast16584){
        const p16584=fast16584.prefix,stride16584=fast16584.stride;
        const rectClear16584=(lo16584,hi16584)=>{
          const t016584=lo16584*invSteps16584,t116584=hi16584*invSteps16584,
                ax16584=Math.round(rax16584+dx16584*t016584),ay16584=Math.round(ray16584+dy16584*t016584),
                bx16584=Math.round(rax16584+dx16584*t116584),by16584=Math.round(ray16584+dy16584*t116584),
                x016584=Math.min(ax16584,bx16584),x116584=Math.max(ax16584,bx16584),
                y016584=Math.min(ay16584,by16584),y116584=Math.max(ay16584,by16584),
                invalid16584=p16584[(y116584+1)*stride16584+x116584+1]-p16584[y016584*stride16584+x116584+1]-p16584[(y116584+1)*stride16584+x016584]+p16584[y016584*stride16584+x016584];
          return invalid16584===0;
        };
        const stack16584=[[0,steps16584]];
        while(stack16584.length){
          const r16584=stack16584.pop(),lo16584=r16584[0],hi16584=r16584[1];
          if(rectClear16584(lo16584,hi16584))continue;
          if(hi16584-lo16584<=8){
            for(let s16584=lo16584;s16584<=hi16584;s16584++){
              const t16584=s16584*invSteps16584,
                    x16584=Math.round(rax16584+dx16584*t16584),
                    y16584=Math.round(ray16584+dy16584*t16584);
              if(!mask16584[y16584*w16584+x16584])return false;
            }
            continue;
          }
          const mid16584=(lo16584+hi16584)>>1;
          stack16584.push([mid16584,hi16584],[lo16584,mid16584]);
        }
        return true;
      }
      for(let s16584=0;s16584<=steps16584;s16584++){
        const t16584=s16584*invSteps16584,
              x16584=Math.round(rax16584+dx16584*t16584),
              y16584=Math.round(ray16584+dy16584*t16584);
        if(!mask16584[y16584*w16584+x16584])return false;
      }
      return true;
    }
    for(let s16584=0;s16584<=steps16584;s16584++){
      const t16584=s16584*invSteps16584,
            gx16584=Math.max(0,Math.min(w16584-1,rax16584+dx16584*t16584)),
            gy16584=Math.max(0,Math.min(h16584-1,ray16584+dy16584*t16584)),
            x16584=Math.round(gx16584),y16584=Math.round(gy16584);
      if(!mask16584[y16584*w16584+x16584])return false;
    }
    return true;
  }
'''

out = s[:start] + replacement + s[end:]
if out.count("function earthlineRegionalSegmentValid16584(") != 1:
    raise SystemExit("Regional validity owner count changed")
if marker not in out:
    raise SystemExit("Repair marker missing")
if "function earthlineRegionalValidityPrefix16584(" not in out:
    raise SystemExit("Existing Regional validity prefix index is missing")

p.write_text(out, encoding="utf-8")
print("16633 exact-prune repair written")
