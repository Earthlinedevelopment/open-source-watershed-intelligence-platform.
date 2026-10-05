from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="    const processOpen=location.hash==='#earthline-process';\n"
new="""    const processOpen=location.hash==='#earthline-process';
    for(const id of ['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872']){
      const el=document.getElementById(id);if(!el)continue;
      if(processOpen)el.style.setProperty('display','none','important');
      else if(!swalesOpen)el.style.removeProperty('display');
    }
"""
if old not in s:
    raise SystemExit("processOpen owner not found")
if "EARTHLINE_PROCESS_RAIL_INLINE_16998" not in s:
    new=new.replace("    const processOpen", "    // EARTHLINE_PROCESS_RAIL_INLINE_16998\n    const processOpen")
    s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
