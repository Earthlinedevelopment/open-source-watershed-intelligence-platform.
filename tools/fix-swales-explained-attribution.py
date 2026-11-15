#!/usr/bin/env python3
"""Single-text replacement in Swales Explained, fail closed on unexpected source."""
from pathlib import Path
import re
p=Path("index.html")
s=p.read_text(encoding="utf-8")
patterns=[
    "Earthline’s three-word principle describes the sequence:",
    "Earthline's three-word principle describes the sequence:",
    "Earthline&rsquo;s three-word principle describes the sequence:",
    "Earthline&#8217;s three-word principle describes the sequence:",
]
matches=[old for old in patterns if old in s]
if len(matches)!=1 or s.count(matches[0])!=1:
    raise SystemExit(f"STOP: expected exactly one original sentence, got {[(m,s.count(m)) for m in matches]}")
old=matches[0]
new="At Earthline, we follow the principle:"
s=s.replace(old,new,1)
assert s.count(new)>=1
assert old not in s
p.write_text(s,encoding="utf-8")
print("PASS: Swales Explained attribution corrected; no claim of originating the principle")
