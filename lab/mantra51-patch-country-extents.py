from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="""    let w=b[2]-b[0],h=b[3]-b[1];
    if(!focusMode){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else{
      const minSpan=.004;
      if(w<minSpan){const d=(minSpan-w)/2;b[0]-=d;b[2]+=d;}
      if(h<minSpan){const d=(minSpan-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }
    const fullAlaskaExtent16905=locked&&!focusMode&&String(loc&&loc.jurisdictionProfileId16556||'')==='us-ak';
    if(!fullAlaskaExtent16905){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}
"""
new="""    let w=b[2]-b[0],h=b[3]-b[1];
    const governedCountryExtent16908=!focusMode&&locked&&pt==='country';
    if(!focusMode&&!governedCountryExtent16908){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else if(focusMode){
      const minSpan=.004;
      if(w<minSpan){const d=(minSpan-w)/2;b[0]-=d;b[2]+=d;}
      if(h<minSpan){const d=(minSpan-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }
    const fullAlaskaExtent16905=locked&&!focusMode&&String(loc&&loc.jurisdictionProfileId16556||'')==='us-ak';
    if(!fullAlaskaExtent16905&&!governedCountryExtent16908){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}
"""
if old not in s:
    if 'governedCountryExtent16908' in s:
        print('country extent ceiling already repaired')
        raise SystemExit(0)
    raise SystemExit('current analysisBounds target not found exactly')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('patched country-only exact governed extent; Alaska path preserved')
