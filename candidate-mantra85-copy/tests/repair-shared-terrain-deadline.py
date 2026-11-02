from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
replacements=[
    ("const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:80;",
     "const openGrid16201=focusMode?220:96,mapGrid16201=focusMode?180:96;"),
    ("const openBudget16353=focusMode?14000:4300;",
     "const openBudget16353=focusMode?14000:6000;"),
    ("const fallbackBudget16353=focusMode?10000:30000;",
     "const fallbackBudget16353=focusMode?10000:6500;"),
]
for old,new in replacements:
    count=s.count(old)
    if count!=1:
        raise SystemExit(f'expected exactly one match for {old!r}, found {count}')
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('repaired shared Regional terrain owner: 96x96 source parity; 6.0s open / 6.5s fallback deadlines')
