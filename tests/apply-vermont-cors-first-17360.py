from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

a=s.find("  function earthlineFetchJsonp15872(url,timeoutMs){")
b=s.find("  async function earthlineFetchJson15872(url,timeoutMs){",a)
c=s.find("  async function earthlineFetchFirstOfficial16481(urls,timeoutMs){",b)
if min(a,b,c)<0: raise SystemExit("Vermont transport anchors missing")

jsonp=r'''  function earthlineFetchJsonp15872(url,timeoutMs){
    return new Promise((resolve,reject)=>{
      const cb="__earthlineVtInfra16458_"+Date.now()+"_"+Math.random().toString(36).slice(2),script=document.createElement("script");
      let done=false,retired=false;
      function retire(){
        if(retired)return;retired=true;
        try{script.remove()}catch(_){}
        try{delete window[cb]}catch(_){window[cb]=undefined}
      }
      function parkLateCallback(){
        /* A timed-out JSONP script can still finish downloading after its DOM node
           is removed. Keep a harmless callback alive until load/error proves the
           script can no longer call it; this prevents late global ReferenceErrors. */
        try{window[cb]=()=>{}}catch(_){}
      }
      const timer=setTimeout(()=>{
        if(done)return;done=true;parkLateCallback();
        reject(new Error("JSONP timeout"));
      },timeoutMs);
      window[cb]=data=>{
        if(done)return;
        done=true;clearTimeout(timer);
        try{const fc=earthlineEsriJsonToGeoJSON16458(data);retire();resolve(fc);}
        catch(error){retire();reject(error);}
      };
      script.onload=()=>{if(done)retire();};
      script.onerror=()=>{
        if(done){retire();return;}
        done=true;clearTimeout(timer);retire();reject(new Error("JSONP failed"));
      };
      try{
        const u=new URL(url,location.href);u.searchParams.set("f","json");u.searchParams.set("callback",cb);
        script.async=true;script.src=u.toString();document.head.appendChild(script);
      }catch(error){done=true;clearTimeout(timer);retire();reject(error);}
    });
  }
'''
fetchfn=r'''  async function earthlineFetchJson15872(url,timeoutMs){
    /* EARTHLINE 17360 — HTTPS/HTTP must not launch a duplicate JSONP request while
       the same official VCGI request is already succeeding through CORS. Use the
       same authority URL and timeout; JSONP remains a fallback transport only. */
    const corsFetch17360=async()=>{
      const controller=typeof AbortController!=="undefined"?new AbortController():null;
      const timer=controller?setTimeout(()=>controller.abort(),timeoutMs):null;
      try{
        const response=await fetch(url,{method:"GET",headers:{"Accept":"application/geo+json,application/json"},signal:controller?controller.signal:undefined});
        if(!response.ok)throw new Error("HTTP "+response.status);
        const data=await response.json();
        if(!data||!Array.isArray(data.features))throw new Error("invalid-geojson-response");
        return data;
      }finally{if(timer)clearTimeout(timer);}
    };
    const protocol17360=String(location&&location.protocol||"").toLowerCase();
    if(protocol17360==="http:"||protocol17360==="https:"){
      try{return await corsFetch17360();}
      catch(corsError17360){
        try{return await earthlineFetchJsonp15872(url,timeoutMs);}
        catch(jsonpError17360){
          if(typeof AggregateError==="function")throw new AggregateError([corsError17360,jsonpError17360],"official Vermont transport failed");
          throw jsonpError17360;
        }
      }
    }
    const cors=corsFetch17360(),jsonp=earthlineFetchJsonp15872(url,timeoutMs);
    if(typeof Promise.any==="function")return await Promise.any([cors,jsonp]);
    return await new Promise((resolve,reject)=>{let failed=0,lastError=null;for(const q of [cors,jsonp])Promise.resolve(q).then(resolve,error=>{lastError=error;if(++failed===2)reject(lastError);});});
  }
'''
s=s[:a]+jsonp+fetchfn+s[c:]
s="<!-- EARTHLINE_VERMONT_TRANSPORT_17360: live HTTP(S) uses CORS-first official VCGI transport; JSONP is fallback-only and late callbacks are safely retired. Authority, geometry, buffers and fail-closed exclusions unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Vermont CORS-first transport repair 17360")
