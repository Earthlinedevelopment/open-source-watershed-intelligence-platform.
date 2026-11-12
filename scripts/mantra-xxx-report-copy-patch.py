#!/usr/bin/env python3
"""MXXX candidate-only restore of approved November 2 copy + report controls."""
from pathlib import Path
from hashlib import sha256
p=Path('index.html')
s=p.read_text('utf-8')
b=s
def swap(old,new,label):
    global s
    matches=s.count(old)
    assert matches==1, f"REFUSE {label}: expected one source, found {matches}"
    s=s.replace(old,new,1)
    print('PATCH:',label)

# Exact user-approved Nov 2 opening first sentence, short enough for the fixed map rail.
# The longer technical explanation remains available in the Process tab.
swap('Earthline analyzes slope and water paths to identify optimum aquifer recharge locations — in any location.',
     'Earthline is a free, community-focused tool that helps communities plan for their water security future.',
     'approved concise homepage intro')

swap('<div class="ep-sub">Find the best places to slow, sink and spread water — recharging groundwater, protecting soil, and fostering nature.</div><p>Earthline’s goal is to provide stable, understandable planning information for water boards, foundations, civic planners, community leaders and property owners as they plan for the water future of their land and communities.</p><p>Earthline does not replace field design or engineering. It provides a defensible set of location options and the supporting evidence behind them — a practical starting point for planning more resilient water futures.</p>',
     '<div class="ep-sub">A no-cost science perspective for communities ready to act with the resources they already have.</div><p>Earthline was built for people who may have more local knowledge, urgency and willingness to work than money for consultants or heavy equipment. You may already know where water runs, where wells are changing and where people can work together. Earthline adds a simple scientific perspective to help decide where to look more closely.</p><p>Earthline does not tell a community what to build. It supports planning by combining terrain, slope, water movement and available groundwater evidence with long-established water-harvesting and land-stewardship principles reflected in modern permaculture practice.</p><p><strong>A shovel multiplied is a bulldozer.</strong> Coordinated labor, guided by better spatial understanding, can become meaningful watershed action.</p>',
     'exact Nov 2 Process intro, removed obsolete 24-hour claim')

# All actions operate only on an already-generated frozen report snapshot.
swap('<div class="el49-toolbar-actions"><button class="el49-tool el49-close" data-action="close"',
     '<div class="el49-toolbar-actions"><button class="el49-tool" type="button" data-action="top" aria-label="First report page" title="First page">↑</button><button class="el49-tool" type="button" data-action="bottom" aria-label="Last report page" title="Last page">↓</button><button class="el49-tool el49-print" type="button" data-action="print" aria-label="Print or save report to PDF">Print / Save PDF</button><button class="el49-tool el49-close" data-action="close"',
     'report export and navigation controls')

swap("panel.querySelectorAll('[data-action=\"close\"]').forEach(b=>b.onclick=()=>{panel.classList.remove('open');document.documentElement.classList.remove('earthline-report-open-16966')});",
     "panel.querySelectorAll('[data-action=\"close\"]').forEach(b=>b.onclick=()=>{panel.classList.remove('open');document.documentElement.classList.remove('earthline-report-open-16966')});panel.querySelectorAll('[data-action=\"print\"]').forEach(b=>b.onclick=()=>{if(panel.classList.contains('open'))window.print()});panel.querySelectorAll('[data-action=\"top\"]').forEach(b=>b.onclick=()=>panel.scrollTo({top:0,behavior:'smooth'}));panel.querySelectorAll('[data-action=\"bottom\"]').forEach(b=>b.onclick=()=>panel.scrollTo({top:panel.scrollHeight,behavior:'smooth'}));",
     'report controls use original print layout and native modal scroll')

s += '''
<!-- MXXX candidate only: compact accessible report actions, never override its science or map. -->
<style id="earthline-mantra-xxx-report-navigation">
#earthlineVermontReportPanel16149 .el49-toolbar-actions{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#earthlineVermontReportPanel16149 .el49-toolbar-actions [data-action="print"]{font:700 12px/1.2 "Noto Sans",Arial,sans-serif;white-space:nowrap;padding:8px 12px;min-width:110px}
#earthlineVermontReportPanel16149 .el49-toolbar-actions [data-action="top"],
#earthlineVermontReportPanel16149 .el49-toolbar-actions [data-action="bottom"]{font-size:19px;min-width:36px;min-height:36px}
@media(max-width:600px){#earthlineVermontReportPanel16149 .el49-toolbar-actions{gap:3px}
#earthlineVermontReportPanel16149 .el49-toolbar-actions [data-action="print"]{min-width:0;font-size:10px;padding:7px}}
@media print{#earthlineVermontReportPanel16149 .el49-toolbar-actions{display:none!important}}
</style>
'''
assert "Earthline is free and available 24 hours a day" not in s
for term in ["earthline-mantra-xxx-regional-clarity","Bioswale Impact Report","Sources · Final Page",
             "Hydrology and Aquifer Context Map","window.earthlineOpenVermontReport16151",
             "How Bioswales Work","Slow it. Sink it. Spread it."]:
    assert term in s, f"Unexpected loss of {term}"
p.write_text(s,encoding='utf-8')
print("IN SHA256",sha256(b.encode()).hexdigest())
print("OUT SHA256",sha256(s.encode()).hexdigest())
