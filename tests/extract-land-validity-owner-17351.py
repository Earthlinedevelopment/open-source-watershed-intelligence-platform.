from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
for a in ["function earthlineLandValidityMask16584","const earthlineLandValidityMask16584","earthlineLandValidityMask16584="]:
    i=s.find(a)
    if i>=0:
        Path("land-validity-owner-17351.txt").write_text(s[max(0,i-12000):i+36000],encoding="utf-8")
        print("found",a,i)
        break
else:
    raise SystemExit("land validity owner not found")
