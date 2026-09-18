from pathlib import Path
import re
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('async function fetchUSGSAquifersLegacy16397')
if i<0: raise SystemExit('legacy function not found')
block=text[i:min(len(text),i+65000)]
print(block)
print('===== URLS =====')
for m in re.finditer(r'https?://[^\'"\s<>]+',block):
    print(m.group(0))
