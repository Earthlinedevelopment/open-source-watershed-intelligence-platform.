#!/usr/bin/env python3
import json, pathlib, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
errors=[]
def load(name):
    p=ROOT/name
    if not p.exists():
        errors.append(f"missing {name}"); return {}
    try:return json.loads(p.read_text(encoding="utf-8"))
    except Exception as e:errors.append(f"invalid {name}: {e}"); return {}
if not (ROOT/"EARTHLINE_GOVERNANCE_CONTRACT.md").exists():errors.append("missing EARTHLINE_GOVERNANCE_CONTRACT.md")
manifest=load("earthline-accepted-baseline.json")
decl=load("earthline-change-declaration.json")
expected="19f075d67cc19b12c6169be69aad78dc37acee0cdcb62c957f94d423bd45c33f"
if manifest.get("accepted_parent",{}).get("build")!=16584:errors.append("accepted parent build changed without explicit user promotion")
if manifest.get("accepted_parent",{}).get("sha256")!=expected:errors.append("accepted parent SHA changed without explicit user promotion")
science=set(manifest.get("science_owners") or [])
if science!={"slope","water_paths","aquifers","exclusions"}:errors.append("science owner set must remain exactly slope/water_paths/aquifers/exclusions")
software=set(manifest.get("existing_software_owners") or [])
change_class=decl.get("change_class")
owner=decl.get("owner")
if change_class=="science":
    if owner not in science:errors.append("science change owner must be one of the four core owners")
elif change_class in {"presentation-lifecycle","performance","water-sidecar"}:
    if owner not in software:errors.append("non-science change must use an existing software owner")
else:errors.append("change_class must be science, presentation-lifecycle, performance, or water-sidecar")
if not decl.get("defect"):errors.append("change declaration must name the defect")
if decl.get("new_owner") is not False:errors.append("new_owner must be false")
if decl.get("unrequested_additions") is not False:errors.append("unrequested_additions must be false")
if decl.get("accepted_parent_unchanged") is not True:errors.append("accepted_parent_unchanged must be true")
required={"single-authoritative-owner","no-new-renderer-owner","no-new-camera-owner","no-new-polling-owner","one-map","one-control-rail","search-orb-unchanged","logo-unchanged","fail-closed"}
missing=sorted(required-set(decl.get("locks_preserved") or []))
if missing:errors.append("missing preserved locks: "+", ".join(missing))
if decl.get("scope")=="shared-core" and decl.get("full_state_matrix_required") is not True:errors.append("shared-core change must require full state matrix")
if manifest.get("hard_regional_core_ceiling_ms")!=15000:errors.append("hard Regional core ceiling must remain 15000 ms")
if errors:
    print("EARTHLINE GOVERNANCE PREFLIGHT: FAIL")
    [print(" -",e) for e in errors]
    sys.exit(1)
print("EARTHLINE GOVERNANCE PREFLIGHT: PASS")
print(" class:",change_class)
print(" owner:",owner)
print(" defect:",decl.get("defect"))
print(" scope:",decl.get("scope"))
