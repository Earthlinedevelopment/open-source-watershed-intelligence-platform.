#!/usr/bin/env python3
"""Isolated one-line map display owner test; no changes to engine, exclusions, camera or water."""
from pathlib import Path
from hashlib import sha256
import sys
src=Path(sys.argv[1]); dest=Path(sys.argv[2]); data=src.read_bytes()
assert sha256(data).hexdigest()=="c97a1ad5c38bff7f23d7c07b63e75a88dda8a4f2ad7c6caf3c5d75ecd14ef088","Unexpected production base"
a=b'const show=centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;'
b=b'const show=!(model()?.propertySwaleEngine16600?.verified===true)&&centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;'
assert data.count(a)==1,"Natural renderer anchor mismatch"
data=data.replace(a,b)
assert sha256(data).hexdigest()=="96c60d7c43124354de071f1751f40882297328f1f5a100259730c54c413745d2","Candidate SHA mismatch"
dest.write_bytes(data)
print("VERIFIED DISPLAY-ONLY CANDIDATE SHA-256:",sha256(data).hexdigest())
