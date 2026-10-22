from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  wrap.appendChild(select);
  rail.appendChild(wrap);
  return wrap;
}"""
new="""  wrap.appendChild(select);
  const menu=document.getElementById('earthlineRailMenu16188');
  if(menu&&menu.nextSibling)rail.insertBefore(wrap,menu.nextSibling);
  else rail.appendChild(wrap);
  return wrap;
}"""
if s.count(old)!=1: raise RuntimeError("language placement count "+str(s.count(old)))
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("EARTHLINE_17701_LANGUAGE_RAIL_PLACEMENT")

# trigger
