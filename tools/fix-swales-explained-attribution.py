#!/usr/bin/env python3
"""Correct misattribution throughout active website text, fail closed on uncertainty.

Do not edit archived builds, historical records, or scientific labels.
"""
from pathlib import Path
import re
import json

root=Path(".")
extensions={".html",".htm",".js",".mjs",".json",".css"}
exclude_dirs={".git","node_modules",".earthline-tests","archive","archives","backup","backups","tests","test","candidate-mantra92","reference-2026-10-05"}
needle=re.compile(r"Earthline(?:’|'|&rsquo;|&#8217;|&#x2019;)s\s+three[- ]word\s+principle\s+describes\s+the\s+sequence\s*:",re.IGNORECASE)
replacement="At Earthline, we follow the principle:"
other=re.compile(r"Earthline(?:’|'|&rsquo;|&#8217;|&#x2019;)s\s+(?:three[- ]word\s+)?principle\b",re.IGNORECASE)
updated=[]
review=[]
for path in sorted(root.rglob("*")):
    if not path.is_file() or path.suffix.lower() not in extensions or any(part in exclude_dirs for part in path.parts):
        continue
    try: s=path.read_text(encoding="utf-8")
    except (UnicodeError,OSError): continue
    out,n=needle.subn(replacement,s)
    if n:
        path.write_text(out,encoding="utf-8")
        updated.append({"path":str(path),"replacements":n})
    for match in other.finditer(out):
        review.append({"path":str(path),"text":match.group()})
print(json.dumps({"updated":updated,"remaining_attribution_phrases":review},indent=2))
if not updated:
    active=Path("index.html").read_text(encoding="utf-8")
    if replacement not in active or needle.search(active):
        raise SystemExit("STOP: expected updated wording missing from active page.")
if review:
    raise SystemExit("STOP: possible additional ownership claims need inspection.")
print("PASS: exact misattribution corrected in active website files.")
