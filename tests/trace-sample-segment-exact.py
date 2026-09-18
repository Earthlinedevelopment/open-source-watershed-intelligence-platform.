from pathlib import Path
text=Path('index.html').read_text(encoding='utf-8')
i=text.find('function sampleSegment')
print('AT',i)
print(text[max(0,i-2500):min(len(text),i+18000)])
