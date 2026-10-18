from pathlib import Path
p=Path("tools/elder_trees/chmv2_array_detector_17129.py")
s=p.read_text(encoding="utf-8")
a=s.index("def _component_size_4(")
b=s.index("\ndef hav(",a)
old=s[a:b]
new=r'''def _component_size_4(mask,r,c):
    """Exact 4-connected seed-component size using a bounded stack flood.
    EARTHLINE 17465 — semantics-preserving performance path.
    Same mask, same seed and exact orthogonal connectivity; only traversal changes.
    """
    mask=np.asarray(mask,dtype=bool)
    h,w=mask.shape
    r=int(r);c=int(c)
    if r<0 or r>=h or c<0 or c>=w or not mask[r,c]:
        return 0
    seen=np.zeros((h,w),dtype=np.uint8)
    stack=[(r,c)]
    seen[r,c]=1
    count=0
    while stack:
        rr,cc=stack.pop()
        count+=1
        nr=rr-1
        if nr>=0 and mask[nr,cc] and not seen[nr,cc]:
            seen[nr,cc]=1;stack.append((nr,cc))
        nr=rr+1
        if nr<h and mask[nr,cc] and not seen[nr,cc]:
            seen[nr,cc]=1;stack.append((nr,cc))
        nc=cc-1
        if nc>=0 and mask[rr,nc] and not seen[rr,nc]:
            seen[rr,nc]=1;stack.append((rr,nc))
        nc=cc+1
        if nc<w and mask[rr,nc] and not seen[rr,nc]:
            seen[rr,nc]=1;stack.append((rr,nc))
    return int(count)
'''
s=s[:a]+new+s[b:]
p.write_text(s,encoding="utf-8")
print("installed exact 4-connected stack flood 17465")
