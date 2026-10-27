from pathlib import Path
needles=["earthline-telemetry","ccucaqwbdsskcwxxbqiz.supabase.co/functions/v1/earthline-telemetry"]
out=[]
for p in Path(".").rglob("*"):
    if not p.is_file() or ".git" in p.parts: continue
    try:
        txt=p.read_text(encoding="utf-8",errors="ignore")
    except Exception:
        continue
    for n in needles:
        if n in txt:
            i=txt.find(n)
            out.append(f"===== {p} :: {n} @ {i} =====\n"+txt[max(0,i-2500):i+5000])
Path("telemetry-repo-snippet-17331.txt").write_text("\n\n".join(out),encoding="utf-8")
print("hits",len(out))
