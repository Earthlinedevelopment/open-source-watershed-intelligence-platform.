from pathlib import Path

p = Path('index.html')
s = p.read_text(encoding='utf-8')
marker = 'EARTHLINE 16635 — U.S. MAPPED-WATER AUTHORITY CONSISTENCY.'
if marker in s:
    print('16635 already installed')
    raise SystemExit(0)

old = "    const verified16609=sourceQueries16609>0&&sourceSuccess16609>0&&deterministicRiverVerified16616&&(!useTiger16617||tigerVerified16617);"
new = """    /* EARTHLINE 16635 — U.S. MAPPED-WATER AUTHORITY CONSISTENCY.\n       16617/16626 already define Census TIGERweb/Hydro as the authoritative final\n       U.S. swale-safety source specifically so U.S. publication does not depend on\n       display zoom or Mapbox source-layer availability. Make the final verdict match\n       that ownership: U.S. runs require successful TIGER verification; non-U.S. runs\n       retain the existing Mapbox + deterministic-river evidence requirement. The\n       exact intersection filter, final shared mask, and fail-closed publication rule\n       are unchanged. */\n    const mapWaterVerified16635=sourceQueries16609>0&&sourceSuccess16609>0&&deterministicRiverVerified16616;\n    const verified16609=useTiger16617?tigerVerified16617:mapWaterVerified16635;"""

count = s.count(old)
if count != 1:
    raise SystemExit(f'16635 expected exactly one verification verdict, found {count}')

s = s.replace(old, new, 1)

if s.count('async function earthlineMappedWaterSwaleGate16609(') != 1:
    raise SystemExit('mapped-water gate owner count changed')
if s.count('const verified16609=') != 1:
    raise SystemExit('mapped-water verification verdict count changed')
for required in [
    'Census TIGERweb/Hydro',
    "const verified16609=useTiger16617?tigerVerified16617:mapWaterVerified16635;",
    "if(usStateWaterRun16609&&mappedWaterGate16609.verified!==true)throw new Error('U.S. state mapped-water verification unavailable; unverified swales were not published');",
    marker,
]:
    if required not in s:
        raise SystemExit('16635 required invariant missing: '+required)

p.write_text(s, encoding='utf-8')
print('16635 U.S. mapped-water authority consistency written')
