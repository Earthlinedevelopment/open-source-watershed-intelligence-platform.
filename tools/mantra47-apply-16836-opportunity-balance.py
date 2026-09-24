from pathlib import Path
import sys

path = Path(sys.argv[1] if len(sys.argv) > 1 else 'index.html')
s = path.read_text(encoding='utf-8')
anchor = 'window.EARTHLINE_SWALE_GENERATION_AUDIT_16167=generationAudit;'
marker = '/* EARTHLINE 16836 - OPPORTUNITY-BALANCED FINAL SELECTION */'

if marker in s:
    raise SystemExit('16836 marker already present')
if s.count(anchor) != 1:
    raise SystemExit(f'expected one generation-audit anchor, found {s.count(anchor)}')

patch = r'''/* EARTHLINE 16836 - OPPORTUNITY-BALANCED FINAL SELECTION */
(()=>{
  if(focusMode||!chosen.length||!candidates.length)return;
  const N16836=12,maxSwaps16836=6,minGain16836=.15;
  const point16836=c=>{const gx=Number.isFinite(Number(c&&c.coverageGX16775))?Number(c.coverageGX16775):Number(c&&c.x),gy=Number.isFinite(Number(c&&c.coverageGY16775))?Number(c.coverageGY16775):Number(c&&c.y);if(!Number.isFinite(gx)||!Number.isFinite(gy))return null;const fx=Math.max(0,Math.min(N16836-1,Math.floor(gx*N16836/Math.max(1,hy.w)))),fy=Math.max(0,Math.min(N16836-1,Math.floor(gy*N16836/Math.max(1,hy.h))));return {fx,fy,cell:fx+','+fy,parent:Math.floor(fx/2)+','+Math.floor(fy/2)};};
  const opportunityCache16836=new Map();
  const opportunity16836=p=>{if(!p)return 0;if(opportunityCache16836.has(p.cell))return opportunityCache16836.get(p.cell);const x0=Math.floor(p.fx*hy.w/N16836),x1=Math.min(hy.w,Math.ceil((p.fx+1)*hy.w/N16836)),y0=Math.floor(p.fy*hy.h/N16836),y1=Math.min(hy.h,Math.ceil((p.fy+1)*hy.h/N16836));let valid=0,opp=0,pref=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=y*hy.w+x;if(hy.validityMask16584?.[i]!==1)continue;valid++;const sp=Number(hy.slope[i]);if(Number.isFinite(sp)&&sp>=.05&&sp<=4){opp++;if(sp>=.25&&sp<=3.5)pref++;}}const v=valid?(.35*(opp/valid)+.65*(pref/valid)):0;opportunityCache16836.set(p.cell,v);return v;};
  const candByCell16836=new Map();for(const c of candidates){const p=point16836(c);if(!p)continue;let a=candByCell16836.get(p.cell);if(!a)candByCell16836.set(p.cell,a=[]);a.push({c,p});}for(const a of candByCell16836.values())a.sort((u,v)=>(Number(v.c.score)||0)-(Number(u.c.score)||0));
  const rows16836=[];let swaps16836=0;
  while(swaps16836<maxSwaps16836){const cellCount16836=new Map(),parentCount16836=new Map();for(const c of chosen){const p=point16836(c);if(!p)continue;cellCount16836.set(p.cell,(cellCount16836.get(p.cell)||0)+1);parentCount16836.set(p.parent,(parentCount16836.get(p.parent)||0)+1);}
    const targets16836=[];for(const [cell,a] of candByCell16836){if((cellCount16836.get(cell)||0)!==0||!a.length)continue;const p=a[0].p,op=opportunity16836(p);targets16836.push({cell,p,op,c:a[0].c});}targets16836.sort((a,b)=>b.op-a.op||(Number(b.c.score)||0)-(Number(a.c.score)||0));
    let best16836=null;for(const t of targets16836){for(let i=0;i<chosen.length;i++){const d=chosen[i],p=point16836(d);if(!p||(cellCount16836.get(p.cell)||0)!==1)continue;if(p.parent!==t.p.parent&&(parentCount16836.get(p.parent)||0)<=3)continue;const dop=opportunity16836(p),gain=t.op-dop;if(gain<minGain16836)continue;const metric=gain*10+(Number(t.c.score)||0)-(Number(d.score)||0)*.25;if(!best16836||metric>best16836.metric)best16836={i,t,d,p,dop,gain,metric};}}if(!best16836)break;chosen[best16836.i]=best16836.t.c;rows16836.push({fromCell:best16836.p.cell,toCell:best16836.t.cell,fromParent:best16836.p.parent,toParent:best16836.t.p.parent,fromOpportunity:best16836.dop,toOpportunity:best16836.t.op,gain:best16836.gain});swaps16836++;}
  window.EARTHLINE_OPPORTUNITY_BALANCE_16836={build:'EARTHLINE 16836',maxSwaps:maxSwaps16836,minGain:minGain16836,swaps:swaps16836,rows:rows16836,chosenCount:chosen.length,rule:'count-neutral opportunity balance; occupied-cell neutral; existing cross-parent donor protection retained'};
})();
'''

path.write_text(s.replace(anchor, patch + anchor, 1), encoding='utf-8')
print('Applied Earthline 16836 opportunity-balanced final selection')
