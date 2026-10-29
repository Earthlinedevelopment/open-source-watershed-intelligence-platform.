from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.index("    /* EARTHLINE 17803 — FINAL REGIONAL->PROPERTY TARGET PREFLIGHT.")
end=s.index("    const priorityPreviewEnabled16329=false;", start)
block=s[start:end]
s=s[:start]+s[end:]
marker="    if(focusMode){for(const f of swales.features||[]){f.properties=Object.assign({},f.properties||{},{analysis_tier:'focus',label:String(f.properties?.grade||'C')+String(f.properties?.rank||'')+' — FOCUS BIOSWALE OPPORTUNITY',screening:'fixed 3 km focus screening; not a property alignment; field and bare-earth verification required'});}}"
idx=s.index(marker)
replacement=block.replace("EARTHLINE 17803 — FINAL REGIONAL->PROPERTY TARGET PREFLIGHT","EARTHLINE 17804 — FINAL POST-CLIP REGIONAL->PROPERTY TARGET PREFLIGHT").replace('build:"EARTHLINE 17803"','build:"EARTHLINE 17804"').replace('rule:"final Regional corridor priority is verified at the exact Property midpoint and exact 20-acre <=4% Terrain-RGB slope grid before publication"','rule:"post-jurisdiction final Regional corridor priority is verified at the exact displayed Property midpoint and exact 20-acre <=4% Terrain-RGB slope grid before publication"')
s=s[:idx]+replacement+s[idx:]
p.write_text(s,encoding="utf-8")
print("moved final target preflight after jurisdiction clipping")
