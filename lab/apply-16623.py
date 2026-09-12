from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16623 — REGIONAL SWALE LOCALITY TIGHTENING'
if marker in s:
    print('16623 already present')
    raise SystemExit(0)

repls=[
("const maxHalfPixels16622=2.0,maxHopPixels16622=1.5;","const maxHalfPixels16622=0.25,maxHopPixels16622=0.75; /* EARTHLINE 16623 — REGIONAL SWALE LOCALITY TIGHTENING */"),
("raw=left.concat(right);if(raw.length<6)return null;","raw=left.concat(right);if(raw.length<3)return null;"),
("if(segment.length<(focusMode?10:6)||segmentPixels16622<(focusMode?10:2.5))return null;","if(segment.length<(focusMode?10:6)||segmentPixels16622<(focusMode?10:0.30))return null;"),
("const lengthScore=Math.min(1,segmentPixels16622/(focusMode?85:4));","const lengthScore=Math.min(1,segmentPixels16622/(focusMode?85:0.50));")
]
for old,new in repls:
    if s.count(old)!=1:
        raise SystemExit(f'guard failed: expected one occurrence of {old!r}, got {s.count(old)}')
    s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
print('16623 mutation applied')
