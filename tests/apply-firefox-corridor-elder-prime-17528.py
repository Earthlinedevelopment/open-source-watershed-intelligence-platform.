from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

# Firefox-only early worker: Chromium/WebKit already pass without this startup cost.
old="""  if(!window.__EARTHLINE_ELDER_EARLY_WORKER_17520){
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});"""
new="""  if(/Firefox\\//.test(navigator.userAgent)&&!window.__EARTHLINE_ELDER_EARLY_WORKER_17520){
    const w=new Worker('earthline-elder-worker-17129.js',{type:'module'});"""
if s.count(old)!=1:
    raise SystemExit(f"early worker anchor count={s.count(old)}")
s=s.replace(old,new,1)

# Prime exact corridor target before Property activation. This is compute-only.
needle="""window.EARTHLINE_PROPERTY_TARGET_16201={lng:Number(target.lng),lat:Number(target.lat),source:String(target.source||'crosshair'),code:target.code?String(target.code):'',score:Number(target.score||0),parentRunToken:parentRunToken16347||'',at:new Date().toISOString()};"""
repl=needle+"""if(window.EARTHLINE_PROPERTY_TARGET_16201.code){try{void window.EARTHLINE_ELDER_TREES_V1_17097?.primePropertyEvidence?.()}catch(_){}}"""
if s.count(needle)!=1:
    raise SystemExit(f"property target anchor count={s.count(needle)}")
s=s.replace(needle,repl,1)

s="<!-- EARTHLINE_FIREFOX_CORRIDOR_ELDER_PRIME_17528: Firefox-only early worker warm; exact corridor target compute primes before Property activation; single terminal publisher unchanged. -->\n"+s
p.write_text(s,encoding="utf-8")

w=Path("earthline-elder-worker-17129.js")
x=w.read_text(encoding="utf-8")
oldpy='''    const py=await loadPyodide({indexURL:"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/"});\n    await py.loadPackage(["numpy"]); /* EARTHLINE_ELDER_NUMPY_ONLY_FINAL_17414 */'''
newpy='''    const py=await loadPyodide({\n      indexURL:"https://cdn.jsdelivr.net/pyodide/v0.29.5/full/",\n      packages:["numpy"]\n    }); /* EARTHLINE 17528 — overlap approved NumPy load with Pyodide bootstrap; detector equations unchanged. */'''
if x.count(oldpy)!=1:
    raise SystemExit(f"worker ensurePy anchor count={x.count(oldpy)}")
x=x.replace(oldpy,newpy,1)
w.write_text(x,encoding="utf-8")
print("installed 17528 Firefox corridor Elder prime + overlapped NumPy bootstrap")
