from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='<!-- EARTHLINE 16846 — AUTHORITATIVE SMALL-COUNTRY EXTENT. GLOBAL DEV ONLY. -->'
if marker in s:
    print('16846 already applied'); raise SystemExit(0)
old="""    if(!focusMode){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{"""
new="""    if(!focusMode){
      const authoritativeCountryExtent16846=!!(locked&&pt==='country');
      if(!authoritativeCountryExtent16846){
        if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
        if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      }
      w=b[2]-b[0];h=b[3]-b[1];
    }else{"""
if old not in s: raise SystemExit('analysisBounds minimum-span owner not found')
s=s.replace(old,new,1)
s=marker+'\n'+s
p.write_text(s,encoding='utf-8')
print('applied 16846 authoritative small-country extent')
