from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""    document.addEventListener('pointerdown',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      schedulePropertyPrime17212();
    },true);"""
new="""    /* EARTHLINE 17425 — Elder sidecar begins only after the browser has created
       the Property click event. Starting on pointerdown moved the button before
       pointerup, causing the trusted click to land on the surrounding section. */
    document.addEventListener('click',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      schedulePropertyPrime17212();
    },true);"""
if s.count(old)!=1:
    raise SystemExit(f"Elder Property trigger anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("moved Elder Property sidecar from pointerdown to click capture 17425")
