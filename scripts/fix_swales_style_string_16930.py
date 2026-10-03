from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
marker='src=src.replace(\'</head>\',"<style id=\\"earthline-swales-professional-16389\\">'
i=s.find(marker)
if i<0: raise SystemExit('style injection start not found')
end='</style>"+\'</head>\');'
j=s.find(end,i)
if j<0: raise SystemExit('style injection end not found')
block=s[i:j+len(end)]
block=block.replace(marker, 'src=src.replace(\'</head>\',`<style id="earthline-swales-professional-16389">', 1)
block=block[:-len(end)] + '</style>`+\'</head>\');'
s=s[:i]+block+s[j+len(end):]
p.write_text(s)