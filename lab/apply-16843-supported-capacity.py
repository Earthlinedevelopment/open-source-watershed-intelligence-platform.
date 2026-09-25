from pathlib import Path
import sys
if len(sys.argv)!=2: raise SystemExit('usage: apply-16843-supported-capacity.py INDEX')
p=Path(sys.argv[1]);s=p.read_text(encoding='utf-8')
old="    const regionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));"
new="""    /* EARTHLINE 16843 — FINE-SUPPORT REGIONAL CAPACITY.
       The legacy capacity used only occupied 6x6 coarse sectors. 16841 can now
       recover real screened candidates in finer low-relief terrain cells, so
       permit a bounded extension only when distinct 24x24 candidate cells
       provide spatial support. Science, spacing, water and jurisdiction gates
       remain unchanged. */
    const baseRegionalCapacity16755=focusMode?80:Math.min(120,Math.max(80,coverageGroups16736.size*4));
    const fineSupportCells16755=new Set();
    if(!focusMode){for(const c16755 of candidates){const gx16755=Number(c16755&&c16755.coverageGX16775),gy16755=Number(c16755&&c16755.coverageGY16775);if(!Number.isFinite(gx16755)||!Number.isFinite(gy16755))continue;const fx16755=Math.max(0,Math.min(23,Math.floor(gx16755*24/Math.max(1,hy.w)))),fy16755=Math.max(0,Math.min(23,Math.floor(gy16755*24/Math.max(1,hy.h))));fineSupportCells16755.add(fx16755+','+fy16755);}}
    const supportExtra16755=focusMode?0:Math.min(36,Math.max(0,Math.floor((fineSupportCells16755.size-baseRegionalCapacity16755)*.50)));
    const regionalCapacity16755=focusMode?80:baseRegionalCapacity16755+supportExtra16755;
    window.EARTHLINE_SUPPORTED_CAPACITY_16843={build:'EARTHLINE 16843',base:baseRegionalCapacity16755,fineSupportCells:fineSupportCells16755.size,extra:supportExtra16755,capacity:regionalCapacity16755,rule:'capacity expands only when distinct screened 24x24 candidate cells exceed legacy coarse-grid capacity; max +36; no jurisdiction-specific branch'};"""
if 'EARTHLINE 16843 — FINE-SUPPORT REGIONAL CAPACITY' in s: raise SystemExit('16843 already present')
n=s.count(old)
if n!=1: raise SystemExit(f'capacity anchor expected once, found {n}')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('16843 applied')
