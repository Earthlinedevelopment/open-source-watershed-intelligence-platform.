from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="earthline-launch-hide-floating-info-bars-16990"
if marker not in s:
    css="""
<style id="earthline-launch-hide-floating-info-bars-16990">
#earthlineSwaleLegend16050,
#earthlineAquiferLegend16070,
#earthlineDiagramLegend16080{
  display:none!important;
  visibility:hidden!important;
  pointer-events:none!important;
}
</style>
"""
    i=s.lower().rfind("</head>")
    if i<0:
        raise SystemExit("head close not found")
    s=s[:i]+css+s[i:]
p.write_text(s,encoding="utf-8")
