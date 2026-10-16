from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=4,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const lo16722=Math.floor(Math.min(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const hi16722=Math.floor(Math.max(Number(a16722[1]),Number(b16722[1]))*scale16722);
        const edge16722=[a16722,b16722];
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      idx16722={scale:scale16722,bins:bins16722};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),edges16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale))||[];
    let inside16722=false;
    for(const edge16722 of edges16722){
      const a16722=edge16722[0],b16722=edge16722[1];
      if(earthlinePointOnSegment16539(p16722,a16722,b16722))return true;
      const xi16722=Number(b16722[0]),yi16722=Number(b16722[1]),xj16722=Number(a16722[0]),yj16722=Number(a16722[1]);
      if(((yi16722>y16722)!==(yj16722>y16722))&&(x16722<(xj16722-xi16722)*(y16722-yi16722)/((yj16722-yi16722)||1e-15)+xi16722))inside16722=!inside16722;
    }
    return inside16722;
  }"""
new="""  function earthlinePointInRingIndexed16722(p16722,ring16722){
    if(!earthlineFinitePoint16539(p16722)||!Array.isArray(ring16722)||ring16722.length<3)return false;
    let idx16722=earthlineRingIndexCache16722.get(ring16722);
    if(!idx16722){
      const scale16722=4,bins16722=new Map();
      for(let i16722=0,j16722=ring16722.length-1;i16722<ring16722.length;j16722=i16722++){
        const a16722=ring16722[j16722],b16722=ring16722[i16722];
        if(!earthlineFinitePoint16539(a16722)||!earthlineFinitePoint16539(b16722))continue;
        const x1=Number(a16722[0]),y1=Number(a16722[1]),x2=Number(b16722[0]),y2=Number(b16722[1]),
              dx=x2-x1,dy=y2-y1,len=dx*dx+dy*dy,
              lo16722=Math.floor(Math.min(y1,y2)*scale16722),hi16722=Math.floor(Math.max(y1,y2)*scale16722),
              edge16722=[x1,y1,x2,y2,dx,dy,len];
        for(let bin16722=lo16722;bin16722<=hi16722;bin16722++){
          let list16722=bins16722.get(bin16722);if(!list16722)bins16722.set(bin16722,list16722=[]);list16722.push(edge16722);
        }
      }
      idx16722={scale:scale16722,bins:bins16722};earthlineRingIndexCache16722.set(ring16722,idx16722);
    }
    const x16722=Number(p16722[0]),y16722=Number(p16722[1]),edges16722=idx16722.bins.get(Math.floor(y16722*idx16722.scale))||[];
    let inside16722=false;
    for(const edge16722 of edges16722){
      const x1=edge16722[0],y1=edge16722[1],x2=edge16722[2],y2=edge16722[3],dx=edge16722[4],dy=edge16722[5],len=edge16722[6];
      if(len<1e-20){if(Math.hypot(x16722-x1,y16722-y1)<1e-10)return true;}
      else{
        const cross=(x16722-x1)*dy-(y16722-y1)*dx;
        if(Math.abs(cross)<=1e-10){const dot=(x16722-x1)*dx+(y16722-y1)*dy;if(dot>=0&&dot<=len)return true;}
      }
      if(((y2>y16722)!==(y1>y16722))&&(x16722<(x1-x2)*(y16722-y2)/((y1-y2)||1e-15)+x2))inside16722=!inside16722;
    }
    return inside16722;
  }"""
if s.count(old)!=1: raise SystemExit(f"indexed ring owner anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_NUMERIC_RING_EDGES_17308: precompute numeric boundary edge values in existing index; exact on-segment tolerance and ray-crossing semantics unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")
print("precomputed numeric ring edge values 17308")
