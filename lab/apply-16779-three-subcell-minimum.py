from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_head="<!-- EARTHLINE 16778 — COUNT-NEUTRAL FINE-CELL DISPERSION REBALANCE."
new_head="<!-- EARTHLINE 16779 — THREE-SUBCELL MINIMUM BEFORE PROPORTIONAL FILL. Regional selection keeps the same screened candidate pool, total capacity, science gates, water sidecar, jurisdiction containment and ranking semantics. Within each occupied 6x6 terrain sector, reserve up to three distinct real 18x18 fine subcells first; then distribute the remaining unchanged capacity proportionally as before. No jurisdiction names, synthetic corridors, relaxed science or added capacity. CANDIDATE / NOT ACCEPTED. -->\n"+old_head
if old_head not in s: raise SystemExit("16778 header anchor missing")
s=s.replace(old_head,new_head,1)

old_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16778'"
new_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16779'"
if s.count(old_marker)!=1: raise SystemExit(f"build marker count {s.count(old_marker)}")
s=s.replace(old_marker,new_marker,1)

anchor="""      const chooseNext16775=(key16775)=>{
        const reps16775=subgroups16775.get(key16775)||[],sel16775=selectedSubs16775.get(key16775)||[];
        const remain16775=reps16775.filter(r16775=>!sel16775.includes(r16775));if(!remain16775.length)return null;
        if(!sel16775.length)return remain16775[0];
        let best16775=null,bestMetric16775=-Infinity;
        for(const r16775 of remain16775){
          const d16775=Math.min(...sel16775.map(s16775=>Math.hypot(r16775.lx-s16775.lx,r16775.ly-s16775.ly)));
          const metric16775=d16775*1000+r16775.count*10+(Number(r16775.candidate.score)||0);
          if(metric16775>bestMetric16775){bestMetric16775=metric16775;best16775=r16775;}
        }
        return best16775;
      };
      while(coverageReserved16736.length<reserveBudget16775){"""

insert="""      const chooseNext16775=(key16775)=>{
        const reps16775=subgroups16775.get(key16775)||[],sel16775=selectedSubs16775.get(key16775)||[];
        const remain16775=reps16775.filter(r16775=>!sel16775.includes(r16775));if(!remain16775.length)return null;
        if(!sel16775.length)return remain16775[0];
        let best16775=null,bestMetric16775=-Infinity;
        for(const r16775 of remain16775){
          const d16775=Math.min(...sel16775.map(s16775=>Math.hypot(r16775.lx-s16775.lx,r16775.ly-s16775.ly)));
          const metric16775=d16775*1000+r16775.count*10+(Number(r16775.candidate.score)||0);
          if(metric16775>bestMetric16775){bestMetric16775=metric16775;best16775=r16775;}
        }
        return best16775;
      };
      /* EARTHLINE 16779 — first guarantee up to three distinct fine subcells
         per occupied 6x6 parent. Capacity is unchanged; this only changes which
         already-screened candidates consume the existing reserve. */
      for(const [key16779,reps16779] of subgroups16775){
        const target16779=Math.min(3,reps16779.length);
        while((selectedSubs16775.get(key16779)||[]).length<target16779&&coverageReserved16736.length<reserveBudget16775){
          const next16779=chooseNext16775(key16779);if(!next16779)break;
          selectedSubs16775.get(key16779).push(next16779);
          const c16779=next16779.candidate;if(!c16779||chosen.includes(c16779))continue;
          chosen.push(c16779);
          coverageReserved16736.push({key:key16779,subBin:next16779.subkey,x:c16779.x,y:c16779.y,score:Number(c16779.score)||0,
            refined:!!(c16779.refined16710||c16779.refined16702),coverageGap:!!c16779.coverageGap16731,
            proportionalReserve16775:true,minimumSubcellReserve16779:true,subcellCandidates:next16779.count,binBasis:c16779.coverageBinBasis16767||'clipped-midpoint'});
        }
      }
      while(coverageReserved16736.length<reserveBudget16775){"""

if s.count(anchor)!=1: raise SystemExit(f"reserve loop anchor count {s.count(anchor)}")
s=s.replace(anchor,insert,1)

old_label="reservePerBin:'full existing Regional capacity distributed proportionally across occupied fine subcells'"
new_label="reservePerBin:'up to 3 distinct fine subcells per occupied parent first, then remaining existing Regional capacity proportionally'"
if s.count(old_label)!=1: raise SystemExit(f"label count {s.count(old_label)}")
s=s.replace(old_label,new_label,1)

old_rule="rule:'use the full unchanged Regional capacity as the proportional reserve budget across occupied 3x3 subregions inside each 6x6 terrain sector; select real screened candidates only; science gates, water safety, final score ordering and capacity remain unchanged'"
new_rule="rule:'reserve up to three distinct real 3x3 fine subcells inside every occupied 6x6 terrain sector first, then distribute the remaining unchanged Regional capacity proportionally; science gates, water safety, final score ordering and capacity remain unchanged'"
if s.count(old_rule)!=1: raise SystemExit(f"rule count {s.count(old_rule)}")
s=s.replace(old_rule,new_rule,1)

needle="subsectorReserve:true,proportionalReserve:true,"
repl="subsectorReserve:true,proportionalReserve:true,minimumSubcellsPerParent16779:3,"
if s.count(needle)!=1: raise SystemExit(f"subsector marker count {s.count(needle)}")
s=s.replace(needle,repl,1)

p.write_text(s,encoding="utf-8")
print("16779 applied")
