#!/usr/bin/env python3
import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
contract = ROOT / "EARTHLINE_GOVERNANCE_CONTRACT.md"
manifest_path = ROOT / "earthline-accepted-baseline.json"
declaration_path = ROOT / "earthline-change-declaration.json"

errors = []

if not contract.exists():
    errors.append("missing EARTHLINE_GOVERNANCE_CONTRACT.md")
if not manifest_path.exists():
    errors.append("missing earthline-accepted-baseline.json")

manifest = {}
if manifest_path.exists():
    try:
        manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    except Exception as e:
        errors.append(f"invalid baseline manifest: {e}")

expected_sha = "19f075d67cc19b12c6169be69aad78dc37acee0cdcb62c957f94d423bd45c33f"
if manifest.get("accepted_parent", {}).get("build") != 16584:
    errors.append("accepted parent build changed without explicit user promotion")
if manifest.get("accepted_parent", {}).get("sha256") != expected_sha:
    errors.append("accepted parent SHA changed without explicit user promotion")

owners = set(manifest.get("architecture_owners") or [])
if owners != {"slope","water_paths","aquifers","exclusions"}:
    errors.append("architecture owner set must remain exactly slope/water_paths/aquifers/exclusions")

if not declaration_path.exists():
    errors.append("missing earthline-change-declaration.json")
    declaration = {}
else:
    try:
        declaration = json.loads(declaration_path.read_text(encoding="utf-8"))
    except Exception as e:
        declaration = {}
        errors.append(f"invalid change declaration: {e}")

owner = declaration.get("owner")
if owner not in owners:
    errors.append("change declaration owner must be one of the four authoritative design owners")

if not declaration.get("defect"):
    errors.append("change declaration must name the defect")
if declaration.get("new_owner") is not False:
    errors.append("new_owner must be false")
if declaration.get("unrequested_additions") is not False:
    errors.append("unrequested_additions must be false")
if declaration.get("accepted_parent_unchanged") is not True:
    errors.append("accepted_parent_unchanged must be true")

locks = declaration.get("locks_preserved") or []
required_locks = {
    "single-authoritative-owner",
    "no-new-renderer-owner",
    "no-new-camera-owner",
    "no-new-polling-owner",
    "one-map",
    "one-control-rail",
    "search-orb-unchanged",
    "logo-unchanged",
    "fail-closed",
}
missing = sorted(required_locks - set(locks))
if missing:
    errors.append("missing preserved locks: " + ", ".join(missing))

scope = declaration.get("scope")
if scope == "shared-core" and declaration.get("full_state_matrix_required") is not True:
    errors.append("shared-core change must require full state matrix")

ceiling = manifest.get("hard_regional_core_ceiling_ms")
if ceiling != 15000:
    errors.append("hard Regional core ceiling must remain 15000 ms")

if errors:
    print("EARTHLINE GOVERNANCE PREFLIGHT: FAIL")
    for e in errors:
        print(" -", e)
    sys.exit(1)

print("EARTHLINE GOVERNANCE PREFLIGHT: PASS")
print(" owner:", owner)
print(" defect:", declaration.get("defect"))
print(" scope:", scope)
print(" full_state_matrix_required:", declaration.get("full_state_matrix_required"))
