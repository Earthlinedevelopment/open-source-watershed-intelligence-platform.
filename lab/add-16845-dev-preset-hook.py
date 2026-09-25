from pathlib import Path

path=Path('index.html')
s=path.read_text(encoding='utf-8')
old="resolvePreset:q=>PRESETS[key(q)]||null,knownPropertyPreset"
new="resolvePreset:q=>PRESETS[key(q)]||null,setDevPreset16845:(q,loc)=>{PRESETS[key(q)]=Object.assign({},loc);return PRESETS[key(q)]},knownPropertyPreset"
if new in s:
    print('16845 dev preset injector already present')
elif old in s:
    s=s.replace(old,new,1)
    path.write_text(s,encoding='utf-8')
    print('added 16845 dev preset injector')
else:
    raise SystemExit('regional test hook insertion target missing')
