from pathlib import Path
import re

p=Path("index.html")
s=p.read_text(encoding="utf-8")

if "shared continuous relief-adaptive Regional drainage density" not in s:
    raise SystemExit("shared continuous Regional flow owner missing")

# Remove the former Vancouver-specific presentation-water bypass.
s,n=re.subn(
    r"\n\s*const vancouverIsland16584=\(\(\)=>\{try\{return String\(window\.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539&&window\.EARTHLINE_REGIONAL_JURISDICTION_BOUNDARY_AUDIT_16539\.capability\|\|''\)==='ca-cgndb-vancouver-island'\}catch\(_\)\{return false\}\}\)\(\);",
    "",
    s,
    count=1
)
if n!=1 and "vancouverIsland16584" in s:
    raise SystemExit("could not remove local Vancouver declaration")

old_cond="if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584&&!vancouverIsland16584){"
new_cond="""const deterministicGridReady16584=!!hy16584.validityMask16584;
    /* EARTHLINE 16919 — deterministic land-validity precedence.
       Live style water is supplemental evidence only when the deterministic Regional
       grid is unavailable. This is jurisdiction-agnostic and applies to every region. */
    if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584&&!deterministicGridReady16584){"""
if old_cond in s:
    s=s.replace(old_cond,new_cond,1)
elif "EARTHLINE 16919 — deterministic land-validity precedence" not in s:
    old_shared="if(style16584&&Array.isArray(style16584.layers)&&!worldCopies16584){"
    if old_shared not in s:
        raise SystemExit("shared style-water condition anchor missing")
    s=s.replace(old_shared,new_cond,1)

s=s.replace("const hasGrid16584=!!hy16584.validityMask16584;","const hasGrid16584=deterministicGridReady16584;",1)

old_style_block="""      const styleIndex16584=hy16584.styleWaterIndex16584,scale16584=Number(styleIndex16584&&styleIndex16584.scale)||4;
      if(styleIndex16584&&styleIndex16584.bins){
        const candidates16584=styleIndex16584.bins[Math.floor(lng16584*scale16584)+':'+Math.floor(lat16584*scale16584)]||[];
        for(const part16584 of candidates16584){
          if(!part16584||!part16584.bbox||!part16584.rings)continue;
          if(lng16584<part16584.bbox[0]||lng16584>part16584.bbox[2]||lat16584<part16584.bbox[1]||lat16584>part16584.bbox[3])continue;
          if(earthlinePointInPolygon16584(lng16584,lat16584,part16584.rings))return false;
        }
      }
"""
if old_style_block in s:
    s=s.replace(old_style_block,"",1)

s=s.replace(
    "failClosedNoEvidence:!evidenceReady16584,worldCopiesSkippedStyleWater:worldCopies16584,vancouverIslandSkippedStyleWater:vancouverIsland16584,at:new Date().toISOString()",
    "failClosedNoEvidence:!evidenceReady16584,worldCopiesSkippedStyleWater:worldCopies16584,deterministicGridPrecedence:hasGrid16584,at:new Date().toISOString()",
    1
)

if "vancouverIsland16584" in s:
    raise SystemExit("local Vancouver final-water exception still present")
if "vancouverFlowDensity16917" in s:
    raise SystemExit("local Vancouver flow-density exception still present")
if "EARTHLINE 16919 — deterministic land-validity precedence" not in s:
    raise SystemExit("shared deterministic water-validity owner missing")
if "earthline-language-hotfix-16890.js" not in s:
    raise SystemExit("language hotfix reference missing")

p.write_text(s,encoding="utf-8")
print("applied shared continuous flow density + deterministic water-validity precedence")
