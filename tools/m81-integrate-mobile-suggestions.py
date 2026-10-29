# integration rerun after mobile acceptance test correction
from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_early="""    function positionMenu16201(){const r=input.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run&&run.getBoundingClientRect?run.getBoundingClientRect():null,w=Math.max(320,Math.min(620,window.innerWidth-r.left-18)),top=Math.max(r.bottom,rr&&Number.isFinite(rr.bottom)?rr.bottom:r.bottom)+8;menu.style.setProperty('left',r.left+'px','important');menu.style.setProperty('right','auto','important');menu.style.setProperty('top',top+'px','important');menu.style.setProperty('width',w+'px','important');}"""
new_early="""    function positionMenu16201(){const r=input.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run&&run.getBoundingClientRect?run.getBoundingClientRect():null,vh=Math.max(1,Number(window.innerHeight||document.documentElement.clientHeight||0)),vw=Math.max(1,Number(window.innerWidth||document.documentElement.clientWidth||0)),belowTop=Math.max(r.bottom,rr&&Number.isFinite(rr.bottom)?rr.bottom:r.bottom)+8,desired=Math.min(340,Math.max(96,Math.floor(vh*.58))),below=Math.max(0,vh-belowTop-8);let top,maxH;if(below>=96){top=belowTop;maxH=Math.min(desired,below)}else{const anchorTop=Math.min(r.top,rr&&Number.isFinite(rr.top)?rr.top:r.top)-8;maxH=Math.min(desired,Math.max(72,anchorTop-8));top=Math.max(8,anchorTop-maxH)}const w=Math.max(120,Math.min(r.width,vw-16)),left=Math.max(8,Math.min(r.left,vw-w-8));menu.style.setProperty('position','fixed','important');menu.style.setProperty('left',Math.round(left)+'px','important');menu.style.setProperty('right','auto','important');menu.style.setProperty('top',Math.round(top)+'px','important');menu.style.setProperty('width',Math.round(w)+'px','important');menu.style.setProperty('max-height',Math.round(maxH)+'px','important');}"""
if old_early in s:
    s=s.replace(old_early,new_early,1)
elif new_early not in s:
    raise SystemExit("early suggestion owner not found")

needle="function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;"
insert=needle+"if(menu.parentElement!==document.body)document.body.appendChild(menu);"
if insert not in s:
    if needle in s:s=s.replace(needle,insert,1)
    else:raise SystemExit("consolidated suggestion owner not found")

p.write_text(s,encoding="utf-8")
print("patched both suggestion placement owners")
