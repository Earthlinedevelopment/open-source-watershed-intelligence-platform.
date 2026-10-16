from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="function percentile(arr,p){const v=[];for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);v.sort((a,b)=>a-b);return v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;}"
new="""const earthlinePercentileSortedCache17279=new WeakMap();
  function percentile(arr,p){
    let v=null;
    const cacheable17279=!!(arr&&typeof arr==='object'&&ArrayBuffer.isView(arr));
    if(cacheable17279)v=earthlinePercentileSortedCache17279.get(arr)||null;
    if(!v){
      v=[];for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);v.sort((a,b)=>a-b);
      if(cacheable17279)earthlinePercentileSortedCache17279.set(arr,v);
    }
    return v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;
  }"""
n=s.count(old)
print("percentile anchors",n)
if n!=1: raise SystemExit(f"expected one percentile anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_PERCENTILE_CACHE_17279 — immutable hydrology typed arrays sorted once per identity; percentile values/science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17279 exact percentile cache applied")
