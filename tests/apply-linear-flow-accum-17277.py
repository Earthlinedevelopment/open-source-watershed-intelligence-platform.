from pathlib import Path
p=Path("index.html")
s=p.read_text(encoding="utf-8")
old="""    const order=[];
    for(let i=0;i<N;i++)if(!valid16584||valid16584[i])order.push(i);
    order.sort((a,c)=>filled[c]-filled[a]);
    const acc=new Float32Array(N);
    if(valid16584){acc.fill(NaN);for(const i of order)acc[i]=1;}else acc.fill(1);
    for(let oi=0;oi<order.length;oi++){
      const i=order[oi],j=to[i];
      if(j>=0&&(!valid16584||valid16584[j]))acc[j]+=acc[i];
      if((oi&4095)===4095){
        noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOW ACCUMULATION');
        await Promise.resolve();
      }
    }"""
new="""    /* EARTHLINE 17277 — exact linear flow accumulation.
       The existing D8 owner assigns at most one strictly-downhill recipient per valid
       cell. Therefore the flow graph is acyclic. Process it topologically instead of
       sorting every cell by filled elevation. Accumulation remains the exact integer
       contributing-cell count; no flow direction, slope or scientific threshold changes. */
    const indegree17277=new Uint8Array(N),queue17277=new Int32Array(N);
    let validCount17277=0,head17277=0,tail17277=0;
    for(let i17277=0;i17277<N;i17277++){
      if(valid16584&&!valid16584[i17277])continue;
      validCount17277++;
      const j17277=to[i17277];if(j17277>=0&&(!valid16584||valid16584[j17277]))indegree17277[j17277]++;
    }
    const acc=new Float32Array(N);
    if(valid16584)acc.fill(NaN);
    for(let i17277=0;i17277<N;i17277++){
      if(valid16584&&!valid16584[i17277])continue;
      acc[i17277]=1;
      if(indegree17277[i17277]===0)queue17277[tail17277++]=i17277;
    }
    let processed17277=0;
    while(head17277<tail17277){
      const i17277=queue17277[head17277++],j17277=to[i17277];processed17277++;
      if(j17277>=0&&(!valid16584||valid16584[j17277])){
        acc[j17277]+=acc[i17277];
        if(--indegree17277[j17277]===0)queue17277[tail17277++]=j17277;
      }
      if((processed17277&4095)===4095){
        noteRegionalProgress16347('DERIVING WATER PATHS + BIOSWALES · FLOW ACCUMULATION');
        await Promise.resolve();
      }
    }
    if(processed17277!==validCount17277)throw new Error('flow accumulation graph invariant failed');"""
n=s.count(old)
print("accumulation anchors",n)
if n!=1: raise SystemExit(f"expected one accumulation anchor, found {n}")
s=s.replace(old,new,1)
s="/* EARTHLINE_LINEAR_FLOW_ACCUM_17277 — O(N) exact D8 accumulation replaces O(N log N) elevation sort; science unchanged. */\n"+s
p.write_text(s,encoding="utf-8")
print("17277 linear accumulation applied")
