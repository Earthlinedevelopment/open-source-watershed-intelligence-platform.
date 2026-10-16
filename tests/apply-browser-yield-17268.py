from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new="""let earthlineYieldPort16661=null,earthlineYieldQueue16661=[];
function earthlineMessageYield16661(){
  if(typeof MessageChannel!=='function')return Promise.resolve();
  if(!earthlineYieldPort16661){
    const ch16661=new MessageChannel();
    ch16661.port1.onmessage=()=>{const r16661=earthlineYieldQueue16661.shift();if(r16661)r16661();};
    earthlineYieldPort16661=ch16661.port2;
  }
  return new Promise(r16661=>{earthlineYieldQueue16661.push(r16661);earthlineYieldPort16661.postMessage(0);});
}
async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return earthlineMessageYield16661();}"""
n=s.count(old)
print("yield anchors",n)
if n!=1: raise SystemExit("expected exactly one yield anchor")
s=s.replace(old,new)
s="/* EARTHLINE_BROWSER_COOPERATIVE_YIELD_17268 — standards-level MessageChannel task yield fallback; hydrology/science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
