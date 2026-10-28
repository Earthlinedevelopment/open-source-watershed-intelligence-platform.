from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="ring.setAttribute('aria-label',q==null?'Recharge Suitability not yet calculated':'Recharge Suitability '+q+' percent')"
new="ring.setAttribute('aria-label',q==null?'Recharge Suitability not yet calculated':'Recharge Suitability '+q+' score out of 100')"
if s.count(old)!=1:
    raise SystemExit(f"gauge accessibility owner count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("Recharge Suitability accessibility contract 17619 installed")
