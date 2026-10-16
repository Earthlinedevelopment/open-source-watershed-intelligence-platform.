from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def once(name,old,new):
    global s
    n=s.count(old);print(name,n)
    if n!=1: raise SystemExit(f"{name}: expected one anchor, found {n}")
    s=s.replace(old,new,1)

old_heap="""  class Heap{constructor(){this.a=[];}push(o){const a=this.a;a.push(o);let i=a.length-1;while(i){const p=(i-1)>>1;if(a[p].z<=o.z)break;a[i]=a[p];i=p;}a[i]=o;}pop(){const a=this.a;if(!a.length)return null;const root=a[0],last=a.pop();if(a.length){let i=0;while(true){let l=i*2+1,r=l+1;if(l>=a.length)break;let c=r<a.length&&a[r].z<a[l].z?r:l;if(a[c].z>=last.z)break;a[i]=a[c];i=c;}a[i]=last;}return root;}get length(){return this.a.length;}}"""
new_heap="""  class Heap{
    constructor(){this.i=[];this.z=[];this.out={i:0,z:0};}
    push(o){
      const ai=this.i,az=this.z,oi=o.i,oz=o.z;ai.push(oi);az.push(oz);let k=az.length-1;
      while(k){const p=(k-1)>>1;if(az[p]<=oz)break;ai[k]=ai[p];az[k]=az[p];k=p;}
      ai[k]=oi;az[k]=oz;
    }
    pop(){
      const ai=this.i,az=this.z;if(!az.length)return null;
      const rootI=ai[0],rootZ=az[0],lastI=ai.pop(),lastZ=az.pop();
      if(az.length){let k=0;while(true){let l=k*2+1,r=l+1;if(l>=az.length)break;let c=r<az.length&&az[r]<az[l]?r:l;if(az[c]>=lastZ)break;ai[k]=ai[c];az[k]=az[c];k=c;}ai[k]=lastI;az[k]=lastZ;}
      const out=this.out;out.i=rootI;out.z=rootZ;return out;
    }
    get length(){return this.z.length;}
  }"""
once("heap",old_heap,new_heap)

once("dirs","    const dirs=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];",
"""    const dx17278=new Int8Array([-1,0,1,-1,1,-1,0,1]),dy17278=new Int8Array([-1,-1,-1,0,0,1,1,1]);""")

once("valid outlet loop",
"""        if(!outlet)for(const [dx,dy] of dirs){
          const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h){outlet=true;break;}
          if(!valid16584[yy*w+xx]){outlet=true;break;}
        }""",
"""        if(!outlet)for(let d17278=0;d17278<8;d17278++){
          const xx=x+dx17278[d17278],yy=y+dy17278[d17278];if(xx<0||yy<0||xx>=w||yy>=h){outlet=true;break;}
          if(!valid16584[yy*w+xx]){outlet=true;break;}
        }""")

once("pit neighbors",
"""      for(const [dx,dy] of dirs){
        const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
        const j=yy*w+xx;if(seen[j]||(valid16584&&!valid16584[j]))continue;
        seen[j]=1;if(filled[j]<=p.z)filled[j]=p.z+0.01;heap.push({i:j,z:filled[j]});
      }""",
"""      for(let d17278=0;d17278<8;d17278++){
        const xx=x+dx17278[d17278],yy=y+dy17278[d17278];if(xx<0||yy<0||xx>=w||yy>=h)continue;
        const j=yy*w+xx;if(seen[j]||(valid16584&&!valid16584[j]))continue;
        seen[j]=1;if(filled[j]<=p.z)filled[j]=p.z+0.01;heap.push({i:j,z:filled[j]});
      }""")

once("distance precompute",
"""          cellY=(b[3]-b[1])*111320/(h-1),to=new Int32Array(N);to.fill(-1);
    const slope=new Float32Array(N);if(valid16584)slope.fill(NaN);""",
"""          cellY=(b[3]-b[1])*111320/(h-1),to=new Int32Array(N);to.fill(-1);
    const diag17278=Math.hypot(cellX,cellY),dist17278=new Float64Array([diag17278,cellY,diag17278,cellX,cellX,diag17278,cellY,diag17278]);
    const slope=new Float32Array(N);if(valid16584)slope.fill(NaN);""")

once("flow neighbor loop",
"""        for(const [dx,dy] of dirs){
          const j=(y+dy)*w+(x+dx);if(valid16584&&!valid16584[j])continue;
          const dist=Math.hypot(dx*cellX,dy*cellY),drop=(filled[i]-filled[j])/dist;
          if(drop>bestDrop){bestDrop=drop;best=j;}
        }""",
"""        for(let d17278=0;d17278<8;d17278++){
          const j=(y+dy17278[d17278])*w+(x+dx17278[d17278]);if(valid16584&&!valid16584[j])continue;
          const drop=(filled[i]-filled[j])/dist17278[d17278];
          if(drop>bestDrop){bestDrop=drop;best=j;}
        }""")

s="/* EARTHLINE_HYDROLOGY_CORE_17278 — exact neighbor order/priority retained; removes repeated iterator allocation and distance recomputation. */\n"+s
p.write_text(s,encoding="utf-8")
print("17278 hydrology core optimization applied")
