from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")

old_ring_index = "const scale16722=4,bins16722=new Map();"
new_ring_index = "const scale16722=16,bins16722=new Map();"
assert old_ring_index in s, "ring index owner missing"
s = s.replace(old_ring_index, new_ring_index, 1)

p.write_text(s, encoding="utf-8")
print("EARTHLINE 17246 ring-index-only candidate applied")
