from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""  function earthlineDensifyCandidate17270(coords17270){
    const raw17270=(coords17270||[]).filter(earthlineFinitePoint16539);if(raw17270.length<2)return [];
    const pts17270=[raw17270[0]];
    for(let i17270=1;i17270<raw17270.length;i17270++){const a17270=raw17270[i17270-1],b17270=raw17270[i17270],steps17270=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b17270[0])-Number(a17270[0])),Math.abs(Number(b17270[1])-Number(a17270[1])))/.01));for(let k17270=1;k17270<=steps17270;k17270++)pts17270.push(earthlineInterpolate16539(a17270,b17270,k17270/steps17270));}
    return pts17270;
  }"""
new="""  function earthlineDensifyCandidate17270(coords17270){
    const src17285=Array.isArray(coords17270)?coords17270:[];
    let allFinite17285=true;for(const p17285 of src17285){if(!earthlineFinitePoint16539(p17285)){allFinite17285=false;break;}}
    const raw17270=allFinite17285?src17285:src17285.filter(earthlineFinitePoint16539);if(raw17270.length<2)return [];
    let needs17285=false;
    for(let i17285=1;i17285<raw17270.length;i17285++){
      const a17285=raw17270[i17285-1],b17285=raw17270[i17285];
      if(Math.max(Math.abs(Number(b17285[0])-Number(a17285[0])),Math.abs(Number(b17285[1])-Number(a17285[1])))>.01){needs17285=true;break;}
    }
    if(!needs17285)return raw17270;
    const pts17270=[raw17270[0]];
    for(let i17270=1;i17270<raw17270.length;i17270++){const a17270=raw17270[i17270-1],b17270=raw17270[i17270],steps17270=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b17270[0])-Number(a17270[0])),Math.abs(Number(b17270[1])-Number(a17270[1])))/.01));for(let k17270=1;k17270<=steps17270;k17270++)pts17270.push(earthlineInterpolate16539(a17270,b17270,k17270/steps17270));}
    return pts17270;
  }"""
n=s.count(old);print("densify anchors",n)
if n!=1: raise SystemExit(f"expected one densify anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_DENSIFY_FASTPATH_17285 — reuse already <=0.01-degree candidate coordinates instead of allocating an identical densified copy; geometry values unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17285 densify fast path applied")
