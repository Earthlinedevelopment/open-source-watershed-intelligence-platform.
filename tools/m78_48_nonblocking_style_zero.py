from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.48 — successful loaded-style zero result is screened-clear without blocking network fallback"
if marker in s:
    raise SystemExit(0)

start=s.find("        }else if(bounded.length===0){")
if start<0:
    raise SystemExit("M78.48 zero-style branch start missing")
end=s.find("        }\n      }else{", start)
if end<0:
    raise SystemExit("M78.48 zero-style branch end missing")

old=s[start:end+10]
if "shared-style-zero-plus-infrastructure-fallback" not in old or "await infrastructure16550()" not in old:
    raise SystemExit("M78.48 expected blocking zero-style fallback not found")

new=r'''        }else if(bounded.length===0){
          /* EARTHLINE M78.48 — successful loaded-style zero result is screened-clear without blocking network fallback.
             The already-loaded shared map evidence answered successfully and found no relevant exclusion geometry.
             Per the existing M78.19 evidence contract, that is sufficient OPEN-DATA SCREENING for publication.
             Overpass remains available only when the loaded style cannot answer; it cannot hold a valid Property run open. */
          infrastructure15862P.status="loaded-map-style-screened-clear";
          infrastructure15862P.source="loaded-map-style-open-data";
          M.vectorNoBuildCoverage.evidencePath17630="shared-style-zero-screened-clear";
        }'''
s=s[:start]+new+s[end+10:]

if marker not in s:
    raise SystemExit("M78.48 marker missing after patch")
if "shared-style-zero-plus-infrastructure-fallback" in s[s.find("async function vectorNoBuild15778"):s.find("earthlineBuildVectorNoBuildMask=vectorNoBuild15778")]:
    raise SystemExit("M78.48 old blocking zero-style fallback still present")

p.write_text(s,encoding="utf-8")
print("Applied M78.48 nonblocking successful-style zero evidence path")
