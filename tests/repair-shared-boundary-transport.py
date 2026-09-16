from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    const params={where:\"NAME='\"+earthlineSqlLiteral16539(stateName)+\"'\",outFields:'NAME,STUSAB,GEOID,INTPTLAT,INTPTLON',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.0025',geometryPrecision:'5'};
    const raw=await jsonp(cap.endpoint,params,6500);
    if(raw&&raw.error)throw new Error(raw.error.message||'administrative boundary service error');
    const data=esriSetToGeoJSON(raw);if(runToken&&!isCurrentRun(runToken))return null;
"""
new="""    const params=new URLSearchParams({where:\"NAME='\"+earthlineSqlLiteral16539(stateName)+\"'\",outFields:'NAME,STUSAB,GEOID,INTPTLAT,INTPTLON',returnGeometry:'true',outSR:'4326',maxAllowableOffset:'0.0025',geometryPrecision:'5',f:'geojson'});
    const signal=(typeof AbortSignal!=='undefined'&&typeof AbortSignal.timeout==='function')?AbortSignal.timeout(6500):undefined;
    const response=await fetch(cap.endpoint+'?'+params.toString(),{mode:'cors',cache:'force-cache',signal,headers:{Accept:'application/geo+json,application/json'}});
    if(!response.ok)throw new Error('administrative boundary HTTP '+response.status);
    const data=await response.json();if(runToken&&!isCurrentRun(runToken))return null;
"""
count=s.count(old)
if count!=1:
    raise SystemExit(f'expected exactly one current JSONP boundary block, found {count}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('repaired shared boundary transport: coarse geometry retained; CORS fetch restored')
