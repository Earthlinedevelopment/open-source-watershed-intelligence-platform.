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
    if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}
"""
new="""    let w=b[2]-b[0],h=b[3]-b[1];
    /* EARTHLINE 16845 — atomic country extents already come from the governed
       country polygon. Preserve them exactly: do not inflate small island nations
       into ocean-heavy 1.8° windows and do not truncate large countries to the
       legacy 18°x14° generic Regional ceiling. U.S. states and all other modes
       retain the existing bounds behavior unchanged. */
    const governedCountryExtent16845=!focusMode&&locked&&pt==='country';
    if(!focusMode&&!governedCountryExtent16845){
      if(w<1.8){const d=(1.8-w)/2;b[0]-=d;b[2]+=d;}
      if(h<1.8){const d=(1.8-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }else if(focusMode){
      const minSpan=.004;
      if(w<minSpan){const d=(minSpan-w)/2;b[0]-=d;b[2]+=d;}
      if(h<minSpan){const d=(minSpan-h)/2;b[1]-=d;b[3]+=d;}
      w=b[2]-b[0];h=b[3]-b[1];
    }
    if(!governedCountryExtent16845){if(w>18){const c=(b[0]+b[2])/2;b[0]=c-9;b[2]=c+9;}if(h>14){const c=(b[1]+b[3])/2;b[1]=c-7;b[3]=c+7;}}
"""
count=s.count(old)
if count!=1:
    raise SystemExit(f'expected exactly one analysisBounds target, found {count}')
s=s.replace(old,new,1)
if 'governedCountryExtent16845' not in s:
    raise SystemExit('patch marker missing')
p.write_text(s,encoding='utf-8')
print('patched index.html: country-only exact extent preservation')
