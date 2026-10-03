from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(errors='ignore')

pat=re.compile(r"(function syncSwalesPage\(\)\{\s*const swalesOpen=location\.hash==='#swales-explained';)")
m=pat.search(s)
if not m:
    raise SystemExit('syncSwalesPage opening not found')
rail="""     for(const id of ['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872']){const el=document.getElementById(id);if(!el)continue;if(swalesOpen)el.style.setProperty('display','none','important');else el.style.removeProperty('display');}"""
s=s[:m.end()]+rail+s[m.end():]
p.write_text(s)
