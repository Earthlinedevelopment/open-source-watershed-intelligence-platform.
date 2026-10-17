from pathlib import Path
p=Path("earthline-launch-16872.js")
s=p.read_text(encoding="utf-8")
old="""      const dynamic=await dynamicPromise17392;
      if(!dynamic||propertyRunIdentity17166(propertyBounds17166())!==runIdentity)return null;
      state.active=dynamic.features||[];"""
new="""      const dynamic=await dynamicPromise17392;
      if(!dynamic){
        window.EARTHLINE_ELDER_TREE_LAST_17097={
          state:'failed',propertyRunIdentity:runIdentity,summary:null,featureCount:0,
          dynamicCandidatePoolCount:0,dynamicError:state.dynamic.error||'Elder dynamic worker returned no result',
          at:new Date().toISOString()
        };
        return null;
      }
      if(propertyRunIdentity17166(propertyBounds17166())!==runIdentity){
        window.EARTHLINE_ELDER_TREE_LAST_17097={
          state:'superseded',propertyRunIdentity:runIdentity,summary:null,featureCount:0,
          dynamicCandidatePoolCount:0,dynamicError:null,at:new Date().toISOString()
        };
        return null;
      }
      state.active=dynamic.features||[];"""
if s.count(old)!=1: raise SystemExit(f"elder pending leak anchor {s.count(old)}")
s=s.replace(old,new,1)
p.write_text(s,encoding="utf-8")
print("closed Elder pending/error path 17395")
