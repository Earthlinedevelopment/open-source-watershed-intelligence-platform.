from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
marker='EARTHLINE 16611 — SPARSE-LAND COVERAGE RETRY'
if marker in s:
    raise SystemExit('guard failed: 16611 product marker already present')

old="""        if(usStateRun16609&&validLand16609<32){"""
new="""        /* EARTHLINE 16611 — SPARSE-LAND COVERAGE RETRY.
           Keep the same authoritative statewide extent, but resample when land
           occupies less than 2% of the fixed Regional grid. The prior absolute
           <32-cell guard remains as the zero/tiny-land fail-safe. */
        const landCoverage16611=(dem&&dem.w&&dem.h)?validLand16609/(dem.w*dem.h):0;
        if(usStateRun16609&&(validLand16609<32||landCoverage16611<0.02)){"""
if s.count(old)!=1:
    raise SystemExit(f'guard failed: sparse-state trigger count {s.count(old)}')
s=s.replace(old,new,1)

if marker not in s:
    raise SystemExit('guard failed: 16611 marker missing after patch')
p.write_text(s,encoding='utf-8')
