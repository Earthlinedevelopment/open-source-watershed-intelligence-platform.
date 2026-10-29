from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="earthline-elder-worker-17129.js?v=17606"
new="earthline-elder-worker-17129.js?v=m81-17569"
if new in s:
    print("Elder worker revision already bound")
elif old in s:
    s=s.replace(old,new)
    p.write_text(s,encoding="utf-8")
    print("bound parity-proven Elder worker revision")
else:
    raise SystemExit("Elder worker revision owner not found")
