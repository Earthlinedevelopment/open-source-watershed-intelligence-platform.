from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
lines=s.splitlines()
out=[]
for i,l in enumerate(lines):
    if "percentile(" in l:
        out.append(f"{i+1:06d}: {l}")
Path("percentile-callers-17283.txt").write_text("\n".join(out),encoding="utf-8")
print("percentile callers",len(out))
