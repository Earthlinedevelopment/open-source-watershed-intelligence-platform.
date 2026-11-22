#!/usr/bin/env python3
"""R15 candidate: live page 96c60d7c + engine v1.2.0 (no swales under closed tree canopy). Only change to index.html: the engine cache-busting ?v= tag. Fails closed on any mismatch."""
import hashlib, sys
from pathlib import Path
src,engine,dst=map(Path,sys.argv[1:4])
d=src.read_bytes(); e=engine.read_bytes()
LIVE='79eac56ac6610176eaa4b38946eca2666b50792a580b8e3bbe39166648c2b13b'
ENG='92b3e42d65a9428e5049a9ba07159ea7f1ee6907c017c9fbba8e4ced666c736f'
if hashlib.sha256(d).hexdigest()!=LIVE: raise SystemExit('FAIL CLOSED: index.html is not the verified live page '+hashlib.sha256(d).hexdigest())
if hashlib.sha256(e).hexdigest()!=ENG: raise SystemExit('FAIL CLOSED: engine file is not v1.2.0 '+hashlib.sha256(e).hexdigest())
a=b'<script src="earthline-property-swales.js?v=83fe88cf"></script>'
b=b'<script src="earthline-property-swales.js?v=92b3e42d"></script>'
if d.count(a)!=1: raise SystemExit('FAIL CLOSED: engine tag anchor count '+str(d.count(a)))
c=d.replace(a,b); expected='53b667b330ed1edd5c4dde3e0fa9a279615649e4506b8750d62c7ee0f26ff335'; assert hashlib.sha256(c).hexdigest()==expected, 'FAIL CLOSED candidate output SHA mismatch'; dst.write_bytes(c)
print('OK',dst,hashlib.sha256(c).hexdigest(),'+%d bytes'%(len(c)-len(d)))
