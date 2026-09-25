from pathlib import Path
import re
s=Path('index.html').read_text(encoding='utf-8')
for start,end,label in [
    ('function analysisBounds(loc){','function boundsHash','ANALYSIS_BOUNDS'),
    ('async function hydrology(','function contourGeoJSON','HYDROLOGY'),
    ('async function loadDEM(','async function hydrology','LOAD_DEM')
]:
    a=s.find(start)
    if a<0:
        print(f'=== {label} NOT FOUND ==='); continue
    b=s.find(end,a+len(start))
    if b<0: b=min(len(s),a+18000)
    print(f'=== {label} ===')
    print(s[a:b][:18000])
