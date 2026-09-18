from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('async function makeContours')
if i<0: raise SystemExit('makeContours not found')
j=text.find('function makeSwales',i)
print(text[i:j if j>i else i+50000])
