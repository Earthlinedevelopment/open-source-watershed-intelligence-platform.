from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
before=s

pairs=[
(
"const pointerSource=source==='pointerup';",
"const pointerSource=source==='pointerdown';",
"pointer source"
),
(
"property.onpointerup=function(ev){\n    return window.earthlineActivateProperty17494(ev,property,'pointerup');\n  };",
"property.onpointerdown=function(ev){\n    return window.earthlineActivateProperty17494(ev,property,'pointerdown');\n  };",
"physical property event"
),
(
"Pointer-up is the primary physical activation; click remains the",
"Pointer-down is the primary physical activation; click remains the",
"owner comment"
)
]
for old,new,label in pairs:
    n=s.count(old)
    if n!=1:
        raise RuntimeError(f"{label}: expected 1 match, found {n}")
    s=s.replace(old,new,1)

if "property.onpointerup=function" in s:
    raise RuntimeError("old Property pointerup owner remains")
if "property.onpointerdown=function" not in s:
    raise RuntimeError("new Property pointerdown owner missing")
if "const pointerSource=source==='pointerdown';" not in s:
    raise RuntimeError("pointerdown source guard missing")

p.write_text(s,encoding="utf-8")
print("EARTHLINE_WEBKIT_PROPERTY_INPUT_17692",len(before),len(s))
