from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
marker='src=src.replace(\'</head>\',"<style id=\\"earthline-swales-professional-16389\\">'
i=s.find(marker)
if i<0: raise SystemExit('style injection start not found')
j=s.find('</style>");', i)
if j<0: raise SystemExit('style injection end not found')
block=s[i:j+11]
block=block.replace('src=src.replace(\'</head>\',"<style id=\\"earthline-swales-professional-16389\\">', 'src=src.replace(\'</head>\',`<style id="earthline-swales-professional-16389">', 1)
block=block[:-11]+'</style>`);'
s=s[:i]+block+s[j+11:]
p.write_text(s)