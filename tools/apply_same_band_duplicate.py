from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="        if(sw.bandKey===ex.bandKey)continue;"
new="""        if(sw.bandKey===ex.bandKey){
          const duplicateTolM15771=Math.max(.25,Math.min(1.5,Math.max(.25,Number(M.cellM||1))*.5));
          if(earthlinePathDistanceFast15770(sw,ex,duplicateTolM15771)<duplicateTolM15771){tooClose=true;break;}
          continue;
        }"""
count=s.count(old)
if count != 1:
    raise SystemExit(f"same-band spacing owner count={count}")
p.write_text(s.replace(old,new),encoding="utf-8")
