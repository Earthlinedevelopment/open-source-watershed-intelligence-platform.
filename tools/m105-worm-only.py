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
p.write_text(s,encoding='utf-8')
print('M105_FIXED_SOURCE: unsmoothed terrain for Regional swale candidates; approved contours and flow paths unchanged')
