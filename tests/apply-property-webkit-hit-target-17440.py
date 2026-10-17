from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
anchor="""#earthlineDeclareProperty16169 .el69-dot{width:10px;height:10px;border-radius:50%;background:#4ec9ff;box-shadow:0 0 0 4px rgba(78,201,255,.18)}"""
insert=anchor+"""
/* EARTHLINE 17440 — decorative/property-label descendants cannot become the
   physical hit target. WebKit must keep pointerdown/up/click on the stable
   button node even while orb/text presentation reconciles. */
#earthlineDeclareProperty16169 *{pointer-events:none!important}"""
if s.count(anchor)!=1: raise SystemExit(f"Property button CSS anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)
s="<!-- EARTHLINE_PROPERTY_WEBKIT_HIT_TARGET_17440: stable button node owns the entire pointer gesture. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched stable Property hit target for WebKit 17440")
