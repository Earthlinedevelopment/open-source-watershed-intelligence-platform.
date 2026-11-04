from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
pairs=[
("const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;",
 "/* M105 no redundant smoothing: use unsmoothed terrain-traced coordinates. */const segment=cleanLine(raw);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;"),
("features.push({type:'Feature',properties:{feature_type:'contour',elev_m:Math.round(level),major,labelable,label:Math.round(level)+' m'},geometry:{type:'LineString',coordinates:coords}});",
 "features.push({type:'Feature',properties:{feature_type:'contour',elev_m:Math.round(level),major,labelable,label:Math.round(level)+' m',swale_source_raw_m105:raw},geometry:{type:'LineString',coordinates:coords}});"),
("const coords=f.geometry.coordinates;if(coords.length<16)continue;",
 "const coords=f.properties.swale_source_raw_m105||f.geometry.coordinates;if(coords.length<16)continue;")
]
for a,b in pairs:
    if s.count(a)!=1:raise RuntimeError('FAIL CLOSED ambiguous anchor: '+a[:65])
    s=s.replace(a,b,1)
assert 'coords=chaikin(raw,2,closed)' in s
assert 'const smooth16584=chaikin(base16584,2,false);' in s
assert s.count('swale_source_raw_m105')==2

gate="""  /* M105: final SVG acceptance excludes folded swale paths, keeping existing contour/water drawings. */
  function earthlineSwaleVisibleM105(pts){
    if(!Array.isArray(pts)||pts.length<3)return false;
    const first=pts[0],last=pts[pts.length-1],chord=Math.hypot(last.x-first.x,last.y-first.y);
    if(!Number.isFinite(chord)||chord<10||polyLength(pts)/chord>1.55)return false;
    for(let i=2;i<pts.length;i++){
      const a=pts[i-2],b=pts[i-1],c=pts[i];
      const ux=b.x-a.x,uy=b.y-a.y,vx=c.x-b.x,vy=c.y-b.y,d=Math.hypot(ux,uy)*Math.hypot(vx,vy);
      if(d>.01&&(ux*vx+uy*vy)/d<-.3)return false;
    }
    const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
    for(let i=0;i<pts.length-1;i++)for(let j=i+2;j<pts.length-1;j++){
      if(j===i+1)continue;
      const a=pts[i],b=pts[i+1],c=pts[j],d=pts[j+1];
      if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0)return false;
    }
    return true;
  }
"""
anchor="  function earthlineSwalePolylineM102(pts){"
if s.count(anchor)!=1:raise RuntimeError('Final SVG swale owner absent or duplicated')
s=s.replace(anchor,gate+anchor,1)
a="const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22)continue;"
b="const pts=points(f.geometry.coordinates),len=polyLength(pts);if(pts.length<3||len<22||!earthlineSwaleVisibleM105(pts))continue;"
if s.count(a)!=1:raise RuntimeError('Final SVG swale publication loop absent or duplicated')
s=s.replace(a,b,1)
assert s.count('earthlineSwaleVisibleM105(pts)')==2
p.write_text(s,encoding='utf-8')
print('M105_FIXED_SOURCE: unsmoothed terrain for Regional swale candidates; approved contours and flow paths unchanged')
