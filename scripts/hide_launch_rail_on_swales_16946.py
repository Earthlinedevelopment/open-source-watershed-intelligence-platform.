from pathlib import Path

p=Path('index.html')
s=p.read_text(errors='ignore')

old="""function syncSwalesPage(){     const swalesOpen=location.hash==='#swales-explained';     const sp=swalesOpen?ensureSwalesPage():document.getElementById('earthlineSwalesPage16125');if(sp){sp.classList.toggle('open',swalesOpen);sp.setAttribute('aria-hidden',swalesOpen?'false':'true');}"""
new="""function syncSwalesPage(){     const swalesOpen=location.hash==='#swales-explained';     const sp=swalesOpen?ensureSwalesPage():document.getElementById('earthlineSwalesPage16125');if(sp){sp.classList.toggle('open',swalesOpen);sp.setAttribute('aria-hidden',swalesOpen?'false':'true');}     for(const id of ['earthlineLaunchLogin16872','earthlineLaunchDonate16872','earthlineLaunchMerch16872']){const el=document.getElementById(id);if(!el)continue;if(swalesOpen)el.style.setProperty('display','none','important');else el.style.removeProperty('display');}"""
if old not in s:
    raise SystemExit('syncSwalesPage owner not found')
s=s.replace(old,new,1)
p.write_text(s)
