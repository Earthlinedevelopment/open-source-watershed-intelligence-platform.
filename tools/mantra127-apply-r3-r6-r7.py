#!/usr/bin/env python3
"""Apply only accepted R3/R6/R7 from 347718f to exact production.
Fail closed on unexpected anchors, never change M105 swale logic.
"""
from pathlib import Path
from subprocess import check_output
import re
p=Path('index.html')
live=p.read_text()
candidate=check_output(['git','show','347718f:index.html'],text=True)
original=live
def line(src,pattern):
    hits=re.findall(r'^.*'+pattern+r'.*$',src,re.M)
    if len(hits)!=1:
        raise RuntimeError('Expected one line for '+pattern+', got '+str(len(hits)))
    return hits[0]
def replace_once(old,new,label):
    global live
    if live.count(old)!=1:raise RuntimeError(label+': anchor count '+str(live.count(old)))
    live=live.replace(old,new,1)
# R3: remove old Property chip only when Regional run has published
r3=line(candidate,r'/\* Hotfix 3 R3:')
anchor=line(live,r'function setTierNotice\(mode,text\)')
if 'Hotfix 3 R3' in live:raise RuntimeError('R3 already present')
replace_once(anchor,anchor+'\n'+r3,'R3')
# R6: tooltip picks an actual visible corridor label, never invented A4
for func in ('ensureCorridorTip16248','maybeShowCorridorTip16248'):
    old=line(live,r'function '+func+r'\(')
    new=line(candidate,r'function '+func+r'\(')
    if old==new:raise RuntimeError('R6 '+func+' already installed')
    replace_once(old,new,func)
# R7: full-opacity panel and legends clear of side panel
r7start='/* Hotfix 3 R7: Regional map-only legends must never bleed through the navigation panel. */'
a=candidate.index(r7start)
b=candidate.index('#earthlineResultsSlot16188:empty',a)
r7=candidate[a:b]
if 'Hotfix 3 R7' in live:raise RuntimeError('R7 already installed')
replace_once('#earthlineResultsSlot16188:empty',r7+'#earthlineResultsSlot16188:empty','R7')
# Fail-closed protected anchors
assert 'if(activeTier16168()!==\\'focus\\')sg.setAttribute(\\'display\\',\\'none\\')' in live
assert 'Place hand cursor over bare land to move map.' in live
assert 'reportPlaceLine123(baseData.d)' in live
assert 'reportAquiferContext123(baseData.d)' in live
assert "center:[-96,39]" in live
assert 'Hotfix 3 R3' in live and 'Hotfix 3 R7' in live
assert 'Select a map label such as <b>A4</b>' not in live
assert live!=original
p.write_text(live)
print('R3_R6_R7_ONLY_APPLIED')
