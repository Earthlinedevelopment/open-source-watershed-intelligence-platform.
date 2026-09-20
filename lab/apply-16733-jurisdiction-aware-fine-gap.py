from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

def patch(name,old,new):
    global s
    n=s.count(old)
    if n!=1:
        raise SystemExit(f"{name}: expected 1 anchor, found {n}")
    s=s.replace(old,new,1)

# 16730 coarse pre-refinement must not count neighboring states as valid opportunity.
patch("16730-jurisdiction",
"""          const i16730=y16730*hy.w+x16730;if(hy.validityMask16584[i16730]!==1)continue;
          valid16730++;const sp16730=Number(hy.slope[i16730]),ac16730=Number(hy.acc[i16730]),el16730=Number(hy.elev[i16730]);""",
"""          const i16730=y16730*hy.w+x16730;if(hy.validityMask16584[i16730]!==1)continue;
          if(swaleJurisdictionGeometry16539){
            const ll16730=gridLL(hy,x16730,y16730);
            if(!earthlinePointInJurisdiction16539(ll16730,swaleJurisdictionGeometry16539))continue;
          }
          valid16730++;const sp16730=Number(hy.slope[i16730]),ac16730=Number(hy.acc[i16730]),el16730=Number(hy.elev[i16730]);""")

# Finer 6x6 coverage cells catch Bay Area / southern NY / eastern CO scale gaps.
patch("16731-grid",
"const binsX16731=4,binsY16731=4,channel16731=percentile(hy.acc,.972);",
"const binsX16731=6,binsY16731=6,channel16731=percentile(hy.acc,.972);")

patch("16731-jurisdiction",
"""          const i16731=y16731*hy.w+x16731;if(hy.validityMask16584[i16731]!==1)continue;
          valid16731++;const sp16731=Number(hy.slope[i16731]),ac16731=Number(hy.acc[i16731]);""",
"""          const i16731=y16731*hy.w+x16731;if(hy.validityMask16584[i16731]!==1)continue;
          if(swaleJurisdictionGeometry16539){
            const ll16731=gridLL(hy,x16731,y16731);
            if(!earthlinePointInJurisdiction16539(ll16731,swaleJurisdictionGeometry16539))continue;
          }
          valid16731++;const sp16731=Number(hy.slope[i16731]),ac16731=Number(hy.acc[i16731]);""")

patch("16731-gap-threshold",
"""        return r16731.valid>=80&&r16731.opportunity>=7&&ratio16731>=.012&&r16731.swales===0;""",
"""        return r16731.valid>=45&&r16731.opportunity>=8&&ratio16731>=.035&&r16731.swales===0;""")

patch("16731-gap-cap",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=3)break;selected16731.push(gap16731);}""",
"""      const selected16731=[];for(const gap16731 of gaps16731){if(selected16731.length>=6)break;selected16731.push(gap16731);}""")

patch("16731-final-threshold",
"""      const unresolved16731=after16731.filter(r16731=>r16731.valid>=80&&r16731.opportunity>=7&&(r16731.opportunity/Math.max(1,r16731.valid))>=.012&&r16731.swales===0);""",
"""      const unresolved16731=after16731.filter(r16731=>r16731.valid>=45&&r16731.opportunity>=8&&(r16731.opportunity/Math.max(1,r16731.valid))>=.035&&r16731.swales===0);""")

patch("16731-rule-text",
"""rule:'a valid 4x4 terrain bin with >=1.2% <=4% opportunity and zero selected corridors is refined regardless of geography'""",
"""rule:'a jurisdiction-valid 6x6 terrain bin with >=3.5% <=4% opportunity and zero selected corridors is refined regardless of geography'""")

# Guarantee at least one high-resolution candidate from every actual coverage-gap
# tile before the remaining refined reserve is chosen by geographic spread.
old_sel="""    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];
    const refinedReserved16713=[];
    if(refinedPool16713.length){
      const remaining16713=refinedPool16713.slice();
      const target16713=Math.min(18,refinedPool16713.length);"""
new_sel="""    const refinedPool16713=!focusMode?candidates.filter(c=>c&&(c.refined16710||c.refined16702)):[];
    const refinedReserved16713=[];
    const coverageGroups16733=new Map();
    for(const c16733 of refinedPool16713){
      if(!c16733||!c16733.coverageGap16731||!c16733.tile16731)continue;
      const key16733=String(c16733.tile16731);let list16733=coverageGroups16733.get(key16733);
      if(!list16733)coverageGroups16733.set(key16733,list16733=[]);list16733.push(c16733);
    }
    for(const [key16733,list16733] of coverageGroups16733){
      list16733.sort((a16733,b16733)=>(Number(b16733.score)||0)-(Number(a16733.score)||0));
      for(const c16733 of list16733.slice(0,2)){if(!refinedReserved16713.includes(c16733)){refinedReserved16713.push(c16733);chosen.push(c16733);}}
    }
    if(refinedPool16713.length){
      const remaining16713=refinedPool16713.filter(c16713=>!refinedReserved16713.includes(c16713));
      const target16713=Math.min(coverageGroups16733.size?24:18,refinedPool16713.length);"""
patch("refined-selection-guarantee",old_sel,new_sel)

# The loop target is total reserved, so already-guaranteed component candidates count.
# Add a new policy audit without changing the accepted score owner.
anchor="""    window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713={
      input:refinedPool16713.length,reserved:refinedReserved16713.length,"""
replacement="""    window.EARTHLINE_REFINED_COVERAGE_SELECTION_16713={
      input:refinedPool16713.length,reserved:refinedReserved16713.length,
      coverageGapGroups16733:coverageGroups16733.size,
      coverageGapGuaranteed16733:refinedReserved16713.filter(c16733=>c16733&&c16733.coverageGap16731).length,"""
patch("selection-audit",anchor,replacement)

# Declare the strengthened coverage policy.
anchor2="""      window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16731',bins:after16731.map"""
replacement2="""      window.EARTHLINE_COVERAGE_POLICY_16733={build:'EARTHLINE 16733',grid:'6x6',jurisdictionAware:!!swaleJurisdictionGeometry16539,maxRefinementBins:6,guaranteedCandidatesPerGapTile:2,rule:'major blank terrain is a failure only where the selected jurisdiction itself contains measurable <=4% opportunity',at:new Date().toISOString()};
      window.EARTHLINE_REGIONAL_COVERAGE_AUDIT_16731={build:'EARTHLINE 16733',bins:after16731.map"""
patch("coverage-policy-audit",anchor2,replacement2)

p.write_text(s,encoding="utf-8")
print("16733 applied")
