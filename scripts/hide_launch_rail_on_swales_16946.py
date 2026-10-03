from pathlib import Path

p=Path('index.html')
s=p.read_text(errors='ignore')

needle="function syncSwalesPage(){     const swalesOpen=location.hash==='#swales-explained';"
insert="function syncSwalesPage(){     const swalesOpen=location.hash==='#swales-explained';     for(const id of ['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872']){const el=document.getElementById(id);if(!el)continue;if(swalesOpen)el.style.setProperty('display','none','important');else el.style.removeProperty('display');}"
if needle not in s:
    raise SystemExit('syncSwalesPage opening not found')
s=s.replace(needle,insert,1)
p.write_text(s)
