from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
a=s.index("function mapSvg(d,small=false){")
b=s.index("  return parts.join('');\n}",a)+len("  return parts.join('');\n}")
fn=s[a:b]
if "el-report-hydro-aquifer-16986" not in fn:
    raise SystemExit("16986 report renderer missing")
fn=fn.replace("el-report-hydro-aquifer-16986","el-report-hydro-aquifer-16987",1)

old="""  const allStatePts=state?state.rings.flat():[];
  let stateB=null;
  if(allStatePts.length){
    const xs=allStatePts.map(q=>+q[0]),ys=allStatePts.map(q=>+q[1]);
    stateB=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }
"""
new="""  const refLng=(Number(rawB?.[0])+Number(rawB?.[2]))/2;
  const wrapStateLng=x=>{
    let v=Number(x);
    if(!Number.isFinite(v))return v;
    while(v-refLng>180)v-=360;
    while(v-refLng<-180)v+=360;
    return v;
  };
  const stateRings=state?(state.rings||[]).map(r=>r.map(q=>[wrapStateLng(q[0]),Number(q[1])])):[];
  const allStatePts=stateRings.flat();
  let stateB=null;
  if(allStatePts.length){
    const xs=allStatePts.map(q=>+q[0]),ys=allStatePts.map(q=>+q[1]);
    stateB=[Math.min(...xs),Math.min(...ys),Math.max(...xs),Math.max(...ys)];
  }
"""
if old not in fn:
    raise SystemExit("state bounds token missing")
fn=fn.replace(old,new,1)

old_main="for(const ring of state.rings){\n      const dp=pathCoords(ring);if(dp)parts.push("
new_main="for(const ring of stateRings){\n      const dp=pathCoords(ring);if(dp)parts.push("
if old_main not in fn:
    raise SystemExit("main state ring token missing")
fn=fn.replace(old_main,new_main,1)

old2="""    for(const ring of state.rings){
      const dp=ring.map((q,i)=>(i?'L':'M')+isx(+q[0]).toFixed(1)+' '+isy(+q[1]).toFixed(1)).join(' ');
      parts.push('<path d="'+dp+' Z" fill="#edf1ed" stroke="#56675f" stroke-width=".9"/>');
    }
"""
new2="""    for(const ring of stateRings){
      const dp=ring.map((q,i)=>(i?'L':'M')+isx(+q[0]).toFixed(1)+' '+isy(+q[1]).toFixed(1)).join(' ');
      parts.push('<path d="'+dp+' Z" fill="#edf1ed" stroke="#56675f" stroke-width=".9"/>');
    }
"""
if old2 not in fn:
    raise SystemExit("locator ring token missing")
fn=fn.replace(old2,new2,1)

old_marker="const rcx=(rawB[0]+rawB[2])/2,rcy=(rawB[1]+rawB[3])/2;"
new_marker="const rcx=wrapStateLng((rawB[0]+rawB[2])/2),rcy=(rawB[1]+rawB[3])/2;"
if old_marker not in fn:
    raise SystemExit("locator marker token missing")
fn=fn.replace(old_marker,new_marker,1)

out=s[:a]+fn+s[b:]
if "el-report-hydro-aquifer-16987" not in out:
    raise SystemExit("16987 marker missing")
p.write_text(out,encoding="utf-8")
