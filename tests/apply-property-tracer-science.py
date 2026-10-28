from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else "index.html")
s = path.read_text(encoding="utf-8")

needle = '''      if(!earthlineSafeCellCached16320(cx,cy,maxS)){termination="unsafe-cell";break;}
      const state=idx(cx,cy)*4+(prevEdge<0?0:prevEdge);
'''
replacement = '''      /* Property contour geometry is traced across the finite in-parcel DEM.
         Construction safety is enforced downstream by earthlineSplitUsableSegments,
         which checks <=4% slope, no-build exclusions, ponding and channel buffers
         at each vertex and interpolated interval. */
      if(cx<1||cy<1||cx>=GW-1||cy>=GH-1){termination="analysis-edge";break;}
      const domainI=idx(cx,cy);
      if(!M.inP[domainI]||!Number.isFinite(Number(M.h[domainI]))){termination="outside-domain";break;}
      const state=idx(cx,cy)*4+(prevEdge<0?0:prevEdge);
'''

if s.count(needle) != 1:
    raise SystemExit(f"expected one contour-tracer safety owner; found {s.count(needle)}")

s = s.replace(needle, replacement)
path.write_text(s, encoding="utf-8")
print("PROPERTY_TRACER_SCIENCE_READY")
