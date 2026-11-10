#!/usr/bin/env python3
"""Review-only rollback candidate: exact byte-for-byte match to uploaded
Earthline-live-restore-property-swales.zip/index.html.
This removes M131 per-point slope gate and restores same-band spacing exemption.
Does NOT claim scientific safety. Never push to pages-live.
"""
from pathlib import Path
import subprocess, hashlib
p=Path('index.html')
s=p.read_bytes()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='151001d83787bb156efdfccc85e20cf697b1ad69'
old=b"""      /* M131: no Property route is prescribed above 4% slope at ANY sample. */
      if(!isRegionalTile15769){
        const ptsM131=Array.isArray(sw&&sw.pts)?sw.pts:[];
        let safeSlopeM131=ptsM131.length>=2 && Number.isFinite(Number(sw.slope)) && Number(sw.slope)<=4;
        if(safeSlopeM131)for(const pointM131 of ptsM131){
          const xM131=Math.round(Number(pointM131?.[0])),yM131=Math.round(Number(pointM131?.[1]));
          if(!Number.isFinite(xM131)||!Number.isFinite(yM131)||xM131<0||yM131<0||xM131>=GW||yM131>=GH){safeSlopeM131=false;break;}
          const localSlopeM131=Number(slopePct(xM131,yM131));
          if(!Number.isFinite(localSlopeM131)||localSlopeM131>4){safeSlopeM131=false;break;}
        }
        if(!safeSlopeM131){
          M.swaleDiagnostics.stage.rejectSlopeAbove4M131=(M.swaleDiagnostics.stage.rejectSlopeAbove4M131||0)+1;
          if(finalRec15803){
            finalRec15803.status='rejected-property-slope-above-four';
            finalRec15803.reason='property-slope-limit-4pct';
          }
          continue;
        }
      }
"""
assert s.count(old)==1
s=s.replace(old,b'',1)
old2=b"""        /* M131: Property fragments in the same elevation band must still
           satisfy exact minimum-distance clearance; Regional logic unchanged. */
        if(isRegionalTile15769&&sw.bandKey===ex.bandKey)continue;"""
new2=b"""        if(sw.bandKey===ex.bandKey)continue;"""
assert s.count(old2)==1
s=s.replace(old2,new2,1)
assert len(s)==3776711
h=hashlib.sha1(b'blob '+str(len(s)).encode()+b'\x00'+s).hexdigest()
assert h=='0adfba90e63a6e1dd6ed3b6b27f387a5bcdf9165',h
assert hashlib.sha256(s).hexdigest()=='5e0f83997d59b003a49866af59ac9951cf31a6b32302db80780bbd8cfe06294c'
p.write_bytes(s)
print('M135 EXACT UPLOADED PROPERTY ROLLBACK HASH VERIFIED',h)
