from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
parts=[]
for start_marker,end_marker in [
  ('<script id="earthline-regional-final-16020-js">','</script>'),
  ('<script id="earthline-progressive-focus-16158-js">','</script>')
]:
    i=s.find(start_marker)
    if i<0: continue
    j=s.find(end_marker,i)
    if j<0: continue
    parts.append(s[i:j+len(end_marker)])
Path("regional-clean-owner-17424.txt").write_text("\n\n===== NEXT OWNER =====\n\n".join(parts),encoding="utf-8")
print("parts",len(parts))
