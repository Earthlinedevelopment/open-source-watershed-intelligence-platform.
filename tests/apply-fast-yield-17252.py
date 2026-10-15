from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new="""const earthlineYieldQueue17252=[];
let earthlineYieldChannel17252=null;
async function earthlineCooperativeYield16661(){
  if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();
  if(typeof MessageChannel==='function'){
    if(!earthlineYieldChannel17252){
      earthlineYieldChannel17252=new MessageChannel();
      earthlineYieldChannel17252.port1.onmessage=()=>{
        const resolve17252=earthlineYieldQueue17252.shift();
        if(resolve17252)resolve17252();
      };
    }
    return new Promise(resolve17252=>{
      earthlineYieldQueue17252.push(resolve17252);
      earthlineYieldChannel17252.port2.postMessage(0);
    });
  }
  return new Promise(r=>setTimeout(r,0));
}"""
if s.count(old)!=1:
    raise SystemExit(f"yield anchor count {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
