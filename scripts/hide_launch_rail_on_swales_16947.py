from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(errors='ignore')

# Persistent state class: unlike inline display changes, this also catches launch
# controls created/reconciled after the How Bioswales overlay has already opened.
pat=re.compile(r"(function syncSwalesPage\(\)\{\s*const swalesOpen=location\.hash==='#swales-explained';)")
m=pat.search(s)
if not m:
    raise SystemExit('syncSwalesPage opening not found')
state="     document.documentElement.classList.toggle('earthline-swales-open-16947',swalesOpen);"
if "earthline-swales-open-16947" not in s:
    s=s[:m.end()]+state+s[m.end():]

css="""<style id="earthline-swales-launch-rail-hide-16947">
html.earthline-swales-open-16947 #earthlineLaunchLogin16872,
html.earthline-swales-open-16947 #earthlineLaunchDonate16872,
html.earthline-swales-open-16947 #earthlineLaunchMerch16872{display:none!important;visibility:hidden!important;pointer-events:none!important}
</style>"""
if 'earthline-swales-launch-rail-hide-16947' not in s:
    h=s.find('</head>')
    if h<0: raise SystemExit('head close not found')
    s=s[:h]+css+s[h:]

p.write_text(s)
