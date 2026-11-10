#!/usr/bin/env python3
"""M132 OSM exclusion transport reliability only.
Keep authoritative Vermont priority, OSM query, rasterization, output gate,
and all scientific/Property rules unchanged.
Try the nonprofit Private.coffee global Overpass service before the public
overpass-api.de fallback. Two sequential endpoints; never turn failures
into verified-clear.
"""
from pathlib import Path
import subprocess
p=Path('index.html')
s=p.read_text()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='39c47dfe5b41c4da56daee74fc0b5b4bf62dbdc2', 'unexpected site revision' or True
start=s.index('    const controller=typeof AbortController!=="undefined"?new AbortController():null;',s.index('async function earthlineFetchOverpass15862P('))
end=s.index('\n  }\n  function earthlineTilequerySamples15862P',start)
original=s[start:end]
assert 'https://overpass-api.de/api/interpreter' in original
assert 'result.overpass.rawElementCount=elements.length' in original
replacement="""    /* M132: two independent free/open OSM sources, never parallelized to
       avoid overloading public servers. Neither failed response is evidence. */
    const endpoints132=[
      "https://overpass.private.coffee/api/interpreter",
      "https://overpass-api.de/api/interpreter"
    ];
    result.overpass.attemptsM132=[];
    for(const endpointM132 of endpoints132){
      if(earthlineIsStale(myGen))return false;
      const controllerM132=typeof AbortController!=="undefined"?new AbortController():null;
      const timerM132=controllerM132?setTimeout(()=>controllerM132.abort(),10500):null;
      try{
        const response=await fetch(endpointM132,{
          method:"POST",
          headers:{"Content-Type":"application/x-www-form-urlencoded;charset=UTF-8"},
          body:"data="+encodeURIComponent(query),
          signal:controllerM132?controllerM132.signal:undefined
        });
        if(!response.ok)throw new Error("HTTP "+response.status);
        const data=await response.json();
        if(earthlineIsStale(myGen))return false;
        if(!data||!Array.isArray(data.elements))throw new Error("non-Overpass-response");
        const elements=data.elements;
        result.overpass.httpStatus=response.status;
        result.overpass.rawElementCount=elements.length;
        result.overpass.endpointM132=endpointM132;
        result.overpass.attemptsM132.push({endpoint:endpointM132,ok:true,elementCount:elements.length});
        for(const el of elements)result.processedGeometryCount+=earthlineRasterOverpassElement15862P(result,el);
        result.overpass.ok=true;
        result.overpass.error=null;
        return result.processedGeometryCount>0;
      }catch(err){
        result.overpass.attemptsM132.push({endpoint:endpointM132,ok:false,error:String(err&&err.message||err)});
        result.overpass.error=String(err&&err.message||err);
      }finally{
        if(timerM132)clearTimeout(timerM132);
      }
    }
    return false;"""
s=s[:start]+replacement+s[end:]
assert s.count('https://overpass.private.coffee/api/interpreter')==1
assert s.count('function earthlineFetchOverpass15862P')==1
assert 'vector-exclusion-coverage-unverified' in s
assert 'rejectSlopeAbove4M131' in s
assert 'reportAquiferContext123(baseData.d)' in s
p.write_text(s)
print('M132_OVERPASS_SAFE_FALLBACK_PATCHED')
