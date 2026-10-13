from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""function openSuggestions16233(){if(!searchEngaged16233)return;const menu=document.getElementById('earthlineSearchSuggestions15970');if(!menu)return;positionSuggestions16233();if(menu.querySelector('button'))menu.classList.add('open')}"""
new="""function openSuggestions16233(){if(!searchEngaged16233)return;const menu=document.getElementById('earthlineSearchSuggestions15970');if(!menu)return;positionSuggestions16233();if(menu.querySelector('button')){menu.classList.add('open');requestAnimationFrame(()=>requestAnimationFrame(positionSuggestions16233))}}"""
if s.count(old)!=1:
    raise SystemExit(f"Expected one suggestion open owner, found {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
q=p.read_text(encoding="utf-8")
assert new in q
assert old not in q
print("17136 post-layout suggestion position PASS")
