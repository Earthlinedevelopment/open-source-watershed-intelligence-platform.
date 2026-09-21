from pathlib import Path

p=Path("index.html")
s=p.read_text(encoding="utf-8")

old_head="<!-- EARTHLINE 16780 — NESTED FINE-CELL OPPORTUNITY REFINEMENT."
new_head="<!-- EARTHLINE 16781 — CLUSTER-AWARE FINE-CELL REFINEMENT. The bounded 16780 local-terrain pass is unchanged in science, tile count, resolution and capacity, but its eight refinement cells are chosen by contiguous empty-opportunity cluster size plus spatial spread instead of raw opportunity alone. This targets broad internal voids without jurisdiction names, synthetic corridors, relaxed science or added capacity. CANDIDATE / NOT ACCEPTED. -->\n"+old_head
if old_head not in s:
    raise SystemExit("16780 header anchor missing")
s=s.replace(old_head,new_head,1)

old_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16780'"
new_marker="window.EARTHLINE_SPATIAL_COVERAGE_SELECTION_16736={build:'EARTHLINE 16781'"
if s.count(old_marker)!=1:
    raise SystemExit(f"build marker count {s.count(old_marker)}")
s=s.replace(old_marker,new_marker,1)

old_select="""      const selected16780=[],parentUse16780=new Map();
      for(const row16780 of gapsBefore16780){
        if(selected16780.length>=8)break;
        const pk16780=Math.floor(row16780.bx/2)+','+Math.floor(row16780.by/2),used16780=parentUse16780.get(pk16780)||0;
        if(used16780>=2)continue;
        selected16780.push(row16780);parentUse16780.set(pk16780,used16780+1);
      }"""

new_select="""      const selected16780=[],parentUse16780=new Map();
      for(const row16780 of gapsBefore16780){
        row16780.cluster16781=gapsBefore16780.filter(o16781=>Math.hypot(o16781.bx-row16780.bx,o16781.by-row16780.by)<=1.5).length;
      }
      while(selected16780.length<8){
        let best16781=null,bestMetric16781=-Infinity;
        for(const row16780 of gapsBefore16780){
          if(selected16780.includes(row16780))continue;
          const pk16780=Math.floor(row16780.bx/2)+','+Math.floor(row16780.by/2),used16780=parentUse16780.get(pk16780)||0;
          if(used16780>=2)continue;
          const ratio16781=row16780.opportunity/Math.max(1,row16780.valid),pref16781=row16780.preferred/Math.max(1,row16780.valid);
          const spread16781=selected16780.length?Math.min(...selected16780.map(p16781=>Math.hypot(p16781.bx-row16780.bx,p16781.by-row16780.by))):3;
          const metric16781=(Number(row16780.cluster16781)||0)*100+spread16781*24+ratio16781*20+pref16781*5+row16780.opportunity/16;
          if(metric16781>bestMetric16781){bestMetric16781=metric16781;best16781=row16780;}
        }
        if(!best16781)break;
        selected16780.push(best16781);
        const pk16781=Math.floor(best16781.bx/2)+','+Math.floor(best16781.by/2);
        parentUse16780.set(pk16781,(parentUse16780.get(pk16781)||0)+1);
      }"""

if s.count(old_select)!=1:
    raise SystemExit(f"selection block count {s.count(old_select)}")
s=s.replace(old_select,new_select,1)

old_obj="window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16780={build:'EARTHLINE 16780'"
new_obj="window.EARTHLINE_FINE_OPPORTUNITY_REFINEMENT_16781={build:'EARTHLINE 16781'"
if s.count(old_obj)!=2:
    raise SystemExit(f"fine audit object count {s.count(old_obj)}")
s=s.replace(old_obj,new_obj)

old_selected="selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred}))"
new_selected="selected:selected16780.map(r16780=>({bx:r16780.bx,by:r16780.by,valid:r16780.valid,opportunity:r16780.opportunity,preferred:r16780.preferred,cluster:Number(r16780.cluster16781||0)}))"
if s.count(old_selected)!=1:
    raise SystemExit(f"selected audit anchor count {s.count(old_selected)}")
s=s.replace(old_selected,new_selected,1)

old_rule="rule:'refine bounded empty 12x12 cells that contain measurable valid <=4% opportunity; add only real screened local-terrain corridors; preserve global science and capacity'"
new_rule="rule:'refine up to eight cluster-centered, spatially distributed empty 12x12 cells with measurable valid <=4% opportunity; add only real screened local-terrain corridors; preserve global science, tile budget and capacity'"
if s.count(old_rule)!=1:
    raise SystemExit(f"rule anchor count {s.count(old_rule)}")
s=s.replace(old_rule,new_rule,1)

p.write_text(s,encoding="utf-8")
print("16781 applied")
