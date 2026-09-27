from pathlib import Path
import re
s=Path('index.html').read_text(encoding='utf-8')
needle='RUN ANALYSIS'
positions=[m.start() for m in re.finditer(re.escape(needle),s)]
print('COUNT',len(positions))
for n,p in enumerate(positions,1):
    print('\n---',n,'at',p,'---')
    print(s[max(0,p-700):min(len(s),p+900)])
