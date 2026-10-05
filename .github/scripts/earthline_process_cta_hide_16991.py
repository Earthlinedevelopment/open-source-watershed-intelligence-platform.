from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="const processOpen=location.hash==='#earthline-process';"
new="const processOpen=location.hash==='#earthline-process'; document.documentElement.classList.toggle('earthline-process-open-16991',processOpen);"
if old not in s:
    raise SystemExit("processOpen token missing")
s=s.replace(old,new,1)
marker="earthline-process-launch-rail-hide-16991"
if marker not in s:
    css="""
<style id="earthline-process-launch-rail-hide-16991">
html.earthline-process-open-16991 #earthlineLaunchLogin16872,
html.earthline-process-open-16991 #earthlineLaunchDonate16872,
html.earthline-process-open-16991 #earthlineLaunchMerch16872{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}
</style>
"""
    i=s.lower().rfind("</head>")
    if i<0: raise SystemExit("head close missing")
    s=s[:i]+css+s[i:]
p.write_text(s,encoding="utf-8")
