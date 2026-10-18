from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      const staticLoad17414=load().catch(()=>null);
      const dynamicPromise17414=dynamicPropertyEvidence(true);
      await staticLoad17414;
      const dynamic=await dynamicPromise17414; /* EARTHLINE_ELDER_GOVERNED_COMPUTE_17211 */"""
new="""      /* EARTHLINE 17505 — static Elder registry loading is nonblocking for
         Property. Property publication is driven exclusively by the dynamic
         exact-frame detector below; keep registry loading in the background. */
      void load().catch(()=>null);
      const dynamic=await dynamicPropertyEvidence(true); /* EARTHLINE_ELDER_GOVERNED_COMPUTE_17211 */"""
if s.count(old)!=1: raise SystemExit(f"static Elder wait anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("removed static Elder registry wait from Property critical path 17505")
