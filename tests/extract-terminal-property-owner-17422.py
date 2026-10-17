from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
for n in ["terminalPropertyRun","function terminalPropertyRun","async function terminalPropertyRun"]:
    start=0
    out=[]
    while True:
        i=s.find(n,start)
        if i<0: break
        out.append(s[max(0,i-12000):i+26000])
        start=i+1
    if out:
        Path("terminal-property-owner-17422.txt").write_text("\n\n===== HIT =====\n".join(out),encoding="utf-8")
        print(n,len(out))
        break
