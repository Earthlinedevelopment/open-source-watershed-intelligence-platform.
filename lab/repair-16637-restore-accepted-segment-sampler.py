from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16637 — RESTORE ACCEPTED 16584 SEGMENT SAMPLER'
if marker in s:
    print('16637 already applied')
    raise SystemExit(0)

pat=r"  /\* EARTHLINE 16633 — EXACT PREFIX-PRUNED SAMPLE WALK\..*?\n  function earthlineRegionalSegmentValid16584\(hy16584,a16584,b16584\)\{.*?\n  \}\n  /\* EARTHLINE 16636 — RESTORE ACCEPTED 16584 FLOW FALLBACK\."
m=re.search(pat,s,re.S)
if not m:
    raise SystemExit('guard failed: current 16633 segment sampler immediately before 16636 owner not found')
if s.count('function earthlineRegionalSegmentValid16584(')!=1:
    raise SystemExit('guard failed: segment-validity owner count != 1')

replacement=r'''  /* EARTHLINE 16637 — RESTORE ACCEPTED 16584 SEGMENT SAMPLER.
     Accepted 16584 used one direct 4-samples-per-grid-cell walk with Math.round and
     the existing validity mask. 16633 replaced it with a prefix-index recursive
     interval walk; New York remains synchronously blocked inside makeFlows while the
     accepted Vermont path completes. Restore the accepted sampler algorithm exactly
     in the same owner. No mask, threshold, renderer, listener, source, hydrology rule,
     or lifecycle owner is added or weakened. */
  function earthlineRegionalSegmentValid16584(hy16584,a16584,b16584){
    if(!hy16584||!hy16584.validityMask16584)return true;
    const ga16584=llGrid(hy16584,a16584),gb16584=llGrid(hy16584,b16584),
          steps16584=Math.max(2,Math.ceil(Math.hypot(gb16584.x-ga16584.x,gb16584.y-ga16584.y)*4));
    for(let s16584=0;s16584<=steps16584;s16584++){
      const t16584=s16584/steps16584,
            x16584=Math.max(0,Math.min(hy16584.w-1,Math.round(ga16584.x+(gb16584.x-ga16584.x)*t16584))),
            y16584=Math.max(0,Math.min(hy16584.h-1,Math.round(ga16584.y+(gb16584.y-ga16584.y)*t16584)));
      if(!hy16584.validityMask16584[y16584*hy16584.w+x16584])return false;
    }
    return true;
  }
  /* EARTHLINE 16636 — RESTORE ACCEPTED 16584 FLOW FALLBACK.'''
s=s[:m.start()]+replacement+s[m.end():]

if s.count('function earthlineRegionalSegmentValid16584(')!=1:
    raise SystemExit('post-guard failed: owner count changed')
if 'EXACT PREFIX-PRUNED SAMPLE WALK' in s:
    raise SystemExit('post-guard failed: recursive sampler marker remains')
p.write_text(s,encoding='utf-8')
print('16637 applied: accepted 16584 direct segment sampler restored in existing owner')
