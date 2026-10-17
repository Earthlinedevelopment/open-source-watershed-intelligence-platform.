from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
out=[]
for needle in ["earthlineOpenCorridorDetail16149","ZOOM TO","Zoom to","zoom to","zoomTo","flyTo","easeTo"]:
    start=0
    hits=0
    while True:
        i=s.find(needle,start)
        if i<0 or hits>=40: break
        out.append(f"===== {needle} @ {i} =====\n"+s[max(0,i-5000):i+10000])
        start=i+1;hits+=1
Path("corridor-zoom-owner-17425.txt").write_text("\n\n".join(out),encoding="utf-8")
print("sections",len(out))
