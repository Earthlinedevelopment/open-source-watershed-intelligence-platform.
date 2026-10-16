from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
for a in ["async function fetchTerrainTile","function fetchTerrainTile","async function fetchImageData","function fetchImageData"]:
    i=s.find(a)
    print(a,i)
    if i>=0:
        Path("terrain-fetch-owner-17340.txt").write_text(s[max(0,i-12000):i+22000],encoding="utf-8")
        break
