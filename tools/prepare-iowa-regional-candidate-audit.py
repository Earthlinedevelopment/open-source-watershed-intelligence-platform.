from pathlib import Path
src=Path("harness/tests/iowa-regional-audit.mjs").read_text()
src=src.replace("https://earthlinedevelopment.org/?iowa-regional-audit=","http://127.0.0.1:8787/?iowa-regional-audit=",1)
needle="const page=await browser.newPage({viewport:{width:1800,height:1000}});"
inject="""const page=await browser.newPage({viewport:{width:1800,height:1000}});
await page.route('https://api.mapbox.com/**',async route=>{
  const headers={...route.request().headers(),referer:'https://earthlinedevelopment.org/',origin:'https://earthlinedevelopment.org'};
  await route.continue({headers});
});"""
if needle not in src: raise SystemExit("page creation marker missing")
src=src.replace(needle,inject,1)
Path("iowa-regional-candidate-audit.mjs").write_text(src)
print("EARTHLINE_IOWA_CANDIDATE_AUDIT_PREPARED")
