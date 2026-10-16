from pathlib import Path
import base64

p=Path("index.html")
s=p.read_text(encoding="utf-8")
wasm_path=Path("tests/earthline-clip-kernel-17322.wasm")
if not wasm_path.exists():
    raise SystemExit("compiled 17322 WASM kernel missing")
wasm_b64=base64.b64encode(wasm_path.read_bytes()).decode("ascii")

old_prepare="""  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    return {prepared16539:true,polygons};
  }"""
new_prepare="""  const earthlinePreparedJurisdictionCache17322=new WeakMap();
  function earthlinePrepareJurisdiction16539(g){
    if(!g)return null;if(g.prepared16539===true)return g;
    if((typeof g==='object'||typeof g==='function')&&earthlinePreparedJurisdictionCache17322.has(g))return earthlinePreparedJurisdictionCache17322.get(g);
    const rawPolys=g.type==='Polygon'?[g.coordinates||[]]:g.type==='MultiPolygon'?(g.coordinates||[]):[];
    const polygons=[];for(const rings of rawPolys){if(!Array.isArray(rings)||!rings.length)continue;const outer=rings[0],bbox=earthlineRingBounds16539(outer);if(!bbox)continue;const holes=[];for(let i=1;i<rings.length;i++){const hb=earthlineRingBounds16539(rings[i]);if(hb)holes.push({ring:rings[i],bbox:hb});}polygons.push({outer,bbox,holes});}
    const prepared17322={prepared16539:true,polygons};
    if(typeof g==='object'||typeof g==='function')earthlinePreparedJurisdictionCache17322.set(g,prepared17322);
    return prepared17322;
  }"""
if s.count(old_prepare)!=1: raise SystemExit(f"prepare anchor count {s.count(old_prepare)}")
s=s.replace(old_prepare,new_prepare,1)

anchor="""  function earthlineInterpolate16539(a,b,t){return [Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];}
"""
helpers="""  const earthlineClipKernel17322=(()=>{
    try{
      if(typeof WebAssembly!=='object'||typeof atob!=='function')return null;
      const raw17322=atob('"""+wasm_b64+"""'),bytes17322=new Uint8Array(raw17322.length);
      for(let i17322=0;i17322<raw17322.length;i17322++)bytes17322[i17322]=raw17322.charCodeAt(i17322);
      const module17322=new WebAssembly.Module(bytes17322),instance17322=new WebAssembly.Instance(module17322,{}),
            memory17322=instance17322.exports.memory,clip17322=instance17322.exports.clip_line;
      if(!memory17322||typeof clip17322!=='function')return null;
      const heap17322=instance17322.exports.__heap_base;
      let next17322=((Number(heap17322&&heap17322.value!==undefined?heap17322.value:heap17322)||65536)+7)&~7;
      function alloc17322(bytes17322){
        const ptr17322=next17322;next17322=(next17322+bytes17322+7)&~7;
        if(next17322>memory17322.buffer.byteLength)memory17322.grow(Math.ceil((next17322-memory17322.buffer.byteLength)/65536));
        return ptr17322;
      }
      return {memory:memory17322,clip:clip17322,alloc:alloc17322};
    }catch(_){return null;}
  })();
  const earthlineClipMetaCache17322=new WeakMap(),earthlineClipScratch17322={rawPtr:0,rawCap:0,outPtr:0,outCap:0,offsPtr:0,lensPtr:0,runCap:0};
  function earthlineEnsureClipMeta17322(g17322){
    if(!earthlineClipKernel17322||!g17322)return null;
    const prepared17322=earthlinePrepareJurisdiction16539(g17322);if(!prepared17322||!(prepared17322.polygons||[]).length)return null;
    if(earthlineClipMetaCache17322.has(prepared17322))return earthlineClipMetaCache17322.get(prepared17322);
    const ringRows17322=[],polyRows17322=[],scale17322=4;
    for(const poly17322 of prepared17322.polygons||[]){
      const ringStart17322=ringRows17322.length,rings17322=[{ring:poly17322.outer,bbox:poly17322.bbox},...(poly17322.holes||[])];
      for(const row17322 of rings17322){
        const ring17322=row17322.ring,bbox17322=row17322.bbox;if(!Array.isArray(ring17322)||ring17322.length<3||!bbox17322)continue;
        const bins17322=new Map();
        for(let i17322=0,j17322=ring17322.length-1;i17322<ring17322.length;j17322=i17322++){
          const a17322=ring17322[j17322],b17322=ring17322[i17322];if(!earthlineFinitePoint16539(a17322)||!earthlineFinitePoint16539(b17322))continue;
          const x117322=Number(a17322[0]),y117322=Number(a17322[1]),x217322=Number(b17322[0]),y217322=Number(b17322[1]),
                dx17322=x217322-x117322,dy17322=y217322-y117322,len17322=dx17322*dx17322+dy17322*dy17322,
                lo17322=Math.floor(Math.min(y117322,y217322)*scale17322),hi17322=Math.floor(Math.max(y117322,y217322)*scale17322),
                edge17322=[x117322,y117322,x217322,y217322,dx17322,dy17322,len17322];
          for(let bin17322=lo17322;bin17322<=hi17322;bin17322++){let list17322=bins17322.get(bin17322);if(!list17322)bins17322.set(bin17322,list17322=[]);list17322.push(edge17322);}
        }
        const keys17322=Array.from(bins17322.keys());if(!keys17322.length)continue;
        const minBin17322=Math.min(...keys17322),maxBin17322=Math.max(...keys17322),span17322=maxBin17322-minBin17322+1,
              ptrsPtr17322=earthlineClipKernel17322.alloc(span17322*4),countsPtr17322=earthlineClipKernel17322.alloc(span17322*4);
        let ptrs17322=new Uint32Array(earthlineClipKernel17322.memory.buffer,ptrsPtr17322,span17322),
            counts17322=new Uint32Array(earthlineClipKernel17322.memory.buffer,countsPtr17322,span17322);
        for(let bin17322=minBin17322;bin17322<=maxBin17322;bin17322++){
          const list17322=bins17322.get(bin17322)||[],k17322=bin17322-minBin17322;if(!list17322.length)continue;
          const edgePtr17322=earthlineClipKernel17322.alloc(list17322.length*56);
          const flat17322=new Float64Array(earthlineClipKernel17322.memory.buffer,edgePtr17322,list17322.length*7);
          let z17322=0;for(const edge17322 of list17322)for(let q17322=0;q17322<7;q17322++)flat17322[z17322++]=edge17322[q17322];
          ptrs17322=new Uint32Array(earthlineClipKernel17322.memory.buffer,ptrsPtr17322,span17322);
          counts17322=new Uint32Array(earthlineClipKernel17322.memory.buffer,countsPtr17322,span17322);
          ptrs17322[k17322]=edgePtr17322;counts17322[k17322]=list17322.length;
        }
        ringRows17322.push([Number(bbox17322[0]),Number(bbox17322[1]),Number(bbox17322[2]),Number(bbox17322[3]),minBin17322,maxBin17322,ptrsPtr17322,countsPtr17322]);
      }
      polyRows17322.push([ringStart17322,ringRows17322.length-ringStart17322]);
    }
    if(!ringRows17322.length||!polyRows17322.length)return null;
    const ringPtr17322=earthlineClipKernel17322.alloc(ringRows17322.length*64),polyPtr17322=earthlineClipKernel17322.alloc(polyRows17322.length*8);
    const ringFlat17322=new Float64Array(earthlineClipKernel17322.memory.buffer,ringPtr17322,ringRows17322.length*8),
          polyFlat17322=new Int32Array(earthlineClipKernel17322.memory.buffer,polyPtr17322,polyRows17322.length*2);
    let ri17322=0;for(const row17322 of ringRows17322)for(const v17322 of row17322)ringFlat17322[ri17322++]=v17322;
    let pi17322=0;for(const row17322 of polyRows17322)for(const v17322 of row17322)polyFlat17322[pi17322++]=v17322;
    const meta17322={ringPtr:ringPtr17322,polyPtr:polyPtr17322,polyCount:polyRows17322.length};earthlineClipMetaCache17322.set(prepared17322,meta17322);return meta17322;
  }
  function earthlineEnsureClipScratch17322(rawCount17322,denseCount17322){
    const k17322=earthlineClipKernel17322;if(!k17322)return null;
    const rawNeed17322=rawCount17322*16,outPts17322=denseCount17322*2+8,outNeed17322=outPts17322*16,runNeed17322=denseCount17322+8;
    if(earthlineClipScratch17322.rawCap<rawNeed17322){earthlineClipScratch17322.rawPtr=k17322.alloc(rawNeed17322);earthlineClipScratch17322.rawCap=rawNeed17322;}
    if(earthlineClipScratch17322.outCap<outNeed17322){earthlineClipScratch17322.outPtr=k17322.alloc(outNeed17322);earthlineClipScratch17322.outCap=outNeed17322;}
    if(earthlineClipScratch17322.runCap<runNeed17322){earthlineClipScratch17322.offsPtr=k17322.alloc(runNeed17322*4);earthlineClipScratch17322.lensPtr=k17322.alloc(runNeed17322*4);earthlineClipScratch17322.runCap=runNeed17322;}
    return {maxPts:outPts17322,maxRuns:runNeed17322};
  }
  function earthlineClipLineWasm17322(raw17322,g17322){
    if(!earthlineClipKernel17322||!Array.isArray(raw17322)||raw17322.length<2||!g17322)return null;
    const meta17322=earthlineEnsureClipMeta17322(g17322);if(!meta17322)return null;
    let dense17322=1;for(let i17322=1;i17322<raw17322.length;i17322++){const a17322=raw17322[i17322-1],b17322=raw17322[i17322],steps17322=Math.max(1,Math.ceil(Math.max(Math.abs(Number(b17322[0])-Number(a17322[0])),Math.abs(Number(b17322[1])-Number(a17322[1])))/.01));dense17322+=steps17322;}
    const caps17322=earthlineEnsureClipScratch17322(raw17322.length,dense17322);if(!caps17322)return null;
    const mem17322=earthlineClipKernel17322.memory,rawView17322=new Float64Array(mem17322.buffer,earthlineClipScratch17322.rawPtr,raw17322.length*2);
    let k17322=0;for(const p17322 of raw17322){rawView17322[k17322++]=Number(p17322[0]);rawView17322[k17322++]=Number(p17322[1]);}
    const rc17322=earthlineClipKernel17322.clip(earthlineClipScratch17322.rawPtr,raw17322.length,meta17322.ringPtr,meta17322.polyPtr,meta17322.polyCount,earthlineClipScratch17322.outPtr,earthlineClipScratch17322.offsPtr,earthlineClipScratch17322.lensPtr,caps17322.maxPts,caps17322.maxRuns);
    if(!Number.isInteger(rc17322)||rc17322<0)return null;if(rc17322===0)return [];
    const outView17322=new Float64Array(mem17322.buffer,earthlineClipScratch17322.outPtr,caps17322.maxPts*2),
          offs17322=new Int32Array(mem17322.buffer,earthlineClipScratch17322.offsPtr,caps17322.maxRuns),
          lens17322=new Int32Array(mem17322.buffer,earthlineClipScratch17322.lensPtr,caps17322.maxRuns),runs17322=[];
    for(let r17322=0;r17322<rc17322;r17322++){const start17322=offs17322[r17322],len17322=lens17322[r17322],run17322=[];for(let i17322=0;i17322<len17322;i17322++){const q17322=(start17322+i17322)*2;run17322.push([outView17322[q17322],outView17322[q17322+1]]);}if(run17322.length>=2)runs17322.push(run17322);}
    return runs17322;
  }
  function earthlineInterpolate16539(a,b,t){return [Number(a[0])+(Number(b[0])-Number(a[0]))*t,Number(a[1])+(Number(b[1])-Number(a[1]))*t];}
"""
if s.count(anchor)!=1: raise SystemExit(f"interpolate anchor count {s.count(anchor)}")
s=s.replace(anchor,helpers,1)

clip_anchor="""  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const pts=[raw[0]];"""
clip_new="""  function earthlineClipLine16539(coords,g){
    const raw=(coords||[]).filter(earthlineFinitePoint16539);if(raw.length<2)return [];
    const wasmRuns17322=earthlineClipLineWasm17322(raw,g);if(wasmRuns17322!==null)return wasmRuns17322;
    const pts=[raw[0]];"""
if s.count(clip_anchor)!=1: raise SystemExit(f"clip entry anchor count {s.count(clip_anchor)}")
s=s.replace(clip_anchor,clip_new,1)

s="<!-- EARTHLINE_WASM_CLIP_KERNEL_17322: existing 0.01-degree densification, jurisdiction PIP, and 26-step inside-side boundary search execute in WASM; exact JS clipper remains fail-safe fallback; prepared geometry cached by source object. -->\n"+s
p.write_text(s,encoding="utf-8")
print("installed exact WASM line clip fast path 17322")
