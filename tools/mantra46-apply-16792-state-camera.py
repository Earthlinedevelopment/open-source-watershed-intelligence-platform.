from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

marker="<!-- EARTHLINE 16791 — CORRECTED REGIONAL AUDIT SEMANTICS."
comment="<!-- EARTHLINE 16792 — AUTHORITATIVE U.S. STATE CAMERA HANDOFF. Registered U.S. state searches now resolve the existing immutable 16556 state package before the generic 3-second geocoder/current-map fallback, so the map camera, crosshair and analysis frame use the same authoritative state location as Regional science. No science, thresholds, terrain, hydrology, swale geometry/ranking, water safety, capacity, renderer or Property behavior changed. CANDIDATE / NOT ACCEPTED. -->\n"
if "EARTHLINE 16792 — AUTHORITATIVE U.S. STATE CAMERA HANDOFF" not in s:
    n=s.count(marker)
    if n!=1: raise SystemExit(f"16791 marker expected once, found {n}")
    s=s.replace(marker,comment+marker,1)

old='''          let local15873=null;
          try{if(typeof earthlineRegionOverride==="function")local15873=earthlineRegionOverride(raw);}catch(_){ }
          try{if(!local15873&&typeof findLoc==="function")local15873=findLoc(raw);}catch(_){ }'''
new='''          let local15873=null;
          try{
            const profile16792=typeof earthlineJurisdictionProfile16549==="function"?earthlineJurisdictionProfile16549(raw):null;
            if(profile16792&&typeof earthlineResolveAtomicUSStatePackage16556==="function"){
              const pkg16792=await earthlineResolveAtomicUSStatePackage16556(profile16792);
              if(pkg16792&&pkg16792.location)local15873=Object.assign({},pkg16792.location);
            }
          }catch(_){ }
          try{if(!local15873&&typeof earthlineRegionOverride==="function")local15873=earthlineRegionOverride(raw);}catch(_){ }
          try{if(!local15873&&typeof findLoc==="function")local15873=findLoc(raw);}catch(_){ }'''
n=s.count(old)
if n!=1: raise SystemExit(f"state camera insertion expected once, found {n}")
s=s.replace(old,new,1)

p.write_text(s,encoding="utf-8")
print("EARTHLINE 16792 applied")
