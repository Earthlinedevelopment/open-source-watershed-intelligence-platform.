from pathlib import Path

p=Path("index.html")
s=p.read_text(errors="ignore")

# Remove the full educational How Bioswales Work and Corrections Registry from the institutional report.
old="</section> ${howBioswalesReportPages16388(data)} ${EARTHLINE_CORRECTIONS_REGISTRY_16513} <section class=\"el49-page\"><div class=\"el49-kicker\">09 · Limitations and Reliance</div>"
new="</section> <section class=\"el49-page\"><div class=\"el49-kicker\">09 · Limitations and Reliance</div>"
if old not in s:
    raise SystemExit("full How Bioswales report injection anchor not found")
s=s.replace(old,new,1)

# Keep only a concise professional explanation of the mechanism in the evidence section.
oldp="<section class=\"el49-page\"><div class=\"el49-kicker\">06 · Comparable Systems and Precedents</div><h2>Evidence for the mechanism—not validation of this map</h2><p>Earthline’s intervention logic is consistent with long-standing landscape systems that slow runoff, increase residence time, retain sediment and support vegetation. These cases demonstrate mechanisms. They do not validate the location, dimensions or performance of any corridor in this report.</p>"
newp="<section class=\"el49-page\"><div class=\"el49-kicker\">06 · Comparable Systems and Precedents</div><h2>Evidence for the mechanism—not validation of this map</h2><p>Contour bioswales intercept surface runoff before it concentrates, reduce flow velocity, spread water laterally along contour, and increase residence time for infiltration. Earthline uses that established hydrologic mechanism to screen where intervention may warrant closer investigation. The comparable systems below support the mechanism; they do not validate the location, dimensions, or performance of any corridor in this report.</p>"
if oldp not in s:
    raise SystemExit("professional evidence paragraph anchor not found")
s=s.replace(oldp,newp,1)

p.write_text(s)
