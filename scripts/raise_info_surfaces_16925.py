from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="ignore")
old="#earthlineSwalesPage16125{position:fixed;inset:0;z-index:5000;background:#0a0e14;display:none}"
new="#earthlineSwalesPage16125{position:fixed;inset:0;z-index:50000;background:#0a0e14;display:none}"
if old not in s and new not in s:
    raise SystemExit("Swales overlay z-index anchor not found")
s=s.replace(old,new,1)

old2="#earthlineProcessPage16265{position:fixed;inset:0;z-index:5100;background:#eef1ef;color:#17323d;display:none;"
new2="#earthlineProcessPage16265{position:fixed;inset:0;z-index:50000;background:#eef1ef;color:#17323d;display:none;"
if old2 not in s and new2 not in s:
    raise SystemExit("Process overlay z-index anchor not found")
s=s.replace(old2,new2,1)

p.write_text(s)
