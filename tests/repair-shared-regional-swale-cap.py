from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='if(chosen.length>=52)break;'
new='if(chosen.length>=80)break;'
count=s.count(old)
if count!=1:
    raise SystemExit(f'expected exactly one shared Regional swale cap, found {count}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('shared Regional swale capacity: 52 -> 80; ranking/spacing/science unchanged')
