from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old='const canonicalParts=earthlineCanonicalHowBioswales16923();'
new='const canonicalParts=window.earthlineCanonicalHowBioswales16923();'
if old not in s: raise SystemExit('canonical accessor call not found')
s=s.replace(old,new,1)
old2="const correctionsBlock=String(EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace"
new2="const correctionsBlock=String(window.EARTHLINE_CORRECTIONS_REGISTRY_16513||'').replace"
if old2 not in s: raise SystemExit('corrections accessor call not found')
s=s.replace(old2,new2,1)
anchor='function howBioswalesReportPages16388(data)'
i=s.find(anchor)
if i<0: raise SystemExit('howBioswalesReportPages owner not found')
publish="window.EARTHLINE_CORRECTIONS_REGISTRY_16513=EARTHLINE_CORRECTIONS_REGISTRY_16513;   "
if publish not in s:
    s=s[:i]+publish+s[i:]
p.write_text(s)