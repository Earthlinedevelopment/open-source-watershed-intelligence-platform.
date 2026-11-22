#!/usr/bin/env python3
from pathlib import Path
from hashlib import sha256
import sys
a=Path(sys.argv[1]);b=Path(sys.argv[2]);s=a.read_bytes()
assert sha256(s).hexdigest()=='96c60d7c43124354de071f1751f40882297328f1f5a100259730c54c413745d2','FAIL CLOSED live page hash mismatch'
anchor=b'<script src="earthline-property-swale-bridge.js?v=37ac5f9b"></script>\n'
insert=b'<script defer src="earthline-waterpath-hold.js?v=97b0ca24"></script>\n'
assert s.count(anchor)==1 and insert not in s,'FAIL CLOSED script anchor mismatch'
c=s.replace(anchor,anchor+insert,1)
assert sha256(c).hexdigest()=='9e2d6621ec4db517a400935493a6b78cb05d133371fbdf6230a65d657c4a81f8','FAIL CLOSED output hash mismatch'
b.write_bytes(c);print('WATER_HOLD_ONLY_HASH_PASS',sha256(c).hexdigest())
