from pathlib import Path
p=Path('index.html')
s=p.read_text(errors='ignore')
old="""take('The core idea');take('Why transparent limits matter');           const sequence=[             take('What happens when water leaves too quickly'),"""
new="""const intro=take('The idea in one minute');take('Why transparent limits matter');           const sequence=[             intro,             take('What happens when water leaves too quickly'),"""
if old not in s: raise SystemExit('How Swales sequence owner not found')
s=s.replace(old,new,1)
p.write_text(s)
