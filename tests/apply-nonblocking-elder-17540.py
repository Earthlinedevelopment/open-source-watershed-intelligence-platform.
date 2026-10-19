from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="try{await Promise.resolve(window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.())}catch(_){}"
new="try{void Promise.resolve(window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()).catch(()=>{})}catch(_){}"
count=s.count(old)
if count!=1: raise SystemExit(f'elder blocking await anchor count={count}')
s=s.replace(old,new,1)
s=s.replace('/* EARTHLINE 17514 — the authoritative 20-acre Property frame now exists.','/* EARTHLINE 17540 — the authoritative 20-acre Property frame now exists; Elder starts asynchronously and never gates Property hydrology.\n       EARTHLINE 17514 — the authoritative 20-acre Property frame now exists.',1)
p.write_text(s,encoding='utf-8')
print('installed nonblocking Elder/Property handoff 17540')