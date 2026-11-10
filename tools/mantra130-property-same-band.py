#!/usr/bin/env python3
"""M130 Property spacing correction: do not exempt same-band contours from the
accepted exact minimum-distance test. Regional selection stays unchanged.
No source masks, topography, target spacing or exclusion/publication gates change.\nAdds the approved <=4% Property slope ceiling at point level; Regional unchanged.
"""
from pathlib import Path
import subprocess
p=Path('index.html')
before=p.read_text()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='0f865cf6dd3ffec340214c99e58a6d51aa087f9e', 'M130 unexpected production parent'
old="        if(sw.bandKey===ex.bandKey)continue;"
assert before.count(old)==1,("M130 spacing anchor count",before.count(old))
after=before.replace(old,"        /* M130: Regional same-band policy unchanged. Property fragments at the\n           same contour elevation must still satisfy the exact minimum-distance\n           test; truly separated fragments remain valid. */\n        if(isRegionalTile15769&&sw.bandKey===ex.bandKey)continue;",1)
# M130: fail-closed for the user's accepted maximum 4% Property slope.
# Test every surveyed contour point; a low mean must never excuse a steep segment.
old_loop="""      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);"""
new_loop="""      if(!isRegionalTile15769){
        const ptsM130=Array.isArray(sw&&sw.pts)?sw.pts:[];
        let safeSlopeM130=ptsM130.length>=2 && Number.isFinite(Number(sw.slope)) && Number(sw.slope)<=4;
        if(safeSlopeM130)for(const ptM130 of ptsM130){
          const xM130=Math.round(Number(ptM130&&ptM130[0])),yM130=Math.round(Number(ptM130&&ptM130[1]));
          if(!Number.isFinite(xM130)||!Number.isFinite(yM130)||xM130<0||yM130<0||xM130>=GW||yM130>=GH){safeSlopeM130=false;break;}
          const slopeM130=Number(slopePct(xM130,yM130));
          if(!Number.isFinite(slopeM130)||slopeM130>4){safeSlopeM130=false;break;}
        }
        if(!safeSlopeM130){
          M.swaleDiagnostics.stage.rejectSlopeAbove4M130=(M.swaleDiagnostics.stage.rejectSlopeAbove4M130||0)+1;
          if(finalRec15803){finalRec15803.status="rejected-property-slope-over-4pct";finalRec15803.reason="property-slope-limit-4pct";}
          continue;
        }
      }
      let tooClose=false;const swBBox16204=earthlineSwaleGridBBox16204(sw);"""
assert after.count(old_loop)==1,("M130 Property slope loop missing",after.count(old_loop))
after=after.replace(old_loop,new_loop,1)
assert after.count('if(earthlinePathsCloserThan15770(sw,ex,minSpacingM15771))')==1
assert "const TARGET_M=6.096, MIN_M=4.572, MAX_M=7.620" in after
assert "const forestPenalty=forested?0.84:1.0" in after
assert 'Place hand cursor over bare land to move map.' in after
p.write_text(after)
print("M130_PROPERTY_SLOPE_AND_SAME_BAND_SPACING_PATCHED")
