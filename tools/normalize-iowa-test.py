from pathlib import Path
p=Path('tests/iowa-live-diagnostic.mjs')
s=p.read_text()
s=s.replace('});\\nawait browser.close();','});\nawait browser.close();')
p.write_text(s)
print('NORMALIZED')
