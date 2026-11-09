#!/usr/bin/env python3
from pathlib import Path
import hashlib,subprocess
p=Path('index.html')
original=p.read_bytes()
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='19b76e344282a444b9d4e3b45734c3467d044f95', 'Not the exact accepted production HTML; blocked'
addition="<style id=\"earthline-swale-zoom-gate-css\">\n/* Swale lines at close zoom: CSS overrides the M105 display=\"none\" attribute on the Regional swale group once the map is zoomed to 10 or closer. Broad zoom keeps M105 behaviour. */\nhtml[data-earthline-swales-near] #earthlineRegionalVectorOverlay16020 g[data-layer=\"swale-opportunities\"]{display:inline!important}\n</style>\n<script id=\"earthline-swale-zoom-gate-js\">\n(function(){\n  function getMap(){try{return (typeof earthlineMap!=='undefined'&&earthlineMap)||window.earthlineMap||null}catch(_){return window.earthlineMap||null}}\n  var tries=0;\n  function bind(){\n    var m=getMap();\n    if(!m||typeof m.on!=='function'||typeof m.getZoom!=='function'){if(++tries<240)setTimeout(bind,500);return}\n    function update(){try{document.documentElement.toggleAttribute('data-earthline-swales-near',m.getZoom()>=10)}catch(_){}}\n    m.on('zoom',update);m.on('zoomend',update);m.on('moveend',update);update();\n  }\n  bind();\n})();\n</script>\n".encode('utf-8')
assert len(addition)==975, ('Not exact uploaded 975-byte block',len(addition))
assert original.count(b'earthline-swale-zoom-gate-css')==0
p.write_bytes(original+addition)
assert subprocess.check_output(['git','hash-object','index.html'],text=True).strip()=='0f865cf6dd3ffec340214c99e58a6d51aa087f9e', 'Candidate does not match uploaded ZIP'
assert original in p.read_bytes()
print('M128_EXACT_UPLOADED_ZIP_MATCH',hashlib.sha256(p.read_bytes()).hexdigest())
