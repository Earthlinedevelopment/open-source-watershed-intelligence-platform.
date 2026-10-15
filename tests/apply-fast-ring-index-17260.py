from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
start=s.find("  const earthlineRingIndexCache16722=new WeakMap();")
end=s.find("  function earthlinePrepareJurisdiction16539(g){",start)
if start<0 or end<0: raise SystemExit(f"ring block anchors {start} {end}")
new=r"""  const earthlineRingIndexCache16722=new WeakMap();
  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=64,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const x116722=Number(a16722[0]),y116722=Number(a16722[1]),x216722=Number(b16722[0]),y216722=Number(b16722[1]);
        const dx16722=x216722-x116722,dy16722=y216722-y116722,len16722=dx16722*dx16722+dy16722*dy16722;
        const edge16722={x1:x116722,y1:y116722,x2:x216722,y2:y216722,dx:dx16722,dy:dy16722,len:len16722,
          minX:Math.min(x116722,x216722),maxX:Math.max(x116722,x216722),minY:Math.min(y116722,y216722),maxY:Math.max(y116722,y216722)};
        const lo16722=Math.floor(edge16722.minY*scale16722),hi16722=Math.floor(edge16722.maxY*scale16722);
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      idx16722={scale:scale16722,bins:bins16722};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),edges16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale))||[];
    let inside16722=false;
    for(const e16722 of edges16722){
      if(x16722>=e16722.minX&&x16722<=e16722.maxX&&y16722>=e16722.minY&&y16722<=e16722.maxY){
        if(e16722.len<1e-20){
          if(Math.hypot(x16722-e16722.x1,y16722-e16722.y1)<1e-10)return true;
        }else{
          const cross16722=(x16722-e16722.x1)*e16722.dy-(y16722-e16722.y1)*e16722.dx;
          if(Math.abs(cross16722)<=1e-10){
            const dot16722=(x16722-e16722.x1)*e16722.dx+(y16722-e16722.y1)*e16722.dy;
            if(dot16722>=0&&dot16722<=e16722.len)return true;
          }
        }
      }
      if(((e16722.y2>y16722)!==(e16722.y1>y16722))&&(x16722<(e16722.x1-e16722.x2)*(y16722-e16722.y2)/((e16722.y1-e16722.y2)||1e-15)+e16722.x2))inside16722=!inside16722;
    }
    return inside16722;
  }
"""
s=s[:start]+new+s[end:]
p.write_text(s,encoding="utf-8")
