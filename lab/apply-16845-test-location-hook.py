from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
anchor="    if(s&&s.loc&&key(s.appliedSearchText)===qk)return s.loc;\n"
insert="    if(window.EARTHLINE_TEST_LOCATION_16845&&key(window.EARTHLINE_TEST_LOCATION_16845.query||q)===qk){const loc=Object.assign({},window.EARTHLINE_TEST_LOCATION_16845,{query:q});if(s){s.loc=loc;s.appliedSearchText=q;}return loc;}\n"
if anchor not in s:
    raise SystemExit('test location hook anchor not found')
if 'EARTHLINE_TEST_LOCATION_16845' in s:
    raise SystemExit('test location hook already present')
s=s.replace(anchor,insert+anchor,1)
p.write_text(s,encoding='utf-8')
print('added runner-only EARTHLINE_TEST_LOCATION_16845 hook')
