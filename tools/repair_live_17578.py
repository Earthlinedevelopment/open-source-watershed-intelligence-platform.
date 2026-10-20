from pathlib import Path

p = Path("index.html")
s = p.read_text(encoding="utf-8")

old_render = '''  function render(){
    const root=document.documentElement,tier=String(root.dataset.earthlineAnalysisTier||"").toLowerCase();
    const slot=document.getElementById("earthlineStatusSlot16188")||document.getElementById("earthlineStatusSection16188");
    let el=document.getElementById("earthlineExclusionEvidence16516");
    if(tier!=="property"){if(el)el.remove();return null;}
    const e=evidence();if(!e||!slot)return e;
    if(!el){el=document.createElement("div");el.id="earthlineExclusionEvidence16516";el.setAttribute("role","status");slot.prepend(el);}
    el.dataset.kind=e.kind;el.innerHTML='<div class="el16516-grade"></div><div class="el16516-detail"></div>';
    el.querySelector(".el16516-grade").textContent=e.label;el.querySelector(".el16516-detail").textContent=e.detail;
    window.EARTHLINE_EXCLUSION_EVIDENCE_16516=e;return e;
  }'''

new_render = '''  function render(){
    /* EARTHLINE 17578 — live production presentation repair.
       Exclusion evidence remains active for safety/publication/report logic, but the
       unapproved standalone Status card is never rendered on the public page. */
    const el=document.getElementById("earthlineExclusionEvidence16516");
    if(el)el.remove();
    const e=evidence();
    window.EARTHLINE_EXCLUSION_EVIDENCE_16516=e;
    return e;
  }'''

old_active = '''  function propertyActive15824(){
    const publication=M&&M.propertyPublication15816||null;
    const currentGen=Number(M&&M.searchGen);
    const publicationGen=Number(publication&&publication.searchGen);
    const currentPublication=!!(
      publication&&
      publication.committed===true&&
      publication.safetyVerified===true&&
      (
        !Number.isFinite(currentGen)||
        !Number.isFinite(publicationGen)||
        currentGen===publicationGen
      )
    );
    return !!(
      M&&M.analysisReady&&
      state.mode==="property"&&!state.active&&
      currentPublication
    );
  }'''

new_active = '''  function propertyActive15824(){
    const publication=M&&M.propertyPublication15816||null;
    /* EARTHLINE 17578 — live production presentation repair.
       A committed, safety-verified Property publication owns its blue water display.
       Do not turn that display off merely because searchGen changes after publication.
       New Property runs already clear/replace propertyPublication15816, so stale-run
       protection remains fail-closed without this redundant presentation veto. */
    const currentPublication=!!(
      publication&&
      publication.committed===true&&
      publication.safetyVerified===true
    );
    return !!(
      M&&M.analysisReady&&
      state.mode==="property"&&!state.active&&
      currentPublication
    );
  }'''

render_count = s.count(old_render)
active_count = s.count(old_active)
assert render_count == 1, f"render owner count {render_count}"
assert active_count == 1, f"water owner count {active_count}"

s = s.replace(old_render, new_render).replace(old_active, new_active)
p.write_text(s, encoding="utf-8")

check = p.read_text(encoding="utf-8")
evidence_start = check.index('<script id="earthline-16516-evidence-grade-js">')
evidence_end = check.index('</script>', evidence_start)
assert 'slot.prepend(el)' not in check[evidence_start:evidence_end]
water_start = check.index('function propertyActive15824()')
water_end = check.index('function viewAllowsWater15824()', water_start)
water_block = check[water_start:water_end]
assert 'currentGen' not in water_block
assert 'publicationGen' not in water_block
assert 'publication.committed===true' in water_block
assert 'publication.safetyVerified===true' in water_block

print("EARTHLINE_17578_PATCH_OK")
