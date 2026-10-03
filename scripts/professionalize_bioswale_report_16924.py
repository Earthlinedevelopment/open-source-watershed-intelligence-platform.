from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(errors="ignore")

# Remove the full educational How Bioswales Work block and Corrections Registry
# from the institutional Bioswale Impact Report only. Preserve their canonical
# sources for the public educational surface.
pat=re.compile(r'''\$\{howBioswalesReportPages16388\(data\)\}\s*\$\{EARTHLINE_CORRECTIONS_REGISTRY_16513\}\s*''')
s2,n=pat.subn('',s,count=1)
if n!=1:
    raise SystemExit(f"expected one report education injection, found {n}")
s=s2

# Keep one concise, professional mechanism statement in the report's
# Comparable Systems and Precedents section.
old="""<section class="el49-page"><div class="el49-kicker">06 · Comparable Systems and Precedents</div><h2>Evidence for the mechanism—not validation of this map</h2><p>Earthline’s intervention logic is consistent with long-standing landscape systems that slow runoff, increase residence time, retain sediment and support vegetation. These cases demonstrate mechanisms. They do not validate the location, dimensions or performance of any corridor in this report.</p>"""
new="""<section class="el49-page"><div class="el49-kicker">06 · Comparable Systems and Precedents</div><h2>Evidence for the mechanism—not validation of this map</h2><p>Contour bioswales intercept surface runoff before it concentrates, reduce flow velocity, spread water laterally along contour, and increase residence time for infiltration. Earthline uses that established hydrologic mechanism to screen where intervention may warrant closer investigation. The comparable systems below support the mechanism; they do not validate the location, dimensions, or performance of any corridor in this report.</p>"""
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    raise SystemExit("Comparable Systems paragraph anchor not found")

p.write_text(s)
