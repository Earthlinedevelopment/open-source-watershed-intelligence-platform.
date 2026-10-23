from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="strict")

old="""      const half=Math.max(10,Math.min(52,Math.floor(coords.length*.18))),start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const raw=coords.slice(start,end);if(raw.length<10)return null;
      const segment=chaikin(raw,2,false);if(segment.length<10)return null;"""
new="""      const half=focusMode
        ?Math.max(10,Math.min(52,Math.floor(coords.length*.18)))
        :Math.max(5,Math.min(14,Math.floor(coords.length*.07))),
        start=Math.max(0,center-half),end=Math.min(coords.length,center+half+1);
      const minPts16632=focusMode?10:7;
      const raw=coords.slice(start,end);if(raw.length<minPts16632)return null;
      const segment=chaikin(raw,2,false);if(segment.length<minPts16632)return null;"""

n=s.count(old)
if n!=1:
    raise SystemExit(f"REGIONAL_SEGMENT_TARGET count={n}")
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_REGIONAL_LOCAL_CONTOUR_17702_PATCH_OK")
