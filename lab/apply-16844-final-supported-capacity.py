from pathlib import Path
import sys
if len(sys.argv)!=2: raise SystemExit('usage: apply-16844-final-supported-capacity.py INDEX')
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
old_expr="Math.min(36,Math.max(0,Math.floor((fineSupportCells16755.size-baseRegionalCapacity16755)*.50)))"
new_expr="Math.min(54,Math.max(0,Math.floor((fineSupportCells16755.size-baseRegionalCapacity16755)*.75)))"
if 'EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY' in s: raise SystemExit('16844 already present')
if s.count(old_expr)!=1: raise SystemExit(f'16843 capacity expression expected once, found {s.count(old_expr)}')
s=s.replace(old_expr,new_expr,1)
s=s.replace('EARTHLINE 16843 — FINE-SUPPORT REGIONAL CAPACITY','EARTHLINE 16844 — FINAL FINE-SUPPORT REGIONAL CAPACITY',1)
s=s.replace("build:'EARTHLINE 16843'","build:'EARTHLINE 16844'",1)
s=s.replace('max +36; no jurisdiction-specific branch','max +54; no jurisdiction-specific branch',1)
p.write_text(s,encoding='utf-8')
print('16844 applied')
