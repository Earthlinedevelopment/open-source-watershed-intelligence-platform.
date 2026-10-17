from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="async function flushTelemetry(keepalive=false){if(tf||!tq.length||!rawFetch)return;tf=true;"
new="""async function flushTelemetry(keepalive=false){
  const host=String(location&&location.hostname||'').toLowerCase();
  if(!/(^|\\.)earthlinedevelopment\\.org$/.test(host)){tq.length=0;tf=false;return;}
  if(tf||!tq.length||!rawFetch)return;tf=true;"""
if s.count(old)!=1: raise SystemExit("telemetry flush anchor missing")
s=s.replace(old,new,1)
s="/* EARTHLINE 17368 — telemetry origin guard: production telemetry only; localhost/test origins never call production telemetry endpoint. */\n"+s
p.write_text(s,encoding="utf-8")
print("installed production-only telemetry origin guard 17368")
