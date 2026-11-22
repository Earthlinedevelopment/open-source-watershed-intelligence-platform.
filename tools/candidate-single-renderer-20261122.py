#!/usr/bin/env python3
"""Minimal display-only candidate. Clean engine unchanged; verified Property uses existing safe blue/brown swale renderer."""
from pathlib import Path
import hashlib, sys
src,dst=map(Path,sys.argv[1:3])
data=src.read_bytes()
base='c97a1ad5c38bff7f23d7c07b63e75a88dda8a4f2ad7c6caf3c5d75ecd14ef088'
if hashlib.sha256(data).hexdigest()!=base: raise SystemExit('FAIL CLOSED: unexpected production base')
a=b'const show=centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;'
b=b'const show=!(model()?.propertySwaleEngine16600?.verified===true)&&centers.length>0&&footprints.length===centers.length&&directional.length+neutral.length===centers.length;'
if data.count(a)!=1:raise SystemExit('FAIL CLOSED: natural renderer anchor mismatch')
if data.count(b"m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});")!=1:
    raise SystemExit('FAIL CLOSED: camera target owner mismatch')
changed=data.replace(a,b).replace(
    b"m.on('moveend',()=>{syncPropertyTargetFromMap16201();positionSuggestions16233()});",
    b"m.on('moveend',()=>{if(!window.EARTHLINE_PROPERTY_TARGET_16201)syncPropertyTargetFromMap16201();positionSuggestions16233()});")
drag=b"if(!t||!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return;if(t.code||t.source==='country-center')"
newdrag=b"if(!c||!Number.isFinite(Number(c.lng))||!Number.isFinite(Number(c.lat)))return;if(t&&(t.code||t.source==='country-center'))"
if data.count(drag)!=1: raise SystemExit('FAIL CLOSED: drag target seeding anchor mismatch')
changed=changed.replace(drag,newdrag)
want='b50b72077839628c08673851793863a6baa290ef23b9c8482cb60b61400308b8'
got=hashlib.sha256(changed).hexdigest()
if got!=want:raise SystemExit('FAIL CLOSED: candidate hash mismatch '+got)
dst.write_bytes(changed)
print('Wrote isolated candidate',dst,'sha256',got,'edit bytes',len(changed)-len(data))
