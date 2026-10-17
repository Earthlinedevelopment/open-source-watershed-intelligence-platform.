from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""  async function startProperty17166(){
    try{
      await load();
      const b=propertyBounds17166(),runIdentity=propertyRunIdentity17166(b);"""
new="""  async function startProperty17166(){
    try{
      const b=propertyBounds17166(),runIdentity=propertyRunIdentity17166(b);"""
if s.count(old)!=1: raise SystemExit(f"elder start anchor {s.count(old)}")
s=s.replace(old,new,1)
old="""      const dynamic=await dynamicPropertyEvidence(true); /* EARTHLINE_ELDER_GOVERNED_COMPUTE_17211 */
      if(!dynamic||propertyRunIdentity17166(propertyBounds17166())!==runIdentity)return null;"""
new="""      /* EARTHLINE 17392 — bounded Elder Property work starts immediately.
         Static Elder context loads in parallel and never gates the dynamic worker. */
      const staticLoad17392=load().catch(()=>null);
      const dynamicPromise17392=dynamicPropertyEvidence(true);
      await staticLoad17392;
      const dynamic=await dynamicPromise17392;
      if(!dynamic||propertyRunIdentity17166(propertyBounds17166())!==runIdentity)return null;"""
if s.count(old)!=1: raise SystemExit(f"dynamic anchor {s.count(old)}")
s=s.replace(old,new,1)
old="""    },1200);
    return true;
  } /* EARTHLINE_ELDER_STAGGERED_PROPERTY_PRIME_17216 */"""
new="""    },0); /* EARTHLINE_ELDER_ZERO_WAIT_17392 */
    return true;
  } /* EARTHLINE_ELDER_STAGGERED_PROPERTY_PRIME_17216 */"""
if s.count(old)!=1: raise SystemExit(f"prime delay anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("patched Elder zero-wait parallel start 17392")
