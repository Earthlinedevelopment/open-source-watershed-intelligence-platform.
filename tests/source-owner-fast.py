from pathlib import Path
import re
text=Path("index.html").read_text(encoding="utf-8")
terms=[
 "async function loadDEM","function loadDEM","async function hydrology","function hydrology",
 "lastResizeRunToken16020","cameraSettle16310","corridor rendering incomplete",
 "earthlineRenderRegionalOverlay16020","regionalOverlayRenderOk16336"
]
for term in terms:
    i=text.find(term)
    print(f"===== {term} @ {i} =====")
    if i>=0:
        print(text[max(0,i-1800):min(len(text),i+4200)])
for pat in [
 r"\b(?:w|W|width)\s*[:=]\s*96\b",
 r"\b(?:h|H|height)\s*[:=]\s*96\b",
 r"\b96\s*[,xX×]\s*96\b",
 r"96\s*\*\s*96",
]:
    ms=list(re.finditer(pat,text))
    print(f"===== REGEX {pat} count={len(ms)} =====")
    for m in ms[:20]:
        i=m.start()
        print(text[max(0,i-700):min(len(text),i+900)])
