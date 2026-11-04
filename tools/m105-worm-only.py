from pathlib import Path
p=Path('index.html')
s=p.read_text()
a='const segment=chaikin(raw,2,false);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;'
b='const segment=cleanLine(raw);if(segment.length<10||lineLengthPixels(hy,segment)<10)return null;'
assert s.count(a)==1
p.write_text(s.replace(a,b,1))
print('M105 swale-only smoothing removed; water and contour smoothing preserved')
