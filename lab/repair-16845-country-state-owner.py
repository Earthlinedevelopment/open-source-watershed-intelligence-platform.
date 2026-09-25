from pathlib import Path

path=Path('index.html')
s=path.read_text(encoding='utf-8')
old="""        if(s){s.loc=loc;s.centerLng=Number(loc.lng);s.centerLat=Number(loc.lat);s.viewZoom=Number(loc.zoomHint||s.viewZoom||5.7);s.appliedSearchText=q;s.jurisdictionPackage16556=countryPackage16845;}"""
new="""        const regionalState16845=state();
        if(regionalState16845){regionalState16845.loc=loc;regionalState16845.centerLng=Number(loc.lng);regionalState16845.centerLat=Number(loc.lat);regionalState16845.viewZoom=Number(loc.zoomHint||regionalState16845.viewZoom||5.7);regionalState16845.appliedSearchText=q;regionalState16845.jurisdictionPackage16556=countryPackage16845;}"""
if old in s:
    s=s.replace(old,new,1)
    path.write_text(s,encoding='utf-8')
    print('repaired 16845 country state handoff')
elif new in s:
    print('16845 country state handoff already repaired')
else:
    raise SystemExit('16845 country state handoff target missing')
