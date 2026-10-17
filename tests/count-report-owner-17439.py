from pathlib import Path
s=Path("index.html").read_text(encoding="utf-8")
needles=[
  "function openReport(){if(!valid())",
  '<div class="el49-toolbar-actions"><button class="el49-tool el49-close" data-action="close"',
  ".el49-modal{position:fixed;inset:0",
  ".el49-shell{width:min(1180px,97vw);max-height:94vh;overflow:auto",
  "@media print{body>*:not(#earthlineVermontReportPanel16149)"
]
for n in needles:
    print(n, s.count(n))
