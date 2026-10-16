from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new="""async function earthlineCooperativeYield16661(){
  if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();
  if(typeof MessageChannel==='function')return new Promise(resolve=>{
    const ch=new MessageChannel();
    ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close()}catch(_){} resolve();};
    ch.port2.postMessage(0);
  });
  return Promise.resolve();
}"""
if old not in s: raise SystemExit("yield anchor not found")
s=s.replace(old,new,1)
s="<!-- EARTHLINE_BROWSER_YIELD_FALLBACK_17268: standards-safe cooperative yield fallback; no science changes. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched yield fallback")
