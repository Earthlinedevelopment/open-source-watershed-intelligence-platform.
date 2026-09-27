from pathlib import Path
import hashlib, re

src = Path('index.html')
s = src.read_text(encoding='utf-8', errors='replace')
out = []
out.append('EARTHLINE 16849 REFINEMENT OVERLAP DIAGNOSTIC')
out.append('index_sha256=' + hashlib.sha256(s.encode('utf-8')).hexdigest())
out.append('chars=' + str(len(s)))
out.append('lines=' + str(s.count('\n') + 1))
out.append('')

needles = [
    'used16780', '16780', '16787', '16788', '16816', '16821',
    '32x32', 'terrain refinement', 'refinement', 'fine terrain',
    'relaxed contour', 'opportunity-rich', 'opportunity',
    'makeContours', 'makeSwales', 'terrainGap', 'refine'
]

hits = []
for needle in needles:
    pos = 0
    while True:
        i = s.find(needle, pos)
        if i < 0:
            break
        line = s.count('\n', 0, i) + 1
        hits.append((i, needle, line))
        pos = i + max(1, len(needle))

out.append('RAW_HIT_COUNTS')
for needle in needles:
    n = sum(1 for _, k, _ in hits if k == needle)
    out.append(f'{needle!r}: {n}')
out.append('')

# Collapse nearby hits so a single owner block is printed once.
clusters = []
for i, needle, line in sorted(hits):
    if not clusters or i - clusters[-1]['last'] > 5000:
        clusters.append({'start': i, 'last': i, 'hits': [(i, needle, line)]})
    else:
        clusters[-1]['last'] = i
        clusters[-1]['hits'].append((i, needle, line))

out.append('CLUSTERS=' + str(len(clusters)))
out.append('')
for num, c in enumerate(clusters, 1):
    center = c['start']
    labels = []
    for _, needle, line in c['hits']:
        label = f'{needle}@L{line}'
        if label not in labels:
            labels.append(label)
    lo = max(0, center - 4500)
    hi = min(len(s), c['last'] + 12000)
    block = s[lo:hi]
    out.append('=' * 88)
    out.append(f'CLUSTER {num} chars {lo}:{hi}')
    out.append('HITS: ' + ', '.join(labels[:80]))
    out.append('-' * 88)
    out.append(block)
    out.append('')

# Pull likely async refinement loops/functions separately, retaining enough context to compare stages.
patterns = [
    r'async\s+function\s+[A-Za-z0-9_$]*(?:refin|terrain|contour)[A-Za-z0-9_$]*',
    r'function\s+[A-Za-z0-9_$]*(?:refin|terrain|contour)[A-Za-z0-9_$]*',
    r'(?:const|let|var)\s+[A-Za-z0-9_$]*(?:16780|16787|16788|16816|16821)[A-Za-z0-9_$]*',
]
out.append('=' * 88)
out.append('LIKELY OWNER DECLARATIONS')
seen = set()
for pat in patterns:
    for m in re.finditer(pat, s, re.I):
        if m.start() in seen:
            continue
        seen.add(m.start())
        line = s.count('\n', 0, m.start()) + 1
        out.append(f'--- {m.group(0)} @ char {m.start()} line {line} ---')
        out.append(s[max(0, m.start()-1800):min(len(s), m.start()+9000)])
        out.append('')

Path('diagnostics/16849-refinement-overlap.txt').write_text('\n'.join(out), encoding='utf-8')
print('wrote diagnostics/16849-refinement-overlap.txt')
print('clusters', len(clusters), 'hits', len(hits))
