#!/usr/bin/env python3
"""M131 two missing fixes, pinned to latest published Earthline HTML.
1. Enforce approved <=4% Property slope at every contour sample, including
   same-band final spacing, without modifying Regional scoring.
2. Illustrate proposed planting along rendered Property swales with explicit
   round brown rim + green canopy, without inventing Elder evidence.
Leave the existing hint, report source/geometry, Elder loader and logo untouched.
"""
from pathlib import Path
import subprocess
p=Path('index.html')
s=p.read_text(encoding='utf8')
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='0f865cf6dd3ffec340214c99e58a6d51aa087f9e','Unexpected live parent; abort'
def one(a,b,label):
 global s
 n=s.count(a)
 if n!=1:raise RuntimeError(f'{label}: anchor count {n}')
 s=s.replace(a,b,1)
# Tight Property-slope and final-spacing safety gate, first vetted in M130.
one('        if(sw.bandKey===ex.bandKey)continue;',
"""        /* M131: Property fragments in the same elevation band must still
           satisfy exact minimum-distance clearance; Regional logic unchanged. */
        if(isRegionalTile15769&&sw.bandKey===ex.bandKey)continue;""",
'same-band-spacing')
old="      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);"
new="""      /* M131: no Property route is prescribed above 4% slope at ANY sample. */
      if(!isRegionalTile15769){
        const ptsM131=Array.isArray(sw&&sw.pts)?sw.pts:[];
        let safeSlopeM131=ptsM131.length>=2 && Number.isFinite(Number(sw.slope)) && Number(sw.slope)<=4;
        if(safeSlopeM131)for(const pointM131 of ptsM131){
          const xM131=Math.round(Number(pointM131?.[0])),yM131=Math.round(Number(pointM131?.[1]));
          if(!Number.isFinite(xM131)||!Number.isFinite(yM131)||xM131<0||yM131<0||xM131>=GW||yM131>=GH){safeSlopeM131=false;break;}
          const localSlopeM131=Number(slopePct(xM131,yM131));
          if(!Number.isFinite(localSlopeM131)||localSlopeM131>4){safeSlopeM131=false;break;}
        }
        if(!safeSlopeM131){
          M.swaleDiagnostics.stage.rejectSlopeAbove4M131=(M.swaleDiagnostics.stage.rejectSlopeAbove4M131||0)+1;
          if(finalRec15803){
            finalRec15803.status='rejected-property-slope-above-four';
            finalRec15803.reason='property-slope-limit-4pct';
          }
          continue;
        }
      }
      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);"""
one(old,new,'slope-check')
# The existing detailed Property swale renderer calls canopy16174.
# Give every crown a clear circular brown earth/wood perimeter with green
# centre. This is a screening illustration of proposed planting, not an
# assertion of extant trees or a new Elder detection.
anchor="crown=svgEl('g',{class:'earthline-swale-tree-crown-16174','data-canopy-style':'bushy'});"
addition="""crown=svgEl('g',{class:'earthline-swale-tree-crown-16174','data-canopy-style':'round-brown-green','data-symbol-semantics':'illustrative-proposed-planting'});
          crown.appendChild(svgEl('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:(r*1.23).toFixed(1),fill:'#765336',stroke:'#c69b69','stroke-width':String(Math.max(.8,r*.14))}));
          crown.appendChild(svgEl('circle',{cx:x.toFixed(1),cy:y.toFixed(1),r:(r*.95).toFixed(1),fill:colors[0],stroke:'#22542b','stroke-width':String(Math.max(.5,r*.11))}));"""
one(anchor,addition,'swale-proposed-tree-circle')
assert 'reportAquiferContext123(baseData.d)' in s
assert 'reportPlaceLine123(baseData.d)' in s
assert 'earthlineTemporaryMapHint126' in s
assert 'Dismiss map tip' in s
assert 'earthline-swale-zoom-gate-css' in s
assert s.count('function canopy16174')==1
assert s.count('rejectSlopeAbove4M131')==2
assert 'const TARGET_M=6.096, MIN_M=4.572, MAX_M=7.620' in s
p.write_text(s,encoding='utf8')
print('M131_EXACT_PROPERTY_SLOPE_SPACING_AND_ROUND_PLANTING_PATCH_APPLIED')
