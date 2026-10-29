from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      const max17803=Math.min(12,original17803.length);
      for(let start17803=0;start17803<max17803&&passed17803.length<3;start17803+=4){
        const batch17803=await Promise.all(original17803.slice(start17803,Math.min(max17803,start17803+4)).map((f17803,i17803)=>verify17803(f17803,start17803+i17803+1)));"""
new="""      const max17803=Math.min(12,original17803.length),batchSize17806=8;
      for(let start17803=0;start17803<max17803&&passed17803.length<3;start17803+=batchSize17806){
        const batch17803=await Promise.all(original17803.slice(start17803,Math.min(max17803,start17803+batchSize17806)).map((f17803,i17803)=>verify17803(f17803,start17803+i17803+1)));"""
if new in s:
    print("preflight parallelization already applied")
elif old in s:
    s=s.replace(old,new,1)
    p.write_text(s,encoding="utf-8")
    print("parallelized exact Property preflight to eight candidates per wave")
else:
    raise SystemExit("17803 batch owner not found")
