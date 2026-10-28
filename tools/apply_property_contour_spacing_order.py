from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old='''    const ordered=swales.slice().sort((a,b)=>
      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||
      (Number(b.prescriptionFlowScore15833||0)-Number(a.prescriptionFlowScore15833||0)) ||
      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      ((b.score||0)-(a.score||0)) ||
      (Number(a.levelH||0)-Number(b.levelH||0)) ||
      (Number(a.bandKey||0)-Number(b.bandKey||0))
    );'''
new='''    const ordered=swales.slice().sort((a,b)=>
      (Number(!!b.primaryFlowFirst15836)-Number(!!a.primaryFlowFirst15836)) ||
      (Number(a.levelH||0)-Number(b.levelH||0)) ||
      (Number(a.bandKey||0)-Number(b.bandKey||0)) ||
      (Number(b.prescriptionFlowScore15833||0)-Number(a.prescriptionFlowScore15833||0)) ||
      (Number(b.seedFlowCrossing15833||0)-Number(a.seedFlowCrossing15833||0)) ||
      ((b.score||0)-(a.score||0))
    );'''
if s.count(old)!=1:
    raise SystemExit(f"expected one final spacing ordering owner; found {s.count(old)}")
p.write_text(s.replace(old,new),encoding="utf-8")
