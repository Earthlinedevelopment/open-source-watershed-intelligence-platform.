from pathlib import Path
p=Path("earthline-elder-worker-17129.js")
s=p.read_text(encoding="utf-8")
old='    await py.loadPackage(["numpy","scipy"]);'
new='    await py.loadPackage(["numpy"]); /* EARTHLINE_ELDER_NUMPY_ONLY_17392 */'
if s.count(old)!=1: raise SystemExit(f"worker package anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("patched Elder worker NumPy-only 17392")
