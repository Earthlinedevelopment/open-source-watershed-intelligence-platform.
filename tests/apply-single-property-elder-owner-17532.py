from pathlib import Path

# Fix Firefox warm template literal for WebKit parsing.
w=Path("earthline-elder-worker-17129.js")
s=w.read_text(encoding="utf-8")
old='''        await py.runPythonAsync(\\`
import numpy as np
_elw=np.arange(4096,dtype=np.float32).reshape((64,64))%31
_median_filter(_elw,9)
_uniform_filter((_elw>5).astype(np.float32),9)
_maximum_filter(_elw,7)
_gaussian_filter(_elw,1.2)
_elm=_elw>20
_components_4(_elm)
_component_size_4(_elm,32,32)
del _elw,_elm
\\`);'''
new='''        await py.runPythonAsync(`
import numpy as np
_elw=np.arange(4096,dtype=np.float32).reshape((64,64))%31
_median_filter(_elw,9)
_uniform_filter((_elw>5).astype(np.float32),9)
_maximum_filter(_elw,7)
_gaussian_filter(_elw,1.2)
_elm=_elw>20
_components_4(_elm)
_component_size_4(_elm,32,32)
del _elw,_elm
`);'''
if s.count(old)!=1:
    raise SystemExit(f"worker template anchor count={s.count(old)}")
s=s.replace(old,new,1)
w.write_text(s,encoding="utf-8")

# Consolidate Property Elder ownership: generic refresh never launches a second
# dynamic detector while the exact Property owner is pending or already committed
# for the current identity.
p=Path("earthline-launch-16872.js")
x=p.read_text(encoding="utf-8")
old_refresh='''  async function refresh(){
    try{
      const pending17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pending17166?.state==='property-pending'&&state.dynamic.promise)return pending17166.summary||null;
      await load();
      const pendingAfterLoad17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pendingAfterLoad17166?.state==='property-pending'&&state.dynamic.promise)return pendingAfterLoad17166.summary||null;
      let coverage=activeCoverage(); /* EARTHLINE_ELDER_PROPERTY_PENDING_REFRESH_GUARD_17203 */
      const dynamic=await dynamicPropertyEvidence(false);'''
new_refresh='''  async function refresh(){
    try{
      const propertyIdentity17532=()=>propertyRunIdentity17166(propertyBounds17166());
      const pending17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pending17166?.state==='property-pending')return pending17166.summary||null;
      if(pending17166?.state==='committed'&&pending17166?.propertyRunIdentity&&pending17166.propertyRunIdentity===propertyIdentity17532())return pending17166.summary||state.lastSummary||null;
      await load();
      const pendingAfterLoad17166=window.EARTHLINE_ELDER_TREE_LAST_17097||null;
      if(pendingAfterLoad17166?.state==='property-pending')return pendingAfterLoad17166.summary||null;
      if(pendingAfterLoad17166?.state==='committed'&&pendingAfterLoad17166?.propertyRunIdentity&&pendingAfterLoad17166.propertyRunIdentity===propertyIdentity17532())return pendingAfterLoad17166.summary||state.lastSummary||null;
      let coverage=activeCoverage(); /* EARTHLINE 17532 — generic refresh is non-owning during Property lifecycle. */
      const dynamic=await dynamicPropertyEvidence(false);'''
if x.count(old_refresh)!=1:
    raise SystemExit(f"refresh anchor count={x.count(old_refresh)}")
x=x.replace(old_refresh,new_refresh,1)
p.write_text(x,encoding="utf-8")
print("installed single Property Elder owner + WebKit template fix 17532")
