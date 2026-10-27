from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.45 — parallel first-valid Overpass transport"
if marker in s:
    raise SystemExit(0)

start=s.find("    for(const ep of endpoints){", s.find("async function earthlineFetchOverpass15862P"))
end=s.find('    result.overpass.error="all-overpass-endpoints-failed:', start)
if start<0 or end<0:
    raise SystemExit("M78.45 Overpass loop anchors missing")

tail=s.find("    return false;", end)
if tail<0:
    raise SystemExit("M78.45 Overpass return anchor missing")
tail += len("    return false;")

new=r'''    /* EARTHLINE M78.45 — parallel first-valid Overpass transport.
       The same free/open endpoints and query semantics are preserved. All endpoints
       start together; the first valid HTTP 200 JSON response is authoritative,
       including a zero-feature result. Losing requests are aborted immediately.
       If every endpoint fails, publication remains fail-closed exactly as before. */
    const controllers16845=[];
    const jobs16845=endpoints.map((ep,endpointIndex)=>{ 
      const controller=typeof AbortController!=="undefined"?new AbortController():null;
      controllers16845[endpointIndex]=controller;
      const timer=controller?setTimeout(()=>controller.abort(),ep.timeoutMs):null;
      const attempt={endpoint:ep.label,url:ep.url,timeoutMs:ep.timeoutMs,httpStatus:null,error:null,ok:false};
      const t0=typeof performance!=="undefined"&&performance.now?performance.now():Date.now();
      return (async()=>{
        try{
          const response=await fetch(ep.url,{
            method:"POST",
            headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
            body:"data="+encodeURIComponent(query),
            signal:controller?controller.signal:undefined
          });
          attempt.httpStatus=response.status;
          if(!response.ok)throw new Error("HTTP "+response.status);
          const data=await response.json();
          if(!data||!Array.isArray(data.elements))throw new Error("invalid-overpass-json");
          attempt.ok=true;
          return {ok:true,ep,endpointIndex,data,attempt};
        }catch(err){
          attempt.error=String(err&&err.message||err);
          return {ok:false,ep,endpointIndex,data:null,attempt};
        }finally{
          if(timer)clearTimeout(timer);
          const t1=typeof performance!=="undefined"&&performance.now?performance.now():Date.now();
          attempt.elapsedMs=Math.max(0,Math.round(t1-t0));
          result.overpass.endpointAttempts16846.push(attempt);
        }
      })();
    });

    let pending16845=jobs16845.length;
    const winner16845=await new Promise(resolve=>{
      for(const job of jobs16845){
        job.then(out=>{
          if(out&&out.ok)return resolve(out);
          pending16845--;
          if(pending16845<=0)resolve(null);
        });
      }
    });

    if(earthlineIsStale(myGen)){
      for(const c of controllers16845)try{c&&c.abort()}catch(_){}
      await Promise.allSettled(jobs16845);
      return false;
    }

    if(winner16845){
      for(let i=0;i<controllers16845.length;i++)if(i!==winner16845.endpointIndex)try{controllers16845[i]&&controllers16845[i].abort()}catch(_){}
      await Promise.allSettled(jobs16845);
      const elements=winner16845.data.elements;
      result.overpass.httpStatus=winner16845.attempt.httpStatus;
      result.overpass.rawElementCount=elements.length;
      for(const el of elements)result.processedGeometryCount+=earthlineRasterOverpassElement15862P(result,el);
      result.overpass.ok=true;
      result.overpass.error=null;
      result.overpass.endpoint16846=winner16845.ep.label;
      return result.processedGeometryCount>0;
    }

    await Promise.allSettled(jobs16845);
    result.overpass.error="all-overpass-endpoints-failed: "+result.overpass.endpointAttempts16846.map(x=>x.endpoint+"="+(x.error||("HTTP "+x.httpStatus))).join("; ");
    return false;'''

s=s[:start]+new+s[tail:]
if marker not in s:
    raise SystemExit("M78.45 marker missing after patch")
p.write_text(s,encoding="utf-8")
print("Applied M78.45 parallel Overpass transport")
