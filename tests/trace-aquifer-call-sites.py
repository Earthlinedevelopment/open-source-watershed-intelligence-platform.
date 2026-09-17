from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
start=0;n=0
needle='fetchUSGSAquifers('
while True:
    i=text.find(needle,start)
    if i<0: break
    n+=1
    print(f'===== CALL {n} @ {i} =====')
    print(text[max(0,i-1800):min(len(text),i+2600)])
    start=i+len(needle)
print('TOTAL',n)
