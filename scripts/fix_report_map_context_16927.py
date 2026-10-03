from pathlib import Path
p=Path("index.html")
s=p.read_text(errors="ignore")

# Aquifers must draw after the opaque report-map background.
old='const parts=[`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}">${aquiferSvg}<defs>'
new='const parts=[`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${title}"><defs>'
if old not in s and new not in s:
    raise SystemExit("report SVG opening anchor not found")
s=s.replace(old,new,1)

old2='</filter></defs><rect width="${W}" height="${H}" fill="url(#elmapbg)"/><text x="${pad}" y="20" fill="#153947" font-size="13" font-weight="800">${title}</text>`];'
new2='</filter></defs><rect width="${W}" height="${H}" fill="url(#elmapbg)"/>${aquiferSvg}<text x="${pad}" y="20" fill="#153947" font-size="13" font-weight="800">${title}</text>`];'
if old2 not in s and new2 not in s:
    raise SystemExit("report SVG background anchor not found")
s=s.replace(old2,new2,1)

# The authoritative visual().flows collection is already the flow product.
# Do not require the obsolete feature_type='flow' tag.
old3="for(const f of flows().filter(x=>x?.geometry?.type==='LineString'&&x?.properties?.feature_type==='flow').slice(0,240))"
new3="for(const f of flows().filter(x=>x?.geometry?.type==='LineString').slice(0,240))"
if old3 not in s and new3 not in s:
    raise SystemExit("report flow filter anchor not found")
s=s.replace(old3,new3,1)

# Remove the Vermont-only report-map title from the global report owner.
old4="const title=(String(d?.tier||d?.mode||'regional').toLowerCase()==='focus'?'Earthline focus screening map':'Earthline Vermont regional screening map');"
new4="const reportPlace=String(d?.query||d?.location||d?.placeName||'').trim();const reportTier=String(d?.tier||d?.mode||'regional').toLowerCase();const title='Earthline '+(reportPlace?reportPlace+' ':'')+(reportTier==='focus'?'focus':'regional')+' screening map';"
if old4 not in s and new4 not in s:
    raise SystemExit("report title anchor not found")
s=s.replace(old4,new4,1)

p.write_text(s)
