from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='''  const f=earthlineSelectPlaceCandidate16537(q,j.features);\n  if(!f)return null;\n  const zh=PLACE_ZOOM[(f.place_type&&f.place_type[0])||"place"]||15;\n'''
new='''  let f=earthlineSelectPlaceCandidate16537(q,j.features);\n  if(!f)return null;\n  /* EARTHLINE 16846 — global country-name ambiguity fallback. If a short bare\n     query resolves to an identically named non-country result, ask the same\n     geocoder once for countries only. This handles country/locality collisions\n     without country-specific aliases. Addresses, comma-qualified searches and\n     ordinary qualified place searches keep the existing single-query path. */\n  const bareCountryCheck16846=!/[0-9,@]/.test(String(q||''))&&earthlinePlaceKey16537(q).split(/\\s+/).filter(Boolean).length<=4;\n  const selectedType16846=earthlinePlaceType16537(f),selectedName16846=earthlinePlaceKey16537(f.text||String(f.place_name||'').split(',')[0]);\n  if(bareCountryCheck16846&&selectedType16846!=='country'&&selectedName16846===earthlinePlaceKey16537(q)){\n    try{\n      const countryUrl16846="https://api.mapbox.com/geocoding/v5/mapbox.places/"+encodeURIComponent(earthlinePlaceLookupQuery16541(q))+".json?limit=5&types=country&language=en&access_token="+MAPBOX_TOKEN;\n      const countryResponse16846=await fetch(countryUrl16846);\n      if(earthlineIsStale(myGen))return null;\n      if(countryResponse16846.ok){\n        const countryJson16846=await countryResponse16846.json();\n        if(earthlineIsStale(myGen))return null;\n        const countryCandidate16846=earthlineSelectPlaceCandidate16537(q,countryJson16846&&countryJson16846.features||[]);\n        if(countryCandidate16846&&earthlinePlaceType16537(countryCandidate16846)==='country')f=countryCandidate16846;\n      }\n    }catch(_){ }\n  }\n  const zh=PLACE_ZOOM[(f.place_type&&f.place_type[0])||"place"]||15;\n'''
if old not in s:
    raise SystemExit('16846 geocoder fallback anchor not found')
if 'bareCountryCheck16846' in s:
    raise SystemExit('16846 geocoder fallback already present')
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
print('patched geocoder: EARTHLINE 16846 generic country-only ambiguity fallback')
