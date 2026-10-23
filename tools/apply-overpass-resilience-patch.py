from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="strict")
old='{url:"https://lz4.overpass-api.de/api/interpreter",timeoutMs:6200,label:"lz4-direct-fallback"}'
new='{url:"https://overpass.private.coffee/api/interpreter",timeoutMs:6000,label:"independent-open-data-fallback"}'
n=s.count(old)
if n!=1: raise SystemExit("OVERPASS_FALLBACK_COUNT="+str(n))
s=s.replace(old,new,1)
p.write_text(s)
print("EARTHLINE_OVERPASS_RESILIENCE_PATCH_OK")

# trigger
