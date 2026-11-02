#!/usr/bin/env python3
"""Earthline Mantra 92: fail-closed release preflight; no external dependencies.

Intended for the required GitHub PR status check on pages-live.
Prevent historic direct production auto-writer reintroduction and accidental
loss of search, Property, and scientific safety owners. This is not a
substitute for browser, geometry, geospatial or scientific acceptance.
"""
from __future__ import annotations
from pathlib import Path
from html.parser import HTMLParser
import hashlib
import re
import subprocess
import sys

ROOT=Path(__file__).resolve().parent.parent
ERRORS=[]
WORKFLOWS=sorted((ROOT/'.github'/'workflows').glob('*.y*ml'))
for workflow in WORKFLOWS:
    source=workflow.read_text(encoding='utf8')
    active='\n'.join(line for line in source.splitlines()
                     if not line.lstrip().startswith('#'))
    direct_push=bool(re.search(r'\bgit\s+push\b',active)) and 'pages-live' in active
    write_permission=bool(re.search(r'^\s*contents:\s*write\s*$',active,re.M))
    if direct_push or (write_permission and re.search(r'\bgit\s+(?:push|commit)\b',active)):
        ERRORS.append(f'Unverified GitHub Actions writer: {workflow.relative_to(ROOT)}')
print(f'EARTHLINE_AIRLOCK_WORKFLOW_SCAN count={len(WORKFLOWS)} unsafe={sum("writer" in x for x in ERRORS)}')

HTML=ROOT/'index.html'
if not HTML.is_file():
    ERRORS.append('Missing public index.html')
    source=''
else:
    raw=HTML.read_bytes()
    print(f'EARTHLINE_AIRLOCK_INDEX_SHA256 {hashlib.sha256(raw).hexdigest()}')
    source=raw.decode('utf8')

required={
    'Search Orb': 'id="searchOrb"',
    'Search Input': 'id="searchInput"',
    'Run Analysis': 'id="runBtn"',
    'Regional engine': 'earthlineLiveRegionalRun15970',
    'Property owner': 'earthlineDeclarePropertyAtCrosshair16169',
    'Property exclusion owner': 'earthlineFinalSafeSegments15771',
    'Regional swale owner': 'async function makeSwales(',
    'Locked slogan': 'Slow it. Sink it. Spread it.',
}
for title,needle in required.items():
    if needle not in source:ERRORS.append(f'Missing locked feature/owner: {title}')

class Scripts(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=False)
        self.script=None
        self.inline=[]
    def handle_starttag(self,tag,attrs):
        if tag.lower()!='script': return
        d=dict(attrs)
        typ=d.get('type','').lower()
        self.script={'src':d.get('src'),'type':typ,'content':[]}
    def handle_data(self,data):
        if self.script is not None:self.script['content'].append(data)
    def handle_endtag(self,tag):
        if tag.lower()=='script' and self.script is not None:
            if not self.script['src'] and self.script['type'] in ('','text/javascript','application/javascript','module'):
                code=''.join(self.script['content'])
                if code.strip():self.inline.append((code,self.script['type']))
            self.script=None

parser=Scripts()
try:
    parser.feed(source)
except Exception as exc:
    ERRORS.append(f'HTML parsing failed: {exc}')
print(f'EARTHLINE_AIRLOCK_INLINE_SCRIPT_COUNT {len(parser.inline)}')
if len(parser.inline)<20:ERRORS.append('Unexpectedly few inline scripts; likely missing engine')

for number,(code,typ) in enumerate(parser.inline,1):
    cmd=['node','--check']
    if typ=='module':cmd.append('--input-type=module')
    result=subprocess.run(cmd,input=code,text=True,capture_output=True)
    if result.returncode:
        ERRORS.append(f'Inline JS #{number} syntax: {result.stderr.strip()[:360]}')

if ERRORS:
    for err in ERRORS:print('::error::'+err,file=sys.stderr)
    print(f'EARTHLINE_AIRLOCK_FAIL count={len(ERRORS)}')
    sys.exit(1)
print('EARTHLINE_AIRLOCK_STATIC_PASS')
