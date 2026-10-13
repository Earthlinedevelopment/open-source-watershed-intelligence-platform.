from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run?.getBoundingClientRect?.(),bottom=rr&&rr.width>0&&rr.height>0?Math.max(r.bottom,rr.bottom):r.bottom;menu.style.left=Math.round(r.left)+'px';menu.style.top=Math.round(bottom+7)+'px';menu.style.width=Math.round(r.width)+'px'}"""
new="""function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;const r=input.closest('.searchbox')?.getBoundingClientRect()||input.getBoundingClientRect(),run=document.getElementById('runBtn'),rr=run?.getBoundingClientRect?.(),bottom=rr&&rr.width>0&&rr.height>0?Math.max(r.bottom,rr.bottom):r.bottom;menu.style.setProperty('left',Math.round(r.left)+'px','important');menu.style.setProperty('top',Math.round(bottom+7)+'px','important');menu.style.setProperty('width',Math.round(r.width)+'px','important')}"""
if s.count(old)!=1:
    raise SystemExit(f"Expected one 17136 suggestion position owner, found {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
q=p.read_text(encoding="utf-8")
assert new in q
assert old not in q
print("17136 suggestion priority contract PASS")
