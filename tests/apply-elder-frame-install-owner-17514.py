from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Insert the single Elder lifecycle publisher immediately after the authoritative
# Property declaration/frame is installed. Use the stable declaration marker rather
# than an older comment anchor.
marker="window.EARTHLINE_PROPERTY_DECLARATION_16169={"
i=s.find(marker)
if i<0: raise SystemExit("Property declaration marker missing")
line_end=s.find("\n",i)
if line_end<0: raise SystemExit("Property declaration line end missing")
insert="""\n    /* EARTHLINE 17514 — the authoritative 20-acre Property frame now exists.
       Start the one Elder Property lifecycle/publication owner here so its already-
       primed exact-target computation can commit without waiting for hydrology
       presentation. Identity validation inside startProperty rejects stale targets. */
    try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}"""
s=s[:line_end]+insert+s[line_end:]

# Neutralize the previous 17512 scientific-terminal publisher so ownership remains single.
old="""      /* EARTHLINE 17512 — Property science is verified. Publish the already-primed
         exact-target Elder result now, before optional map/texture finishing.
         startProperty remains the single Elder Property publication owner and
         retains its exact run-identity guard. */
      try{void window.EARTHLINE_ELDER_TREES_V1_17097?.startProperty?.()}catch(_){}
"""
if s.count(old)!=1:
    raise SystemExit(f"scientific terminal 17512 owner anchor count={s.count(old)}")
s=s.replace(old,"""      /* EARTHLINE 17514 — Elder publication already started from the authoritative
         Property frame before the hydrology runner; no second lifecycle owner here. */
""",1)

s="<!-- EARTHLINE_ELDER_FRAME_INSTALL_OWNER_17514: one Elder lifecycle owner starts at authoritative 20-acre frame install; stale identity remains fail-closed. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed frame-install Elder lifecycle owner 17514")
