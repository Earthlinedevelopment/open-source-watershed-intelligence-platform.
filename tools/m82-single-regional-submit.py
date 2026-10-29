from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""      /* A committed suggestion is a Regional search submission. */
      void action(null);
"""
new="""      /* EARTHLINE M82 — suggestion selection commits the requested identity only.
         The visible RUN ANALYSIS control is the single Regional submission owner.
         This prevents one suggestion tap plus one Run press from launching two concurrent runs. */
"""
if old not in s:
    raise SystemExit("M82 suggestion auto-submit target not found")
if s.count(old)!=1:
    raise SystemExit(f"M82 suggestion auto-submit target count={s.count(old)}")
s=s.replace(old,new)
p.write_text(s,encoding="utf-8")
print("patched",len(s))
