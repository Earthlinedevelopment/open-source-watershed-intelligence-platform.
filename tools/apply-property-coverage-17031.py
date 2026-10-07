from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="/* EARTHLINE 16783 — final published 12x12 candidate-cell spread."
i=s.find(marker)
assert i>=0, "16783 spread marker not found"
old="if(!focusMode&&chosen.length&&candidates.length){"
j=s.find(old,i,i+2500)
assert j>=0, "16783 Property guard not found"
s=s[:j]+"if(chosen.length&&candidates.length){"+s[j+len(old):]
p.write_text(s,encoding="utf-8")
print("enabled existing 16783 count-neutral spread for Property and Regional")
