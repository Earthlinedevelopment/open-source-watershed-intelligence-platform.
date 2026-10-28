from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
n=s.count("Recharge Potential")
if n!=6:
    raise SystemExit(f"Recharge terminology owner count {n}")
s=s.replace("Recharge Potential","Recharge Suitability")
p.write_text(s,encoding="utf-8")
print("Recharge Suitability language contract 17622 installed")
