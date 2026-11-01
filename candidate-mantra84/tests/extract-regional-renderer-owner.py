from pathlib import Path

text = Path('index.html').read_text(encoding='utf-8')
terms = [
    'earthlineRenderRegionalOverlay16020',
    'lastResizeRunToken16020',
    'regionalOverlayRenderOk16336',
    'cameraSettle16310',
    'corridor rendering incomplete',
    'lineLengthPixels',
]

out = []
for term in terms:
    idx = text.find(term)
    out.append(f'===== {term} @ {idx} =====')
    if idx < 0:
        out.append('NOT FOUND')
        continue
    start = max(0, idx - 7000)
    end = min(len(text), idx + 12000)
    out.append(text[start:end])
    out.append('')

Path('regional-renderer-owner-extract.txt').write_text('\n'.join(out), encoding='utf-8')
print('wrote regional-renderer-owner-extract.txt')
