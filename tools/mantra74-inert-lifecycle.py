from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s
patterns=[
  'earthlineMap.on("styledata",()=>{});',
  'earthlineMap.on("idle",()=>{});',
  "map.on('styledata',()=>{});",
  'setInterval(()=>{},850);'
]
counts={}
for pat in patterns:
    counts[pat]=s.count(pat)
    s=s.replace(pat,'')
if not any(counts.values()):
    raise SystemExit('no inert lifecycle attachments found')
for pat in patterns:
    if pat in s:
        raise SystemExit('inert lifecycle attachment remains: '+pat)
p.write_text(s,encoding='utf-8')
print('EARTHLINE_INERT_LIFECYCLE_REMOVAL',counts)
