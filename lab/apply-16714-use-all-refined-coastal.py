from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""        const c16713=remaining16713.splice(bestI16713,1)[0];
        if(refinedReserved16713.some(p16713=>Math.hypot(p16713.x-c16713.x,p16713.y-c16713.y)<1.5))continue;
        refinedReserved16713.push(c16713);chosen.push(c16713);"""
new="""        const c16713=remaining16713.splice(bestI16713,1)[0];
        refinedReserved16713.push(c16713);chosen.push(c16713);"""
n=s.count(old)
if n!=1: raise SystemExit(f"16714 anchor expected once, found {n}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("16714 applied")
