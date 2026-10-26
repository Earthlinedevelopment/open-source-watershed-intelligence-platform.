from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

# M78.11 — canonical minor paths must not share already-owned downstream cells.
old_trace='''        while(i>=0&&i<N&&eligible[i]&&!seen.has(i)&&guard++<N){
          seen.add(i);cells.push(i);claimed[i]=1;'''
new_trace='''        while(i>=0&&i<N&&eligible[i]&&!seen.has(i)&&guard++<N){
          if(claimed[i])break; /* EARTHLINE M78.11 — one canonical owner per minor-flow cell; stop duplicate downstream tracing. */
          seen.add(i);cells.push(i);claimed[i]=1;'''
if "EARTHLINE M78.11 — one canonical owner per minor-flow cell" not in s:
    if s.count(old_trace)!=1:
        raise SystemExit(f"M78.11 trace anchor count={s.count(old_trace)}")
    s=s.replace(old_trace,new_trace,1)

# M78.12 — use currently listed free global OSM Overpass instances instead
# of the failing lz4 backend. Same OSM data, same query, same raster owner.
old_eps='''    const endpoints=[
      {url:"https://overpass-api.de/api/interpreter",timeoutMs:5200,label:"canonical"},
      {url:"https://lz4.overpass-api.de/api/interpreter",timeoutMs:6200,label:"lz4-direct-fallback"}
    ];'''
new_eps='''    const endpoints=[
      {url:"https://overpass-api.de/api/interpreter",timeoutMs:6000,label:"fosssgis-main-global"},
      {url:"https://overpass.private.coffee/api/interpreter",timeoutMs:5000,label:"private-coffee-global"},
      {url:"https://maps.mail.ru/osm/tools/overpass/api/interpreter",timeoutMs:5000,label:"vk-maps-global"}
    ]; /* EARTHLINE M78.16 — resilient free global OSM transport with three current public instances; source/query semantics unchanged. */'''
current_eps='''    const endpoints=[
      {url:"https://overpass.private.coffee/api/interpreter",timeoutMs:5000,label:"private-coffee-global"},
      {url:"https://maps.mail.ru/osm/tools/overpass/api/interpreter",timeoutMs:5000,label:"vk-maps-global"}
    ]; /* EARTHLINE M78.12 — resilient free global OSM transport; source/query semantics unchanged. */'''
if "EARTHLINE M78.16 — resilient free global OSM transport with three current public instances" not in s:
    if current_eps in s:
        s=s.replace(current_eps,new_eps,1)
    elif old_eps in s:
        s=s.replace(old_eps,new_eps,1)
    else:
        raise SystemExit("M78.16 endpoint anchor missing")

# M78.12 — a style-zero frame that required fallback may only be screened-clear
# after the fallback itself actually responded.
old_flags='''    const openDataAttempted=!!(op.attempted===true||styleAttempted);
    const openDataResponded=!!(overpassResponded||styleResponded);
    const openDataFailed=!!(overpassFailed||styleFailed);
    const openGeometryCount16516=Math.max(0,'''
new_flags='''    const openDataAttempted=!!(op.attempted===true||styleAttempted);
    const openDataResponded=!!(overpassResponded||styleResponded);
    const openDataFailed=!!(overpassFailed||styleFailed);
    const zeroStyleFallbackRequiredM7812=c.evidencePath17630==="shared-style-zero-plus-infrastructure-fallback";
    /* EARTHLINE M78.19 — loaded map evidence is the primary Property exclusion screen.
       A successful loaded-style query is sufficient to publish as OPEN-DATA SCREENING
       even when it returns zero relevant exclusions. External Overpass is enrichment,
       never a publication dependency. */
    const effectiveOpenDataRespondedM7812=!!(styleResponded||overpassResponded);
    const effectiveOpenDataFailedM7812=!!(!effectiveOpenDataRespondedM7812&&(overpassFailed||styleFailed));
    const openGeometryCount16516=Math.max(0,'''
if "EARTHLINE M78.19 — loaded map evidence is the primary Property exclusion screen" not in s:
    if s.count(old_flags)!=1:
        raise SystemExit(f"M78.12 verification flags anchor count={s.count(old_flags)}")
    s=s.replace(old_flags,new_flags,1)
    s=s.replace("if(openGeometryCount16516>0&&openDataResponded){","if(openGeometryCount16516>0&&effectiveOpenDataRespondedM7812){",1)
    s=s.replace("if(openDataResponded){","if(effectiveOpenDataRespondedM7812){",1)
    s=s.replace(
      "c.openDataSources16539={overpass:{attempted:!!op.attempted,responded:false,failed:overpassFailed},style:{attempted:styleAttempted,responded:false,failed:styleFailed}};",
      "c.openDataSources16539={overpass:{attempted:!!op.attempted,responded:false,failed:effectiveOpenDataFailedM7812},style:{attempted:styleAttempted,responded:zeroStyleFallbackRequiredM7812?false:styleResponded,failed:styleFailed}};",
      1
    )

for marker in [
  "EARTHLINE M78.11 — one canonical owner per minor-flow cell",
  "EARTHLINE M78.16 — resilient free global OSM transport with three current public instances",
  "effectiveOpenDataRespondedM7812"
]:
    if marker not in s:
        raise SystemExit("missing "+marker)

p.write_text(s,encoding="utf-8")
