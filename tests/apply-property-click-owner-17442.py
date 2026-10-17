from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""    document.addEventListener('pointerdown',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      schedulePropertyPrime17212();
    },true);"""
new="""    document.addEventListener('pointerdown',e=>{
      const b=e.target?.closest?.('#earthlineDeclareProperty16169');
      if(!b||b.disabled)return;
      /* EARTHLINE 17442 — do not mutate Elder presentation between pointer-down
         and click. The governed terminal Property owner already starts Elder work
         immediately after the click is accepted. Keep only the already-idempotent
         runtime warm here so the physical click cannot be displaced by DOM work. */
      try{void prewarmDynamicWorker()}catch(_){}
    },true);"""
if s.count(old)!=1: raise SystemExit(f"Elder Property pointerdown anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("removed pre-click Elder presentation mutation 17442")
