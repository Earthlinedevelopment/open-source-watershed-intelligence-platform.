from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new="""const earthlineMessageYield16661=(()=>{
  if(typeof MessageChannel!=='function')return null;
  const q=[],ch=new MessageChannel();
  ch.port1.onmessage=()=>{
    const resolve=q.shift();
    if(resolve)resolve();
    if(q.length)ch.port2.postMessage(0);
  };
  return ()=>new Promise(resolve=>{q.push(resolve);if(q.length===1)ch.port2.postMessage(0);});
})();
async function earthlineCooperativeYield16661(){
  if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();
  if(earthlineMessageYield16661)return earthlineMessageYield16661();
  return Promise.resolve();
}"""
if s.count(old)!=1: raise SystemExit(f"yield anchor count {s.count(old)}")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_REUSABLE_BROWSER_YIELD_17277: one reusable MessageChannel queue replaces clamped timeout fallback; no science/output changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched reusable cooperative yield 17277")
