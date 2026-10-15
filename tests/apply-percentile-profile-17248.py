from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="function percentile(arr,p){const v=[];for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);v.sort((a,b)=>a-b);return v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;}"
new="""function percentile(arr,p){
  const t17248=performance.now(),v=[];
  for(let i=0;i<arr.length;i++)if(Number.isFinite(arr[i]))v.push(arr[i]);
  const collectMs17248=performance.now()-t17248,tSort17248=performance.now();
  v.sort((a,b)=>a-b);
  const sortMs17248=performance.now()-tSort17248;
  const out17248=v[Math.max(0,Math.min(v.length-1,Math.floor((v.length-1)*p)))]||0;
  try{
    const pr17248=window.EARTHLINE_PERCENTILE_PROFILE_17248||(window.EARTHLINE_PERCENTILE_PROFILE_17248={calls:0,totalMs:0,sortMs:0,collectMs:0,maxMs:0,maxN:0,rows:[]});
    const total17248=performance.now()-t17248;
    pr17248.calls++;pr17248.totalMs+=total17248;pr17248.sortMs+=sortMs17248;pr17248.collectMs+=collectMs17248;pr17248.maxMs=Math.max(pr17248.maxMs,total17248);pr17248.maxN=Math.max(pr17248.maxN,v.length);
    if(total17248>=5||v.length>=5000)pr17248.rows.push({n:v.length,p:Number(p),totalMs:Number(total17248.toFixed(2)),sortMs:Number(sortMs17248.toFixed(2)),collectMs:Number(collectMs17248.toFixed(2))});
    console.log("EARTHLINE_PERCENTILE_17248 "+JSON.stringify({n:v.length,p:Number(p),totalMs:Number(total17248.toFixed(2)),sortMs:Number(sortMs17248.toFixed(2)),collectMs:Number(collectMs17248.toFixed(2)),calls:pr17248.calls,cumulativeMs:Number(pr17248.totalMs.toFixed(2))}));
  }catch(_){}
  return out17248;
}"""
if s.count(old)!=1:
    raise SystemExit(f"percentile anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
