from pathlib import Path
import re
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('function makeSwales')
print('MAKE_SWALES_AT',i)
if i>=0:
    lo=max(0,i-12000);hi=min(len(text),i+55000)
    block=text[lo:hi]
    print('===== MAKE SWALES WINDOW =====')
    print(block)
    print('===== COVERAGE-LIKE TERMS IN WINDOW =====')
    for m in re.finditer(r'(?i)(coverage|spatial|bucket|bin|quadrant|sector|gap|hole|fallback|local|distribution|density|cell|region)',block):
        p=m.start()
        print('\n---',m.group(0),'@',lo+p,'---')
        print(block[max(0,p-700):min(len(block),p+1400)])
