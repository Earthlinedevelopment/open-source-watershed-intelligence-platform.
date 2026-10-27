from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="  function percentile(arr,p){const v=[];for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);v.sort((a,b)=>a-b);return v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;}"
new="""  const earthlinePercentileSortedCache17284=new WeakMap();
  function percentile(arr,p){
    const cacheable17284=!!(arr&&typeof arr==='object'&&typeof ArrayBuffer!=='undefined'&&ArrayBuffer.isView(arr));
    let v=cacheable17284?earthlinePercentileSortedCache17284.get(arr):null;
    if(!v){
      v=[];for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);
      v.sort((a,b)=>a-b);
      if(cacheable17284)earthlinePercentileSortedCache17284.set(arr,v);
    }
    return v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;
  }"""
if s.count(old)!=1: raise SystemExit(f"percentile anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_TYPED_PERCENTILE_CACHE_17284: exact sorted finite values cached by immutable typed-array identity; ordinary arrays remain uncached; no percentile/science change. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched typed-array percentile cache 17284")
