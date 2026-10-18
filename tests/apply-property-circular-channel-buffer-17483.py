from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old1=r'''        for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
          const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;unsafe[idx(nx,ny)]=1;
        }'''
new1=r'''        for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
          const nx=x+ox,ny=y+oy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
          const propertyExact17483=String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||
            !!(M&&M.loc&&M.loc.userSelectedSite===true&&Number(M.loc.acres||0)>0&&Number(M.loc.acres||0)<=50);
          if(propertyExact17483&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;
          unsafe[idx(nx,ny)]=1;
        }'''
if s.count(old1)!=1: raise SystemExit(f"channel cache loop anchor count {s.count(old1)}")
s=s.replace(old1,new1,1)
old2=r'''  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    const x=gx+ox,y=gy+oy;
    if(x<0||y<0||x>=GW||y>=GH)continue;
    if(M.acc&&M.acc[idx(x,y)]>=channelThreshold)return false;
  }'''
new2=r'''  for(let oy=-radius;oy<=radius;oy++)for(let ox=-radius;ox<=radius;ox++){
    const x=gx+ox,y=gy+oy;
    if(x<0||y<0||x>=GW||y>=GH)continue;
    const propertyExact17483=String(document.documentElement.dataset.earthlinePropertyRunState||'')==='running'||
      !!(M&&M.loc&&M.loc.userSelectedSite===true&&Number(M.loc.acres||0)>0&&Number(M.loc.acres||0)<=50);
    if(propertyExact17483&&Math.hypot(ox,oy)*Math.max(0.5,Number(M.cellM||1))>4.000001)continue;
    if(M.acc&&M.acc[idx(x,y)]>=channelThreshold)return false;
  }'''
if s.count(old2)!=1: raise SystemExit(f"path channel loop anchor count {s.count(old2)}")
s=s.replace(old2,new2,1)
s="<!-- EARTHLINE_PROPERTY_MAJOR_CHANNEL_CIRCULAR_BUFFER_17483: Property-run exact 4 m Euclidean channel buffer; Regional unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed Property-run exact circular 4m major-channel buffer 17483")
