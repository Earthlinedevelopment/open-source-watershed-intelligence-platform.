from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
marker="EARTHLINE M78.27 — contour start and marcher share one half-open crossing rule"
if marker in s:
    raise SystemExit(0)
old='''function earthlineCellCrossesLevel(cx,cy,L){
  if(cx<0||cy<0||cx>=GW-1||cy>=GH-1)return false;
  const h00=M.h[idx(cx,cy)], h10=M.h[idx(cx+1,cy)],
        h01=M.h[idx(cx,cy+1)], h11=M.h[idx(cx+1,cy+1)];
  const mn=Math.min(h00,h10,h01,h11), mx=Math.max(h00,h10,h01,h11);
  return L>=mn && L<=mx && mx-mn>1e-7;
}'''
new='''function earthlineCellCrossesLevel(cx,cy,L){
  if(cx<0||cy<0||cx>=GW-1||cy>=GH-1)return false;
  const h00=M.h[idx(cx,cy)], h10=M.h[idx(cx+1,cy)],
        h01=M.h[idx(cx,cy+1)], h11=M.h[idx(cx+1,cy+1)];
  if(![h00,h10,h01,h11].every(Number.isFinite))return false;
  const crosses=(a,b)=>(a<=L)!==(b<=L);
  /* EARTHLINE M78.27 — contour start and marcher share one half-open crossing rule.
     Do not accept a min/max-only cell that the marching tracer cannot actually exit. */
  return crosses(h00,h10)||crosses(h10,h11)||crosses(h01,h11)||crosses(h00,h01);
}'''
if s.count(old)!=1:
    raise SystemExit(f"M78.27 contour-cell anchor count={s.count(old)}")
s=s.replace(old,new,1)
if marker not in s:
    raise SystemExit("M78.27 verification failed")
p.write_text(s,encoding="utf-8")
