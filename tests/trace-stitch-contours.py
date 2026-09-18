from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('function stitchContourSegments')
if i<0: raise SystemExit('stitchContourSegments not found')
print(text[i:min(len(text),i+18000)])
