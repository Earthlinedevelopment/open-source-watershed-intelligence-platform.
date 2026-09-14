from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16636 — RESTORE ACCEPTED 16584 FLOW FALLBACK'
if marker in s:
    print('16636 already applied')
    raise SystemExit(0)

pat=r"  function earthlineRegionalSmoothFlow16584\(hy16584,raw16584\)\{.*?\n  \}\n\n  function makeFlows\(hy\)\{"
ms=list(re.finditer(pat,s,re.S))
if len(ms)!=1:
    raise SystemExit(f'guard failed: expected exactly one smooth-flow owner, found {len(ms)}')
old=ms[0].group(0)
required=[
    'const smooth16584=chaikin(base16584,2,false);',
    'const runs16584=[];let run16584=[];',
    'const retrySmooth16584=chaikin(safeBase16584,2,false);',
    'return lineSafe16584(retrySmooth16584)?retrySmooth16584:safeBase16584;'
]
for x in required:
    if x not in old:
        raise SystemExit('guard failed: current post-16584 fallback shape not found: '+x)

new=r'''  /* EARTHLINE 16636 — RESTORE ACCEPTED 16584 FLOW FALLBACK.
     Accepted 16584 tested the Chaikin-smoothed D8 line once and, when smoothing crossed
     an invalid cell, immediately retained the original D8 line. Later code added a
     split-to-valid-runs pass plus a second smoothing/validation pass. That extra work is
     not part of accepted 16584 science and becomes pathological on water-dense Regional
     grids such as New York. Restore the accepted fallback shape while retaining the
     current single segment-validity owner. No mask, threshold, renderer, listener,
     lifecycle owner, source, or hydrology rule is added or weakened. */
  function earthlineRegionalSmoothFlow16584(hy16584,raw16584){
    const base16584=cleanLine(raw16584);if(base16584.length<2)return [];
    const lineSafe16584=line16584=>{
      if(!Array.isArray(line16584)||line16584.length<2)return false;
      for(let i16584=1;i16584<line16584.length;i16584++){
        if(!earthlineRegionalSegmentValid16584(hy16584,line16584[i16584-1],line16584[i16584]))return false;
      }
      return true;
    };
    const smooth16584=chaikin(base16584,2,false);
    return lineSafe16584(smooth16584)?smooth16584:base16584;
  }

  function makeFlows(hy){'''
s=s[:ms[0].start()]+new+s[ms[0].end():]

if s.count('function earthlineRegionalSmoothFlow16584(')!=1:
    raise SystemExit('post-guard failed: smooth-flow owner count changed')
if 'const runs16584=[];let run16584=[];' in s:
    raise SystemExit('post-guard failed: split-and-resmooth fallback remains')
if 'const retrySmooth16584=chaikin(safeBase16584,2,false);' in s:
    raise SystemExit('post-guard failed: second smoothing pass remains')
p.write_text(s,encoding='utf-8')
print('16636 applied: accepted 16584 one-pass smoothing fallback restored inside existing owner')
