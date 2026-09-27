from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Export the existing centralized text helper so inherited UI owners can reuse it
# without creating another language dictionary or lifecycle owner.
old_helper="function earthlineText16848(lang){return EARTHLINE_TEXT_16848[['en','th','vi'].includes(lang)?lang:'en']}"
new_helper=old_helper+"\nwindow.earthlineText16848=earthlineText16848;window.EARTHLINE_TEXT_16848=EARTHLINE_TEXT_16848;"
if s.count(old_helper)!=1:
    raise SystemExit(f'text helper expected once, found {s.count(old_helper)}')
s=s.replace(old_helper,new_helper,1)

# Old core idle renderer: keep its existing timing/ownership but make the label presentation-aware.
old_core='let label=runBtn.querySelector("span");if(!label){label=document.createElement("span");runBtn.appendChild(label)}label.textContent="RUN ANALYSIS";'
new_core='let label=runBtn.querySelector("span");if(!label){label=document.createElement("span");runBtn.appendChild(label)}const t16848=typeof window.earthlineText16848===\'function\'?window.earthlineText16848(window.EARTHLINE_LANGUAGE_16488||\'en\'):null;label.textContent=t16848&&t16848.run?t16848.run:"RUN ANALYSIS";'
if s.count(old_core)!=1:
    raise SystemExit(f'core idle run-label owner expected once, found {s.count(old_core)}')
s=s.replace(old_core,new_core,1)

# Live Regional busy/idle owner: translate only the idle default label. Running/progress labels stay untouched.
old_live="if(b.id==='runBtn'){let labelSpan=b.querySelector('span');if(!labelSpan){labelSpan=document.createElement('span');b.appendChild(labelSpan)}labelSpan.textContent=String(label||'RUN ANALYSIS');}"
new_live="if(b.id==='runBtn'){let labelSpan=b.querySelector('span');if(!labelSpan){labelSpan=document.createElement('span');b.appendChild(labelSpan)}let labelText16848=String(label||'RUN ANALYSIS');if(!on&&labelText16848==='RUN ANALYSIS'&&typeof window.earthlineText16848==='function'){const t16848=window.earthlineText16848(window.EARTHLINE_LANGUAGE_16488||'en');if(t16848&&t16848.run)labelText16848=t16848.run}labelSpan.textContent=labelText16848;}"
if s.count(old_live)!=1:
    raise SystemExit(f'live setBusy run-label owner expected once, found {s.count(old_live)}')
s=s.replace(old_live,new_live,1)

# Final periodic top-run owner: preserve the existing 900 ms maintenance owner, only change its string source.
old_top="function ensureTopRun(){const b=document.getElementById('runBtn');if(!b)return false;let span=b.querySelector('span');if(!span){span=document.createElement('span');b.appendChild(span)}if(b.dataset.busy!=='1'&&b.getAttribute('aria-busy')!=='true')span.textContent='RUN ANALYSIS';b.title='Run Analysis';b.setAttribute('aria-label','Run Analysis');return true}"
new_top="function ensureTopRun(){const b=document.getElementById('runBtn');if(!b)return false;let span=b.querySelector('span');if(!span){span=document.createElement('span');b.appendChild(span)}const t16848=typeof window.earthlineText16848==='function'?window.earthlineText16848(window.EARTHLINE_LANGUAGE_16488||'en'):null,run16848=t16848&&t16848.run?t16848.run:'RUN ANALYSIS';if(b.dataset.busy!=='1'&&b.getAttribute('aria-busy')!=='true')span.textContent=run16848;b.title=run16848;b.setAttribute('aria-label',run16848);return true}"
if s.count(old_top)!=1:
    raise SystemExit(f'periodic ensureTopRun owner expected once, found {s.count(old_top)}')
s=s.replace(old_top,new_top,1)

p.write_text(s,encoding='utf-8')
print('16848 stable translated Run Analysis ownership applied')
