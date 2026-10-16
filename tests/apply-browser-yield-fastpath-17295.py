from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="async function earthlineCooperativeYield16661(){if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();return new Promise(r=>setTimeout(r,0));}"
new="""async function earthlineCooperativeYield16661(){
  if(globalThis.scheduler&&typeof globalThis.scheduler.yield==='function')return globalThis.scheduler.yield();
  if(typeof MessageChannel==='function')return new Promise(resolve=>{
    const ch=new MessageChannel();
    ch.port1.onmessage=()=>{try{ch.port1.close();ch.port2.close())}catch(_){} resolve();};
    ch.port2.postMessage(0);
  });
  return Promise.resolve();
}"""
# avoid typo by constructing exact replacement below
new=new.replace("ch.port2.close())","ch.port2.close()")
if s.count(old)!=1: raise SystemExit(f"yield anchor count {s.count(old)}")
s=s.replace(old,new,1)
repls={
"if((++yieldCount16661%12)===0)await earthlineCooperativeYield16661();":"if((++yieldCount16661%256)===0)await earthlineCooperativeYield16661();",
"if((++finalScreenYield16661%12)===0)await earthlineCooperativeYield16661();":"if((++finalScreenYield16661%256)===0)await earthlineCooperativeYield16661();",
"if((++featureIndex16661%12)===0)await earthlineCooperativeYield16661();":"if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();",
"if((++featureIndex16661%16)===0)await earthlineCooperativeYield16661();":"if((++featureIndex16661%256)===0)await earthlineCooperativeYield16661();"
}
for old2,new2 in repls.items():
    n=s.count(old2)
    if n!=1: raise SystemExit(f"batch anchor count {n}: {old2}")
    s=s.replace(old2,new2,1)
s="<!-- EARTHLINE_BROWSER_YIELD_FASTPATH_17295: MessageChannel fallback + 256-item cooperative batches; identical science/output order. -->\n"+s
p.write_text(s,encoding="utf-8")
print("patched cross-browser cooperative yield fastpath 17295")
