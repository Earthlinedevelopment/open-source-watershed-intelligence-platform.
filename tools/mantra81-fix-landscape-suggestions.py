from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
needle="function positionSuggestions16233(){const input=document.getElementById('searchInput'),menu=document.getElementById('earthlineSearchSuggestions15970');if(!input||!menu)return;"
insert=needle+"const vw0=Math.max(1,Number(window.innerWidth||document.documentElement.clientWidth||0));if(vw0<=760&&menu.parentElement!==document.body)document.body.appendChild(menu);"
if insert in s:
    print("mobile suggestion portal already present")
elif needle in s:
    s=s.replace(needle,insert,1)
    p.write_text(s,encoding="utf-8")
    print("patched mobile suggestion portal")
else:
    raise SystemExit("suggestion owner not found")
