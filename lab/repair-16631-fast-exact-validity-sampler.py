from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'EARTHLINE 16631 — FAST EXACT IN-BOUNDS VALIDITY SAMPLER' in s:
    print('16631 already applied')
    raise SystemExit(0)

pat=r"  function earthlineRegionalSegmentValid16584\(hy16584,a16584,b16584\)\{.*?\n  \}\n  function earthlineRegionalSmoothFlow16584"
m=re.search(pat,s,re.S)
if not m:
    raise SystemExit('guard failed: authoritative 16584 segment-validity owner not found exactly once')
if len(re.findall(r"function earthlineRegionalSegmentValid16584\(",s))!=1:
    raise SystemExit('guard failed: segment-validity owner count != 1')

new=r'''  /* EARTHLINE 16631 — FAST EXACT IN-BOUNDS VALIDITY SAMPLER.
     Same 16584 owner, same 4-samples-per-grid-cell density, same Math.round verdict.
     Regional flow coordinates are normally already inside the analysis grid, so avoid
     four redundant clamp operations per sample. Out-of-bounds inputs retain the exact
     prior clamp path. No mask, source, rule, renderer, listener, or lifecycle owner added. */
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
            x16584=Math.max(0,Math.min(w16584-1,Math.round(gx16584))),
            y16584=Math.max(0,Math.min(h16584-1,Math.round(gy16584)));
      if(!mask16584[y16584*w16584+x16584])return false;
    }
    return true;
  }
  function earthlineRegionalSmoothFlow16584'''
s=s[:m.start()]+new+s[m.end():]

old='''      for(let i16584=0;i16584<line16584.length;i16584++){
        if(!earthlineRegionalPointValid16584(hy16584,line16584[i16584]))return false;
        if(i16584>0&&!earthlineRegionalSegmentValid16584(hy16584,line16584[i16584-1],line16584[i16584]))return false;
      }
      return true;'''
new2='''      /* Every vertex is an endpoint of at least one segment; the segment owner samples
         both endpoints. Avoid the redundant point-validity pass without changing verdicts. */
      for(let i16584=1;i16584<line16584.length;i16584++){
        if(!earthlineRegionalSegmentValid16584(hy16584,line16584[i16584-1],line16584[i16584]))return false;
      }
      return true;'''
if s.count(old)!=1:
    raise SystemExit(f'guard failed: redundant point pass count={s.count(old)}')
s=s.replace(old,new2,1)

if len(re.findall(r"function earthlineRegionalSegmentValid16584\(",s))!=1:
    raise SystemExit('post-guard failed: owner count changed')
p.write_text(s,encoding='utf-8')
print('16631 applied: exact same validity owner/rule with in-bounds fast path and redundant point pass removed')
